/**
 * CategoriesPage.tsx
 *
 * CRUD page for product categories.
 * Desktop: table view | Mobile: card view
 */

import { useEffect, useState } from 'react';
import { categoriesAPI } from '../services/api';
import { Layout } from '../components/Layout';

interface Category {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await categoriesAPI.getAll();
      setCategories(data.categories || data);
    } catch (err: any) {
      console.error('Failed to fetch categories:', err);
      setError(err.response?.data?.error || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = () => {
    setEditingCategory(null); // null = new category
    setShowModal(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setShowModal(true);
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this category?'))
      return;

    try {
      await categoriesAPI.delete(id);
      // Remove from local state instead of refetching
      setCategories(categories.filter((c) => c.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete category');
    }
  };

  const handleSaveCategory = async () => {
    setShowModal(false);
    await fetchCategories();
  };

  // Client-side filter across name and description
  const filteredCategories = categories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Categories
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Organize your products into categories
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="w-full sm:w-96">
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              />
            </div>
            <button
              onClick={handleAddCategory}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors font-medium text-base"
            >
              + Add Category
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
          <CategoriesView
            categories={filteredCategories}
            onEdit={handleEditCategory}
            onDelete={handleDeleteCategory}
          />
        )}

        {showModal && (
          <CategoryModal
            category={editingCategory}
            onClose={() => setShowModal(false)}
            onSave={handleSaveCategory}
          />
        )}
      </div>
    </Layout>
  );
};

// ─────────────────────────────────────────────
// RESPONSIVE VIEW SWITCHER
// ─────────────────────────────────────────────

interface ViewProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (id: number) => void;
}

const CategoriesView: React.FC<ViewProps> = ({
  categories,
  onEdit,
  onDelete,
}) => {
  if (categories.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 sm:p-16 text-center">
        <p className="text-gray-500 text-lg">No categories found</p>
        <p className="text-gray-400 text-sm mt-2">
          Add your first category to get started
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden md:block">
        <CategoriesTable
          categories={categories}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
      <div className="md:hidden">
        <CategoriesCards
          categories={categories}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </>
  );
};

// ─────────────────────────────────────────────
// TABLE (Desktop)
// ─────────────────────────────────────────────

const CategoriesTable: React.FC<ViewProps> = ({
  categories,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Description
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {categories.map((category) => (
              <tr key={category.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {category.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {category.description || '-'}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onEdit(category)}
                      className="px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(category.id)}
                      className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// CARDS (Mobile)
// ─────────────────────────────────────────────

const CategoriesCards: React.FC<ViewProps> = ({
  categories,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="space-y-3">
      {categories.map((category) => (
        <div key={category.id} className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {category.name}
          </h3>
          {category.description && (
            <p className="text-sm text-gray-600 mb-4">{category.description}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(category)}
              className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 font-medium text-sm"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(category.id)}
              className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 active:bg-red-700 font-medium text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────
// MODAL — Add / Edit category
// ─────────────────────────────────────────────

interface ModalProps {
  category: Category | null;
  onClose: () => void;
  onSave: () => void;
}

const CategoryModal: React.FC<ModalProps> = ({ category, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (category) {
        await categoriesAPI.update(category.id, formData);
      } else {
        await categoriesAPI.create(formData);
      }
      onSave();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save category');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-white rounded-t-lg sm:rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
            {category ? 'Edit Category' : 'Add New Category'}
          </h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                placeholder="e.g., Beverages"
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
                {loading ? 'Saving...' : category ? 'Update' : 'Add Category'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
