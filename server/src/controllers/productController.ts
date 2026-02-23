import { Request, Response } from 'express';
import productModel from '../models/productModel';

class ProductController {
  // Create new product
  async create(req: Request, res: Response): Promise<void> {
    try {
      const {
        sku,
        name,
        description,
        category_id,
        supplier_id,
        unit_price,
        reorder_level,
        unit_of_measure,
      } = req.body;

      // Validate required fields
      if (!sku || !name || unit_price === undefined) {
        res
          .status(400)
          .json({ error: 'SKU, name, and unit_price are required' });
        return;
      }

      // Validate unit_price is positive
      if (unit_price < 0) {
        res.status(400).json({ error: 'Unit price must be positive' });
        return;
      }

      // Check if SKU already exists
      const existingProduct = await productModel.findBySKU(sku);
      if (existingProduct) {
        res.status(409).json({ error: 'SKU already exists' });
        return;
      }

      // Create product
      const newProduct = await productModel.create({
        sku,
        name,
        description,
        category_id,
        supplier_id,
        unit_price,
        reorder_level,
        unit_of_measure,
      });

      res.status(201).json({
        message: 'Product created successfully',
        product: newProduct,
      });
    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get all products
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const products = await productModel.findAll();
      res.status(200).json(products); // ✅ Just the array
    } catch (error) {
      console.error('Get all products error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get single product
  async getOne(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      const product = await productModel.findById(parseInt(id));

      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      res.status(200).json({ product });
    } catch (error) {
      console.error('Get product error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Update product
  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const updateData = req.body;

      // Validate unit_price if provided
      if (updateData.unit_price !== undefined && updateData.unit_price < 0) {
        res.status(400).json({ error: 'Unit price must be positive' });
        return;
      }

      // Check if product exists
      const existingProduct = await productModel.findById(parseInt(id));
      if (!existingProduct) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      // If updating SKU, check it's not already taken
      if (updateData.sku && updateData.sku !== existingProduct.sku) {
        const skuExists = await productModel.findBySKU(updateData.sku);
        if (skuExists) {
          res.status(409).json({ error: 'SKU already exists' });
          return;
        }
      }

      // Update product
      const updatedProduct = await productModel.update(
        parseInt(id),
        updateData,
      );

      res.status(200).json({
        message: 'Product updated successfully',
        product: updatedProduct,
      });
    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Delete product
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      // Check if product exists
      const existingProduct = await productModel.findById(parseInt(id));
      if (!existingProduct) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      // Delete product
      const deleted = await productModel.delete(parseInt(id));

      if (deleted) {
        res.status(200).json({ message: 'Product deleted successfully' });
      } else {
        res.status(500).json({ error: 'Failed to delete product' });
      }
    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new ProductController();
