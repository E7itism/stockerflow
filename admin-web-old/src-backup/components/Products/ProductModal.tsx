/**
 * ProductModal.tsx
 *
 * Reusable modal for creating and editing products.
 * Used by ProductsPage for both Add and Edit flows.
 *
 * Props:
 *   product    — null = create mode, Product = edit mode
 *   categories — list for the category dropdown
 *   suppliers  — list for the supplier dropdown
 *   onClose    — called when modal is dismissed
 *   onSave     — called after successful save (triggers list refresh)
 */

import { useState } from 'react';
import { productsAPI } from '../../services/api';
import type { Product } from '../../pages/ProductsPage';

interface Category {
  id: number;
  name: string;
}

interface Supplier {
  id: number;
  name: string;
}

interface Props {
  product: Product | null;
  categories: Category[];
  suppliers: Supplier[];
  onClose: () => void;
  onSave: () => void;
}

export const ProductModal: React.FC<Props> = ({
  product,
  categories,
  suppliers,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    sku: product?.sku || '',
    name: product?.name || '',
    description: product?.description || '',
    category_id: product?.category_id || 0,
    supplier_id: product?.supplier_id || 0,
    unit_price: product?.unit_price || 0,
    reorder_level: product?.reorder_level || 10,
    unit_of_measure: product?.unit_of_measure || 'piece',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]:
        name === 'category_id' || name === 'supplier_id'
          ? Number(value)
          : name === 'unit_price' || name === 'reorder_level'
            ? parseFloat(value) || ''
            : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.category_id === 0) {
      setError('Please select a category');
      return;
    }

    if (formData.supplier_id === 0) {
      setError('Please select a supplier');
      return;
    }

    const submitData = {
      ...formData,
      unit_price: parseFloat(String(formData.unit_price)) || 0,
      reorder_level: parseInt(String(formData.reorder_level)) || 0,
    };

    if (submitData.unit_price <= 0) {
      setError('Unit price must be greater than 0');
      return;
    }

    setLoading(true);

    try {
      if (product) {
        await productsAPI.update(product.id, submitData);
      } else {
        await productsAPI.create(submitData);
      }
      onSave();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save product');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white rounded-t-lg sm:rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU *
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                placeholder="e.g., PROD-001"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                placeholder="e.g., Coca-Cola 1.5L"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                placeholder="Optional description..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                required
              >
                <option value={0}>Select category...</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier *
              </label>
              <select
                name="supplier_id"
                value={formData.supplier_id}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                required
              >
                <option value={0}>Select supplier...</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Price *
                </label>
                <input
                  type="number"
                  name="unit_price"
                  value={formData.unit_price}
                  onChange={handleChange}
                  onFocus={(e) => e.target.select()}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reorder Level *
                </label>
                <input
                  type="number"
                  name="reorder_level"
                  value={formData.reorder_level}
                  onChange={handleChange}
                  onFocus={(e) => e.target.select()}
                  min="0"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  placeholder="10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit of Measure *
              </label>
              <select
                name="unit_of_measure"
                value={formData.unit_of_measure}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              >
                <option value="piece">Piece</option>
                <option value="sachet">Sachet</option>
                <option value="pack">Pack</option>
                <option value="bottle">Bottle</option>
                <option value="can">Can</option>
                <option value="kilo">Kilo</option>
                <option value="gram">Gram</option>
                <option value="tray">Tray</option>
                <option value="dozen">Dozen</option>
                <option value="liter">Liter</option>
              </select>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 font-medium"
              >
                {loading ? 'Saving...' : product ? 'Update' : 'Add Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
