const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  // Récupérer le token depuis l'en-tête Authorization
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token d\'accès requis',
      errors: ['Aucun token fourni']
    });
  }

  // Vérifier le token
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Erreur de vérification du token:', err);
      
      // Différents types d'erreurs JWT
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expiré',
          errors: ['Votre session a expiré, veuillez vous reconnecter']
        });
      }
      
      if (err.name === 'JsonWebTokenError') {
        return res.status(403).json({
          success: false,
          message: 'Token invalide',
          errors: ['Token malformé ou invalide']
        });
      }
      
      // Autres erreurs JWT
      return res.status(403).json({
        success: false,
        message: 'Token invalide',
        errors: ['Impossible de vérifier le token']
      });
    }

    // Debug: voir ce qui est dans le token
    console.log('Token décodé:', user);

    // Token valide, ajouter les infos utilisateur à la requête
    // Gérer les différentes structures possibles du token
    req.user = {
      id: user.userId || user.id, // Compatibilité avec userId et id
      username: user.username,
      email: user.email,
      role: user.role || 'user'
    };
    
    console.log('req.user défini:', req.user);
    next();
  });
};

// Middleware optionnel - authentification facultative
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // Pas de token, continuer sans utilisateur
    req.user = null;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      // Token invalide, continuer sans utilisateur
      req.user = null;
    } else {
      // Token valide
      req.user = {
        id: user.userId || user.id,
        username: user.username,
        email: user.email,
        role: user.role || 'user'
      };
    }
    next();
  });
};

// Middleware pour vérifier les rôles
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise',
        errors: ['Vous devez être connecté pour accéder à cette ressource']
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes',
        errors: ['Vous n\'avez pas les permissions nécessaires pour cette action']
      });
    }

    next();
  };
};

// Middleware pour vérifier si l'utilisateur est admin
const requireAdmin = requireRole('admin');

// Middleware pour vérifier si l'utilisateur est admin ou modérateur
const requireModerator = requireRole(['admin', 'moderator']);

module.exports = {
  authenticateToken,
  optionalAuth,
  requireRole,
  requireAdmin,
  requireModerator
};