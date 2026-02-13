/**
 * CATEGORIES PAGE - COMPLETE GUIDE
 *
 * WHAT THIS PAGE DOES:
 * - Shows all categories in a table
 * - Lets you add new categories
 * - Lets you edit existing categories
 * - Lets you delete categories
 * - Has search functionality
 *
 * HOW IT WORKS:
 * 1. Page loads → Fetches categories from API
 * 2. Displays categories in a table
 * 3. Click "Add Category" → Opens modal
 * 4. Fill form → Saves to database via API
 * 5. Table updates automatically
 */

import React, { useEffect, useState } from 'react';
import { categoriesAPI } from '../services/api';
import { Layout } from '../components/Layout';

// -----------------------------------------------------------------
// TYPESCRIPT INTERFACES (Define the shape of our data)
// -----------------------------------------------------------------

/**
 * Category Interface
 * This tells TypeScript what a category object looks like
 * Helps catch errors if we try to access wrong properties
 */
interface Category {
  id: number; // Unique ID from database
  name: string; // Category name (e.g., "Electronics")
  description?: string; // Optional description
  created_at?: string; // When it was created
  updated_at?: string; // When it was last updated
}

// -----------------------------------------------------------------
// MAIN COMPONENT
// -----------------------------------------------------------------

export const CategoriesPage: React.FC = () => {
  // ===============================================================
  // STATE MANAGEMENT (Where we store data)
  // ===============================================================

  /**
   * useState Hook - Stores data that can change
   * When state changes, React re-renders the component
   */

  // All categories from database
  const [categories, setCategories] = useState<Category[]>([]);

  // Is data loading?
  const [loading, setLoading] = useState(true);

  // Error message if something goes wrong
  const [error, setError] = useState<string | null>(null);

  // Is the add/edit modal open?
  const [showModal, setShowModal] = useState(false);

  // Which category are we editing? (null = adding new)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Search text entered by user
  const [searchTerm, setSearchTerm] = useState('');

  // ===============================================================
  // FETCH DATA ON PAGE LOAD
  // ===============================================================

  /**
   * useEffect Hook - Runs code when component mounts
   * The empty array [] means "run once when page loads"
   */
  useEffect(() => {
    fetchCategories(); // Go get the categories!
  }, []); // Empty array = run once on mount

  /**
   * fetchCategories Function
   *
   * WHAT IT DOES:
   * 1. Sets loading to true (shows spinner)
   * 2. Calls API to get categories from database
   * 3. Saves categories to state
   * 4. Sets loading to false (hides spinner)
   * 5. If error, saves error message
   */
  const fetchCategories = async () => {
    try {
      setLoading(true); // Show loading spinner
      setError(null); // Clear any previous errors

      const data = await categoriesAPI.getAll(); // Call API

      // Handle both response formats (array or object with categories property)
      setCategories(data.categories || data); // Save to state
    } catch (err: any) {
      console.error('Failed to fetch categories:', err);
      setError(err.response?.data?.error || 'Failed to load categories');
    } finally {
      setLoading(false); // Hide loading spinner (runs no matter what)
    }
  };

  // ===============================================================
  // EVENT HANDLERS (What happens when user clicks things)
  // ===============================================================

  /**
   * handleAddCategory
   *
   * WHAT IT DOES:
   * Opens the modal in "add mode" (no category selected)
   */
  const handleAddCategory = () => {
    setEditingCategory(null); // null = adding new, not editing
    setShowModal(true); // Open the modal
  };

  /**
   * handleEditCategory
   *
   * WHAT IT DOES:
   * Opens the modal in "edit mode" with the selected category
   *
   * @param category - The category to edit
   */
  const handleEditCategory = (category: Category) => {
    setEditingCategory(category); // Set which category we're editing
    setShowModal(true); // Open the modal
  };

  /**
   * handleDeleteCategory
   *
   * WHAT IT DOES:
   * 1. Asks user "Are you sure?"
   * 2. If yes, calls API to delete
   * 3. Removes category from the list
   *
   * @param id - The ID of category to delete
   */
  const handleDeleteCategory = async (id: number) => {
    // Show confirmation dialog
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return; // User clicked "Cancel", stop here
    }

    try {
      await categoriesAPI.delete(id); // Call API to delete

      // Remove from state (filter out the deleted one)
      // filter keeps everything EXCEPT the one we deleted
      setCategories(categories.filter((c) => c.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete category');
    }
  };

  /**
   * handleSaveCategory
   *
   * WHAT IT DOES:
   * Called when modal saves successfully
   * Closes modal and refreshes the list
   */
  const handleSaveCategory = async () => {
    setShowModal(false); // Close the modal
    await fetchCategories(); // Refresh the list from database
  };

  // ===============================================================
  // SEARCH FILTER
  // ===============================================================

  /**
   * filteredCategories
   *
   * WHAT IT DOES:
   * Filters categories based on search text
   * Shows only categories whose name matches the search
   */
  const filteredCategories = categories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  /**
   * HOW FILTER WORKS:
   *
   * categories = [
   *   { name: "Electronics", description: "Devices" },
   *   { name: "Furniture", description: "Tables" }
   * ]
   *
   * searchTerm = "elec"
   *
   * filter checks each category:
   * - "Electronics".includes("elec") → true ✓ (keep it)
   * - "Furniture".includes("elec") → false ✗ (remove it)
   *
   * Result: [{ name: "Electronics", description: "Devices" }]
   */

  // ===============================================================
  // RENDER THE PAGE (What the user sees)
  // ===============================================================

  return (
    <Layout>
      <div className="p-8">
        {/* ========== HEADER ========== */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600 mt-1">
            Organize your products into categories
          </p>
        </div>

        {/* ========== SEARCH & ADD BUTTON ========== */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Search Input */}
            <div className="w-full sm:w-96">
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Add Button */}
            <button
              onClick={handleAddCategory}
              className="w-full sm:w-auto px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              + Add Category
            </button>
          </div>
        </div>

        {/* ========== LOADING STATE ========== */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          /* ========== ERROR STATE ========== */
          <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
        ) : (
          /* ========== CATEGORIES TABLE ========== */
          <CategoriesTable
            categories={filteredCategories}
            onEdit={handleEditCategory}
            onDelete={handleDeleteCategory}
          />
        )}

        {/* ========== ADD/EDIT MODAL ========== */}
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

// -----------------------------------------------------------------
// CATEGORIES TABLE COMPONENT
// -----------------------------------------------------------------

/**
 * CategoriesTable Component
 *
 * WHAT IT DOES:
 * Displays categories in a nice table format
 * Shows Edit and Delete buttons for each category
 *
 * PROPS:
 * - categories: Array of categories to display
 * - onEdit: Function to call when Edit is clicked
 * - onDelete: Function to call when Delete is clicked
 */

interface TableProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (id: number) => void;
}

const CategoriesTable: React.FC<TableProps> = ({
  categories,
  onEdit,
  onDelete,
}) => {
  // If no categories, show friendly message
  if (categories.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-16 text-center">
        <p className="text-gray-500 text-lg">No categories found</p>
        <p className="text-gray-400 text-sm mt-2">
          Add your first category to get started
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* ========== TABLE HEADER ========== */}
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

          {/* ========== TABLE BODY ========== */}
          <tbody className="divide-y divide-gray-200">
            {categories.map((category) => (
              <tr key={category.id} className="hover:bg-gray-50">
                {/* Category Name */}
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {category.name}
                </td>

                {/* Category Description */}
                <td className="px-6 py-4 text-sm text-gray-600">
                  {category.description || '-'}
                </td>

                {/* Action Buttons */}
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

// -----------------------------------------------------------------
// CATEGORY MODAL COMPONENT (Add/Edit Form)
// -----------------------------------------------------------------

/**
 * CategoryModal Component
 *
 * WHAT IT DOES:
 * Shows a popup form to add or edit a category
 * If category prop is null = "Add new" mode
 * If category prop has data = "Edit" mode
 *
 * PROPS:
 * - category: The category to edit (null for new)
 * - onClose: Function to call when closing modal
 * - onSave: Function to call after successful save
 */

interface ModalProps {
  category: Category | null;
  onClose: () => void;
  onSave: () => void;
}

const CategoryModal: React.FC<ModalProps> = ({ category, onClose, onSave }) => {
  // ===============================================================
  // FORM STATE
  // ===============================================================

  /**
   * formData State
   *
   * Stores the form input values
   * If editing, pre-fill with category data
   * If adding new, start with empty values
   */
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ===============================================================
  // FORM HANDLERS
  // ===============================================================

  /**
   * handleChange
   *
   * WHAT IT DOES:
   * Updates formData when user types in input fields
   *
   * HOW IT WORKS:
   * 1. User types in an input
   * 2. onChange event fires
   * 3. Gets the input's name and value
   * 4. Updates that specific field in formData
   *
   * @param e - The change event from input
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    /**
     * Spread Operator (...) Explanation:
     *
     * Old formData = { name: "Electronics", description: "Devices" }
     * User types in description field
     *
     * setFormData({
     *   ...formData,           // Copy all old values
     *   description: "New text"  // Override this one field
     * })
     *
     * Result = { name: "Electronics", description: "New text" }
     */
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  /**
   * handleSubmit
   *
   * WHAT IT DOES:
   * 1. Prevents page reload
   * 2. Validates form data
   * 3. Calls API to save (create or update)
   * 4. Calls onSave callback if successful
   *
   * @param e - The form submit event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Stop page from reloading
    setError('');
    setLoading(true);

    try {
      if (category) {
        // EDIT MODE - Update existing category
        await categoriesAPI.update(category.id, formData);
      } else {
        // ADD MODE - Create new category
        await categoriesAPI.create(formData);
      }

      onSave(); // Tell parent component we saved successfully
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save category');
      setLoading(false);
    }
  };

  // ===============================================================
  // RENDER THE MODAL
  // ===============================================================

  return (
    // Dark overlay background
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      {/* Modal Box */}
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          {/* Modal Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {category ? 'Edit Category' : 'Add New Category'}
          </h2>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {/* The Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Electronics"
                required
              />
            </div>

            {/* Description Textarea */}
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
                placeholder="Optional description..."
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
                  : category
                    ? 'Update Category'
                    : 'Add Category'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
