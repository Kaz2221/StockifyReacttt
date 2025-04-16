// server.js

import cookieParser from 'cookie-parser';
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import pkg from "pg";
import env from "dotenv";

//ROUTES IMPORTING
import authRoutes from "./routes/auth.js"
import inventoryRoutes from "./routes/inventory.js"
import expensesRoutes from "./routes/expenses.js"
import salesRoutes from "./routes/sales.js"
import salesItemsRoutes from "./routes/salesItems.js"
import dashboardRoutes from "./routes/dashboard/index.js"
import subscriptionsRoutes from "./routes/subscription.js"
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
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api', dashboardRoutes);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// Démarrer le serveur
app.listen(port, () => {
  console.log(`Serveur démarré sur le port ${port}`);
});