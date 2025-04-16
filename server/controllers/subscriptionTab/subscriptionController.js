import pool from '../../server.js'; // path depends on where the file is


export const getSubscriptions = async (req, res) => {
    try{
        const userId = req.user.id;
        const result = await pool.query(`
            SELECT 
                id,
                name,
                category,
                amount,
                billing_cycle,
                next_billing_date,
                auto_renew,
                notes,
                created_at
                FROM subscriptions
                WHERE user_id = $1
                ORDER BY next_billing_date ASC;
        `,[userId]);
        
        res.json(result.rows);
    }catch(error){
        console.error('Erreur lors de la récupération des abonnements:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
}

export const createSubscription = async (req, res) => {
    const {
      name,
      category,
      amount,
      billing_cycle,
      next_billing_date,
      auto_renew,
      notes
    } = req.body;
    const userId = req.user.id;
  
    try {
      const query = `
        INSERT INTO subscriptions 
        (name, category, amount, billing_cycle, next_billing_date, auto_renew, notes, user_id, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        RETURNING *;
      `;
      const values = [name, category, amount, billing_cycle, next_billing_date, auto_renew, notes, userId];
  
      const { rows } = await pool.query(query, values);
      res.status(201).json(rows[0]);
    } catch (err) {
      console.error("Error creating subscription:", err);
      res.status(500).json({ message: "Erreur serveur" });
    }
  };
  
  export const updateSubscription = async (req, res) => {
    const subId = req.params.id;
    const userId = req.user.id;
    const {
      name,
      category,
      amount,
      billing_cycle,
      next_billing_date,
      auto_renew,
      notes
    } = req.body;
  
    try {
      const query = `
        UPDATE subscriptions
        SET name = $1,
            category = $2,
            amount = $3,
            billing_cycle = $4,
            next_billing_date = $5,
            auto_renew = $6,
            notes = $7
        WHERE id = $8 AND user_id = $9
        RETURNING *;
      `;
      const values = [name, category, amount, billing_cycle, next_billing_date, auto_renew, notes, subId, userId];
  
      const { rows } = await pool.query(query, values);
      if (rows.length === 0) return res.status(404).json({ message: "Subscription not found" });
  
      res.json(rows[0]);
    } catch (err) {
      console.error("Error updating subscription:", err);
      res.status(500).json({ message: "Erreur serveur" });
    }
  };
  

  export const deleteSubscription = async (req, res) => {
    const subId = req.params.id;
    const userId = req.user.id;
  
    try {
      const result = await pool.query(
        `DELETE FROM subscriptions WHERE id = $1 AND user_id = $2 RETURNING *;`,
        [subId, userId]
      );
  
      if (result.rowCount === 0) {
        return res.status(404).json({ message: "Subscription not found" });
      }
  
      res.status(200).json({ message: "Subscription deleted successfully" });
    } catch (err) {
      console.error("Error deleting subscription:", err);
      res.status(500).json({ message: "Erreur serveur" });
    }
  };
  