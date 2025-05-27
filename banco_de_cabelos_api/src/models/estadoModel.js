const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Estado = sequelize.define('estado', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'O nome do estado é obrigatório' }
    }
  },
  sigla: {
    type: DataTypes.CHAR(2),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'A sigla do estado é obrigatória' },
      len: {
        args: [2, 2],
        msg: 'A sigla deve ter exatamente 2 caracteres'
      }
    }
  }
});

module.exports = Estado;