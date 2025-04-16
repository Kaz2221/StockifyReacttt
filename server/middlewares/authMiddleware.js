import jwt from 'jsonwebtoken';
//Verify token middleware
// This middleware checks if the user is authenticated by verifying the JWT token.
export const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "No token" });
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("🔐 Token decoded:", decoded); // DEBUG 
      req.user = decoded.user;
      next();
    } catch (err) {
      console.error("❌ Invalid token:", err.message);
      return res.status(401).json({ message: "Invalid token" });
    }
  };