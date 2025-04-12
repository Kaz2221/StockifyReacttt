import pool from '../server.js'; // path depends on where the file is



export const getSales = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log("📦 Fetching sales for userId:", userId); //DEBUG LINE VERY USEFUL !! (This is what the user object being passed looks like)
        const result = await pool.query(`
          SELECT 
            id,
            user_id,
            sale_date,
            total_amount,
            payment_method,
            notes
          FROM sales
          WHERE user_id = $1
          ORDER BY sale_date DESC
        `, [userId]);
        
        res.json(result.rows);
      } catch (error) {
        console.error('Erreur lors de la récupération des ventes:', error);
        res.status(500).json({ message: 'Erreur serveur' });
      }
}

export const getFullSales = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT 
        s.id AS sale_id,
        s.sale_date,
        s.total_amount,
        s.payment_method,
        s.notes,
        si.id AS sale_item_id,
        si.item_id,
        si.quantity,
        si.unit_price,
        i.product_name
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      LEFT JOIN items i ON si.item_id = i.id
      WHERE s.user_id = $1
      ORDER BY s.sale_date DESC, si.id
    `, [userId]);

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Erreur lors de la récupération complète des ventes:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};


export const addSale = async (req, res) => {
    try {
        const userId = req.user.id; // 🔐 From the token
        const { total_amount, payment_method, notes } = req.body;
    
        const result = await pool.query(
          `INSERT INTO sales 
           (user_id, sale_date, total_amount, payment_method, notes) 
           VALUES ($1, CURRENT_TIMESTAMP, $2, $3, $4) 
           RETURNING id, sale_date, total_amount, payment_method, notes`,
          [userId, total_amount, payment_method, notes]
        );
    
        res.status(201).json(result.rows[0]);
      } catch (error) {
        console.error("Erreur lors de l'ajout d'une vente:", error);
        res.status(500).json({ message: "Erreur serveur" });
      }
}

export const updateSale = async (req, res) => {
  const { total_amount, payment_method, notes } = req.body;
  const { id } = req.params;
  const userId = req.user.id;

  try {
    await pool.query(
      `UPDATE sales SET total_amount = $1, payment_method = $2, notes = $3 WHERE id = $4 AND user_id = $5`,
      [total_amount, payment_method, notes, id, userId]
    );
    res.status(200).json({ message: 'Sale updated successfully' });
  } catch (err) {
    console.error('Error updating sale:', err);
    res.status(500).json({ message: 'Failed to update sale' });
  }
};

export const deleteSale = async (req, res) => {
    const client = await pool.connect();
  
    try {
      await client.query('BEGIN');
      
      const { id } = req.params;
      const numId = Number(id);
      
      if (isNaN(numId)) {
        console.error("❌ Invalid sale ID passed:", id);
        return res.status(400).json({ message: "Invalid sale ID" });
      }
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

}


