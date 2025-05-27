const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const TipoPeruca = sequelize.define('tipo_peruca', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'O nome do tipo de peruca é obrigatório' }
    }
  },
  sigla: {
    type: DataTypes.CHAR(2),
    allowNull: true
  }
});

module.exports = TipoPeruca;