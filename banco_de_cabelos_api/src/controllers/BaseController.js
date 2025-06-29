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

  sendError(res, error, statusCode = 500) {
    const response = {
      success: false,
      message: error.message || 'Erro interno do servidor'
    };
    
    if (process.env.NODE_ENV === 'development') {
      response.stack = error.stack;
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

  async executeWithTransaction(callback, options = {}) {
    const { sequelize } = require('../models');
    const transaction = await sequelize.transaction();
    try {
      const result = await callback(transaction);
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findByIdOrThrow(Model, id, options = {}) {
    const validatedId = this.validateNumericId(id, options.fieldName || 'ID');
    const entity = await Model.findByPk(validatedId, options.include ? { include: options.include } : {});
    
    if (!entity) {
      throw new ApiError(options.notFoundMessage || 'Registro não encontrado', 404);
    }
    
    return entity;
  }

  buildIncludeOptions(includes = []) {
    return includes.length > 0 ? { include: includes } : {};
  }

  handleControllerError(error, res) {
    if (error instanceof ApiError) {
      return this.sendError(res, error, error.statusCode);
    }
    
    const handledError = handleSequelizeError(error);
    return this.sendError(res, handledError, handledError.statusCode || 500);
  }
}

module.exports = BaseController;