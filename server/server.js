// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

// Configuration de PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'InventoryManager',
  password: 'djibril21',
  port: 5432,
});

const app = express();
const port = 5000;
app.use(cors());

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ===== ROUTES POUR LES UTILISATEURS =====

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Vérifier si l'utilisateur existe dans la base de données
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1', 
      [email]
    );
    
    // Si aucun utilisateur n'est trouvé
    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email ou mot de passe incorrect' 
      });
    }
    
    const user = result.rows[0];
    
    // En production, vous devriez utiliser bcrypt pour comparer les mots de passe hachés
    // Mais pour cet exemple, nous comparons directement (non recommandé en production)
    if (password !== user.password) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email ou mot de passe incorrect' 
      });
    }
    
    // Authentification réussie
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
        // N'incluez pas le mot de passe dans la réponse!
      }
    });
    
  } catch (error) {
    console.error('Erreur de connexion:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

// ===== ROUTES POUR LES ARTICLES D'INVENTAIRE =====

// Récupérer tous les articles
app.get('/api/items', async (req, res) => {
  try {
    // Exécuter la requête pour récupérer tous les articles
    const result = await pool.query(`
      SELECT 
        id,
        product_name,
        description,
        category,
        qty,
        min_qty,
        price,
        cost,
        purchase_date,
        created_at,
        updated_at
      FROM items
      ORDER BY product_name
    `);
    
    // Renvoyer les résultats au format JSON
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des articles:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Ajouter un nouvel article
app.post('/api/items', async (req, res) => {
  try {
    const { 
      product_name, 
      description, 
      category, 
      qty, 
      min_qty, 
      price, 
      cost, 
      purchase_date 
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO items 
       (product_name, description, category, qty, min_qty, price, cost, purchase_date, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
       RETURNING *`,
      [product_name, description, category, qty, min_qty, price, cost, purchase_date]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de l\'ajout d\'un article:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Mettre à jour un article existant
app.put('/api/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      product_name, 
      description, 
      category, 
      qty, 
      min_qty, 
      price, 
      cost, 
      purchase_date 
    } = req.body;
    
    const result = await pool.query(
      `UPDATE items 
       SET product_name = $1, 
           description = $2, 
           category = $3, 
           qty = $4, 
           min_qty = $5, 
           price = $6, 
           cost = $7, 
           purchase_date = $8, 
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [product_name, description, category, qty, min_qty, price, cost, purchase_date, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Article non trouvé' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la modification d\'un article:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Supprimer un article
app.delete('/api/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM items WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Article non trouvé' });
    }
    
    res.json({ message: 'Article supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression d\'un article:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ===== ROUTES POUR LES DÉPENSES =====

// Récupérer toutes les dépenses
app.get('/api/expenses', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        category,
        amount,
        expense_date,
        recurring,
        recurring_period,
        notes,
        created_at
      FROM expenses
      ORDER BY expense_date DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des dépenses:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Ajouter une dépense
app.post('/api/expenses', async (req, res) => {
  try {
    const { name, category, amount, expense_date, recurring, recurring_period, notes } = req.body;
    
    const result = await pool.query(
      `INSERT INTO expenses 
       (name, category, amount, expense_date, recurring, recurring_period, notes, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP) 
       RETURNING *`,
      [name, category, amount, expense_date, recurring, recurring_period, notes]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de l\'ajout d\'une dépense:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Mettre à jour une dépense
app.put('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, amount, expense_date, recurring, recurring_period, notes } = req.body;
    
    const result = await pool.query(
      `UPDATE expenses 
       SET name = $1, 
           category = $2, 
           amount = $3, 
           expense_date = $4, 
           recurring = $5, 
           recurring_period = $6, 
           notes = $7
       WHERE id = $8
       RETURNING *`,
      [name, category, amount, expense_date, recurring, recurring_period, notes, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Dépense non trouvée' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la modification d\'une dépense:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Supprimer une dépense
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM expenses WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Dépense non trouvée' });
    }
    
    res.json({ message: 'Dépense supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression d\'une dépense:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ===== ROUTES POUR LES VENTES =====

// Récupérer toutes les ventes
app.get('/api/sales', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        user_id,
        sale_date,
        total_amount,
        payment_method,
        notes
      FROM sales
      ORDER BY sale_date DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des ventes:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer les articles des ventes
app.get('/api/sale_items', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        si.id,
        si.sale_id,
        si.item_id,
        i.product_name,
        si.quantity,
        si.unit_price
      FROM sale_items si
      LEFT JOIN items i ON si.item_id = i.id
      ORDER BY si.sale_id, si.id
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des articles de vente:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Ajouter une nouvelle vente
app.post('/api/sales', async (req, res) => {
  try {
    const { user_id, total_amount, payment_method, notes } = req.body;
    
    const result = await pool.query(
      `INSERT INTO sales 
       (user_id, sale_date, total_amount, payment_method, notes) 
       VALUES ($1, CURRENT_TIMESTAMP, $2, $3, $4) 
       RETURNING *`,
      [user_id, total_amount, payment_method, notes]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de l\'ajout d\'une vente:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Ajouter un article à une vente
app.post('/api/sale_items', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { sale_id, item_id, quantity, unit_price } = req.body;
    
    // Convertir les paramètres en types appropriés pour éviter les problèmes de type
    const numItemId = Number(item_id);
    const numQuantity = Number(quantity);
    const numSaleId = Number(sale_id);
    const numUnitPrice = Number(unit_price);
    
    // Vérifier que l'article existe et a suffisamment de stock
    const itemCheck = await client.query(
      'SELECT qty FROM items WHERE id = $1',
      [numItemId]
    );
    
    if (itemCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Article non trouvé' });
    }
    
    const currentStock = itemCheck.rows[0].qty;
    
    if (currentStock < numQuantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        message: `Stock insuffisant. Stock actuel: ${currentStock}, Quantité demandée: ${numQuantity}` 
      });
    }
    
    // Insérer l'article de vente
    const result = await client.query(
      `INSERT INTO sale_items 
       (sale_id, item_id, quantity, unit_price) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [numSaleId, numItemId, numQuantity, numUnitPrice]
    );
    
    // Mettre à jour la quantité en stock - Ajouter des logs pour le debug
    console.log(`Mise à jour du stock: Réduire la quantité de ${numQuantity} pour l'article ${numItemId}`);
    
    const updateStock = await client.query(
      `UPDATE items 
       SET qty = qty - $1 
       WHERE id = $2
       RETURNING qty as new_stock`,
      [numQuantity, numItemId]
    );
    
    console.log(`Nouveau stock après mise à jour: ${updateStock.rows[0].new_stock}`);
    
    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur lors de l\'ajout d\'un article de vente:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

// Mettre à jour une vente
app.put('/api/sales/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { total_amount, payment_method, notes } = req.body;
    
    const result = await pool.query(
      `UPDATE sales 
       SET total_amount = $1, 
           payment_method = $2, 
           notes = $3
       WHERE id = $4
       RETURNING *`,
      [total_amount, payment_method, notes, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vente non trouvée' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la modification d\'une vente:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Mettre à jour un article de vente
app.put('/api/sale_items/:id', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { item_id, quantity, unit_price } = req.body;
    
    // Convertir les paramètres en nombres
    const numId = Number(id);
    const numItemId = Number(item_id);
    const numQuantity = Number(quantity);
    const numUnitPrice = Number(unit_price);
    
    // Récupérer l'article de vente actuel
    const currentItem = await client.query(
      'SELECT item_id, quantity FROM sale_items WHERE id = $1',
      [numId]
    );
    
    if (currentItem.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Article de vente non trouvé' });
    }
    
    const oldItemId = Number(currentItem.rows[0].item_id);
    const oldQuantity = Number(currentItem.rows[0].quantity);
    
    // Vérifier le stock si l'article ou la quantité change
    if (numItemId !== oldItemId || numQuantity > oldQuantity) {
      const diffQuantity = numItemId === oldItemId 
        ? numQuantity - oldQuantity 
        : numQuantity;
      
      if (diffQuantity > 0) {
        const itemCheck = await client.query(
          'SELECT qty FROM items WHERE id = $1',
          [numItemId === oldItemId ? numItemId : numItemId]
        );
        
        if (itemCheck.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ message: 'Nouvel article non trouvé' });
        }
        
        const currentStock = itemCheck.rows[0].qty;
        
        if (currentStock < diffQuantity) {
          await client.query('ROLLBACK');
          return res.status(400).json({ 
            message: `Stock insuffisant. Stock actuel: ${currentStock}, Quantité additionnelle demandée: ${diffQuantity}` 
          });
        }
      }
    }
    
    // Mettre à jour l'article de vente
    const result = await client.query(
      `UPDATE sale_items 
       SET item_id = $1, 
           quantity = $2, 
           unit_price = $3
       WHERE id = $4
       RETURNING *`,
      [numItemId, numQuantity, numUnitPrice, numId]
    );
    
    // Ajuster les stocks
    if (oldItemId === numItemId) {
      // Même article, ajuster la différence de quantité
      const quantityDiff = numQuantity - oldQuantity;
      if (quantityDiff !== 0) {
        console.log(`Ajustement du stock pour l'article ${numItemId}: ${quantityDiff > 0 ? 'réduction' : 'augmentation'} de ${Math.abs(quantityDiff)}`);
        
        await client.query(
          `UPDATE items 
           SET qty = qty - $1 
           WHERE id = $2
           RETURNING qty as new_stock`,
          [quantityDiff, numItemId]
        );
      }
    } else {
      // Article différent, restaurer l'ancien stock
      console.log(`Restauration du stock pour l'article ${oldItemId}: +${oldQuantity}`);
      
      await client.query(
        `UPDATE items 
         SET qty = qty + $1 
         WHERE id = $2
         RETURNING qty as new_stock`,
        [oldQuantity, oldItemId]
      );
      
      // Réduire le nouveau stock
      console.log(`Réduction du stock pour le nouvel article ${numItemId}: -${numQuantity}`);
      
      await client.query(
        `UPDATE items 
         SET qty = qty - $1 
         WHERE id = $2
         RETURNING qty as new_stock`,
        [numQuantity, numItemId]
      );
    }
    
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur lors de la modification d\'un article de vente:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

// Supprimer une vente
app.delete('/api/sales/:id', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const numId = Number(id);
    
    // Récupérer les articles de la vente pour restaurer les stocks
    const saleItems = await client.query(
      'SELECT item_id, quantity FROM sale_items WHERE sale_id = $1',
      [numId]
    );
    
    // Restaurer les stocks
    for (const item of saleItems.rows) {
      const numItemId = Number(item.item_id);
      const numQuantity = Number(item.quantity);
      
      console.log(`Restauration du stock pour l'article ${numItemId}: +${numQuantity}`);
      
      await client.query(
        `UPDATE items 
         SET qty = qty + $1 
         WHERE id = $2
         RETURNING qty as new_stock`,
        [numQuantity, numItemId]
      );
    }
    
    // Supprimer les articles de la vente
    await client.query('DELETE FROM sale_items WHERE sale_id = $1', [numId]);
    
    // Supprimer la vente
    const result = await client.query(
      'DELETE FROM sales WHERE id = $1 RETURNING *',
      [numId]
    );
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Vente non trouvée' });
    }
    
    await client.query('COMMIT');
    res.json({ message: 'Vente supprimée avec succès' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur lors de la suppression d\'une vente:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  } finally {
    client.release();
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