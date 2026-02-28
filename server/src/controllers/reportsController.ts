/**
 * reportsController.ts
 *
 * Handles aggregated sales analytics for the admin dashboard.
 *
 * WHY a separate controller (not reusing posController)?
 * posController is optimized for the cashier — it returns individual
 * sales records for receipts. This controller runs heavier GROUP BY
 * queries that aggregate across many rows. Keeping them separate
 * makes it obvious which queries are "heavy" analytics vs "light" lookups.
 */

import { Request, Response } from 'express';
import pool from '../config/database';

// ─────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────

interface SummaryRow {
  total_revenue: string; // PostgreSQL DECIMAL comes back as string
  transaction_count: string;
  avg_transaction_value: string;
}

interface TopProductRow {
  product_name: string;
  total_quantity: string;
  total_revenue: string;
}

interface SaleRow {
  id: number;
  cashier_id: number;
  cashier_name: string;
  total_amount: string;
  payment_method: string;
  created_at: string;
  items?: SaleItemRow[];
}

interface SaleItemRow {
  product_name: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
  unit_of_measure: string;
}

// ─────────────────────────────────────────────────────────────────
// CONTROLLER
// ─────────────────────────────────────────────────────────────────

export const reportsController = {
  /**
   * GET /api/reports/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
   *
   * Returns:
   * - Revenue summary (total, count, average)
   * - Top 5 selling products by quantity
   *
   * WHY combine summary + top products in one endpoint?
   * Both are needed at the same time on the reports page. One round
   * trip is faster than two, and both queries share the same date filter.
   *
   * WHY use $1 / $2 parameterized queries?
   * Prevents SQL injection. Never interpolate user input directly into SQL.
   *
   * DATE RANGE LOGIC:
   * If no dates are provided, default to the last 30 days so the page
   * always shows useful data on first load — not an empty state.
   */
  getSummary: async (req: Request, res: Response) => {
    try {
      // Default: last 30 days if no range provided
      const from =
        (req.query.from as string) ||
        (() => {
          const d = new Date();
          d.setDate(d.getDate() - 30);
          return d.toISOString().split('T')[0];
        })();

      // Default: end of today so today's sales are included
      const to =
        (req.query.to as string) || new Date().toISOString().split('T')[0];

      /**
       * Summary Query
       *
       * WHY DATE_TRUNC / casting to DATE?
       * `created_at` is a TIMESTAMP. Comparing it to a DATE string
       * with >= and <= works, but the upper bound needs to include
       * the full last day (up to 23:59:59). Adding 1 day and using <
       * is the safest pattern for inclusive date ranges.
       */
      const summaryQuery = `
        SELECT
          COALESCE(SUM(total_amount), 0)           AS total_revenue,
          COUNT(*)                                  AS transaction_count,
          COALESCE(AVG(total_amount), 0)            AS avg_transaction_value
        FROM sales
        WHERE created_at >= $1::date
          AND created_at <  ($2::date + INTERVAL '1 day')
      `;

      /**
       * Top Products Query
       *
       * WHY query sale_items instead of inventory_transactions?
       * sale_items has the SNAPSHOT price at time of sale. This gives us
       * accurate revenue per product even if prices changed later.
       * inventory_transactions only has quantity — not revenue.
       *
       * JOIN to sales is needed to filter by date, since sale_items
       * doesn't have its own created_at.
       */
      const topProductsQuery = `
        SELECT
          si.product_name,
          SUM(si.quantity)             AS total_quantity,
          SUM(si.subtotal)             AS total_revenue
        FROM sale_items si
        JOIN sales s ON s.id = si.sale_id
        WHERE s.created_at >= $1::date
          AND s.created_at <  ($2::date + INTERVAL '1 day')
        GROUP BY si.product_name
        ORDER BY total_quantity DESC
        LIMIT 5
      `;

      // Run both queries in parallel — they're independent
      const [summaryResult, topProductsResult] = await Promise.all([
        pool.query<SummaryRow>(summaryQuery, [from, to]),
        pool.query<TopProductRow>(topProductsQuery, [from, to]),
      ]);

      const summary = summaryResult.rows[0];

      res.json({
        date_range: { from, to },
        summary: {
          total_revenue: parseFloat(summary.total_revenue),
          transaction_count: parseInt(summary.transaction_count),
          avg_transaction_value: parseFloat(summary.avg_transaction_value),
        },
        top_products: topProductsResult.rows.map((row) => ({
          product_name: row.product_name,
          total_quantity: parseInt(row.total_quantity),
          total_revenue: parseFloat(row.total_revenue),
        })),
      });
    } catch (error) {
      console.error('[reportsController.getSummary] Error:', error);
      res.status(500).json({ error: 'Failed to fetch report summary' });
    }
  },

  /**
   * GET /api/reports/sales?from=YYYY-MM-DD&to=YYYY-MM-DD&page=1&limit=20
   *
   * Returns paginated list of sales with cashier name.
   * Line items are NOT included here — they're fetched per-sale
   * when the user expands a row (see getSaleItems below).
   *
   * WHY paginate?
   * A busy store might have hundreds of sales per day. Sending all of
   * them at once would be slow and wasteful. The UI loads 20 at a time.
   */
  getSales: async (req: Request, res: Response) => {
    try {
      const from =
        (req.query.from as string) ||
        (() => {
          const d = new Date();
          d.setDate(d.getDate() - 30);
          return d.toISOString().split('T')[0];
        })();
      const to =
        (req.query.to as string) || new Date().toISOString().split('T')[0];
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const salesQuery = `
        SELECT
          s.id,
          s.cashier_id,
          u.first_name || ' ' || u.last_name   AS cashier_name,
          s.total_amount,
          s.cash_tendered,
          s.change_amount,
          s.payment_method,
          s.created_at
        FROM sales s
        JOIN users u ON u.id = s.cashier_id
        WHERE s.created_at >= $1::date
          AND s.created_at <  ($2::date + INTERVAL '1 day')
        ORDER BY s.created_at DESC
        LIMIT $3 OFFSET $4
      `;

      // Count query for pagination metadata
      const countQuery = `
        SELECT COUNT(*) AS total
        FROM sales
        WHERE created_at >= $1::date
          AND created_at <  ($2::date + INTERVAL '1 day')
      `;

      const [salesResult, countResult] = await Promise.all([
        pool.query<SaleRow>(salesQuery, [from, to, limit, offset]),
        pool.query(countQuery, [from, to]),
      ]);

      const total = parseInt(countResult.rows[0].total);

      res.json({
        sales: salesResult.rows,
        pagination: {
          total,
          page,
          limit,
          total_pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('[reportsController.getSales] Error:', error);
      res.status(500).json({ error: 'Failed to fetch sales list' });
    }
  },

  /**
   * GET /api/reports/sales/:id/items
   *
   * Returns line items for a single sale.
   * Called when the user clicks to expand a sale row in the table.
   *
   * WHY a separate endpoint for items?
   * Loading all items for all sales upfront would be N×M data for
   * large date ranges. Lazy-loading per sale keeps the initial page fast.
   */
  getSaleItems: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const result = await pool.query<SaleItemRow>(
        `SELECT
          product_name,
          quantity,
          unit_price,
          unit_of_measure,
          subtotal
        FROM sale_items
        WHERE sale_id = $1
        ORDER BY id ASC`,
        [id],
      );

      res.json({ items: result.rows });
    } catch (error) {
      console.error('[reportsController.getSaleItems] Error:', error);
      res.status(500).json({ error: 'Failed to fetch sale items' });
    }
  },
};
