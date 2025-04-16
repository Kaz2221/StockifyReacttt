import pool from '../../server.js';

export const getInventoryCostLast30Days = async (req, res) => {
const userId = req.user.id;

try{
    const query = `
    WITH date_series AS (
      SELECT generate_series(
        CURRENT_DATE - INTERVAL '29 days', 
        CURRENT_DATE, 
        '1 day'::interval
      ) AS day
    )
    SELECT 
      TO_CHAR(date_series.day, 'YYYY-MM-DD') AS day,
      COALESCE((
        SELECT SUM(cost * qty) 
        FROM items 
        WHERE user_id = $1 
        AND purchase_date::date <= date_series.day
      ), 0)::FLOAT AS total
    FROM date_series
    ORDER BY day
  `;
    const { rows } = await pool.query(query, [userId]);

    // Ensure we have data for all 30 days
    const today = new Date();
    const days = Array.from({length: 30}, (_,i) =>{
        const d = new Date(today);
        d.setDate(today.getDate() - (29 - i));
        return d.toISOString().split('T')[0]; // 'YYYY-MM-DD'
    });

    const inventoryMap = new Map(rows.map(r => [r.day, r.total]));

    const chartData = days.map(day => ({
        day,
        total: inventoryMap.get(day) || 0
    }));

    res.json(chartData);

    }catch(err){
    console.error('Error fetching inventory cost:', err);
    res.status(500).json({ message: 'Server error retrieving inventory cost' });
    }
}