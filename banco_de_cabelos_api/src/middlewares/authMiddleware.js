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
    console.log('=== AUTH MIDDLEWARE ===');
    console.log('Path:', req.path);
    console.log('Method:', req.method);
    
    const token = AuthMiddleware.extractTokenFromRequest(req);
    
    if (!token) {
      console.log('Token não fornecido');
      return AuthMiddleware.sendError(res, 401, 'Token de acesso não fornecido');
    }
    
    req.token = token;

    const isBlacklisted = await AuthMiddleware.isTokenBlacklisted(token);
    if (isBlacklisted) {
      console.log('Token está na blacklist');
      return AuthMiddleware.sendError(res, 401, 'Token invalidado, faça login novamente');
    }

    try {
      const decoded = AuthMiddleware.verifyToken(token);
      req.usuario = decoded;
      req.userId = decoded.id;
      console.log('Usuário autenticado:', { id: decoded.id, tipo: decoded.tipo });
      next();
    } catch (error) {
      console.log('Erro ao verificar token:', error.message);
      return AuthMiddleware.handleTokenError(error, req, res, next);
    }
  } catch (error) {
    console.log('Erro geral na autenticação:', error.message);
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
    console.log('=== VERIFICAR TIPO ===');
    console.log('Tipos permitidos:', tipos);
    console.log('Usuário:', req.usuario);
    
    if (AuthMiddleware.isLogoutRoute(req.path) && !req.usuario) {
      return next();
    }
    
    if (req.usuario && req.usuario.tipo === AuthMiddleware.TIPO_ADMIN) {
      console.log('Usuário é admin, permitindo acesso');
      return next();
    }
    
    if (!req.usuario || !tipos.includes(req.usuario.tipo)) {
      console.log('Acesso negado para tipo:', req.usuario?.tipo);
      return AuthMiddleware.sendError(
        res, 
        403, 
        'Acesso negado. Tipo de usuário não autorizado para esta operação'
      );
    }
    
    console.log('Tipo verificado com sucesso');
    next();
  };
};

module.exports = {
  auth,
  authOptional,
  verificarTipo,
  AuthMiddleware
};