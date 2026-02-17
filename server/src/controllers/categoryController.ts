/**
 * categoryController.ts
 *
 * CRUD operations for product categories.
 * Validates name uniqueness before create and update.
 */

import { Request, Response } from 'express';
import categoryModel from '../models/categoryModel';

class CategoryController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, description } = req.body;

      if (!name) {
        res.status(400).json({ error: 'Category name is required' });
        return;
      }

      const existingCategory = await categoryModel.findByName(name);
      if (existingCategory) {
        res.status(409).json({ error: 'Category name already exists' });
        return;
      }

      const newCategory = await categoryModel.create({ name, description });

      res.status(201).json({
        message: 'Category created successfully',
        category: newCategory,
      });
    } catch (error) {
      console.error('Create category error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const categories = await categoryModel.findAll();
      res.status(200).json(categories);
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getOne(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const category = await categoryModel.findById(parseInt(id));

      if (!category) {
        res.status(404).json({ error: 'Category not found' });
        return;
      }

      res.status(200).json({ category });
    } catch (error) {
      console.error('Get category error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const updateData = req.body;

      const existingCategory = await categoryModel.findById(parseInt(id));
      if (!existingCategory) {
        res.status(404).json({ error: 'Category not found' });
        return;
      }

      // Only check name conflict if the name is actually changing
      if (updateData.name && updateData.name !== existingCategory.name) {
        const nameExists = await categoryModel.findByName(updateData.name);
        if (nameExists) {
          res.status(409).json({ error: 'Category name already exists' });
          return;
        }
      }

      const updatedCategory = await categoryModel.update(
        parseInt(id),
        updateData,
      );

      res.status(200).json({
        message: 'Category updated successfully',
        category: updatedCategory,
      });
    } catch (error) {
      console.error('Update category error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      const existingCategory = await categoryModel.findById(parseInt(id));
      if (!existingCategory) {
        res.status(404).json({ error: 'Category not found' });
        return;
      }

      const deleted = await categoryModel.delete(parseInt(id));

      if (deleted) {
        res.status(200).json({ message: 'Category deleted successfully' });
      } else {
        res.status(500).json({ error: 'Failed to delete category' });
      }
    } catch (error) {
      console.error('Delete category error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new CategoryController();
