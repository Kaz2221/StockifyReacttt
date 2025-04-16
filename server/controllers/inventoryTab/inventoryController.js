import pool from '../../server.js'; // path depends on where the file is
//Get Items from logged in user
// This function retrieves all items for the logged-in user from the database.
export const getItems = async (req, res) => {
    try {
        const userId = req.user.id; 
        console.log("📦 Fetching items for userId:", userId); //DEBUG LINE VERY USEFUL !! (This is what the user object being passed looks like)
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
          WHERE user_id = $1
          ORDER BY product_name
        `, [userId]);
        
        // Renvoyer les résultats au format JSON
        res.json(result.rows);
      } catch (error) {
        console.error('Erreur lors de la récupération des articles:', error);
        res.status(500).json({ message: 'Erreur serveur' });
      }
}

//Add Item
// This function adds a new item to the database with the provided details in the request body.
export const addItem = async (req, res) => {
try {
        const userId = req.user.id;
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
           (product_name, description, category, qty, min_qty, price, cost, purchase_date, created_at, updated_at, user_id) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,$9) 
           RETURNING *`,
          [product_name, description, category, qty, min_qty, price, cost, purchase_date,userId]
        );
        
        res.status(201).json(result.rows[0]);
      } catch (error) {
        console.error('Erreur lors de l\'ajout d\'un article:', error);
        res.status(500).json({ message: 'Erreur serveur' });
      }
}

//Update Item
// This function updates an item in the database based on the provided ID and request body.
export const updateItem = async (req, res) => {
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
}

export const deleteItem = async (req, res) => {
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
}