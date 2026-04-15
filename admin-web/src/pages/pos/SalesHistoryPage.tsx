import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { posAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { POSSale } from '../../types/pos';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

const formatPeso = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(num);
};

const formatDateTime = (iso: string): string =>
  new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));

const todayISO = (): string => new Date().toISOString().split('T')[0];

export function SalesHistoryPage() {
  const [sales, setSales] = useState<POSSale[]>([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadSales();
  }, []);

  async function loadSales() {
    try {
      setLoading(true);
      const today = todayISO();
      const data = await posAPI.getSalesHistory({ from: today, to: today });
      setSales(data);
    } catch {
      toast.error('Failed to load sales history');
    } finally {
      setLoading(false);
    }
  }

  const totalRevenue = sales.reduce(
    (sum, s) => sum + parseFloat(s.total_amount),
    0,
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-green-600 text-white px-6 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/pos')}
            className="text-green-200 hover:text-white text-sm transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Back to POS
          </button>
          <span className="text-xl font-bold">Sales History</span>
        </div>
        <span className="text-green-100 text-sm">
          {user?.first_name} {user?.last_name}
        </span>
      </header>

      <div className="max-w-3xl mx-auto p-6 space-y-4">
        {/* Summary */}
        <div className="bg-white rounded-xl shadow-sm p-5 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-500">Today's Sales</div>
            <div className="text-3xl font-bold text-gray-900 mt-0.5">
              {sales.length}{' '}
              <span className="text-lg font-normal text-gray-400">
                transactions
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Total Revenue</div>
            <div className="text-3xl font-bold text-green-600 mt-0.5">
              {formatPeso(totalRevenue)}
            </div>
          </div>
        </div>

        {/* Sales list */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : sales.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-4xl mb-3">🧾</div>
            <div>No sales yet today</div>
          </div>
        ) : (
          <div className="space-y-3">
            {sales.map((sale) => (
              <div
                key={sale.id}
                className="bg-white rounded-xl shadow-sm px-5 py-4 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-gray-800">
                    Sale #{sale.id}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {formatDateTime(sale.created_at)} · {sale.cashier_name}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">
                    {formatPeso(sale.total_amount)}
                  </div>
                  <div className="text-xs text-gray-400">
                    Change: {formatPeso(sale.change_amount)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
