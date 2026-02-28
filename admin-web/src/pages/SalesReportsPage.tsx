/**
 * SalesReportsPage.tsx
 *
 * Admin view for sales analytics.
 *
 * WHAT THIS PAGE SHOWS:
 * 1. Summary cards — total revenue, # of transactions, avg sale value
 * 2. Top 5 selling products (by units sold)
 * 3. Paginated sales list — each row expandable to show line items
 * 4. Date range filter — preset shortcuts + custom date inputs
 *
 * DATA FLOW:
 * - On mount → fetch summary + sales list for default range (last 30 days)
 * - User picks date range → refetch both
 * - User clicks a sale row → lazy-fetch that sale's line items
 * - User paginates → fetch next page of sales (summary stays the same)
 *
 * WHY split summary and sales list into separate fetches?
 * The summary (totals, top products) only changes when the DATE changes.
 * The sales list also changes on PAGE change. Keeping them separate
 * means pagination doesn't re-run the heavy aggregation queries.
 */

import { useState, useEffect, useCallback } from 'react';
import { Layout } from '../components/Layout';
import {
  reportsAPI,
  ReportSummary,
  SaleRecord,
  SaleItem,
} from '../services/api';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

/**
 * Format as Philippine Peso — matches the ₱ pattern used in ProductsPage.
 * Using toFixed(2) to stay consistent with the rest of the app.
 */
const formatPeso = (value: number | string): string =>
  `₱${Number(value).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Format an ISO timestamp as a readable local date + time. */
const formatDateTime = (iso: string): string =>
  new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));

/** Returns YYYY-MM-DD string for a Date (used to seed date inputs). */
const toDateInput = (d: Date): string => d.toISOString().split('T')[0];

// ─────────────────────────────────────────────────────────────────
// DATE PRESET SHORTCUTS
// ─────────────────────────────────────────────────────────────────

type Preset = 'today' | 'week' | 'month' | 'custom';

/**
 * Calculates the from/to pair for each preset.
 * "today" uses today's date for both — the backend's inclusive range
 * handles covering the full day.
 */
const getPresetRange = (preset: Preset): { from: string; to: string } => {
  const today = new Date();
  const to = toDateInput(today);

  if (preset === 'today') return { from: to, to };

  if (preset === 'week') {
    const from = new Date(today);
    from.setDate(today.getDate() - 6); // last 7 days including today
    return { from: toDateInput(from), to };
  }

  if (preset === 'month') {
    const from = new Date(today);
    from.setDate(today.getDate() - 29); // last 30 days including today
    return { from: toDateInput(from), to };
  }

  return { from: toDateInput(today), to };
};

// ─────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────

export const SalesReportsPage: React.FC = () => {
  // ── Date filter state ──────────────────────────────────────────
  const [preset, setPreset] = useState<Preset>('month');
  const [dateFrom, setDateFrom] = useState<string>(
    () => getPresetRange('month').from,
  );
  const [dateTo, setDateTo] = useState<string>(
    () => getPresetRange('month').to,
  );

  // ── Summary data ───────────────────────────────────────────────
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // ── Sales list data ────────────────────────────────────────────
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [salesLoading, setSalesLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSales, setTotalSales] = useState(0);

  // ── Expanded row state ─────────────────────────────────────────
  // Maps sale_id → its line items (loaded lazily on expand)
  const [expandedSaleId, setExpandedSaleId] = useState<number | null>(null);
  const [expandedItems, setExpandedItems] = useState<
    Record<number, SaleItem[]>
  >({});
  const [itemsLoading, setItemsLoading] = useState(false);

  // ─────────────────────────────────────────────────────────────
  // DATA FETCHING
  // ─────────────────────────────────────────────────────────────

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const data = await reportsAPI.getSummary({ from: dateFrom, to: dateTo });
      setSummary(data);
    } catch {
      toast.error('Failed to load report summary');
    } finally {
      setSummaryLoading(false);
    }
  }, [dateFrom, dateTo]);

  const fetchSales = useCallback(
    async (page: number) => {
      setSalesLoading(true);
      try {
        const data = await reportsAPI.getSales(
          { from: dateFrom, to: dateTo },
          page,
        );
        setSales(data.sales);
        setTotalPages(data.pagination.total_pages);
        setTotalSales(data.pagination.total);
      } catch {
        toast.error('Failed to load sales list');
      } finally {
        setSalesLoading(false);
      }
    },
    [dateFrom, dateTo],
  );

  // Refetch both when date range changes
  useEffect(() => {
    setCurrentPage(1);
    setExpandedSaleId(null);
    fetchSummary();
    fetchSales(1);
  }, [fetchSummary, fetchSales]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setExpandedSaleId(null);
    fetchSales(page);
  };

  // ─────────────────────────────────────────────────────────────
  // ROW EXPAND / COLLAPSE
  // ─────────────────────────────────────────────────────────────

  const handleRowClick = async (saleId: number) => {
    if (expandedSaleId === saleId) {
      setExpandedSaleId(null);
      return;
    }

    setExpandedSaleId(saleId);

    // Skip API call if we already loaded this sale's items
    if (expandedItems[saleId]) return;

    setItemsLoading(true);
    try {
      const items = await reportsAPI.getSaleItems(saleId);
      setExpandedItems((prev) => ({ ...prev, [saleId]: items }));
    } catch {
      toast.error('Failed to load sale details');
    } finally {
      setItemsLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // DATE PRESET HANDLERS
  // ─────────────────────────────────────────────────────────────

  const handlePreset = (p: Preset) => {
    setPreset(p);
    if (p !== 'custom') {
      const range = getPresetRange(p);
      setDateFrom(range.from);
      setDateTo(range.to);
    }
  };

  const handleCustomFrom = (val: string) => {
    setPreset('custom');
    setDateFrom(val);
  };

  const handleCustomTo = (val: string) => {
    setPreset('custom');
    setDateTo(val);
  };

  // ─────────────────────────────────────────────────────────────
  // INITIAL LOADING STATE — matches DashboardPage full-screen spinner
  // ─────────────────────────────────────────────────────────────

  if (summaryLoading && !summary) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* ── Page Header ──────────────────────────────────────── */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Sales Reports
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Track revenue, transaction volume, and top-selling products.
          </p>
        </div>

        {/* ── Date Filter ──────────────────────────────────────── */}
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex flex-wrap items-center gap-3">
            {/* Preset shortcut buttons */}
            <div className="flex gap-2">
              {(['today', 'week', 'month'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePreset(p)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    preset === p
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {p === 'today'
                    ? 'Today'
                    : p === 'week'
                      ? 'This Week'
                      : 'This Month'}
                </button>
              ))}
            </div>

            {/* Divider */}
            <span className="hidden sm:block text-gray-300">|</span>

            {/* Custom date inputs */}
            <div className="flex items-center gap-2 flex-wrap">
              <label className="text-sm text-gray-500">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => handleCustomFrom(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <label className="text-sm text-gray-500">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => handleCustomTo(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* ── Summary Cards ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <SummaryCard
            label="Total Revenue"
            value={formatPeso(summary?.summary.total_revenue || 0)}
            icon="💰"
            loading={summaryLoading}
          />
          <SummaryCard
            label="Total Transactions"
            value={(summary?.summary.transaction_count || 0).toLocaleString()}
            icon="🧾"
            loading={summaryLoading}
          />
          <SummaryCard
            label="Avg. Transaction"
            value={formatPeso(summary?.summary.avg_transaction_value || 0)}
            icon="📊"
            loading={summaryLoading}
          />
        </div>

        {/* ── Top Products + Sales List ─────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
          {/* ── Top 5 Products ───────────────────────────────────── */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 h-full">
              <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">
                🏆 Top Selling Products
              </h2>

              {summaryLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : summary && summary.top_products.length > 0 ? (
                <div className="space-y-4">
                  {summary.top_products.map((product, index) => {
                    const maxQty = summary.top_products[0].total_quantity;
                    const barWidth = Math.round(
                      (product.total_quantity / maxQty) * 100,
                    );

                    return (
                      <div key={product.product_name}>
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="text-sm text-gray-900 font-medium flex items-center gap-1.5 truncate pr-2">
                            <span>
                              {index === 0
                                ? '🥇'
                                : index === 1
                                  ? '🥈'
                                  : index === 2
                                    ? '🥉'
                                    : `${index + 1}.`}
                            </span>
                            <span className="truncate">
                              {product.product_name}
                            </span>
                          </span>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {product.total_quantity.toLocaleString()} units
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 text-right">
                          {formatPeso(product.total_revenue)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-lg">
                    No sales in this period
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Try a wider date range
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Sales List ───────────────────────────────────────── */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Table header bar */}
              <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
                <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  🧾 Transactions
                </h2>
                {!salesLoading && (
                  <span className="text-xs text-gray-400">
                    {totalSales.toLocaleString()} total
                  </span>
                )}
              </div>

              {salesLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
              ) : sales.length === 0 ? (
                <div className="p-16 text-center">
                  <p className="text-gray-500 text-lg">No transactions found</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Try adjusting your date range
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Date & Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Cashier
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Method
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                            Details
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {sales.map((sale) => (
                          <>
                            {/* Main sale row */}
                            <tr
                              key={sale.id}
                              onClick={() => handleRowClick(sale.id)}
                              className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                                expandedSaleId === sale.id ? 'bg-blue-50' : ''
                              }`}
                            >
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {formatDateTime(sale.created_at)}
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                {sale.cashier_name}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900 text-right font-semibold">
                                {formatPeso(sale.total_amount)}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                                {sale.payment_method}
                              </td>
                              <td className="px-6 py-4 text-center text-xs text-gray-400">
                                {expandedSaleId === sale.id
                                  ? '▲ hide'
                                  : '▼ view'}
                              </td>
                            </tr>

                            {/* Expanded line items */}
                            {expandedSaleId === sale.id && (
                              <tr key={`${sale.id}-items`}>
                                <td
                                  colSpan={5}
                                  className="px-6 pb-4 pt-0 bg-blue-50"
                                >
                                  {itemsLoading && !expandedItems[sale.id] ? (
                                    <div className="flex items-center justify-center py-4">
                                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                    </div>
                                  ) : (
                                    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-blue-100">
                                      <table className="w-full">
                                        <thead className="bg-blue-50 border-b border-blue-100">
                                          <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-blue-600 uppercase">
                                              Product
                                            </th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-blue-600 uppercase">
                                              Qty
                                            </th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-blue-600 uppercase">
                                              Unit Price
                                            </th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-blue-600 uppercase">
                                              Subtotal
                                            </th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                          {(expandedItems[sale.id] || []).map(
                                            (item, idx) => (
                                              <tr
                                                key={idx}
                                                className="hover:bg-gray-50"
                                              >
                                                <td className="px-4 py-2 text-sm text-gray-900">
                                                  {item.product_name}{' '}
                                                  <span className="text-gray-400 text-xs">
                                                    ({item.unit_of_measure})
                                                  </span>
                                                </td>
                                                <td className="px-4 py-2 text-sm text-gray-600 text-right">
                                                  {item.quantity}
                                                </td>
                                                <td className="px-4 py-2 text-sm text-gray-600 text-right">
                                                  {formatPeso(item.unit_price)}
                                                </td>
                                                <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                                                  {formatPeso(item.subtotal)}
                                                </td>
                                              </tr>
                                            ),
                                          )}
                                        </tbody>
                                      </table>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )}
                          </>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="px-6 py-4 border-t flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        Page {currentPage} of {totalPages}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          ← Prev
                        </button>
                        {Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, i) => {
                            const start = Math.max(
                              1,
                              Math.min(currentPage - 2, totalPages - 4),
                            );
                            return start + i;
                          },
                        ).map((page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                              page === currentPage
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

// ─────────────────────────────────────────────────────────────────
// SUMMARY CARD — matches shadow-md / rounded-lg pattern from other pages
// ─────────────────────────────────────────────────────────────────

interface SummaryCardProps {
  label: string;
  value: string;
  icon: string;
  loading: boolean;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  label,
  value,
  icon,
  loading,
}) => (
  <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
    <div className="flex items-center gap-3 mb-3">
      <span className="text-2xl">{icon}</span>
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
        {label}
      </span>
    </div>
    {loading ? (
      <div className="h-8 bg-gray-200 rounded animate-pulse w-3/4" />
    ) : (
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    )}
  </div>
);
