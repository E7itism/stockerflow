import { Request, Response } from 'express';
import inventoryModel from '../models/inventoryModel';
import productModel from '../models/productModel';
import { io } from '../server';

class InventoryController {
  async createTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { product_id, transaction_type, quantity, notes } = req.body;
      const user_id = (req as any).user?.userId;

      if (!product_id || !transaction_type || quantity === undefined) {
        res.status(400).json({
          error: 'Product ID, transaction type, and quantity are required',
        });
        return;
      }

      if (!['in', 'out', 'adjustment'].includes(transaction_type)) {
        res
          .status(400)
          .json({ error: 'Transaction type must be: in, out, or adjustment' });
        return;
      }

      if (quantity <= 0 && transaction_type !== 'adjustment') {
        res
          .status(400)
          .json({ error: 'Quantity must be positive for in/out transactions' });
        return;
      }

      const product = await productModel.findById(product_id);
      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      if (transaction_type === 'out') {
        const currentStock = await inventoryModel.getCurrentStock(product_id);
        if (currentStock < quantity) {
          res.status(400).json({
            error: `Insufficient stock. Current stock: ${currentStock}`,
            current_stock: currentStock,
          });
          return;
        }
      }

      const newTransaction = await inventoryModel.create({
        product_id,
        transaction_type,
        quantity,
        user_id,
        notes,
      });

      const currentStock = await inventoryModel.getCurrentStock(product_id);

      /**
       * Emit 'stock:updated' after a manual inventory transaction.
       *
       * WHY emit here too (not just from posController)?
       * Manual adjustments from STOCKER should also update the Inventory
       * page in real time — e.g. two admins using the app simultaneously.
       */
      io.emit('stock:updated', {
        product_id,
        product_name: product.name,
        transaction_type,
        quantity,
        current_stock: currentStock,
      });

      res.status(201).json({
        message: 'Transaction created successfully',
        transaction: newTransaction,
        current_stock: currentStock,
      });
    } catch (error) {
      console.error('Create transaction error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getAllTransactions(req: Request, res: Response): Promise<void> {
    try {
      const transactions = await inventoryModel.findAll();
      res.status(200).json({ count: transactions.length, transactions });
    } catch (error) {
      console.error('Get all transactions error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getOneTransaction(req: Request, res: Response): Promise<void> {
    try {
      const transaction = await inventoryModel.findById(
        parseInt(req.params.id as string),
      );
      if (!transaction) {
        res.status(404).json({ error: 'Transaction not found' });
        return;
      }
      res.status(200).json({ transaction });
    } catch (error) {
      console.error('Get transaction error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getTransactionsByProduct(req: Request, res: Response): Promise<void> {
    try {
      const productId = parseInt(req.params.productId as string);
      const product = await productModel.findById(productId);
      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }
      const transactions = await inventoryModel.findByProductId(productId);
      res.status(200).json({ count: transactions.length, transactions });
    } catch (error) {
      console.error('Get product transactions error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getProductStock(req: Request, res: Response): Promise<void> {
    try {
      const productId = parseInt(req.params.productId as string);
      const product = await productModel.findById(productId);
      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }
      const currentStock = await inventoryModel.getCurrentStock(productId);
      res.status(200).json({
        product_id: productId,
        sku: product.sku,
        name: product.name,
        current_stock: currentStock,
        reorder_level: product.reorder_level,
        is_low_stock: currentStock <= (product.reorder_level || 0),
      });
    } catch (error) {
      console.error('Get product stock error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getAllStock(req: Request, res: Response): Promise<void> {
    try {
      const stockData = await inventoryModel.getAllProductStock();
      res.status(200).json({ count: stockData.length, stock: stockData });
    } catch (error) {
      console.error('Get all stock error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getLowStock(req: Request, res: Response): Promise<void> {
    try {
      const lowStockProducts = await inventoryModel.getLowStockProducts();
      res.status(200).json({
        count: lowStockProducts.length,
        low_stock_products: lowStockProducts,
      });
    } catch (error) {
      console.error('Get low stock error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getRecentTransactions(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const transactions = await inventoryModel.getRecentTransactions(limit);
      res.status(200).json({ count: transactions.length, transactions });
    } catch (error) {
      console.error('Get recent transactions error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteTransaction(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id as string);
      const existing = await inventoryModel.findById(id);
      if (!existing) {
        res.status(404).json({ error: 'Transaction not found' });
        return;
      }
      const deleted = await inventoryModel.delete(id);
      if (deleted) {
        res.status(200).json({ message: 'Transaction deleted successfully' });
      } else {
        res.status(500).json({ error: 'Failed to delete transaction' });
      }
    } catch (error) {
      console.error('Delete transaction error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new InventoryController();
