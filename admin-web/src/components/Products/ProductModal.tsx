import { useState } from 'react';
import { productsAPI } from '../../services/api';
import type { Product } from '../../pages/ProductsPage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

  const fieldClass =
    'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none';

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">SKU *</label>
            <Input
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              placeholder="e.g., PROD-001"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Product Name *
            </label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Coca-Cola 1.5L"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              className={fieldClass}
              placeholder="Optional description..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Category *
            </label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className={fieldClass}
              required
            >
              <option value={0}>Select category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Supplier *
            </label>
            <select
              name="supplier_id"
              value={formData.supplier_id}
              onChange={handleChange}
              className={fieldClass}
              required
            >
              <option value={0}>Select supplier...</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Unit Price *
              </label>
              <Input
                type="number"
                name="unit_price"
                value={formData.unit_price}
                onChange={handleChange}
                onFocus={(e) => e.target.select()}
                step="0.01"
                min="0"
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Reorder Level *
              </label>
              <Input
                type="number"
                name="reorder_level"
                value={formData.reorder_level}
                onChange={handleChange}
                onFocus={(e) => e.target.select()}
                min="0"
                placeholder="10"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Unit of Measure *
            </label>
            <select
              name="unit_of_measure"
              value={formData.unit_of_measure}
              onChange={handleChange}
              className={fieldClass}
            >
              {[
                'piece',
                'sachet',
                'pack',
                'bottle',
                'can',
                'kilo',
                'gram',
                'tray',
                'dozen',
                'liter',
              ].map((u) => (
                <option key={u} value={u} className="capitalize">
                  {u.charAt(0).toUpperCase() + u.slice(1)}
                </option>
              ))}
            </select>
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
              ) : product ? (
                'Update Product'
              ) : (
                'Add Product'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
