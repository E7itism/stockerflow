import { Request, Response } from 'express'
import pool from '../config/db'  // reuse existing DB connection

// ─────────────────────────────────────────────────────────────
// GET /api/pos/products
// Returns all products with current stock (calculated)
// Optional: ?search=coca to filter by name or SKU
// ─────────────────────────────────────────────────────────────
export async function getProducts(req: Request, res: Response) {
  try {
    const { search } = req.query

    // WHY calculate stock here instead of storing it:
    // Stock = sum of all inventory_transactions. This gives us
    // a complete audit trail and is always accurate.
    const query = `
      SELECT
        p.id,
        p.sku,
        p.name,
        p.description,
        p.category_id,
        c.name AS category_name,
        p.unit_price,
        p.unit_of_measure,
        p.reorder_level,
        COALESCE(
          SUM(
            CASE
              WHEN it.transaction_type IN ('in', 'adjustment') THEN it.quantity
              WHEN it.transaction_type = 'out'                 THEN -it.quantity
              ELSE 0
            END
          ), 0
        ) AS current_stock
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN inventory_transactions it ON p.id = it.product_id
      WHERE ($1::text IS NULL OR p.name ILIKE $1 OR p.sku ILIKE $1)
      GROUP BY p.id, c.name
      ORDER BY p.name
    `

    const searchParam = search ? `%${search}%` : null
    const result = await pool.query(query, [searchParam])

    res.status(200).json({ products: result.rows })
  } catch (error) {
    console.error('getProducts error:', error)
    res.status(500).json({ error: 'Failed to fetch products' })
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/pos/products/:id
// ─────────────────────────────────────────────────────────────
export async function getProductById(req: Request, res: Response) {
  try {
    const { id } = req.params
    const result = await pool.query(
      `SELECT p.*, c.name AS category_name,
        COALESCE(SUM(CASE
          WHEN it.transaction_type IN ('in','adjustment') THEN it.quantity
          WHEN it.transaction_type = 'out' THEN -it.quantity
          ELSE 0 END), 0) AS current_stock
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN inventory_transactions it ON p.id = it.product_id
       WHERE p.id = $1
       GROUP BY p.id, c.name`,
      [id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' })
    }
    res.status(200).json({ product: result.rows[0] })
  } catch (error) {
    console.error('getProductById error:', error)
    res.status(500).json({ error: 'Failed to fetch product' })
  }
}

// ─────────────────────────────────────────────────────────────
// POST /api/pos/sales
// Creates sale + sale_items + inventory_transactions (atomically)
// ─────────────────────────────────────────────────────────────
export async function createSale(req: Request, res: Response) {
  // Use a database transaction so either EVERYTHING saves or NOTHING does.
  // WHY: If the sale saves but inventory_transactions fail, stock would be
  //      wrong. Atomic operations = data integrity.
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const { total_amount, cash_tendered, change_amount, payment_method, items } = req.body
    const cashierId = (req as any).user.id  // set by authenticateToken middleware

    // Basic validation
    if (!items || items.length === 0) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'Sale must have at least one item' })
    }

    // 1. Create the sale record
    const saleResult = await client.query(
      `INSERT INTO sales (cashier_id, total_amount, cash_tendered, change_amount, payment_method)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [cashierId, total_amount, cash_tendered, change_amount, payment_method ?? 'cash']
    )
    const sale = saleResult.rows[0]

    // 2. Create sale_items + inventory_transactions for each product
    for (const item of items) {
      // Insert sale item (with snapshot of product details)
      await client.query(
        `INSERT INTO sale_items (sale_id, product_id, product_name, unit_of_measure, unit_price, quantity, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [sale.id, item.product_id, item.product_name, item.unit_of_measure,
         item.unit_price, item.quantity, item.subtotal]
      )

      // Automatically deduct from inventory
      // WHY: This is the "magic" that syncs POS → STOCKER.
      //      No manual syncing needed. One sale = one 'out' transaction per item.
      await client.query(
        `INSERT INTO inventory_transactions (product_id, transaction_type, quantity, user_id, notes)
         VALUES ($1, 'out', $2, $3, $4)`,
        [item.product_id, item.quantity, cashierId, `POS Sale #${sale.id}`]
      )
    }

    await client.query('COMMIT')

    // Return the complete sale with items for receipt display
    const fullSale = await getSaleData(sale.id)
    res.status(201).json({ message: 'Sale created successfully', sale: fullSale })

  } catch (error) {
    await client.query('ROLLBACK')
    console.error('createSale error:', error)
    res.status(500).json({ error: 'Failed to create sale' })
  } finally {
    client.release()
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/pos/sales
// Query params: ?from=2024-01-01&to=2024-01-31
// ─────────────────────────────────────────────────────────────
export async function getSales(req: Request, res: Response) {
  try {
    const { from, to } = req.query

    const result = await pool.query(
      `SELECT s.*,
              u.first_name || ' ' || u.last_name AS cashier_name
       FROM sales s
       LEFT JOIN users u ON s.cashier_id = u.id
       WHERE ($1::date IS NULL OR s.created_at::date >= $1::date)
         AND ($2::date IS NULL OR s.created_at::date <= $2::date)
       ORDER BY s.created_at DESC
       LIMIT 100`,
      [from ?? null, to ?? null]
    )

    res.status(200).json({ sales: result.rows })
  } catch (error) {
    console.error('getSales error:', error)
    res.status(500).json({ error: 'Failed to fetch sales' })
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/pos/sales/:id
// ─────────────────────────────────────────────────────────────
export async function getSaleById(req: Request, res: Response) {
  try {
    const sale = await getSaleData(parseInt(req.params.id))
    if (!sale) return res.status(404).json({ error: 'Sale not found' })
    res.status(200).json({ sale })
  } catch (error) {
    console.error('getSaleById error:', error)
    res.status(500).json({ error: 'Failed to fetch sale' })
  }
}

// ── Helper: fetch sale with all items ────────────────────────
async function getSaleData(saleId: number) {
  const saleResult = await pool.query(
    `SELECT s.*, u.first_name || ' ' || u.last_name AS cashier_name
     FROM sales s LEFT JOIN users u ON s.cashier_id = u.id
     WHERE s.id = $1`,
    [saleId]
  )
  if (saleResult.rows.length === 0) return null

  const itemsResult = await pool.query(
    'SELECT * FROM sale_items WHERE sale_id = $1 ORDER BY id',
    [saleId]
  )

  return { ...saleResult.rows[0], items: itemsResult.rows }
}
