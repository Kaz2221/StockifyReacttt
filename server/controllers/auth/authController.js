import pool from '../../server.js'; // path depends on where the file is
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken"; 
//REGISTER LOGIC
// This function handles user registration by checking if the user already exists and hashing the password before storing it in the database.
export const registerUser = async (req, res) => {
    try{
      const { email, password, phone_number } = req.body;
    
          // Check if user already exists
          const check = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
          if (check.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'User already exists' });
          }
    
          const saltRounds = 10;
          const hashedPassword = await bcrypt.hash(password, saltRounds);
    
          //Insert new user
          await pool.query(
            'INSERT INTO users (email, password, phone_number, created_at) VALUES ($1, $2, $3, NOW())',
            [email, hashedPassword, phone_number]
          );
          res.status(201).json({ success: true, message: 'User registered' });
    
        }catch (err) {
          console.error('Register error:', err);
          res.status(500).json({ success: false, message: 'Server error' });
        }
    };
//LOGIN LOGIC
// This function handles user login by checking the provided credentials against the database.
    export const loginUser = async (req, res) => {
            try{
        
              const {email, password} = req.body;
        
              //Check query for user
              const result  = await pool.query(
                'SELECT * FROM users WHERE email = $1', 
                [email]
              );
        
              //Check if user does not  exists
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
        
              //Generate JWT token
              const token = jwt.sign(
                  { user },// payload
                  process.env.JWT_SECRET,// secret key
                  { expiresIn: "1h" }// token expiration 
                );
                console.log("Generated token:", token);
                
              // 3. If password matches, return user data (excluding password)
              res
              .cookie("token", token, {
                httpOnly: true,       // cannot access in JS (good!)
                secure: false,        // set to true if you're using HTTPS
                sameSite: "Lax",      // prevents CSRF in some contexts
                maxAge: 3600000       // 1 hour
              })
              .json({
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
      };