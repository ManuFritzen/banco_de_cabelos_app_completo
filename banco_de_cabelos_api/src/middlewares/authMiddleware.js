const jwt = require('jsonwebtoken');
const { BlacklistedToken } = require('../models'); 
const BaseMiddleware = require('./BaseMiddleware');
require('dotenv').config();

class AuthMiddleware extends BaseMiddleware {
  static TIPO_ADMIN = 'A';
  static LOGOUT_PATH = '/logout';
  
  static async isTokenBlacklisted(token) {
    const tokenInvalidado = await BlacklistedToken.findOne({ where: { token } });
    return !!tokenInvalidado;
  }
  
  static verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
  }
  
  static isLogoutRoute(path) {
    return path.endsWith(AuthMiddleware.LOGOUT_PATH);
  }
  
  static handleTokenError(error, req, res, next) {
    if (AuthMiddleware.isLogoutRoute(req.path)) {
      return next();
    }
    
    if (error.name === 'TokenExpiredError') {
      return AuthMiddleware.sendError(res, 401, 'Token expirado');
    }
    
    return AuthMiddleware.sendError(res, 401, 'Token inválido');
  }
}

const auth = async (req, res, next) => {
  try {
    const token = AuthMiddleware.extractTokenFromRequest(req);
    
    if (!token) {
      return AuthMiddleware.sendError(res, 401, 'Token de acesso não fornecido');
    }
    
    req.token = token;

    const isBlacklisted = await AuthMiddleware.isTokenBlacklisted(token);
    if (isBlacklisted) {
      return AuthMiddleware.sendError(res, 401, 'Token invalidado, faça login novamente');
    }

    try {
      const decoded = AuthMiddleware.verifyToken(token);
      req.usuario = decoded;
      req.userId = decoded.id;
      next();
    } catch (error) {
      return AuthMiddleware.handleTokenError(error, req, res, next);
    }
  } catch (error) {
    AuthMiddleware.logError('autenticação', error);
    return AuthMiddleware.sendError(res, 500, 'Erro interno do servidor');
  }
};

const authOptional = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    req.token = token;

    const isBlacklisted = await AuthMiddleware.isTokenBlacklisted(token);
    if (isBlacklisted) {
      return next();
    }

    try {
      const decoded = AuthMiddleware.verifyToken(token);
      req.usuario = decoded;
    } catch (error) {
    }
    
    next();
  } catch (error) {
    AuthMiddleware.logError('autenticação opcional', error);
    next();
  }
};

const verificarTipo = (tipos) => {
  return (req, res, next) => {
    if (AuthMiddleware.isLogoutRoute(req.path) && !req.usuario) {
      return next();
    }
    
    if (req.usuario && req.usuario.tipo === AuthMiddleware.TIPO_ADMIN) {
      return next();
    }
    
    if (!req.usuario || !tipos.includes(req.usuario.tipo)) {
      return AuthMiddleware.sendError(
        res, 
        403, 
        'Acesso negado. Tipo de usuário não autorizado para esta operação'
      );
    }
    
    next();
  };
};

module.exports = {
  auth,
  authOptional,
  verificarTipo,
  AuthMiddleware
};