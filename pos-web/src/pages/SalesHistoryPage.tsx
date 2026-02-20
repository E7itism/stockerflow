/**
 * SalesHistoryPage.tsx
 *
 * Shows a summary of today's sales for the cashier to review their shift.
 * Intentionally simple — line item detail belongs on a receipt, not a list.
 *
 * Data flow:
 *   GET /api/pos/sales?from=TODAY&to=TODAY → list of sales
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { salesAPI } from '../services/api';
import { formatPeso, formatDateTime, todayISO } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import type { Sale } from '../types';
import toast from 'react-hot-toast';

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();

  // Load today's sales on mount
  useEffect(() => {
    loadSales();
  }, []);

  async function loadSales() {
    try {
      setLoading(true);
      const today = todayISO();
      const data = await salesAPI.getHistory({ from: today, to: today });
      setSales(data);
    } catch {
      toast.error('Failed to load sales history');
    } finally {
      setLoading(false);
    }
  }

  // Total revenue for the day — calculated from all sales
  const totalRevenue = sales.reduce(
    (sum, s) => sum + parseFloat(s.total_amount),
    0,
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ── HEADER ─────────────────────────────────────────── */}
      <header className="bg-green-600 text-white px-6 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="text-green-200 hover:text-white text-sm transition-colors"
          >
            ← Back to POS
          </Link>
          <span className="text-xl font-bold">Sales History</span>
        </div>
        <span className="text-green-100 text-sm">
          {user?.first_name} {user?.last_name}
        </span>
      </header>

      <div className="max-w-3xl mx-auto p-6 space-y-4">
        {/* ── SUMMARY CARD ───────────────────────────────── */}
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

        {/* ── SALES LIST ─────────────────────────────────── */}
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
                {/* Left — sale info */}
                <div>
                  <div className="font-semibold text-gray-800">
                    Sale #{sale.id}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {formatDateTime(sale.created_at)} · {sale.cashier_name}
                  </div>
                </div>

                {/* Right — amounts */}
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
