import { Request, Response } from 'express';
import supplierModel from '../models/supplierModel';

class SupplierController {
  // Create supplier
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, contact_person, email, phone, address } = req.body;

      // Validate
      if (!name) {
        res.status(400).json({ error: 'Supplier name is required' });
        return;
      }

      // Check if name already exists
      const existingSupplier = await supplierModel.findByName(name);
      if (existingSupplier) {
        res.status(409).json({ error: 'Supplier name already exists' });
        return;
      }

      // Create supplier
      const newSupplier = await supplierModel.create({
        name,
        contact_person,
        email,
        phone,
        address,
      });

      res.status(201).json({
        message: 'Supplier created successfully',
        supplier: newSupplier,
      });
    } catch (error) {
      console.error('Create supplier error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get all suppliers
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const suppliers = await supplierModel.findAll();

      res.status(200).json({
        count: suppliers.length,
        suppliers,
      });
    } catch (error) {
      console.error('Get suppliers error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get single supplier
  async getOne(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      const supplier = await supplierModel.findById(parseInt(id));

      if (!supplier) {
        res.status(404).json({ error: 'Supplier not found' });
        return;
      }

      res.status(200).json({ supplier });
    } catch (error) {
      console.error('Get supplier error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Update supplier
  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const updateData = req.body;

      // Check if supplier exists
      const existingSupplier = await supplierModel.findById(parseInt(id));
      if (!existingSupplier) {
        res.status(404).json({ error: 'Supplier not found' });
        return;
      }

      // If updating name, check it's not already taken
      if (updateData.name && updateData.name !== existingSupplier.name) {
        const nameExists = await supplierModel.findByName(updateData.name);
        if (nameExists) {
          res.status(409).json({ error: 'Supplier name already exists' });
          return;
        }
      }

      // Update supplier
      const updatedSupplier = await supplierModel.update(
        parseInt(id),
        updateData,
      );

      res.status(200).json({
        message: 'Supplier updated successfully',
        supplier: updatedSupplier,
      });
    } catch (error) {
      console.error('Update supplier error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Delete supplier
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      // Check if supplier exists
      const existingSupplier = await supplierModel.findById(parseInt(id));
      if (!existingSupplier) {
        res.status(404).json({ error: 'Supplier not found' });
        return;
      }

      // Delete supplier
      const deleted = await supplierModel.delete(parseInt(id));

      if (deleted) {
        res.status(200).json({ message: 'Supplier deleted successfully' });
      } else {
        res.status(500).json({ error: 'Failed to delete supplier' });
      }
    } catch (error) {
      console.error('Delete supplier error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new SupplierController();
