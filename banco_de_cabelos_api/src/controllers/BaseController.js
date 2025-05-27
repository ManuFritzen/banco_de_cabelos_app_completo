const { handleSequelizeError, ApiError } = require('../utils/errorHandler');
const { Validators } = require('../utils/validators');

class BaseController {
  sendSuccess(res, data, message = null, statusCode = 200) {
    const response = {
      success: true,
      ...data
    };
    
    if (message) {
      response.message = message;
    }
    
    return res.status(statusCode).json(response);
  }

  sendPaginatedResponse(res, result, page, limit) {
    return this.sendSuccess(res, {
      count: result.count,
      totalPages: Math.ceil(result.count / limit),
      currentPage: page,
      data: result.rows
    });
  }

  sanitizeUser(user) {
    if (!user) return null;
    
    const sanitized = { ...user };
    delete sanitized.senha;
    return sanitized;
  }

  async removeUploadedFile(filePath) {
    const fs = require('fs');
    try {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Erro ao remover arquivo:', error);
    }
  }

  getPaginationParams(req) {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    
    if (page < 1) {
      page = 1;
    }
    
    if (limit < 1) {
      limit = 10;
    } else if (limit > 100) {
      limit = 100; 
    }
    
    const offset = (page - 1) * limit;
    
    return { page, limit, offset };
  }

  checkPermission(userId, resourceOwnerId, userType = null, allowedTypes = []) {
    if (userType && !Validators.isValidUserType(userType)) {
      return false;
    }
    
    if (userType === 'A') return true;
    
    if (userId === resourceOwnerId) return true;
    
    if (allowedTypes.length > 0 && allowedTypes.includes(userType)) return true;
    
    return false;
  }

  handleError(error) {
    return handleSequelizeError(error);
  }

  validateNumericId(id, fieldName = 'ID') {
    if (!id || !Validators.PATTERNS.ONLY_NUMBERS.test(id.toString())) {
      throw new ApiError(`${fieldName} inválido`, 400);
    }
    return parseInt(id);
  }

  sanitizeInput(input, options = {}) {
    return Validators.sanitizeInput(input, options);
  }

  validateAndSanitizeUserData(userData) {
    const validation = Validators.validateUserData(userData);
    if (!validation.isValid) {
      const errorMessages = Object.entries(validation.errors)
        .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
        .join('; ');
      throw new ApiError(errorMessages, 400);
    }
    
    if (userData.nome) {
      userData.nome = this.sanitizeInput(userData.nome, { removeExtraSpaces: true });
    }
    if (userData.email) {
      userData.email = this.sanitizeInput(userData.email, { toLowerCase: true });
    }
    
    return userData;
  }
}

module.exports = BaseController;