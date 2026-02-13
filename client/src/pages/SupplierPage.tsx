/**
 * SUPPLIERS PAGE - COMPLETE GUIDE
 *
 * WHAT THIS PAGE DOES:
 * - Shows all suppliers in a table
 * - Add new suppliers
 * - Edit existing suppliers
 * - Delete suppliers
 * - Search suppliers
 *
 * VERY SIMILAR TO CATEGORIES PAGE
 * Just has more fields (email, phone, address)
 */

import React, { useEffect, useState } from 'react';
import { suppliersAPI } from '../services/api';
import { Layout } from '../components/Layout';

// -----------------------------------------------------------------
// TYPESCRIPT INTERFACE
// -----------------------------------------------------------------

interface Supplier {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
}

// -----------------------------------------------------------------
// MAIN COMPONENT
// -----------------------------------------------------------------

export const SuppliersPage: React.FC = () => {
  // State - Same pattern as Categories page
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch on mount
  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await suppliersAPI.getAll();
      setSuppliers(data.suppliers || data);
    } catch (err: any) {
      console.error('Failed to fetch suppliers:', err);
      setError(err.response?.data?.error || 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSupplier = () => {
    setEditingSupplier(null);
    setShowModal(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setShowModal(true);
  };

  const handleDeleteSupplier = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) {
      return;
    }

    try {
      await suppliersAPI.delete(id);
      setSuppliers(suppliers.filter((s) => s.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete supplier');
    }
  };

  const handleSaveSupplier = async () => {
    setShowModal(false);
    await fetchSuppliers();
  };

  // Search filter
  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <Layout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-600 mt-1">Manage your product suppliers</p>
        </div>

        {/* Search & Add */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="w-full sm:w-96">
              <input
                type="text"
                placeholder="Search suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleAddSupplier}
              className="w-full sm:w-auto px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              + Add Supplier
            </button>
          </div>
        </div>

        {/* Loading/Error/Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
        ) : (
          <SuppliersTable
            suppliers={filteredSuppliers}
            onEdit={handleEditSupplier}
            onDelete={handleDeleteSupplier}
          />
        )}

        {/* Modal */}
        {showModal && (
          <SupplierModal
            supplier={editingSupplier}
            onClose={() => setShowModal(false)}
            onSave={handleSaveSupplier}
          />
        )}
      </div>
    </Layout>
  );
};

// -----------------------------------------------------------------
// SUPPLIERS TABLE
// -----------------------------------------------------------------

interface TableProps {
  suppliers: Supplier[];
  onEdit: (supplier: Supplier) => void;
  onDelete: (id: number) => void;
}

const SuppliersTable: React.FC<TableProps> = ({
  suppliers,
  onEdit,
  onDelete,
}) => {
  if (suppliers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-16 text-center">
        <p className="text-gray-500 text-lg">No suppliers found</p>
        <p className="text-gray-400 text-sm mt-2">
          Add your first supplier to get started
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
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Address
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {suppliers.map((supplier) => (
              <tr key={supplier.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {supplier.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {supplier.email}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {supplier.phone || '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {supplier.address || '-'}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onEdit(supplier)}
                      className="px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(supplier.id)}
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

// -----------------------------------------------------------------
// SUPPLIER MODAL
// -----------------------------------------------------------------

interface ModalProps {
  supplier: Supplier | null;
  onClose: () => void;
  onSave: () => void;
}

const SupplierModal: React.FC<ModalProps> = ({ supplier, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: supplier?.name || '',
    email: supplier?.email || '',
    phone: supplier?.phone || '',
    address: supplier?.address || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (supplier) {
        await suppliersAPI.update(supplier.id, formData);
      } else {
        await suppliersAPI.create(formData);
      }
      onSave();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save supplier');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {supplier ? 'Edit Supplier' : 'Add New Supplier'}
          </h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Tech Direct"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="contact@supplier.com"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+1-555-0100"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="123 Business St, City, State"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 font-medium"
              >
                {loading
                  ? 'Saving...'
                  : supplier
                    ? 'Update Supplier'
                    : 'Add Supplier'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
