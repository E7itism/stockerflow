/**
 * InventoryPage.tsx
 *
 * Displays all stock movement transactions and allows adding new ones.
 * Supports filtering by product and transaction type.
 *
 * Design decision: No delete button.
 * Transactions are permanent like a financial ledger.
 * Mistakes are corrected by adding an Adjustment transaction,
 * which keeps the full history intact for auditing.
 */

import { useEffect, useState } from 'react';
import { inventoryAPI, productsAPI } from '../services/api';
import { Layout } from '../components/Layout';

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

export const InventoryPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const [filterProduct, setFilterProduct] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch transactions and products in parallel
      const [transactionsData, productsData] = await Promise.all([
        inventoryAPI.getAllTransactions(),
        productsAPI.getAll(),
      ]);

      setTransactions(transactionsData.transactions || transactionsData);
      setProducts(productsData.products || productsData);
    } catch (err: any) {
      console.error('Failed to fetch inventory data:', err);
      setError(err.response?.data?.error || 'Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTransaction = async () => {
    setShowModal(false);
    await fetchData(); // Refresh list after adding a transaction
  };

  /**
   * Client-side filtering — no extra API calls needed.
   * Both filters can be active at the same time.
   * Returning false from any condition excludes the transaction.
   */
  const filteredTransactions = transactions.filter((transaction) => {
    if (
      filterProduct !== 'all' &&
      transaction.product_id.toString() !== filterProduct
    ) {
      return false;
    }
    if (filterType !== 'all' && transaction.transaction_type !== filterType) {
      return false;
    }
    return true;
  });

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Inventory Transactions
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Track all stock movements
          </p>
        </div>

        {/* Filters + Add button */}
        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3 lg:gap-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full lg:w-auto">
              <select
                value={filterProduct}
                onChange={(e) => setFilterProduct(e.target.value)}
                className="w-full sm:flex-1 lg:w-48 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              >
                <option value="all">All Products</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full sm:flex-1 lg:w-48 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              >
                <option value="all">All Types</option>
                <option value="in">Stock In</option>
                <option value="out">Stock Out</option>
                <option value="adjustment">Adjustment</option>
              </select>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="w-full lg:w-auto px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors font-medium text-base"
            >
              + Add Transaction
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
        ) : (
          <>
            {/* Desktop: table */}
            <div className="hidden md:block">
              <TransactionsTable transactions={filteredTransactions} />
            </div>
            {/* Mobile: cards */}
            <div className="md:hidden">
              <TransactionsCards transactions={filteredTransactions} />
            </div>
          </>
        )}

        {showModal && (
          <TransactionModal
            products={products}
            onClose={() => setShowModal(false)}
            onSave={handleSaveTransaction}
          />
        )}
      </div>
    </Layout>
  );
};

// ─────────────────────────────────────────────
// TABLE (Desktop)
// ─────────────────────────────────────────────

interface TableProps {
  transactions: Transaction[];
}

const TransactionsTable: React.FC<TableProps> = ({ transactions }) => {
  // Maps transaction type to display icon, label, and color classes
  const getTransactionStyle = (type: string) => {
    switch (type) {
      case 'in':
        return {
          icon: '📥',
          label: 'Stock In',
          color: 'text-green-600',
          bg: 'bg-green-50',
        };
      case 'out':
        return {
          icon: '📤',
          label: 'Stock Out',
          color: 'text-red-600',
          bg: 'bg-red-50',
        };
      case 'adjustment':
        return {
          icon: '🔧',
          label: 'Adjustment',
          color: 'text-yellow-600',
          bg: 'bg-yellow-50',
        };
      default:
        return {
          icon: '📦',
          label: 'Unknown',
          color: 'text-gray-600',
          bg: 'bg-gray-50',
        };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-16 text-center">
        <p className="text-gray-500 text-lg">No transactions found</p>
        <p className="text-gray-400 text-sm mt-2">
          Add your first transaction to get started
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Date', 'Product', 'Type', 'Quantity', 'User', 'Notes'].map(
                (h) => (
                  <th
                    key={h}
                    className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase ${
                      h === 'Type' || h === 'Quantity'
                        ? 'text-center'
                        : 'text-left'
                    } ${h === 'Quantity' ? 'text-right' : ''}`}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transactions.map((transaction) => {
              const style = getTransactionStyle(transaction.transaction_type);
              return (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDate(transaction.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">
                      {transaction.product_name}
                    </p>
                    <p className="text-xs text-gray-500">{transaction.sku}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${style.bg} ${style.color}`}
                    >
                      <span className="mr-1">{style.icon}</span>
                      {style.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {/* Show + for in/adjustment, - for out */}
                    <span className={`text-sm font-semibold ${style.color}`}>
                      {transaction.transaction_type === 'out' ? '-' : '+'}
                      {transaction.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {transaction.user_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {transaction.notes || '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// CARDS (Mobile)
// ─────────────────────────────────────────────

const TransactionsCards: React.FC<TableProps> = ({ transactions }) => {
  const getTransactionStyle = (type: string) => {
    switch (type) {
      case 'in':
        return {
          icon: '📥',
          label: 'Stock In',
          color: 'text-green-600',
          bg: 'bg-green-50',
        };
      case 'out':
        return {
          icon: '📤',
          label: 'Stock Out',
          color: 'text-red-600',
          bg: 'bg-red-50',
        };
      case 'adjustment':
        return {
          icon: '🔧',
          label: 'Adjustment',
          color: 'text-yellow-600',
          bg: 'bg-yellow-50',
        };
      default:
        return {
          icon: '📦',
          label: 'Unknown',
          color: 'text-gray-600',
          bg: 'bg-gray-50',
        };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500 text-lg">No transactions found</p>
        <p className="text-gray-400 text-sm mt-2">
          Add your first transaction to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => {
        const style = getTransactionStyle(transaction.transaction_type);
        return (
          <div
            key={transaction.id}
            className="bg-white rounded-lg shadow-md p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3 flex-1">
                <span className="text-2xl">{style.icon}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900">
                    {transaction.product_name}
                  </h3>
                  <p className="text-xs text-gray-500">{transaction.sku}</p>
                </div>
              </div>
              <span
                className={`text-lg font-bold ${style.color} ml-2 flex-shrink-0`}
              >
                {transaction.transaction_type === 'out' ? '-' : '+'}
                {transaction.quantity}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Type:</span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${style.bg} ${style.color}`}
                >
                  {style.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Date:</span>
                <span className="text-gray-900">
                  {formatDate(transaction.created_at)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">User:</span>
                <span className="text-gray-900">{transaction.user_name}</span>
              </div>
            </div>

            {transaction.notes && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-sm text-gray-600">{transaction.notes}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────
// MODAL — Add Transaction
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
    quantity: '' as number | string, // starts empty so user doesn't have to clear 0
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
              : value // keep as string while typing, convert at submit
            : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Convert quantity string → number only at submit time
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
      await inventoryAPI.createTransaction({
        ...formData,
        quantity, // send as number
      });
      onSave();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create transaction');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white rounded-t-lg sm:rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
            Add Inventory Transaction
          </h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product *
              </label>
              <select
                name="product_id"
                value={formData.product_id}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                required
              >
                <option value={0}>Select product...</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                    {product.current_stock !== undefined &&
                      ` - Stock: ${product.current_stock}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Type *
              </label>
              <select
                name="transaction_type"
                value={formData.transaction_type}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                required
              >
                <option value="in">📥 Stock In (Receiving/Purchase)</option>
                <option value="out">📤 Stock Out (Sale/Usage)</option>
                <option value="adjustment">🔧 Adjustment (Correction)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                onFocus={(e) => e.target.select()} // select all on click for easy overwrite
                min="1"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                placeholder="Enter quantity"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                placeholder="Optional notes..."
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:bg-gray-100 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 disabled:bg-blue-300 font-medium"
              >
                {loading ? 'Saving...' : 'Add Transaction'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
