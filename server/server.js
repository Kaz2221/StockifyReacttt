// server.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import env from "dotenv";

env.config();
// Configuration de PostgreSQL
// Configuration de PostgreSQL
const db = new pg.Client({   
  user: process.env.PG_USER,  
  host: process.env.PG_HOST,  
  database: process.env.PG_DATABASE,  
  password: process.env.PG_PASSWORD,   
  port: process.env.PG_PORT,
  });

  db.connect()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch((err) => console.error("DB connection error:", err));


const app = express();
const port = 5000;
app.use(cors());

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ===== ROUTES POUR LES UTILISATEURS =====

app.post('/api/login', async (req, res) => {
    try{

      const {email, password} = req.body;

      //Check if user does not  exists
      const result  = await db.query(
        'SELECT * FROM users WHERE email = $1', 
        [email]
      );

      //If user exists throw back error
      if(result.rows.length === 0){
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }
      //IF exists check password
      const user = result.rows[0];
      // 2. Compare plaintext password with hashed password using bcrypt
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Mot de passe incorrect'
        });
      }
      // 3. If password matches, return user data (excluding password)
      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email
        }
      });

    }catch(error){
      console.error('Erreur de connexion:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }

});

app.post('/api/register', async (req, res) => {
  try{
  const { email, password, phone_number } = req.body;

      // Check if user already exists
      const check = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      if (check.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'User already exists' });
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      //Insert new user
      await db.query(
        'INSERT INTO users (email, password, phone_number, created_at) VALUES ($1, $2, $3, NOW())',
        [email, hashedPassword, phone_number]
      );
      res.status(201).json({ success: true, message: 'User registered' });

    }catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ===== ROUTES POUR LES ARTICLES D'INVENTAIRE =====

// Récupérer tous les articles
app.get('/api/items', async (req, res) => {
  try {
    // Exécuter la requête pour récupérer tous les articles
    const result = await db.query(`
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
    
    const result = await db.query(
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
    
    const result = await db.query(
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
    
    const result = await db.query(
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
    const result = await db.query(`
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
    
    const result = await db.query(
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
    
    const result = await db.query(
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
    
    const result = await db.query(
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
    const result = await db.query(`
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
// Récupérer les articles des ventes
app.get('/api/sale_items', async (req, res) => {
  try {
    const result = await db.query(`
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
    
    const result = await db.query(
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
// Ajouter un article à une vente
app.post('/api/sale_items', async (req, res) => {
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');
    
    const { sale_id, item_id, quantity, unit_price } = req.body;
    
    // Convertir les paramètres en types appropriés
    const numItemId = Number(item_id);
    const numQuantity = Number(quantity);
    const numSaleId = Number(sale_id);
    const numUnitPrice = Number(unit_price);
    
    // Vérifier que l'article existe et récupérer des informations
    const itemCheck = await client.query(
      'SELECT qty, product_name, min_qty FROM items WHERE id = $1',
      [numItemId]
    );
    
    if (itemCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Article non trouvé' });
    }
    
    const currentStock = itemCheck.rows[0].qty;
    const product_name = itemCheck.rows[0].product_name;
    const minQty = itemCheck.rows[0].min_qty || 0; // Quantité minimale, 0 par défaut
    
    // Vérifier si le stock est suffisant
    if (currentStock < numQuantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        message: `Stock insuffisant. Stock actuel: ${currentStock}, Quantité demandée: ${numQuantity}` 
      });
    }
    
    // Calculer la quantité qui restera après la vente
    const remainingQty = currentStock - numQuantity;
    
    // Flag pour indiquer si le stock passe en dessous du seuil minimal
    let lowStockAlert = false;
    
    // Vérifier si le stock va passer en dessous du seuil minimal
    if (remainingQty <= minQty) {
      lowStockAlert = true;
      console.log(`ALERTE: Le stock de ${product_name} va passer en dessous du seuil minimal (${minQty}). Stock restant: ${remainingQty}`);
    }
    
    // Calculer le sous-total
    const subtotal = numQuantity * numUnitPrice;
    
    // Insérer l'article de vente
    const result = await client.query(
      `INSERT INTO sale_items 
       (sale_id, item_id, quantity, unit_price, product_name, subtotal) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [numSaleId, numItemId, numQuantity, numUnitPrice, product_name, subtotal]
    );
    
    // Mettre à jour la quantité en stock
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
    
    // Ajouter l'alerte à la réponse si nécessaire
    const response = {
      ...result.rows[0],
      lowStockAlert: lowStockAlert,
      message: lowStockAlert ? `Attention: Le stock de ${product_name} est bas (${remainingQty}/${minQty})` : null
    };
    
    res.status(201).json(response);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur lors de l\'ajout d\'un article de vente:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  } finally {
    client.release();
  }
});
// Mettre à jour un article de vente
app.put('/api/sale_items/:id', async (req, res) => {
  const client = await db.connect();
  
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
    if (numItemId === oldItemId) {
      // Même article, vérifier si l'augmentation de quantité est possible
      const quantityDiff = numQuantity - oldQuantity;
      if (quantityDiff > 0) {
        // Récupérer le stock actuel
        const currentStockResult = await client.query(
          'SELECT qty FROM items WHERE id = $1',
          [numItemId]
        );
        
        if (currentStockResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ message: 'Article non trouvé dans l\'inventaire' });
        }
        
        const currentStock = currentStockResult.rows[0].qty;
        
        // Vérifier si le stock est suffisant pour l'augmentation
        if (currentStock < quantityDiff) {
          await client.query('ROLLBACK');
          return res.status(400).json({ 
            message: `Stock insuffisant. Stock disponible: ${currentStock}, Augmentation demandée: ${quantityDiff}` 
          });
        }
      }
    } else {
      // Article différent, vérifier si le stock est suffisant
      const currentStockResult = await client.query(
        'SELECT qty, product_name FROM items WHERE id = $1',
        [numItemId]
      );
      
      if (currentStockResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Nouvel article non trouvé dans l\'inventaire' });
      }
      
      const currentStock = currentStockResult.rows[0].qty;
      const product_name = currentStockResult.rows[0].product_name;
      
      // Vérifier si le stock est suffisant
      if (currentStock < numQuantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          message: `Stock insuffisant pour le nouvel article. Stock disponible: ${currentStock}, Quantité demandée: ${numQuantity}` 
        });
      }
      
      // Mettre à jour la requête pour inclure product_name
      const subtotal = numQuantity * numUnitPrice;
      
      // Mettre à jour l'article de vente
      const result = await client.query(
        `UPDATE sale_items 
         SET item_id = $1, 
             quantity = $2, 
             unit_price = $3,
             product_name = $4,
             subtotal = $5
         WHERE id = $6
         RETURNING *`,
        [numItemId, numQuantity, numUnitPrice, product_name, subtotal, numId]
      );
      
      // Ajuster les stocks
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
      
      await client.query('COMMIT');
      res.json(result.rows[0]);
      return; // Sortir de la fonction ici puisque nous avons déjà traité ce cas
    }
    
    // Si on est toujours ici, c'est que c'est le même article avec une quantité différente
    // Calculer le sous-total
    const subtotal = numQuantity * numUnitPrice;
    
    // Récupérer le nom du produit
    const productNameResult = await client.query(
      'SELECT product_name FROM items WHERE id = $1',
      [numItemId]
    );
    
    const product_name = productNameResult.rows[0].product_name;
    
    // Mettre à jour l'article de vente
    const result = await client.query(
      `UPDATE sale_items 
       SET item_id = $1, 
           quantity = $2, 
           unit_price = $3,
           product_name = $4,
           subtotal = $5
       WHERE id = $6
       RETURNING *`,
      [numItemId, numQuantity, numUnitPrice, product_name, subtotal, numId]
    );
    
    // Ajuster les stocks
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
  const client = await db.connect();
  
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
  const client = await db.connect();
  
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