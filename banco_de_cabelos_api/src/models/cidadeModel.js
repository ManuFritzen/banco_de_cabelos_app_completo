const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');
const Estado = require('./estadoModel');

class Cidade extends Model {
  static async buscarPorEstado(estadoId, options = {}) {
    return await this.findAll({
      where: { estado_id: estadoId },
      order: [['nome', 'ASC']],
      ...options
    });
  }

  static async buscarPorNome(nome, options = {}) {
    return await this.findAll({
      where: {
        nome: {
          [require('sequelize').Op.iLike]: `%${nome}%`
        }
      },
      ...options
    });
  }

  async getEstado() {
    if (!this.Estado) {
      return await Estado.findByPk(this.estado_id);
    }
    return this.Estado;
  }

  toString() {
    return this.nome;
  }
}

Cidade.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  estado_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'estado',
      key: 'id'
    },
    validate: {
      notNull: { msg: 'O ID do estado é obrigatório' }
    }
  },
  nome: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'O nome da cidade é obrigatório' }
    }
  },
  sigla: {
    type: DataTypes.CHAR(2),
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'cidade'
});

Cidade.belongsTo(Estado, { foreignKey: 'estado_id' });
Estado.hasMany(Cidade, { foreignKey: 'estado_id' });

module.exports = Cidade;