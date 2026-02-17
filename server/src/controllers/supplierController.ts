/**
 * supplierController.ts
 *
 * CRUD operations for suppliers.
 * Validates name uniqueness before create and update.
 */

import { Request, Response } from 'express';
import supplierModel from '../models/supplierModel';

class SupplierController {
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, contact_person, email, phone, address } = req.body;

      if (!name) {
        res.status(400).json({ error: 'Supplier name is required' });
        return;
      }

      const existingSupplier = await supplierModel.findByName(name);
      if (existingSupplier) {
        res.status(409).json({ error: 'Supplier name already exists' });
        return;
      }

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

  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const suppliers = await supplierModel.findAll();
      res.status(200).json(suppliers);
    } catch (error) {
      console.error('Get suppliers error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

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

  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const updateData = req.body;

      const existingSupplier = await supplierModel.findById(parseInt(id));
      if (!existingSupplier) {
        res.status(404).json({ error: 'Supplier not found' });
        return;
      }

      // Only check name conflict if the name is actually changing
      if (updateData.name && updateData.name !== existingSupplier.name) {
        const nameExists = await supplierModel.findByName(updateData.name);
        if (nameExists) {
          res.status(409).json({ error: 'Supplier name already exists' });
          return;
        }
      }

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

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      const existingSupplier = await supplierModel.findById(parseInt(id));
      if (!existingSupplier) {
        res.status(404).json({ error: 'Supplier not found' });
        return;
      }

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
