const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const StatusSolicitacao = sequelize.define('status_solicitacao', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'O nome do status é obrigatório' }
    }
  }
});

module.exports = StatusSolicitacao;