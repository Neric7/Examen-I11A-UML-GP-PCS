const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  console.log('Headers reçus:', req.headers);
  const authHeader = req.headers.authorization;
  console.log('Authorization header:', authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token manquant ou mal formaté' });
  }

  
  const token = authHeader.split(' ')[1];
  console.log('Token extrait:', token);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token décodé:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('JWT verify error:', err.message);
    return res.status(403).json({ message: 'Token invalide ou expiré' });
  }
};

