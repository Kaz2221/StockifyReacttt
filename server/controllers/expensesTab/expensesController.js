import pool from '../../server.js'; // path depends on where the file is

export const getExpenses = async (req, res) => {
    try {
      const userId = req.user.id;
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
          WHERE user_id = $1
          ORDER BY expense_date DESC
        `,[userId]);
        
        res.json(result.rows);
      } catch (error) {
        console.error('Erreur lors de la récupération des dépenses:', error);
        res.status(500).json({ message: 'Erreur serveur' });
      }
}

export const addExpense = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, category, amount, expense_date, recurring, recurring_period, notes } = req.body;
        
        const result = await pool.query(
          `INSERT INTO expenses 
           (name, category, amount, expense_date, recurring, recurring_period, notes, created_at,user_id) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP,$8) 
           RETURNING *`,
          [name, category, amount, expense_date, recurring, recurring_period, notes, userId]
        );
        
        res.status(201).json(result.rows[0]);
      } catch (error) {
        console.error('Erreur lors de l\'ajout d\'une dépense:', error);
        res.status(500).json({ message: 'Erreur serveur' });
      }
      
}

export const updateExpense = async (req, res) => {
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
}

export const deleteExpense = async (req, res) => {  
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
}