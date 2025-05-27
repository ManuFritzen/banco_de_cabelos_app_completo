const path = require('path');
const fs = require('fs');

class BaseMiddleware {
  static UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
  static MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; 
  static ALLOWED_IMAGE_TYPES = /jpeg|jpg|png|gif/;
  static ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'application/pdf'
  ];

  static sendError(res, statusCode, message, error = true) {
    return res.status(statusCode).json({
      error,
      message
    });
  }

  static sendSuccess(res, data = null, message = null, statusCode = 200) {
    const response = { success: true };
    
    if (message) response.message = message;
    if (data !== null) response.data = data;
    
    return res.status(statusCode).json(response);
  }

  static async ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  static extractTokenFromRequest(req) {
    let token = null;
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } 
    else if (req.query.token) {
      token = req.query.token;
    }
    
    return token;
  }

  static generateUniqueFilename(originalName = '', prefix = '', suffix = '') {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension).replace(/\s+/g, '_');
    
    return `${prefix}${prefix ? '_' : ''}${baseName}_${timestamp}_${random}${suffix}${extension}`;
  }

  static validateImageFile(file) {
    const extname = BaseMiddleware.ALLOWED_IMAGE_TYPES.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = BaseMiddleware.ALLOWED_IMAGE_TYPES.test(file.mimetype);
    
    return mimetype && extname;
  }

  static validateFileType(file, allowedMimes = BaseMiddleware.ALLOWED_MIME_TYPES) {
    return allowedMimes.includes(file.mimetype);
  }

  static logError(context, error) {
    console.error(`Erro no middleware ${context}:`, error);
  }

  static createErrorHandler(context) {
    return (error, req, res, next) => {
      BaseMiddleware.logError(context, error);
      
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return BaseMiddleware.sendError(res, 400, 'Arquivo muito grande. Máximo permitido: 5MB');
        }
        return BaseMiddleware.sendError(res, 400, error.message);
      }
      
      return BaseMiddleware.sendError(res, 500, 'Erro interno do servidor');
    };
  }
}

module.exports = BaseMiddleware;