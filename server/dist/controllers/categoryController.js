import categoryModel from '../models/categoryModel';
class CategoryController {
    // Create category
    async create(req, res) {
        try {
            const { name, description } = req.body;
            // Validate
            if (!name) {
                res.status(400).json({ error: 'Category name is required' });
                return;
            }
            // Check if name already exists
            const existingCategory = await categoryModel.findByName(name);
            if (existingCategory) {
                res.status(409).json({ error: 'Category name already exists' });
                return;
            }
            // Create category
            const newCategory = await categoryModel.create({ name, description });
            res.status(201).json({
                message: 'Category created successfully',
                category: newCategory,
            });
        }
        catch (error) {
            console.error('Create category error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    // Get all categories
    async getAll(req, res) {
        try {
            const categories = await categoryModel.findAll();
            res.status(200).json(categories); // ✅ Just the array
        }
        catch (error) {
            console.error('Get categories error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    // Get single category
    async getOne(req, res) {
        try {
            const id = req.params.id;
            const category = await categoryModel.findById(parseInt(id));
            if (!category) {
                res.status(404).json({ error: 'Category not found' });
                return;
            }
            res.status(200).json({ category });
        }
        catch (error) {
            console.error('Get category error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    // Update category
    async update(req, res) {
        try {
            const id = req.params.id;
            const updateData = req.body;
            // Check if category exists
            const existingCategory = await categoryModel.findById(parseInt(id));
            if (!existingCategory) {
                res.status(404).json({ error: 'Category not found' });
                return;
            }
            // If updating name, check it's not already taken
            if (updateData.name && updateData.name !== existingCategory.name) {
                const nameExists = await categoryModel.findByName(updateData.name);
                if (nameExists) {
                    res.status(409).json({ error: 'Category name already exists' });
                    return;
                }
            }
            // Update category
            const updatedCategory = await categoryModel.update(parseInt(id), updateData);
            res.status(200).json({
                message: 'Category updated successfully',
                category: updatedCategory,
            });
        }
        catch (error) {
            console.error('Update category error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    // Delete category
    async delete(req, res) {
        try {
            const id = req.params.id;
            // Check if category exists
            const existingCategory = await categoryModel.findById(parseInt(id));
            if (!existingCategory) {
                res.status(404).json({ error: 'Category not found' });
                return;
            }
            // Delete category
            const deleted = await categoryModel.delete(parseInt(id));
            if (deleted) {
                res.status(200).json({ message: 'Category deleted successfully' });
            }
            else {
                res.status(500).json({ error: 'Failed to delete category' });
            }
        }
        catch (error) {
            console.error('Delete category error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
export default new CategoryController();
