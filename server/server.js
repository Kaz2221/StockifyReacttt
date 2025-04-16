// server.js
import cookieParser from 'cookie-parser';
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import multer from 'multer';
import path from 'path';
import pkg from "pg";
import env from "dotenv";

// Import routes
import authRoutes from "./routes/auth.js"
import inventoryRoutes from "./routes/inventory.js"
import expensesRoutes from "./routes/expenses.js"
import salesRoutes from "./routes/sales.js"
import salesItemsRoutes from "./routes/salesItems.js"
import dashboardRoutes from "./routes/dashboard/index.js"

env.config();
const { Pool } = pkg;

// PostgreSQL Configuration
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

// Multer configuration for profile picture uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profile-pictures/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Images only!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: fileFilter
});

// CORS configuration
app.use(cors({
  origin: "http://localhost:3000", // React frontend during dev
  credentials: true // allow cookies to be sent/received
}));

// Middleware configurations
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(bodyParser.json({ limit: '10mb' }));

// Serve static files for uploaded images
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Profile picture upload route
app.post('/api/upload-profile-picture', upload.single('profilePicture'), (req, res) => {
  if (req.file) {
    res.json({ 
      message: 'Image téléchargée avec succès', 
      filePath: req.file.path.replace(/\\/g, '/') // Normalize path for all OS
    });
  } else {
    res.status(400).json({ message: 'Aucune image téléchargée' });
  }
});

// Error handling middleware for Multer
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading.
    return res.status(400).json({ 
      message: err.message || 'Erreur lors du téléchargement du fichier' 
    });
  } else if (err) {
    // An unknown error occurred when uploading.
    return res.status(500).json({ 
      message: err.message || 'Une erreur est survenue' 
    });
  }
  next();
});

// Routes
app.use('/api', authRoutes);
app.use('/api/items', inventoryRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/sales', salesRoutes); 
app.use('/api/sale_items', salesItemsRoutes);
app.use('/api', dashboardRoutes);

// Start the server
const port = 5000;
app.listen(port, () => {
  console.log(`Serveur démarré sur le port ${port}`);
});