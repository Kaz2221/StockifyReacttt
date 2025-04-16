import pool from '../../server.js';

export const getInventoryCostLast30Days = async (req, res) => {
const userId = req.user.id;

try{
    const query = `
    SELECT \
      TO_CHAR(purchase_date, 'YYYY-MM-DD') AS day,
      SUM(cost)::FLOAT AS total
    FROM items
    WHERE user_id = $1
      AND purchase_date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY day
    ORDER BY day
  `;
    const { rows } = await pool.query(query, [userId]);

    //  Format the data for the chart
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
    console.error('Error fetching sales last 30 days:', err);
    res.status(500).json({ message: 'Server error retrieving sales' });
    }
}