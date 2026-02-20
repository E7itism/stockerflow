import { useState, useCallback } from 'react'
import type { CartItem, Product } from '../types'

/**
 * useCart — all cart logic in one place
 *
 * WHY a custom hook:
 * Cart state is needed by ProductBrowser, Cart, and Checkout.
 * Lifting it to App and passing as props works, but a hook is
 * cleaner and easier to test. (Context would also work — this
 * is simpler for the current scale.)
 */
export function useCart() {
  const [items, setItems] = useState<CartItem[]>([])

  /** Add product to cart, or increment quantity if already there */
  const addItem = useCallback((product: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === product.id)

      if (existing) {
        // Increment quantity and recalculate subtotal
        return prev.map((i) =>
          i.product_id === product.id
            ? {
                ...i,
                quantity: i.quantity + 1,
                subtotal: (i.quantity + 1) * i.unit_price,
              }
            : i
        )
      }

      // New item
      const price = parseFloat(product.unit_price)
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
      ]
    })
  }, [])

  /** Update quantity directly (e.g., cashier types "3") */
  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      // Remove item if quantity reaches 0
      setItems((prev) => prev.filter((i) => i.product_id !== productId))
      return
    }
    setItems((prev) =>
      prev.map((i) =>
        i.product_id === productId
          ? { ...i, quantity, subtotal: quantity * i.unit_price }
          : i
      )
    )
  }, [])

  /** Remove a single item from cart */
  const removeItem = useCallback((productId: number) => {
    setItems((prev) => prev.filter((i) => i.product_id !== productId))
  }, [])

  /** Clear cart after successful sale */
  const clearCart = useCallback(() => setItems([]), [])

  /** Total before tax */
  const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0)

  /** 12% VAT — standard Philippine VAT rate */
  const TAX_RATE = 0.12
  const tax = subtotal * TAX_RATE

  /** Grand total (what customer pays) */
  const total = subtotal + tax

  return { items, addItem, updateQuantity, removeItem, clearCart, subtotal, tax, total }
}
