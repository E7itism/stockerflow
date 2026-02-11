/**
 * ═══════════════════════════════════════════════════════════════════
 * INVENTORY ROUTES - API Endpoints
 * ═══════════════════════════════════════════════════════════════════
 *
 * PURPOSE: Define all API endpoints for inventory management
 *
 * WHAT THIS FILE DOES:
 * - Maps URLs to controller functions
 * - Applies authentication middleware
 * - Defines HTTP methods (GET, POST, DELETE)
 *
 * ROUTE STRUCTURE:
 * HTTP Method + URL Path → Controller Function
 *
 * EXAMPLE:
 * POST /api/inventory/transactions → createTransaction()
 * ═══════════════════════════════════════════════════════════════════
 */
import { Router } from 'express';
import inventoryController from '../controllers/inventoryController';
import { authenticateToken } from '../middleware/authMiddleware';
const router = Router();
// ═══════════════════════════════════════════════════════════════════
// AUTHENTICATION MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════
/**
 * PROTECT ALL ROUTES
 *
 * router.use(authenticate) means:
 * - Every route below requires a valid JWT token
 * - User must be logged in to access any inventory endpoint
 * - If no token or invalid token → 401 Unauthorized
 *
 * WHY?
 * - Track who made each transaction (user_id)
 * - Security: Only authenticated users can view/modify inventory
 * - Audit trail: Know who did what
 */
router.use(authenticateToken);
// ═══════════════════════════════════════════════════════════════════
// TRANSACTION ROUTES
// ═══════════════════════════════════════════════════════════════════
/**
 * CREATE TRANSACTION
 * POST /api/inventory/transactions
 *
 * PURPOSE: Add/Remove/Adjust stock
 *
 * REQUEST BODY:
 * {
 *   "product_id": 1,
 *   "transaction_type": "in",  // 'in', 'out', or 'adjustment'
 *   "quantity": 50,
 *   "notes": "Received from supplier"
 * }
 *
 * RESPONSE: 201 Created
 * {
 *   "message": "Transaction created successfully",
 *   "transaction": {...},
 *   "current_stock": 150
 * }
 */
router.post('/transactions', inventoryController.createTransaction);
/**
 * GET ALL TRANSACTIONS
 * GET /api/inventory/transactions
 *
 * PURPOSE: View complete transaction history
 *
 * RESPONSE: 200 OK
 * {
 *   "count": 50,
 *   "transactions": [...]
 * }
 */
router.get('/transactions', inventoryController.getAllTransactions);
/**
 * GET RECENT TRANSACTIONS
 * GET /api/inventory/transactions/recent?limit=10
 *
 * PURPOSE: Dashboard "Recent Activity" widget
 *
 * QUERY PARAMS:
 * - limit: Number of transactions (default: 10)
 *
 * EXAMPLE: GET /api/inventory/transactions/recent?limit=20
 *
 * NOTE: This MUST be before '/:id' route
 * WHY? Route matching is order-dependent:
 * - If '/:id' comes first, 'recent' would be treated as an ID
 * - With 'recent' first, it matches exactly before trying '/:id'
 */
router.get('/transactions/recent', inventoryController.getRecentTransactions);
/**
 * GET SINGLE TRANSACTION
 * GET /api/inventory/transactions/:id
 *
 * PURPOSE: View details of one transaction
 *
 * EXAMPLE: GET /api/inventory/transactions/5
 *
 * RESPONSE: 200 OK
 * {
 *   "transaction": {
 *     "id": 5,
 *     "product_name": "Laptop",
 *     "type": "out",
 *     "quantity": 2,
 *     ...
 *   }
 * }
 */
router.get('/transactions/:id', inventoryController.getOneTransaction);
/**
 * DELETE TRANSACTION
 * DELETE /api/inventory/transactions/:id
 *
 * PURPOSE: Remove a transaction (use carefully!)
 *
 * EXAMPLE: DELETE /api/inventory/transactions/5
 *
 * WARNING: Affects stock calculations!
 * Use only for corrections/mistakes
 *
 * RESPONSE: 200 OK
 * {
 *   "message": "Transaction deleted successfully"
 * }
 */
router.delete('/transactions/:id', inventoryController.deleteTransaction);
// ═══════════════════════════════════════════════════════════════════
// PRODUCT-SPECIFIC ROUTES
// ═══════════════════════════════════════════════════════════════════
/**
 * GET TRANSACTIONS FOR ONE PRODUCT
 * GET /api/inventory/products/:productId/transactions
 *
 * PURPOSE: View transaction history for specific product
 *
 * EXAMPLE: GET /api/inventory/products/1/transactions
 * → Shows all transactions for product #1 (Dell Laptop)
 *
 * USE CASE:
 * - "Show me all movements for Dell Laptop"
 * - Track specific product's history
 */
router.get('/products/:productId/transactions', inventoryController.getTransactionsByProduct);
/**
 * GET STOCK LEVEL FOR ONE PRODUCT
 * GET /api/inventory/products/:productId/stock
 *
 * PURPOSE: Check current stock for specific product
 *
 * EXAMPLE: GET /api/inventory/products/1/stock
 *
 * RESPONSE:
 * {
 *   "product_id": 1,
 *   "sku": "LAP-001",
 *   "name": "Dell Laptop",
 *   "current_stock": 50,
 *   "reorder_level": 10,
 *   "is_low_stock": false
 * }
 */
router.get('/products/:productId/stock', inventoryController.getProductStock);
// ═══════════════════════════════════════════════════════════════════
// STOCK LEVEL ROUTES
// ═══════════════════════════════════════════════════════════════════
/**
 * GET ALL STOCK LEVELS
 * GET /api/inventory/stock
 *
 * PURPOSE: Dashboard inventory overview
 *
 * RESPONSE:
 * {
 *   "count": 10,
 *   "stock": [
 *     { product_id: 1, name: "Laptop", current_stock: 50, ... },
 *     { product_id: 2, name: "Mouse", current_stock: 5, is_low_stock: true },
 *     ...
 *   ]
 * }
 */
router.get('/stock', inventoryController.getAllStock);
/**
 * GET LOW STOCK PRODUCTS (IMPORTANT!)
 * GET /api/inventory/stock/low
 *
 * PURPOSE: Alert system for products needing reorder
 *
 * LOW STOCK = current_stock <= reorder_level
 *
 * USE CASES:
 * - Dashboard alert: "5 products low on stock!"
 * - Email notification to manager
 * - Automatic reorder trigger
 *
 * NOTE: This MUST be before '/stock' route
 * Same reason as '/transactions/recent' above
 *
 * RESPONSE:
 * {
 *   "count": 2,
 *   "low_stock_products": [
 *     { name: "Mouse", current_stock: 5, reorder_level: 20 },
 *     { name: "Keyboard", current_stock: 0, reorder_level: 15 }
 *   ]
 * }
 */
router.get('/stock/low', inventoryController.getLowStock);
/**
 * ═══════════════════════════════════════════════════════════════════
 * ROUTE SUMMARY
 * ═══════════════════════════════════════════════════════════════════
 *
 * TRANSACTIONS:
 * POST   /api/inventory/transactions           - Create transaction
 * GET    /api/inventory/transactions           - Get all transactions
 * GET    /api/inventory/transactions/recent    - Get recent transactions
 * GET    /api/inventory/transactions/:id       - Get one transaction
 * DELETE /api/inventory/transactions/:id       - Delete transaction
 *
 * PRODUCT-SPECIFIC:
 * GET    /api/inventory/products/:id/transactions  - Product history
 * GET    /api/inventory/products/:id/stock         - Product stock level
 *
 * STOCK OVERVIEW:
 * GET    /api/inventory/stock                  - All stock levels
 * GET    /api/inventory/stock/low              - Low stock products
 *
 * ═══════════════════════════════════════════════════════════════════
 */
export default router;
