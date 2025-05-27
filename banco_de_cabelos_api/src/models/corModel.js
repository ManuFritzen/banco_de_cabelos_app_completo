const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Cor = sequelize.define('cor', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'O nome da cor é obrigatório' }
    }
  }
});

module.exports = Cor;