import { useEffect, useState, useMemo } from 'react';
import { inventoryAPI, productsAPI } from '../services/api';
import { Layout } from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  SlidersHorizontal,
  Plus,
  ClipboardList,
  Search,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Transaction {
  id: number;
  product_id: number;
  product_name: string;
  sku: string;
  transaction_type: 'in' | 'out' | 'adjustment';
  quantity: number;
  user_name: string;
  notes?: string;
  created_at: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  current_stock?: number;
}

const typeConfig = {
  in: {
    icon: ArrowDownToLine,
    label: 'Stock In',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    quantity: 'text-emerald-600',
    prefix: '+',
  },
  out: {
    icon: ArrowUpFromLine,
    label: 'Stock Out',
    badge: 'bg-red-50 text-red-700 border-red-200',
    quantity: 'text-red-600',
    prefix: '-',
  },
  adjustment: {
    icon: SlidersHorizontal,
    label: 'Adjustment',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    quantity: 'text-amber-600',
    prefix: '',
  },
};

const formatDate = (d: string) =>
  new Date(d).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const toDateInput = (d: Date) => d.toISOString().split('T')[0];

const fieldClass =
  'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none';

export const InventoryPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // ── Filters ───────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [txData, prodData] = await Promise.all([
        inventoryAPI.getAllTransactions(),
        productsAPI.getAll(),
      ]);
      setTransactions(txData.transactions || txData);
      setProducts(prodData.products || prodData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  /**
   * filtered — applies all active filters simultaneously.
   * useMemo prevents recalculation on every render.
   * All filters are client-side — no extra API calls needed.
   */
  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      // Search — matches product name, SKU, or user name
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesSearch =
          t.product_name.toLowerCase().includes(q) ||
          t.sku.toLowerCase().includes(q) ||
          t.user_name.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      // Transaction type filter
      if (filterType !== 'all' && t.transaction_type !== filterType)
        return false;

      // Date range filter
      if (filterFrom) {
        const txDate = new Date(t.created_at).toISOString().split('T')[0];
        if (txDate < filterFrom) return false;
      }
      if (filterTo) {
        const txDate = new Date(t.created_at).toISOString().split('T')[0];
        if (txDate > filterTo) return false;
      }

      return true;
    });
  }, [transactions, search, filterType, filterFrom, filterTo]);

  const hasActiveFilters =
    search || filterType !== 'all' || filterFrom || filterTo;

  const clearFilters = () => {
    setSearch('');
    setFilterType('all');
    setFilterFrom('');
    setFilterTo('');
  };

  // Summary counts for the active filtered set
  const summary = useMemo(
    () => ({
      in: filtered
        .filter((t) => t.transaction_type === 'in')
        .reduce((s, t) => s + t.quantity, 0),
      out: filtered
        .filter((t) => t.transaction_type === 'out')
        .reduce((s, t) => s + t.quantity, 0),
      adjustment: filtered.filter((t) => t.transaction_type === 'adjustment')
        .length,
    }),
    [filtered],
  );

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* ── Header ──────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
            <p className="text-sm text-slate-500 mt-1">
              {filtered.length} of {transactions.length} transactions
            </p>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-slate-900 hover:bg-slate-800 gap-2"
          >
            <Plus className="w-4 h-4" /> Add Transaction
          </Button>
        </div>

        {/* ── Filters ─────────────────────────────────────── */}
        <Card>
          <CardContent className="p-4 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by product, SKU or user..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10"
              />
            </div>

            {/* Type + Date range */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Type filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className={`${fieldClass} sm:w-44`}
              >
                <option value="all">All Types</option>
                <option value="in">Stock In</option>
                <option value="out">Stock Out</option>
                <option value="adjustment">Adjustment</option>
              </select>

              {/* Date range */}
              <div className="flex items-center gap-2 flex-1">
                <div className="space-y-0.5 flex-1">
                  <label className="text-xs text-slate-500 ml-1">From</label>
                  <input
                    type="date"
                    value={filterFrom}
                    onChange={(e) => setFilterFrom(e.target.value)}
                    className={fieldClass}
                  />
                </div>
                <div className="space-y-0.5 flex-1">
                  <label className="text-xs text-slate-500 ml-1">To</label>
                  <input
                    type="date"
                    value={filterTo}
                    max={toDateInput(new Date())}
                    onChange={(e) => setFilterTo(e.target.value)}
                    className={fieldClass}
                  />
                </div>
              </div>

              {/* Clear filters */}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="gap-1.5 text-slate-500 self-end h-10"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Summary strip (only when filters active) ────── */}
        {hasActiveFilters && filtered.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-emerald-700">
                +{summary.in}
              </p>
              <p className="text-xs text-emerald-600 mt-0.5">Units In</p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-red-700">-{summary.out}</p>
              <p className="text-xs text-red-600 mt-0.5">Units Out</p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-amber-700">
                {summary.adjustment}
              </p>
              <p className="text-xs text-amber-600 mt-0.5">Adjustments</p>
            </div>
          </div>
        )}

        {/* ── Content ─────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={fetchData}>
              Retry
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-slate-400">
              <ClipboardList className="w-10 h-10 mb-3 opacity-40" />
              <p className="font-medium">No transactions found</p>
              <p className="text-sm mt-1">
                {hasActiveFilters
                  ? 'Try adjusting your filters'
                  : 'Add your first transaction to get started'}
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="mt-3 gap-1.5"
                >
                  <X className="w-3.5 h-3.5" /> Clear filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <Card className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="text-xs uppercase tracking-wider">
                        Date
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-wider">
                        Product
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-wider">
                        Type
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-wider text-right">
                        Qty
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-wider">
                        User
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-wider">
                        Notes
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((t) => {
                      const config = typeConfig[t.transaction_type];
                      const Icon = config.icon;
                      return (
                        <TableRow key={t.id} className="hover:bg-slate-50">
                          <TableCell className="text-sm text-slate-500 whitespace-nowrap">
                            {formatDate(t.created_at)}
                          </TableCell>
                          <TableCell>
                            <p className="text-sm font-medium text-slate-900">
                              {t.product_name}
                            </p>
                            <p className="text-xs font-mono text-slate-400">
                              {t.sku}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`text-xs gap-1.5 ${config.badge}`}
                            >
                              <Icon className="w-3 h-3" />
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={`text-sm font-bold ${config.quantity}`}
                            >
                              {config.prefix}
                              {t.quantity}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {t.user_name}
                          </TableCell>
                          <TableCell className="text-sm text-slate-400">
                            {t.notes || '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filtered.map((t) => {
                const config = typeConfig[t.transaction_type];
                const Icon = config.icon;
                return (
                  <Card key={t.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                            <Icon className="w-4 h-4 text-slate-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {t.product_name}
                            </p>
                            <p className="text-xs font-mono text-slate-400">
                              {t.sku}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-lg font-bold ${config.quantity}`}
                        >
                          {config.prefix}
                          {t.quantity}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${config.badge}`}
                        >
                          {config.label}
                        </Badge>
                        <span>{formatDate(t.created_at)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>By {t.user_name}</span>
                        {t.notes && (
                          <span className="text-slate-400 truncate ml-2">
                            {t.notes}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {showModal && (
          <TransactionModal
            products={products}
            onClose={() => setShowModal(false)}
            onSave={() => {
              setShowModal(false);
              fetchData();
            }}
          />
        )}
      </div>
    </Layout>
  );
};

// ─────────────────────────────────────────────
// TRANSACTION MODAL
// ─────────────────────────────────────────────

interface ModalProps {
  products: Product[];
  onClose: () => void;
  onSave: () => void;
}

const TransactionModal: React.FC<ModalProps> = ({
  products,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    product_id: 0,
    transaction_type: 'in' as 'in' | 'out' | 'adjustment',
    quantity: '' as number | string,
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]:
        name === 'product_id'
          ? Number(value)
          : name === 'quantity'
            ? value === ''
              ? ''
              : value
            : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const quantity = parseInt(String(formData.quantity)) || 0;
    if (formData.product_id === 0) {
      setError('Please select a product');
      return;
    }
    if (quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await inventoryAPI.createTransaction({ ...formData, quantity });
      toast.success('Transaction added');
      onSave();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create transaction');
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Inventory Transaction</DialogTitle>
        </DialogHeader>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Product *
            </label>
            <select
              name="product_id"
              value={formData.product_id}
              onChange={handleChange}
              className={fieldClass}
              required
            >
              <option value={0}>Select product...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                  {p.current_stock !== undefined
                    ? ` — Stock: ${p.current_stock}`
                    : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Transaction Type *
            </label>
            <select
              name="transaction_type"
              value={formData.transaction_type}
              onChange={handleChange}
              className={fieldClass}
            >
              <option value="in">Stock In — Receiving / Purchase</option>
              <option value="out">Stock Out — Sale / Usage</option>
              <option value="adjustment">Adjustment — Correction</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Quantity *
            </label>
            <Input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              onFocus={(e) => e.target.select()}
              min="1"
              placeholder="Enter quantity"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              className={fieldClass}
              placeholder="Optional notes..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-slate-900 hover:bg-slate-800"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </span>
              ) : (
                'Add Transaction'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
