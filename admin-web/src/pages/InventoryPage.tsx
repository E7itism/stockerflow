import { useEffect, useState } from 'react';
import { inventoryAPI, productsAPI } from '../services/api';
import { Layout } from '../components/Layout';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  SlidersHorizontal,
  Plus,
  ClipboardList,
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

const fieldClass =
  'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none';

export const InventoryPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filterProduct, setFilterProduct] = useState('all');
  const [filterType, setFilterType] = useState('all');

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

  const filtered = transactions.filter((t) => {
    if (filterProduct !== 'all' && t.product_id.toString() !== filterProduct)
      return false;
    if (filterType !== 'all' && t.transaction_type !== filterType) return false;
    return true;
  });

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
            <p className="text-sm text-slate-500 mt-1">
              {transactions.length} total transactions
            </p>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-slate-900 hover:bg-slate-800 gap-2"
          >
            <Plus className="w-4 h-4" /> Add Transaction
          </Button>
        </div>

        <Card>
          <CardContent className="p-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={filterProduct}
                onChange={(e) => setFilterProduct(e.target.value)}
                className={`${fieldClass} sm:w-64`}
              >
                <option value="all">All Products</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className={`${fieldClass} sm:w-48`}
              >
                <option value="all">All Types</option>
                <option value="in">Stock In</option>
                <option value="out">Stock Out</option>
                <option value="adjustment">Adjustment</option>
              </select>
            </div>
          </CardContent>
        </Card>

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
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </CardContent>
          </Card>
        ) : (
          <>
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
