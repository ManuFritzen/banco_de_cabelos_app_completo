const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const BlacklistedToken = sequelize.define('blacklisted_tokens', {
  token: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true
  },
  expiresat: {
    type: DataTypes.DATE,
    allowNull: false
  }
});

module.exports = BlacklistedToken;