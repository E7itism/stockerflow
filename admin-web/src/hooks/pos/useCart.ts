import { useState, useCallback } from 'react';
import type { CartItem, POSProduct } from '../../types/pos';

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((product: POSProduct) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product_id === product.id
            ? {
                ...i,
                quantity: i.quantity + 1,
                subtotal: (i.quantity + 1) * i.unit_price,
              }
            : i,
        );
      }
      const price = parseFloat(product.unit_price);
      return [
        ...prev,
        {
          product_id: product.id,
          product_name: product.name,
          unit_of_measure: product.unit_of_measure,
          unit_price: price,
          quantity: 1,
          subtotal: price,
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.product_id !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.product_id === productId
          ? { ...i, quantity, subtotal: quantity * i.unit_price }
          : i,
      ),
    );
  }, []);

  const removeItem = useCallback((productId: number) => {
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
  }, []);
  const clearCart = useCallback(() => setItems([]), []);

  const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
  const tax = subtotal * 0.12;
  const total = subtotal + tax;

  return {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    tax,
    total,
  };
}
