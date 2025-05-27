const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Estado = require('./estadoModel');

const Cidade = sequelize.define('cidade', {
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
});

Cidade.belongsTo(Estado, { foreignKey: 'estado_id' });
Estado.hasMany(Cidade, { foreignKey: 'estado_id' });

module.exports = Cidade;