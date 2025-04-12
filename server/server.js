// server.js

import cookieParser from 'cookie-parser';
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import pkg from "pg";
import bcrypt from "bcrypt";
import env from "dotenv";
import { verifyToken } from './middlewares/authMiddleware.js';


//ROUTES IMPORTING
import authRoutes from "./routes/auth.js"
import inventoryRoutes from "./routes/inventory.js"
import expensesRoutes from "./routes/expenses.js"
import salesRoutes from "./routes/sales.js"
import salesItemsRoutes from "./routes/salesItems.js"
env.config();
const { Pool } = pkg;
// Configuration de PostgreSQL
const pool = new Pool({   
  user: process.env.PG_USER,  
  host: process.env.PG_HOST,  
  database: process.env.PG_DATABASE,  
  password: process.env.PG_PASSWORD,   
  port: process.env.PG_PORT,
  });
  export default pool;

  pool.connect()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch((err) => console.error("pool connection error:", err));


const app = express();
const port = 5000;
app.use(cors({
  origin: "http://localhost:3000", //  React frontend during dev
  credentials: true                // allow cookies to be sent/received
}));
app.use(cookieParser());
app.use(express.json());
app.use('/api', authRoutes);
app.use('/api/items', inventoryRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/sales', salesRoutes); 
app.use('/api/sale_items', salesItemsRoutes);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));




// Ajouter un article à une vente
// Ajouter un article à une vente

// Mettre à jour un article de vente
app.put('/api/sale_items/:id', async (req, res) => {
  const client = await pool.connect();
  const { id } = req.params;
  const { item_id, quantity, unit_price } = req.body;

  const saleItemId = Number(id);
  const newItemId = Number(item_id);
  const newQuantity = Number(quantity);
  const newUnitPrice = Number(unit_price);
  try{
    await client.query('BEGIN');
    // Récupérer l'article de vente existant
    const current = await client.query(
      'SELECT item_id, quantity FROM sale_items WHERE id = $1',
      [saleItemId]
    );

    if (current.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: "Article de vente non trouvé" });
    }

    const oldItemId = current.rows[0].item_id;
    const oldQuantity = current.rows[0].quantity;

        // 🧠 Helper: Get stock + product_name
        const getStockAndName = async (itemId) => {
          const result = await client.query(
            'SELECT qty, product_name FROM items WHERE id = $1',
            [itemId]
          );
          return result.rows[0];
        };


    const newItemData = await getStockAndName(newItemId);
    if (!newItemData) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: "Article non trouvé dans l'inventaire" });
    }

    const newProductName = newItemData.product_name;
    const newStockAvailable = newItemData.qty;
    const subtotal = newQuantity * newUnitPrice;

        // 🧠 Helper: Adjust stock
        const adjustStock = async (itemId, diff) => {
          await client.query(
            'UPDATE items SET qty = qty + $1 WHERE id = $2',
            [diff, itemId]
          );
        };
    

      // 🔁 Stock validation logic
      if (oldItemId !== newItemId) {
        // ✅ Item changed: restore old, reduce new
        await adjustStock(oldItemId, oldQuantity); // restore stock
        if (newStockAvailable < newQuantity) {
          await client.query('ROLLBACK');
          return res.status(400).json({ 
            message: `Stock insuffisant pour le nouvel article. Disponible: ${newStockAvailable}, demandé: ${newQuantity}` 
          });
        }
        await adjustStock(newItemId, -newQuantity);
      } else {
        // ✅ Same item, just quantity changed
        const quantityDiff = oldQuantity - newQuantity;
        if (newStockAvailable < -quantityDiff) {
          await client.query('ROLLBACK');
          return res.status(400).json({ 
            message: `Stock insuffisant. Disponible: ${newStockAvailable}, ajustement requis: ${Math.abs(quantityDiff)}` 
          });
        }
        await adjustStock(newItemId, quantityDiff);
      }
  
      // ✏️ Update sale item
      const updated = await client.query(`
        UPDATE sale_items 
        SET item_id = $1,
            quantity = $2,
            unit_price = $3,
            product_name = $4,
            subtotal = $5
        WHERE id = $6
        RETURNING id, sale_id, item_id, quantity, unit_price, product_name, subtotal
      `, [newItemId, newQuantity, newUnitPrice, newProductName, subtotal, saleItemId]);
  
      await client.query('COMMIT');
      res.json(updated.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur lors de la modification d\'un article de vente:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

app.put('/api/sales/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { payment_method, notes, total_amount } = req.body;

  try {
    const result = await pool.query(
      `UPDATE sales 
       SET payment_method = $1, 
           notes = $2,
           total_amount = $3
       WHERE id = $4 AND user_id = $5
       RETURNING id, payment_method, notes, total_amount, sale_date`,
      [payment_method, notes, total_amount, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Vente non trouvée ou non autorisée" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la vente:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});




// Supprimer un article de vente
app.delete('/api/sale_items/:id', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const numId = Number(id);
    
    // Récupérer l'article de vente pour restaurer le stock
    const saleItem = await client.query(
      'SELECT item_id, quantity FROM sale_items WHERE id = $1',
      [numId]
    );
    
    if (saleItem.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Article de vente non trouvé' });
    }
    
    const numItemId = Number(saleItem.rows[0].item_id);
    const numQuantity = Number(saleItem.rows[0].quantity);
    
    // Restaurer le stock
    console.log(`Restauration du stock pour l'article ${numItemId}: +${numQuantity}`);
    
    await client.query(
      `UPDATE items 
       SET qty = qty + $1 
       WHERE id = $2
       RETURNING qty as new_stock`,
      [numQuantity, numItemId]
    );
    
    // Supprimer l'article de vente
    const result = await client.query(
      'DELETE FROM sale_items WHERE id = $1 RETURNING *',
      [numId]
    );
    
    await client.query('COMMIT');
    res.json({ message: 'Article de vente supprimé avec succès' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur lors de la suppression d\'un article de vente:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

// Démarrer le serveur
app.listen(port, () => {
  console.log(`Serveur démarré sur le port ${port}`);
});