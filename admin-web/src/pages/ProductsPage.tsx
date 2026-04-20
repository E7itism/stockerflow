import { useEffect, useState, useCallback } from 'react';
import { productsAPI, categoriesAPI, suppliersAPI } from '../services/api';
import { Layout } from '../components/Layout';
import { ProductModal } from '../components/Products/ProductModal';
import { useRole } from '../hooks/useRole';
import { useSocket } from '../hooks/useSocket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Search, Package } from 'lucide-react';
import toast from 'react-hot-toast';

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

const getStockBadge = (stock: number, reorderLevel: number) => {
  if (stock <= 0)
    return {
      label: 'Out of stock',
      class: 'bg-red-50 text-red-700 border-red-200',
    };
  if (stock <= reorderLevel)
    return {
      label: `Low: ${stock}`,
      class: 'bg-amber-50 text-amber-700 border-amber-200',
    };
  return {
    label: String(stock),
    class: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
};

// ── Skeleton ──────────────────────────────────
const TableSkeleton = () => (
  <Card className="overflow-hidden">
    <Table>
      <TableHeader>
        <TableRow className="bg-slate-50">
          {['SKU', 'Name', 'Category', 'Unit', 'Price', 'Stock', 'Actions'].map(
            (h) => (
              <TableHead key={h} className="text-xs uppercase tracking-wider">
                {h}
              </TableHead>
            ),
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...Array(6)].map((_, i) => (
          <TableRow key={i}>
            <TableCell>
              <Skeleton className="h-3.5 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-3.5 w-32" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-3.5 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-3.5 w-16" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-3.5 w-16 ml-auto" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-16 rounded-full mx-auto" />
            </TableCell>
            <TableCell>
              <div className="flex justify-center gap-1.5">
                <Skeleton className="h-7 w-10 rounded-md" />
                <Skeleton className="h-7 w-14 rounded-md" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Card>
);

const CardsSkeleton = () => (
  <div className="space-y-3">
    {[...Array(4)].map((_, i) => (
      <Card key={i}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[...Array(4)].map((_, j) => (
              <div key={j} className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3.5 w-24" />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 flex-1 rounded-md" />
            <Skeleton className="h-8 flex-1 rounded-md" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { canEdit, canDelete } = useRole();

  const fetchData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const [productsData, categoriesData, suppliersData] = await Promise.all([
        productsAPI.getAll(),
        categoriesAPI.getAll(),
        suppliersAPI.getAll(),
      ]);
      const categoriesList = categoriesData.categories || categoriesData;
      const suppliersList = suppliersData.suppliers || suppliersData;
      const productsList = productsData.products || productsData;
      setProducts(
        productsList.map((p: Product) => ({
          ...p,
          category_name:
            categoriesList.find((c: Category) => c.id === p.category_id)
              ?.name || '-',
          supplier_name:
            suppliersList.find((s: Supplier) => s.id === p.supplier_id)?.name ||
            '-',
        })),
      );
      setCategories(categoriesList);
      setSuppliers(suppliersList);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load products');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useSocket({
    'sale:created': (_data) => {
      fetchData(true);
    },
    'stock:updated': (_data) => {
      fetchData(true);
    },
  });

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await productsAPI.delete(deleteId);
      setProducts(products.filter((p) => p.id !== deleteId));
      toast.success('Product deleted');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete product');
    } finally {
      setDeleteId(null);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Products</h1>
            <p className="text-sm text-slate-500 mt-1">
              {products.length} products in inventory
            </p>
          </div>
          {canEdit && (
            <Button
              onClick={() => {
                setEditingProduct(null);
                setShowModal(true);
              }}
              className="bg-slate-900 hover:bg-slate-800 gap-2"
            >
              <Plus className="w-4 h-4" /> Add Product
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name, SKU or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <>
            <div className="hidden md:block">
              <TableSkeleton />
            </div>
            <div className="md:hidden">
              <CardsSkeleton />
            </div>
          </>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => fetchData()}>
              Retry
            </Button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Package className="w-10 h-10 mb-3 opacity-40" />
              <p className="font-medium">No products found</p>
              <p className="text-sm mt-1">
                {searchTerm
                  ? `No results for "${searchTerm}"`
                  : 'Add your first product to get started'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="hidden md:block">
              <Card className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="text-xs uppercase tracking-wider">
                        SKU
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-wider">
                        Name
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-wider">
                        Category
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-wider">
                        Unit
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-wider text-right">
                        Price
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-wider text-center">
                        Stock
                      </TableHead>
                      {(canEdit || canDelete) && (
                        <TableHead className="text-xs uppercase tracking-wider text-center">
                          Actions
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => {
                      const stock = getStockBadge(
                        product.current_stock || 0,
                        product.reorder_level,
                      );
                      return (
                        <TableRow
                          key={product.id}
                          className="hover:bg-slate-50"
                        >
                          <TableCell className="text-xs font-mono text-slate-500">
                            {product.sku}
                          </TableCell>
                          <TableCell className="font-medium text-slate-900">
                            {product.name}
                          </TableCell>
                          <TableCell className="text-slate-600 text-sm">
                            {product.category_name || '-'}
                          </TableCell>
                          <TableCell className="text-slate-600 text-sm capitalize">
                            {product.unit_of_measure}
                          </TableCell>
                          <TableCell className="text-right font-medium text-slate-900">
                            ₱{Number(product.unit_price).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className={`text-xs ${stock.class}`}
                            >
                              {stock.label}
                            </Badge>
                          </TableCell>
                          {(canEdit || canDelete) && (
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {canEdit && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingProduct(product);
                                      setShowModal(true);
                                    }}
                                    className="h-7 px-2.5 text-xs"
                                  >
                                    Edit
                                  </Button>
                                )}
                                {canDelete && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setDeleteId(product.id)}
                                    className="h-7 px-2.5 text-xs text-red-600 hover:text-red-700 hover:border-red-200 hover:bg-red-50"
                                  >
                                    Delete
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            </div>
            <div className="md:hidden space-y-3">
              {filteredProducts.map((product) => {
                const stock = getStockBadge(
                  product.current_stock || 0,
                  product.reorder_level,
                );
                return (
                  <Card key={product.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {product.name}
                          </h3>
                          <p className="text-xs font-mono text-slate-400 mt-0.5">
                            {product.sku}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs ${stock.class}`}
                        >
                          {stock.label}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                        <div>
                          <p className="text-xs text-slate-400">Category</p>
                          <p className="font-medium text-slate-700">
                            {product.category_name || '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Supplier</p>
                          <p className="font-medium text-slate-700">
                            {product.supplier_name || '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Price</p>
                          <p className="font-medium text-slate-700">
                            ₱{Number(product.unit_price).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Unit</p>
                          <p className="font-medium text-slate-700 capitalize">
                            {product.unit_of_measure}
                          </p>
                        </div>
                      </div>
                      {(canEdit || canDelete) && (
                        <div className="flex gap-2">
                          {canEdit && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingProduct(product);
                                setShowModal(true);
                              }}
                              className="flex-1"
                            >
                              Edit
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteId(product.id)}
                              className="flex-1 text-red-600 hover:text-red-700 hover:border-red-200 hover:bg-red-50"
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {showModal && (
          <ProductModal
            product={editingProduct}
            categories={categories}
            suppliers={suppliers}
            onClose={() => setShowModal(false)}
            onSave={() => {
              setShowModal(false);
              fetchData();
            }}
          />
        )}

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Product</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this product? This action cannot
                be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};
