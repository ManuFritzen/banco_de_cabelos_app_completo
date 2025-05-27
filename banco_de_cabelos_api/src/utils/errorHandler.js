const BaseUtil = require('./BaseUtil');

class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
  
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
  
const formatValidationErrors = (errors) => {
  if (!Array.isArray(errors)) {
    throw new Error('Parâmetro errors deve ser um array');
  }
  
  const formattedErrors = {};
  
  errors.forEach((error) => {
    if (error.path && error.msg) {
      formattedErrors[error.path] = error.msg;
    }
  });
  
  return {
    error: true,
    message: 'Erro de validação',
    errors: formattedErrors
  };
};
  
class ErrorHandler extends BaseUtil {
  // Constantes para tipos de erro
  static ERROR_TYPES = {
    DATABASE: 'SequelizeDatabaseError',
    VALIDATION: 'SequelizeValidationError',
    UNIQUE_CONSTRAINT: 'SequelizeUniqueConstraintError',
    FOREIGN_KEY: 'SequelizeForeignKeyConstraintError',
    CONNECTION: 'SequelizeConnectionError'
  };

  static FIELD_ERROR_MESSAGES = {
    cpf: {
      invalid: 'CPF inválido. Deve conter 11 dígitos numéricos.',
      duplicate: 'Este CPF já está cadastrado no sistema.',
      trigger: 'CPF inválido. Por favor, verifique se o número está correto.'
    },
    cnpj: {
      invalid: 'CNPJ inválido. Deve conter 14 dígitos numéricos.',
      duplicate: 'Este CNPJ já está cadastrado no sistema.',
      trigger: 'CNPJ inválido. Por favor, verifique se o número está correto.'
    },
    email: {
      invalid: 'E-mail inválido. Por favor, verifique o formato.',
      duplicate: 'Este e-mail já está cadastrado no sistema.'
    },
    telefone: {
      duplicate: 'Este telefone já está cadastrado no sistema.'
    }
  };

  static logSequelizeError(error) {
    const additionalInfo = {};
    
    if (error.errors) {
      additionalInfo.validationErrors = error.errors.map((err, index) => ({
        index: index + 1,
        field: err.path,
        message: err.message
      }));
    }
    
    if (error.fields) {
      additionalInfo.problemFields = error.fields;
    }
    
    ErrorHandler.logError('Sequelize', error, additionalInfo);
  }

  static handleDatabaseError(error) {
    if (error.message.includes('CPF inválido')) {
      return { message: ErrorHandler.FIELD_ERROR_MESSAGES.cpf.trigger, statusCode: 400 };
    }
    
    if (error.message.includes('CNPJ inválido')) {
      return { message: ErrorHandler.FIELD_ERROR_MESSAGES.cnpj.trigger, statusCode: 400 };
    }
    
    return {
      message: 'Erro ao processar dados no servidor. Por favor, verifique as informações e tente novamente.',
      statusCode: 400
    };
  }

  static handleValidationError(error) {
    const firstError = error.errors?.[0];
    
    if (!firstError) {
      return { message: 'Erro de validação nos dados', statusCode: 400 };
    }

    const { path, validatorKey } = firstError;
    const fieldMessages = ErrorHandler.FIELD_ERROR_MESSAGES[path];
    
    if (fieldMessages) {
      if (validatorKey === 'is') {
        return { message: fieldMessages.invalid, statusCode: 400 };
      }
      
      if (validatorKey === 'not_unique') {
        return { message: fieldMessages.duplicate, statusCode: 400 };
      }
    }
    
    if (validatorKey === 'isEmail') {
      return { message: ErrorHandler.FIELD_ERROR_MESSAGES.email.invalid, statusCode: 400 };
    }
    
    if (validatorKey === 'not_unique') {
      return { message: `O campo ${path} já está em uso.`, statusCode: 400 };
    }
    
    return { message: firstError.message || 'Erro de validação nos dados', statusCode: 400 };
  }

  static getErrorResponse(errorType, error) {
    switch (errorType) {
      case ErrorHandler.ERROR_TYPES.DATABASE:
        return ErrorHandler.handleDatabaseError(error);
      
      case ErrorHandler.ERROR_TYPES.VALIDATION:
      case ErrorHandler.ERROR_TYPES.UNIQUE_CONSTRAINT:
        return ErrorHandler.handleValidationError(error);
      
      case ErrorHandler.ERROR_TYPES.FOREIGN_KEY:
        return {
          message: 'Erro de referência: o objeto referenciado não existe',
          statusCode: 400
        };
      
      case ErrorHandler.ERROR_TYPES.CONNECTION:
        return {
          message: 'Erro de conexão com o banco de dados',
          statusCode: 503
        };
      
      default:
        return {
          message: 'Erro no banco de dados',
          statusCode: 500
        };
    }
  }
}

const handleSequelizeError = (error) => {
  ErrorHandler.logSequelizeError(error);
  
  const { message, statusCode } = ErrorHandler.getErrorResponse(error.name, error);
  return new ApiError(message, statusCode);
};
  
module.exports = {
  ApiError,
  asyncHandler,
  formatValidationErrors,
  handleSequelizeError,
  ErrorHandler
};