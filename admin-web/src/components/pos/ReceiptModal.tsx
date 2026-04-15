import { useEffect, useState } from 'react';
import { posAPI } from '../../services/api';
import type { POSSale } from '../../types/pos';

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

interface Props {
  saleId: number;
  onClose: () => void;
}

export function ReceiptModal({ saleId, onClose }: Props) {
  const [sale, setSale] = useState<POSSale | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    posAPI
      .getSaleById(saleId)
      .then(setSale)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [saleId]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            Loading receipt...
          </div>
        ) : !sale ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-3">✅</div>
            <div className="font-bold text-gray-800 text-lg">Sale Complete</div>
            <div className="text-gray-500 text-sm mt-1">
              Receipt unavailable
            </div>
            <button
              onClick={onClose}
              className="mt-4 w-full py-2.5 bg-green-500 text-white rounded-lg font-medium"
            >
              New Sale
            </button>
          </div>
        ) : (
          <>
            <div className="p-6">
              <div className="text-center mb-4">
                <div className="text-xl font-bold text-gray-900">
                  🧾 StockerFlow POS
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {formatDateTime(sale.created_at)}
                </div>
                <div className="text-xs text-gray-400">Receipt #{sale.id}</div>
                <div className="text-xs text-gray-400">
                  Cashier: {sale.cashier_name}
                </div>
              </div>
              <div className="border-t border-dashed border-gray-300 my-3" />
              <div className="space-y-2">
                {sale.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div>
                      <div className="text-gray-800 font-medium">
                        {item.product_name}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {item.quantity} × {formatPeso(item.unit_price)} /{' '}
                        {item.unit_of_measure}
                      </div>
                    </div>
                    <div className="text-gray-800 font-medium">
                      {formatPeso(item.subtotal)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed border-gray-300 my-3" />
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Total</span>
                  <span className="font-bold text-gray-900">
                    {formatPeso(sale.total_amount)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Cash</span>
                  <span>{formatPeso(sale.cash_tendered)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Change</span>
                  <span className="font-bold text-green-600">
                    {formatPeso(sale.change_amount)}
                  </span>
                </div>
              </div>
              <div className="text-center mt-4 text-xs text-gray-400">
                Thank you for your purchase!
              </div>
            </div>
            <div className="px-6 pb-6">
              <button
                onClick={onClose}
                className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors"
              >
                New Sale
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
