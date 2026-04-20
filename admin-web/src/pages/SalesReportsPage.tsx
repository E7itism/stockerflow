import { useState, useEffect, useCallback } from 'react';
import { Layout } from '../components/Layout';
import { reportsAPI } from '../services/api';
import { useSocket } from '../hooks/useSocket';
import type { ReportSummary, SaleRecord, SaleItem } from '../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DollarSign,
  Receipt,
  TrendingUp,
  Download,
  ChevronDown,
  ChevronUp,
  BarChart3,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';

const formatPeso = (value: number | string): string =>
  `₱${Number(value).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDateTime = (iso: string): string =>
  new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));

const formatDateShort = (iso: string): string =>
  new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));

const toDateInput = (d: Date): string => d.toISOString().split('T')[0];

const escapeCsvCell = (value: string | number): string => {
  const str = String(value);
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
};

const buildCsv = (rows: (string | number)[][]): string =>
  rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n');

const downloadCsv = (csvString: string, filename: string): void => {
  const blob = new Blob(['\uFEFF' + csvString], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

type Preset = 'today' | 'week' | 'month' | 'custom';

const getPresetRange = (preset: Preset): { from: string; to: string } => {
  const today = new Date();
  const to = toDateInput(today);
  if (preset === 'today') return { from: to, to };
  if (preset === 'week') {
    const from = new Date(today);
    from.setDate(today.getDate() - 6);
    return { from: toDateInput(from), to };
  }
  if (preset === 'month') {
    const from = new Date(today);
    from.setDate(today.getDate() - 29);
    return { from: toDateInput(from), to };
  }
  return { from: toDateInput(today), to };
};

const medals = ['🥇', '🥈', '🥉'];
const inputClass =
  'border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none';

// ── Skeletons ─────────────────────────────────
const SummaryCardsSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
    {[...Array(3)].map((_, i) => (
      <Card key={i}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-7 w-32" />
            </div>
            <Skeleton className="h-11 w-11 rounded-xl flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

const TopProductsSkeleton = () => (
  <Card>
    <CardHeader className="pb-3">
      <Skeleton className="h-5 w-36" />
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 flex-shrink-0" />
              <Skeleton className="h-3.5 w-24" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const TransactionsSkeleton = () => (
  <Card className="overflow-hidden">
    <div className="px-5 py-3 border-b bg-slate-50 flex items-center justify-between">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-3 w-16" />
    </div>
    <div className="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50">
            {['Date & Time', 'Cashier', 'Amount', 'Method', ''].map((h, i) => (
              <TableHead key={i} className="text-xs uppercase tracking-wider">
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(6)].map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-3.5 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-3.5 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-3.5 w-20 ml-auto" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-12 rounded-full" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-4 mx-auto rounded" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
    <div className="md:hidden divide-y divide-slate-100">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="px-4 py-4 space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <div className="space-y-1 text-right">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </Card>
);

export const SalesReportsPage: React.FC = () => {
  const [preset, setPreset] = useState<Preset>('month');
  const [dateFrom, setDateFrom] = useState(() => getPresetRange('month').from);
  const [dateTo, setDateTo] = useState(() => getPresetRange('month').to);

  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [salesLoading, setSalesLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSales, setTotalSales] = useState(0);
  const [expandedSaleId, setExpandedSaleId] = useState<number | null>(null);
  const [expandedItems, setExpandedItems] = useState<
    Record<number, SaleItem[]>
  >({});
  const [itemsLoading, setItemsLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

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

  useEffect(() => {
    setCurrentPage(1);
    setExpandedSaleId(null);
    fetchSummary();
    fetchSales(1);
  }, [fetchSummary, fetchSales]);

  useSocket({
    'sale:created': (_data) => {
      const today = toDateInput(new Date());
      if (today >= dateFrom && today <= dateTo) {
        fetchSummary();
        fetchSales(currentPage);
      }
    },
  });

  const handleRowClick = async (saleId: number) => {
    if (expandedSaleId === saleId) {
      setExpandedSaleId(null);
      return;
    }
    setExpandedSaleId(saleId);
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

  const handlePreset = (p: Preset) => {
    setPreset(p);
    if (p !== 'custom') {
      const range = getPresetRange(p);
      setDateFrom(range.from);
      setDateTo(range.to);
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const allSalesData = await reportsAPI.getSales(
        { from: dateFrom, to: dateTo },
        1,
        9999,
      );
      if (allSalesData.sales.length === 0) {
        toast.error('No sales to export');
        return;
      }
      const itemsPerSale = await Promise.all(
        allSalesData.sales.map((sale) => reportsAPI.getSaleItems(sale.id)),
      );
      const headers = [
        'Sale ID',
        'Date',
        'Cashier',
        'Payment Method',
        'Product',
        'Unit of Measure',
        'Qty',
        'Unit Price (₱)',
        'Subtotal (₱)',
        'Sale Total (₱)',
      ];
      const dataRows = allSalesData.sales.flatMap((sale, i) => {
        const items = itemsPerSale[i];
        if (items.length === 0)
          return [
            [
              sale.id,
              formatDateTime(sale.created_at),
              sale.cashier_name,
              sale.payment_method,
              '-',
              '-',
              '-',
              '-',
              '-',
              Number(sale.total_amount).toFixed(2),
            ],
          ];
        return items.map((item) => [
          sale.id,
          formatDateTime(sale.created_at),
          sale.cashier_name,
          sale.payment_method,
          item.product_name,
          item.unit_of_measure,
          item.quantity,
          Number(item.unit_price).toFixed(2),
          Number(item.subtotal).toFixed(2),
          Number(sale.total_amount).toFixed(2),
        ]);
      });
      downloadCsv(
        buildCsv([headers, ...dataRows]),
        `sales-report_${dateFrom}_to_${dateTo}.csv`,
      );
      toast.success(`Exported ${allSalesData.sales.length} transactions`);
    } catch {
      toast.error('Failed to export CSV');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Sales Reports</h1>
            <p className="text-sm text-slate-500 mt-1">
              Track revenue, transactions, and top products.
            </p>
          </div>
          <Button
            onClick={handleExport}
            disabled={exportLoading}
            variant="outline"
            size="sm"
            className="gap-2 flex-shrink-0"
          >
            {exportLoading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
        </div>

        {/* Date filter */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex gap-2 flex-wrap">
              {(['today', 'week', 'month'] as const).map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant={preset === p ? 'default' : 'outline'}
                  onClick={() => handlePreset(p)}
                  className={
                    preset === p ? 'bg-slate-900 hover:bg-slate-800' : ''
                  }
                >
                  {p === 'today'
                    ? 'Today'
                    : p === 'week'
                      ? 'This Week'
                      : 'This Month'}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">
                  From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setPreset('custom');
                    setDateFrom(e.target.value);
                  }}
                  className={`${inputClass} w-full`}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setPreset('custom');
                    setDateTo(e.target.value);
                  }}
                  className={`${inputClass} w-full`}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary cards */}
        {summaryLoading ? (
          <SummaryCardsSkeleton />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: 'Total Revenue',
                value: formatPeso(summary?.summary.total_revenue || 0),
                icon: DollarSign,
                color: 'text-emerald-600',
                bg: 'bg-emerald-50',
              },
              {
                label: 'Total Transactions',
                value: (
                  summary?.summary.transaction_count || 0
                ).toLocaleString(),
                icon: Receipt,
                color: 'text-blue-600',
                bg: 'bg-blue-50',
              },
              {
                label: 'Avg. Transaction',
                value: formatPeso(summary?.summary.avg_transaction_value || 0),
                icon: TrendingUp,
                color: 'text-violet-600',
                bg: 'bg-violet-50',
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <Card
                  key={card.label}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                          {card.label}
                        </p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">
                          {card.value}
                        </p>
                      </div>
                      <div
                        className={`${card.bg} p-3 rounded-xl flex-shrink-0`}
                      >
                        <Icon className={`w-5 h-5 ${card.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Top products */}
        {summaryLoading ? (
          <TopProductsSkeleton />
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-slate-900">
                  Top Selling Products
                </CardTitle>
                <BarChart3 className="w-4 h-4 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent>
              {summary && summary.top_products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {summary.top_products.map((product, index) => {
                    const maxQty = summary.top_products[0].total_quantity;
                    const barWidth = Math.round(
                      (product.total_quantity / maxQty) * 100,
                    );
                    return (
                      <div key={product.product_name} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg flex-shrink-0">
                            {medals[index] ?? `${index + 1}.`}
                          </span>
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {product.product_name}
                          </p>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div
                            className="bg-slate-900 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>
                            {product.total_quantity.toLocaleString()} units
                          </span>
                          <span className="font-medium text-slate-700">
                            {formatPeso(product.total_revenue)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                  <BarChart3 className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-sm">No sales in this period</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Transactions */}
        {salesLoading ? (
          <TransactionsSkeleton />
        ) : (
          <Card className="overflow-hidden">
            <div className="px-5 py-3 border-b bg-slate-50 flex items-center justify-between">
              <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Transactions
              </h2>
              <span className="text-xs text-slate-400">
                {totalSales.toLocaleString()} total
              </span>
            </div>

            {sales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <Receipt className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm font-medium">No transactions found</p>
                <p className="text-xs mt-1">Try adjusting your date range</p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs uppercase tracking-wider">
                          Date & Time
                        </TableHead>
                        <TableHead className="text-xs uppercase tracking-wider">
                          Cashier
                        </TableHead>
                        <TableHead className="text-xs uppercase tracking-wider text-right">
                          Amount
                        </TableHead>
                        <TableHead className="text-xs uppercase tracking-wider">
                          Method
                        </TableHead>
                        <TableHead className="text-xs uppercase tracking-wider text-center w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sales.map((sale) => (
                        <>
                          <TableRow
                            key={sale.id}
                            onClick={() => handleRowClick(sale.id)}
                            className={`cursor-pointer hover:bg-slate-50 transition-colors ${expandedSaleId === sale.id ? 'bg-blue-50/50' : ''}`}
                          >
                            <TableCell className="text-sm text-slate-500">
                              {formatDateTime(sale.created_at)}
                            </TableCell>
                            <TableCell className="text-sm font-medium text-slate-900">
                              {sale.cashier_name}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-slate-900">
                              {formatPeso(sale.total_amount)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="text-xs capitalize bg-slate-50"
                              >
                                {sale.payment_method}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {expandedSaleId === sale.id ? (
                                <ChevronUp className="w-4 h-4 text-slate-400 mx-auto" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-400 mx-auto" />
                              )}
                            </TableCell>
                          </TableRow>
                          {expandedSaleId === sale.id && (
                            <TableRow key={`${sale.id}-items`}>
                              <TableCell
                                colSpan={5}
                                className="p-0 bg-slate-50"
                              >
                                {itemsLoading && !expandedItems[sale.id] ? (
                                  <div className="flex justify-center py-4">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-900" />
                                  </div>
                                ) : (
                                  <div className="px-6 py-3">
                                    <div className="rounded-lg overflow-hidden border border-slate-200 bg-white">
                                      <Table>
                                        <TableHeader>
                                          <TableRow className="bg-slate-100">
                                            <TableHead className="text-xs uppercase">
                                              Product
                                            </TableHead>
                                            <TableHead className="text-xs uppercase text-right">
                                              Qty
                                            </TableHead>
                                            <TableHead className="text-xs uppercase text-right">
                                              Unit Price
                                            </TableHead>
                                            <TableHead className="text-xs uppercase text-right">
                                              Subtotal
                                            </TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {(expandedItems[sale.id] || []).map(
                                            (item, idx) => (
                                              <TableRow
                                                key={idx}
                                                className="hover:bg-slate-50"
                                              >
                                                <TableCell className="text-sm text-slate-900">
                                                  {item.product_name}
                                                  <span className="text-slate-400 text-xs ml-1">
                                                    ({item.unit_of_measure})
                                                  </span>
                                                </TableCell>
                                                <TableCell className="text-right text-sm text-slate-600">
                                                  {item.quantity}
                                                </TableCell>
                                                <TableCell className="text-right text-sm text-slate-600">
                                                  {formatPeso(item.unit_price)}
                                                </TableCell>
                                                <TableCell className="text-right text-sm font-medium text-slate-900">
                                                  {formatPeso(item.subtotal)}
                                                </TableCell>
                                              </TableRow>
                                            ),
                                          )}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile card list */}
                <div className="md:hidden divide-y divide-slate-100">
                  {sales.map((sale) => (
                    <div key={sale.id}>
                      <button
                        onClick={() => handleRowClick(sale.id)}
                        className={`w-full text-left px-4 py-4 hover:bg-slate-50 transition-colors ${expandedSaleId === sale.id ? 'bg-blue-50/30' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-slate-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900 truncate">
                                {sale.cashier_name}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {formatDateShort(sale.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold text-slate-900">
                              {formatPeso(sale.total_amount)}
                            </p>
                            <Badge
                              variant="outline"
                              className="text-xs capitalize mt-1"
                            >
                              {sale.payment_method}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center justify-end mt-2">
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            {expandedSaleId === sale.id ? (
                              <>
                                <ChevronUp className="w-3 h-3" /> Hide items
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3 h-3" /> View items
                              </>
                            )}
                          </span>
                        </div>
                      </button>
                      {expandedSaleId === sale.id && (
                        <div className="px-4 pb-4 bg-slate-50">
                          {itemsLoading && !expandedItems[sale.id] ? (
                            <div className="flex justify-center py-3">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-900" />
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {(expandedItems[sale.id] || []).map(
                                (item, idx) => (
                                  <div
                                    key={idx}
                                    className="bg-white rounded-lg p-3 border border-slate-200"
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="min-w-0">
                                        <p className="text-sm font-medium text-slate-900 truncate">
                                          {item.product_name}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                          {item.unit_of_measure} ·{' '}
                                          {item.quantity} pcs
                                        </p>
                                      </div>
                                      <div className="text-right flex-shrink-0">
                                        <p className="text-sm font-semibold text-slate-900">
                                          {formatPeso(item.subtotal)}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                          {formatPeso(item.unit_price)} each
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-4 sm:px-5 py-3 border-t flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-400">
                      Page {currentPage} of {totalPages}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCurrentPage(currentPage - 1);
                          fetchSales(currentPage - 1);
                        }}
                        disabled={currentPage === 1}
                        className="h-7 px-2 text-xs"
                      >
                        ←
                      </Button>
                      {Array.from(
                        { length: Math.min(3, totalPages) },
                        (_, i) => {
                          const start = Math.max(
                            1,
                            Math.min(currentPage - 1, totalPages - 2),
                          );
                          return start + i;
                        },
                      ).map((page) => (
                        <Button
                          key={page}
                          variant={page === currentPage ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            setCurrentPage(page);
                            fetchSales(page);
                          }}
                          className={`h-7 px-2.5 text-xs ${page === currentPage ? 'bg-slate-900 hover:bg-slate-800' : ''}`}
                        >
                          {page}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCurrentPage(currentPage + 1);
                          fetchSales(currentPage + 1);
                        }}
                        disabled={currentPage === totalPages}
                        className="h-7 px-2 text-xs"
                      >
                        →
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        )}
      </div>
    </Layout>
  );
};
