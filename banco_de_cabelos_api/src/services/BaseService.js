const { ApiError } = require('../utils/errorHandler');
const { Validators } = require('../utils/validators');

class BaseService {
  constructor(model) {
    this.model = model;
  }

  async findById(id, options = {}) {
    if (!Validators.PATTERNS.ONLY_NUMBERS.test(id.toString())) {
      throw new ApiError('ID inválido', 400);
    }
    
    const entity = await this.model.findByPk(id, options);
    if (!entity) {
      throw new ApiError('Registro não encontrado', 404);
    }
    
    return entity;
  }

  async findAll(options = {}) {
    return await this.model.findAndCountAll(options);
  }

  async create(data, options = {}) {
    return await this.model.create(data, options);
  }

  async update(id, data, options = {}) {
    const entity = await this.findById(id);
    return await entity.update(data, options);
  }

  async delete(id, options = {}) {
    const entity = await this.findById(id);
    return await entity.destroy(options);
  }

  validateData(data, rules) {
    for (const [field, validator] of Object.entries(rules)) {
      if (typeof validator === 'function' && !validator(data[field])) {
        throw new ApiError(`${field} inválido`, 400);
      }
    }
  }

  sanitizeData(data, fields) {
    const sanitized = { ...data };
    
    for (const field of fields) {
      if (sanitized[field] && typeof sanitized[field] === 'string') {
        sanitized[field] = Validators.sanitizeInput(sanitized[field], { removeExtraSpaces: true });
      }
    }
    
    return sanitized;
  }

  async executeInTransaction(callback) {
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
}

module.exports = BaseService;