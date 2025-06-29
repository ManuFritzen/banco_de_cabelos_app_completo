const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');
const Cor = require('./corModel');

class Cabelo extends Model {
  static async buscarPorCor(corId, options = {}) {
    return await this.findAll({
      where: { cor_id: corId },
      ...options
    });
  }

  static async buscarPorComprimento(minComprimento, maxComprimento = null, options = {}) {
    const where = {
      comprimento: {
        [require('sequelize').Op.gte]: minComprimento
      }
    };
    
    if (maxComprimento) {
      where.comprimento[require('sequelize').Op.lte] = maxComprimento;
    }
    
    return await this.findAll({
      where,
      ...options
    });
  }

  static async buscarPorPeso(minPeso, maxPeso = null, options = {}) {
    const where = {
      peso: {
        [require('sequelize').Op.gte]: minPeso
      }
    };
    
    if (maxPeso) {
      where.peso[require('sequelize').Op.lte] = maxPeso;
    }
    
    return await this.findAll({
      where,
      ...options
    });
  }

  async getCor() {
    if (!this.Cor && this.cor_id) {
      return await Cor.findByPk(this.cor_id);
    }
    return this.Cor;
  }

  temFoto() {
    return this.foto && this.foto.length > 0;
  }

  isValido() {
    return (this.peso && this.peso > 0) || (this.comprimento && this.comprimento > 0);
  }

  getDescricao() {
    let descricao = 'Cabelo';
    
    if (this.comprimento) {
      descricao += ` ${this.comprimento}cm`;
    }
    
    if (this.peso) {
      descricao += ` (${this.peso}g)`;
    }
    
    return descricao;
  }
}

Cabelo.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  peso: {
    type: DataTypes.REAL,
    allowNull: true,
    validate: {
      isFloat: { msg: 'O peso deve ser um número' },
      min: {
        args: [0],
        msg: 'O peso deve ser maior que zero'
      }
    }
  },
  comprimento: {
    type: DataTypes.REAL,
    allowNull: true,
    validate: {
      isFloat: { msg: 'O comprimento deve ser um número' },
      min: {
        args: [0],
        msg: 'O comprimento deve ser maior que zero'
      }
    }
  },
  foto: {
    type: DataTypes.BLOB,
    allowNull: true
  },
  cor_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'cor',
      key: 'id'
    }
  }
}, {
  sequelize,
  modelName: 'cabelo'
});

Cabelo.belongsTo(Cor, { foreignKey: 'cor_id' });
Cor.hasMany(Cabelo, { foreignKey: 'cor_id' });

module.exports = Cabelo;