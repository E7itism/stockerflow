/**
 * ═══════════════════════════════════════════════════════════════════
 * INVENTORY CONTROLLER - Business Logic Layer
 * ═══════════════════════════════════════════════════════════════════
 *
 * PURPOSE: Handle the business rules for inventory transactions
 *
 * WHAT THIS FILE DOES:
 * - Validates incoming requests
 * - Checks business rules (enough stock? valid type?)
 * - Calls the model to save/retrieve data
 * - Sends responses back to the client
 *
 * REAL-WORLD ANALOGY:
 * Think of this as the shop manager who:
 * - Checks if the request makes sense
 * - Makes sure you're not selling more than you have
 * - Records the transaction
 * - Tells you the result
 *
 * CONTROLLER FLOW:
 * Request → Validate → Check Rules → Model → Response
 * ═══════════════════════════════════════════════════════════════════
 */
import inventoryModel from '../models/inventoryModel';
import productModel from '../models/productModel';
class InventoryController {
    // ═══════════════════════════════════════════════════════════════════
    // CREATE TRANSACTION (Main Function!)
    // ═══════════════════════════════════════════════════════════════════
    /**
     * Creates a new inventory transaction
     *
     * FLOW:
     * 1. Extract data from request
     * 2. Validate all required fields
     * 3. Check if product exists
     * 4. Check if enough stock (for 'out' transactions)
     * 5. Create the transaction
     * 6. Return updated stock level
     *
     * EXAMPLE REQUEST:
     * POST /api/inventory/transactions
     * {
     *   "product_id": 1,
     *   "transaction_type": "out",
     *   "quantity": 5,
     *   "notes": "Sold to customer"
     * }
     */
    async createTransaction(req, res) {
        try {
            // ─────────────────────────────────────────────────────────────
            // STEP 1: EXTRACT DATA
            // ─────────────────────────────────────────────────────────────
            const { product_id, transaction_type, quantity, notes } = req.body;
            /**
             * USER ID FROM AUTH MIDDLEWARE
             *
             * When user logs in, they get a JWT token
             * Auth middleware extracts user_id from token
             * It attaches user info to req.user
             *
             * Type assertion (req as any) because TypeScript doesn't
             * know about our custom req.user property
             */
            const user_id = req.user?.userId;
            // ─────────────────────────────────────────────────────────────
            // STEP 2: VALIDATE REQUIRED FIELDS
            // ─────────────────────────────────────────────────────────────
            /**
             * VALIDATION #1: Are all required fields present?
             *
             * We check:
             * - product_id: Which product?
             * - transaction_type: What type of movement?
             * - quantity: How many? (checking undefined, not falsy, so 0 is valid)
             *
             * WHY "quantity === undefined"?
             * - quantity: 0 is valid (adjustment to 0)
             * - !quantity would reject 0 (bad!)
             * - === undefined only rejects missing field (good!)
             */
            if (!product_id || !transaction_type || quantity === undefined) {
                res.status(400).json({
                    error: 'Product ID, transaction type, and quantity are required',
                });
                return;
            }
            // ─────────────────────────────────────────────────────────────
            // STEP 3: VALIDATE TRANSACTION TYPE
            // ─────────────────────────────────────────────────────────────
            /**
             * VALIDATION #2: Is transaction type valid?
             *
             * Only 3 types allowed:
             * - 'in': Adding stock (receiving from supplier)
             * - 'out': Removing stock (sale, damage)
             * - 'adjustment': Correction (physical count mismatch)
             *
             * .includes() checks if value is in array
             */
            if (!['in', 'out', 'adjustment'].includes(transaction_type)) {
                res.status(400).json({
                    error: 'Transaction type must be: in, out, or adjustment',
                });
                return;
            }
            // ─────────────────────────────────────────────────────────────
            // STEP 4: VALIDATE QUANTITY
            // ─────────────────────────────────────────────────────────────
            /**
             * VALIDATION #3: Is quantity valid?
             *
             * For 'in' and 'out': quantity MUST be positive
             * For 'adjustment': quantity can be negative (reducing stock)
             *
             * EXAMPLE:
             * ✅ type='in', quantity=10   (adding 10)
             * ✅ type='out', quantity=5   (removing 5)
             * ✅ type='adjustment', quantity=-3  (correcting down by 3)
             * ❌ type='in', quantity=-5   (can't add negative!)
             * ❌ type='out', quantity=0   (removing 0 makes no sense)
             */
            if (quantity <= 0 && transaction_type !== 'adjustment') {
                res.status(400).json({
                    error: 'Quantity must be positive for in/out transactions',
                });
                return;
            }
            // ─────────────────────────────────────────────────────────────
            // STEP 5: CHECK IF PRODUCT EXISTS
            // ─────────────────────────────────────────────────────────────
            /**
             * VALIDATION #4: Does the product exist?
             *
             * WHY CHECK THIS?
             * - Can't add stock for non-existent product
             * - Database would reject it anyway (foreign key constraint)
             * - Better to give clear error message here
             */
            const product = await productModel.findById(product_id);
            if (!product) {
                res.status(404).json({ error: 'Product not found' });
                return;
            }
            // ─────────────────────────────────────────────────────────────
            // STEP 6: BUSINESS RULE - CHECK SUFFICIENT STOCK
            // ─────────────────────────────────────────────────────────────
            /**
             * VALIDATION #5: Is there enough stock? (CRITICAL!)
             *
             * ONLY for 'out' transactions:
             * - Calculate current stock from all transactions
             * - If current stock < quantity being removed → STOP!
             *
             * EXAMPLE:
             * Current stock: 10 units
             * Trying to remove: 15 units
             * Result: ❌ Error! Can't remove more than you have
             *
             * WHY NOT FOR 'in' or 'adjustment'?
             * - 'in': Adding stock, no limit
             * - 'adjustment': Manual correction, might intentionally go negative
             */
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
            // ─────────────────────────────────────────────────────────────
            // STEP 7: ALL VALIDATIONS PASSED - CREATE TRANSACTION
            // ─────────────────────────────────────────────────────────────
            /**
             * CREATE THE TRANSACTION
             *
             * At this point:
             * ✅ All fields are present
             * ✅ Transaction type is valid
             * ✅ Quantity is valid
             * ✅ Product exists
             * ✅ Enough stock available (if removing)
             *
             * Safe to create the transaction!
             */
            const newTransaction = await inventoryModel.create({
                product_id,
                transaction_type,
                quantity,
                user_id,
                notes,
            });
            // ─────────────────────────────────────────────────────────────
            // STEP 8: GET UPDATED STOCK LEVEL
            // ─────────────────────────────────────────────────────────────
            /**
             * CALCULATE NEW STOCK
             *
             * After creating transaction, recalculate stock
             * Return it to user so they know the new total
             *
             * EXAMPLE:
             * Before: 100 units
             * Removed: 10 units
             * After: 90 units ← We return this
             */
            const currentStock = await inventoryModel.getCurrentStock(product_id);
            // ─────────────────────────────────────────────────────────────
            // STEP 9: SUCCESS RESPONSE
            // ─────────────────────────────────────────────────────────────
            res.status(201).json({
                message: 'Transaction created successfully',
                transaction: newTransaction,
                current_stock: currentStock,
            });
        }
        catch (error) {
            console.error('Create transaction error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    // ═══════════════════════════════════════════════════════════════════
    // GET ALL TRANSACTIONS
    // ═══════════════════════════════════════════════════════════════════
    /**
     * Retrieves all inventory transactions
     *
     * USE CASE: View complete transaction history
     *
     * RESPONSE EXAMPLE:
     * {
     *   "count": 50,
     *   "transactions": [
     *     { id: 1, product_name: "Laptop", type: "in", quantity: 10, ... },
     *     { id: 2, product_name: "Mouse", type: "out", quantity: 2, ... }
     *   ]
     * }
     */
    async getAllTransactions(req, res) {
        try {
            const transactions = await inventoryModel.findAll();
            res.status(200).json({
                count: transactions.length,
                transactions,
            });
        }
        catch (error) {
            console.error('Get all transactions error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    // ═══════════════════════════════════════════════════════════════════
    // GET SINGLE TRANSACTION
    // ═══════════════════════════════════════════════════════════════════
    async getOneTransaction(req, res) {
        try {
            const id = req.params.id;
            const transaction = await inventoryModel.findById(parseInt(id));
            if (!transaction) {
                res.status(404).json({ error: 'Transaction not found' });
                return;
            }
            res.status(200).json({ transaction });
        }
        catch (error) {
            console.error('Get transaction error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    // ═══════════════════════════════════════════════════════════════════
    // GET TRANSACTIONS BY PRODUCT
    // ═══════════════════════════════════════════════════════════════════
    /**
     * Get transaction history for ONE product
     *
     * USE CASE: "Show me all movements for Dell Laptop"
     *
     * Useful for:
     * - Tracking product movement history
     * - Debugging stock discrepancies
     * - Audit trail for specific product
     */
    async getTransactionsByProduct(req, res) {
        try {
            const productId = req.params.productId;
            // Check if product exists first
            const product = await productModel.findById(parseInt(productId));
            if (!product) {
                res.status(404).json({ error: 'Product not found' });
                return;
            }
            const transactions = await inventoryModel.findByProductId(parseInt(productId));
            res.status(200).json({
                count: transactions.length,
                transactions,
            });
        }
        catch (error) {
            console.error('Get product transactions error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    // ═══════════════════════════════════════════════════════════════════
    // GET PRODUCT STOCK LEVEL
    // ═══════════════════════════════════════════════════════════════════
    /**
     * Get current stock for ONE product
     *
     * USE CASE: "How many Dell Laptops do I have?"
     *
     * Returns:
     * - Current stock quantity
     * - Reorder level
     * - Low stock alert boolean
     */
    async getProductStock(req, res) {
        try {
            const productId = req.params.productId;
            const product = await productModel.findById(parseInt(productId));
            if (!product) {
                res.status(404).json({ error: 'Product not found' });
                return;
            }
            const currentStock = await inventoryModel.getCurrentStock(parseInt(productId));
            res.status(200).json({
                product_id: parseInt(productId),
                sku: product.sku,
                name: product.name,
                current_stock: currentStock,
                reorder_level: product.reorder_level,
                is_low_stock: currentStock <= (product.reorder_level || 0),
            });
        }
        catch (error) {
            console.error('Get product stock error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    // ═══════════════════════════════════════════════════════════════════
    // GET ALL STOCK LEVELS
    // ═══════════════════════════════════════════════════════════════════
    /**
     * Get stock levels for ALL products
     *
     * USE CASE: Dashboard showing inventory overview
     *
     * Shows:
     * - Every product
     * - Current stock for each
     * - Which ones are low
     */
    async getAllStock(req, res) {
        try {
            const stockData = await inventoryModel.getAllProductStock();
            res.status(200).json({
                count: stockData.length,
                stock: stockData,
            });
        }
        catch (error) {
            console.error('Get all stock error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    // ═══════════════════════════════════════════════════════════════════
    // GET LOW STOCK PRODUCTS (Important for Alerts!)
    // ═══════════════════════════════════════════════════════════════════
    /**
     * Get products that need reordering
     *
     * USE CASE: Dashboard alert "5 products low on stock!"
     *
     * LOW STOCK = current_stock <= reorder_level
     *
     * EXAMPLE:
     * Product: Mouse
     * Current: 5 units
     * Reorder level: 20 units
     * Result: ⚠️ LOW STOCK! Need to reorder
     */
    async getLowStock(req, res) {
        try {
            const lowStockProducts = await inventoryModel.getLowStockProducts();
            res.status(200).json({
                count: lowStockProducts.length,
                low_stock_products: lowStockProducts,
            });
        }
        catch (error) {
            console.error('Get low stock error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    // ═══════════════════════════════════════════════════════════════════
    // GET RECENT TRANSACTIONS
    // ═══════════════════════════════════════════════════════════════════
    /**
     * Get last N transactions
     *
     * USE CASE: Dashboard "Recent Activity" widget
     *
     * Shows most recent stock movements
     * Default: Last 10 transactions
     * Can customize with ?limit=20
     */
    async getRecentTransactions(req, res) {
        try {
            // Get limit from query parameter, default to 10
            const limit = req.query.limit ? parseInt(req.query.limit) : 10;
            const transactions = await inventoryModel.getRecentTransactions(limit);
            res.status(200).json({
                count: transactions.length,
                transactions,
            });
        }
        catch (error) {
            console.error('Get recent transactions error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    // ═══════════════════════════════════════════════════════════════════
    // DELETE TRANSACTION
    // ═══════════════════════════════════════════════════════════════════
    /**
     * Delete a transaction (Use carefully!)
     *
     * WARNING: This affects stock calculations
     *
     * USE ONLY FOR:
     * - Correcting mistakes (entered wrong quantity)
     * - Testing during development
     *
     * BETTER APPROACH in production:
     * - Create a reversal transaction instead
     * - Or use soft delete (mark as deleted, don't remove)
     */
    async deleteTransaction(req, res) {
        try {
            const id = req.params.id;
            const existingTransaction = await inventoryModel.findById(parseInt(id));
            if (!existingTransaction) {
                res.status(404).json({ error: 'Transaction not found' });
                return;
            }
            const deleted = await inventoryModel.delete(parseInt(id));
            if (deleted) {
                res.status(200).json({ message: 'Transaction deleted successfully' });
            }
            else {
                res.status(500).json({ error: 'Failed to delete transaction' });
            }
        }
        catch (error) {
            console.error('Delete transaction error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
/**
 * EXPORT AS SINGLETON
 * Same pattern as your other controllers
 */
export default new InventoryController();
