const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Cor = require('./corModel');

const Cabelo = sequelize.define('cabelo', {
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
});

Cabelo.belongsTo(Cor, { foreignKey: 'cor_id' });
Cor.hasMany(Cabelo, { foreignKey: 'cor_id' });

module.exports = Cabelo;