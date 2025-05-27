class BaseUtil {
  static BRASIL_TIMEZONE = 'America/Sao_Paulo';
  static BRASIL_LOCALE = 'pt-BR';
  static DEFAULT_DATE_FORMAT = { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  };
  static DEFAULT_DATETIME_FORMAT = { 
    ...BaseUtil.DEFAULT_DATE_FORMAT,
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  };

  static isValidDate(date) {
    return date instanceof Date && !isNaN(date);
  }

  static normalizeDate(date) {
    if (!date) return null;
    
    const dateObj = new Date(date);
    return BaseUtil.isValidDate(dateObj) ? dateObj : null;
  }

  static createBrasilDate(date) {
    const now = date ? new Date(date) : new Date();
    const brasilDateStr = now.toLocaleString(BaseUtil.BRASIL_LOCALE, { 
      timeZone: BaseUtil.BRASIL_TIMEZONE 
    });
    return new Date(brasilDateStr);
  }

  static formatDate(date, options = {}) {
    const dateObj = BaseUtil.normalizeDate(date);
    if (!dateObj) return '';
    
    const formatOptions = {
      timeZone: BaseUtil.BRASIL_TIMEZONE,
      ...options
    };
    
    return dateObj.toLocaleString(BaseUtil.BRASIL_LOCALE, formatOptions);
  }

  static resetTimeToMidnight(date) {
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);
    return dateObj;
  }

  static logError(context, error, additionalInfo = {}) {
    console.error(`======= ERRO EM ${context.toUpperCase()} =======`);
    console.error('Nome do erro:', error.name);
    console.error('Mensagem:', error.message);
    
    if (additionalInfo && Object.keys(additionalInfo).length > 0) {
      console.error('Informações adicionais:', additionalInfo);
    }
    
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    
    console.error('======= FIM DO ERRO =======');
  }

  static validateRequired(value, fieldName) {
    if (value === null || value === undefined || value === '') {
      throw new Error(`${fieldName} é obrigatório`);
    }
    return true;
  }

  static validateType(value, expectedType, fieldName) {
    if (typeof value !== expectedType) {
      throw new Error(`${fieldName} deve ser do tipo ${expectedType}`);
    }
    return true;
  }

  static sanitizeObject(obj, fieldsToRemove = []) {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sanitized = { ...obj };
    fieldsToRemove.forEach(field => {
      delete sanitized[field];
    });
    
    return sanitized;
  }

  static isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }

  static deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (Array.isArray(obj)) return obj.map(item => BaseUtil.deepClone(item));
    
    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = BaseUtil.deepClone(obj[key]);
      }
    }
    return cloned;
  }
}

module.exports = BaseUtil;