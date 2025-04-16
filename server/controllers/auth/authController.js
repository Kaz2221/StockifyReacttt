import pool from '../../server.js';
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken"; 

export const registerUser = async (req, res) => {
    try{
      const { 
        email, 
        password, 
        phone_number, 
        first_name, 
        last_name, 
        profile_picture 
      } = req.body;
    
      // Check if user already exists
      const check = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (check.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'Utilisateur existe déjà' });
      }
    
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
    
      // Insert new user with additional fields
      const result = await pool.query(
        `INSERT INTO users 
         (email, password, phone_number, first_name, last_name, profile_picture, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
         RETURNING id, email, first_name, last_name, profile_picture`,
        [email, hashedPassword, phone_number, first_name, last_name, profile_picture]
      );
      
      res.status(201).json({ 
        success: true, 
        message: 'Utilisateur enregistré',
        user: result.rows[0]
      });
    
    }catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

export const loginUser = async (req, res) => {
    try{
      const {email, password} = req.body;
    
      // Check query for user
      const result  = await pool.query(
        `SELECT 
          id, email, password, 
          first_name, last_name, 
          profile_picture 
        FROM users 
        WHERE email = $1`, 
        [email]
      );
    
      // Check if user does not exist
      if(result.rows.length === 0){
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }
      
      // Compare plaintext password with hashed password
      const user = result.rows[0];
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: 'Mot de passe incorrect'
        });
      }
    
      // Generate JWT token
      const token = jwt.sign(
        { 
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            profile_picture: user.profile_picture
          }
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      
      // Return user data (excluding password)
      res
      .cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "Lax",
        maxAge: 3600000
      })
      .json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          profile_picture: user.profile_picture
        }
      });
    
    }catch(error){
      console.error('Erreur de connexion:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur'
      });
    }
};