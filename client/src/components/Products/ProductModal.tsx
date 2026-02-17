/**
 * Product Modal - FIXED VERSION
 *
 * FIXES:
 * - Validates category_id and supplier_id before submit
 * - Shows error if either is not selected
 * - Keeps existing values when editing
 * - Prevents foreign key violations
 */

import React, { useState, useEffect } from 'react';
import { Product } from '../../pages/ProductsPage';
import { productsAPI, categoriesAPI, suppliersAPI } from '../../services/api';

interface Props {
  product: Product | null;
  onClose: () => void;
  onSave: () => void;
}

interface Category {
  id: number;
  name: string;
}

interface Supplier {
  id: number;
  name: string;
}

export const ProductModal: React.FC<Props> = ({ product, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    sku: product?.sku || '',
    name: product?.name || '',
    description: product?.description || '',
    category_id: product?.category_id || 0,
    supplier_id: product?.supplier_id || 0,
    unit_price: product?.unit_price || 0,
    reorder_level: product?.reorder_level || 10,
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    try {
      const [categoriesData, suppliersData] = await Promise.all([
        categoriesAPI.getAll(),
        suppliersAPI.getAll(),
      ]);

      setCategories(
        Array.isArray(categoriesData)
          ? categoriesData
          : categoriesData.categories || [],
      );
      setSuppliers(
        Array.isArray(suppliersData)
          ? suppliersData
          : suppliersData.suppliers || [],
      );
    } catch (err) {
      console.error('Failed to load dropdown data:', err);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]:
        name === 'unit_price' ||
        name === 'reorder_level' ||
        name === 'category_id' ||
        name === 'supplier_id'
          ? Number(value)
          : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // ✅ VALIDATION: Check if category and supplier are selected
    if (formData.category_id === 0) {
      setError('Please select a category');
      return;
    }

    if (formData.supplier_id === 0) {
      setError('Please select a supplier');
      return;
    }

    // ✅ VALIDATION: Check if SKU and name are filled
    if (!formData.sku.trim()) {
      setError('SKU is required');
      return;
    }

    if (!formData.name.trim()) {
      setError('Product name is required');
      return;
    }

    // ✅ VALIDATION: Check if price is positive
    if (formData.unit_price <= 0) {
      setError('Unit price must be greater than 0');
      return;
    }

    setLoading(true);

    try {
      console.log('Submitting product data:', formData);

      if (product) {
        // Editing existing product
        await productsAPI.update(product.id, formData);
      } else {
        // Creating new product
        await productsAPI.create(formData);
      }

      onSave();
    } catch (err: any) {
      console.error('Save product error:', err);

      // Better error messages
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.response?.status === 500) {
        setError('Server error. Please check if category and supplier exist.');
      } else {
        setError('Failed to save product. Please try again.');
      }

      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SKU *
                </label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="PROD-001"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Laptop"
                  required
                />
              </div>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Product description..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formData.category_id === 0
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  required
                >
                  <option value={0}>Select category...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {formData.category_id === 0 && (
                  <p className="text-xs text-red-600 mt-1">
                    ⚠️ Category is required
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier *
                </label>
                <select
                  name="supplier_id"
                  value={formData.supplier_id}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formData.supplier_id === 0
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  required
                >
                  <option value={0}>Select supplier...</option>
                  {suppliers.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name}
                    </option>
                  ))}
                </select>
                {formData.supplier_id === 0 && (
                  <p className="text-xs text-red-600 mt-1">
                    ⚠️ Supplier is required
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Price ($) *
                </label>
                <input
                  type="number"
                  name="unit_price"
                  value={formData.unit_price}
                  onChange={handleChange}
                  step="0.01"
                  min="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="99.99"
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
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="10"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  loading ||
                  formData.category_id === 0 ||
                  formData.supplier_id === 0
                }
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 font-medium"
              >
                {loading
                  ? 'Saving...'
                  : product
                    ? 'Update Product'
                    : 'Add Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
