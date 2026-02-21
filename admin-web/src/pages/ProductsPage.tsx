/**
 * ProductsPage.tsx
 *
 * Full CRUD page for managing products.
 * Fetches products, categories, and suppliers together so the UI
 * can show names instead of raw IDs.
 *
 * Desktop: table view | Mobile: card view
 * Modal: extracted to components/Products/ProductModal.tsx
 */

import { useEffect, useState } from 'react';
import { productsAPI, categoriesAPI, suppliersAPI } from '../services/api';
import { Layout } from '../components/Layout';
import { ProductModal } from '../components/Products/ProductModal';

export interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string;
  category_id: number;
  category_name?: string;
  supplier_id: number;
  supplier_name?: string;
  unit_price: number;
  unit_of_measure: string;
  reorder_level: number;
  current_stock?: number;
  created_at?: string;
  updated_at?: string;
}

interface Category {
  id: number;
  name: string;
}

interface Supplier {
  id: number;
  name: string;
}

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  /**
   * fetchData — loads products, categories, and suppliers in parallel.
   *
   * Why Promise.all?
   * Runs all 3 requests simultaneously instead of one after another.
   * Faster for the user — total wait time = slowest request, not sum of all.
   *
   * Why enrich products with category_name and supplier_name?
   * Products store foreign key IDs, not names. We do the lookup once here
   * so child components (table, cards) can just render product.category_name
   * without needing their own lookup logic.
   */
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [productsData, categoriesData, suppliersData] = await Promise.all([
        productsAPI.getAll(),
        categoriesAPI.getAll(),
        suppliersAPI.getAll(),
      ]);

      const categoriesList = categoriesData.categories || categoriesData;
      const suppliersList = suppliersData.suppliers || suppliersData;
      const productsList = productsData.products || productsData;

      const enrichedProducts = productsList.map((product: Product) => ({
        ...product,
        category_name:
          categoriesList.find((c: Category) => c.id === product.category_id)
            ?.name || '-',
        supplier_name:
          suppliersList.find((s: Supplier) => s.id === product.supplier_id)
            ?.name || '-',
      }));

      setProducts(enrichedProducts);
      setCategories(categoriesList);
      setSuppliers(suppliersList);
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      setError(err.response?.data?.error || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null); // null = create mode
    setShowModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product); // non-null = edit mode
    setShowModal(true);
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this product?'))
      return;
    try {
      await productsAPI.delete(id);
      setProducts(products.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete product');
    }
  };

  const handleSaveProduct = async () => {
    setShowModal(false);
    await fetchData();
  };

  // Client-side filter — searches name, SKU, and category simultaneously
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Products
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Manage your product inventory
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="w-full sm:w-96">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              />
            </div>
            <button
              onClick={handleAddProduct}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-base"
            >
              + Add Product
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
          <>
            {/* Desktop: table view */}
            <div className="hidden md:block">
              <ProductsTable
                products={filteredProducts}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
              />
            </div>

            {/* Mobile: card view */}
            <div className="md:hidden">
              <ProductsCards
                products={filteredProducts}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
              />
            </div>
          </>
        )}

        {showModal && (
          <ProductModal
            product={editingProduct}
            categories={categories}
            suppliers={suppliers}
            onClose={() => setShowModal(false)}
            onSave={handleSaveProduct}
          />
        )}
      </div>
    </Layout>
  );
};

// ─────────────────────────────────────────────
// TABLE (Desktop)
// ─────────────────────────────────────────────

interface TableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
}

const ProductsTable: React.FC<TableProps> = ({
  products,
  onEdit,
  onDelete,
}) => {
  const getStockColor = (stock: number, reorderLevel: number) => {
    if (stock <= 0) return 'text-red-600 bg-red-50';
    if (stock <= reorderLevel) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-16 text-center">
        <p className="text-gray-500 text-lg">No products found</p>
        <p className="text-gray-400 text-sm mt-2">
          Add your first product to get started
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Unit
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Price
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Stock
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-600">
                  {product.sku}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {product.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {product.category_name || '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {product.unit_of_measure}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 text-right">
                  ₱{Number(product.unit_price).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={`inline-block px-2 py-1 text-xs font-semibold rounded ${getStockColor(product.current_stock || 0, product.reorder_level)}`}
                  >
                    {product.current_stock || 0}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onEdit(product)}
                      className="px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(product.id)}
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

const ProductsCards: React.FC<TableProps> = ({
  products,
  onEdit,
  onDelete,
}) => {
  const getStockColor = (stock: number, reorderLevel: number) => {
    if (stock <= 0) return 'bg-red-500';
    if (stock <= reorderLevel) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500 text-lg">No products found</p>
        <p className="text-gray-400 text-sm mt-2">
          Add your first product to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {products.map((product) => (
        <div key={product.id} className="bg-white rounded-lg shadow-md p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {product.name}
              </h3>
              <p className="text-sm text-gray-500">SKU: {product.sku}</p>
            </div>
            <span
              className={`px-2 py-1 rounded text-xs font-semibold text-white ${getStockColor(product.current_stock || 0, product.reorder_level)}`}
            >
              {product.current_stock || 0}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm mb-4">
            <div>
              <span className="text-gray-500">Category:</span>
              <p className="text-gray-900 font-medium">
                {product.category_name || '-'}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Supplier:</span>
              <p className="text-gray-900 font-medium">
                {product.supplier_name || '-'}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Price:</span>
              <p className="text-gray-900 font-medium">
                ₱{Number(product.unit_price).toFixed(2)}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Unit:</span>
              <p className="text-gray-900 font-medium">
                {product.unit_of_measure}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onEdit(product)}
              className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium text-sm"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(product.id)}
              className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
