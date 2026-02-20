/**
 * CheckoutModal.tsx
 *
 * Shown when cashier clicks "Checkout".
 * Cashier enters cash tendered → app calculates change → confirm sale.
 *
 * On confirm:
 *   1. Calls POST /api/pos/sales
 *   2. Backend creates sale + sale_items + inventory_transactions atomically
 *   3. Returns sale ID → parent shows receipt
 */

import { useState } from 'react';
import { salesAPI } from '../../services/api';
import { formatPeso } from '../../utils/format';
import type { CartItem } from '../../types';
import toast from 'react-hot-toast';

interface Props {
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  onConfirm: (saleId: number) => void;
  onCancel: () => void;
}

export default function CheckoutModal({
  items,
  subtotal,
  tax,
  total,
  onConfirm,
  onCancel,
}: Props) {
  const [cashTendered, setCashTendered] = useState('');
  const [loading, setLoading] = useState(false);

  // Calculate change — only when cash tendered is a valid number >= total
  const cash = parseFloat(cashTendered);
  const change = !isNaN(cash) && cash >= total ? cash - total : null;
  const canConfirm = change !== null && !loading;

  // Quick cash buttons — common denominations in Philippines
  const quickAmounts = [20, 50, 100, 200, 500, 1000];

  async function handleConfirm() {
    if (!canConfirm) return;
    setLoading(true);

    try {
      const sale = await salesAPI.create({
        total_amount: total,
        cash_tendered: cash,
        change_amount: change!,
        payment_method: 'cash',
        items: items.map((i) => ({
          product_id: i.product_id,
          product_name: i.product_name,
          unit_of_measure: i.unit_of_measure,
          unit_price: i.unit_price,
          quantity: i.quantity,
          subtotal: i.subtotal,
        })),
      });

      onConfirm(sale.id);
    } catch {
      toast.error('Failed to process sale. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    // Backdrop
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Checkout</h2>
        </div>

        <div className="p-6 space-y-4">
          {/* Order summary */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>{formatPeso(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>VAT (12%)</span>
              <span>{formatPeso(tax)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 text-lg pt-2 border-t border-gray-200">
              <span>Total</span>
              <span className="text-green-600">{formatPeso(total)}</span>
            </div>
          </div>

          {/* Cash tendered input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cash Tendered
            </label>
            <input
              type="number"
              value={cashTendered}
              onChange={(e) => setCashTendered(e.target.value)}
              placeholder="0.00"
              min={total}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-xl font-bold text-gray-900"
              autoFocus
            />
          </div>

          {/* Quick amount buttons */}
          <div className="grid grid-cols-3 gap-2">
            {quickAmounts.map((amount) => (
              <button
                key={amount}
                onClick={() => setCashTendered(String(amount))}
                className="py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                ₱{amount}
              </button>
            ))}
          </div>

          {/* Change display */}
          {change !== null ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
              <div className="text-sm text-green-600 mb-1">Change</div>
              <div className="text-3xl font-bold text-green-600">
                {formatPeso(change)}
              </div>
            </div>
          ) : cashTendered && cash < total ? (
            // Not enough cash warning
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
              <div className="text-sm text-red-600 font-medium">
                Short by {formatPeso(total - cash)}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer buttons */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="flex-1 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-200 disabled:text-gray-400 transition-colors font-semibold"
          >
            {loading ? 'Processing...' : 'Confirm Sale'}
          </button>
        </div>
      </div>
    </div>
  );
}
