const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');

class BlacklistedToken extends Model {
  static async buscarPorToken(token) {
    return await this.findOne({
      where: { token }
    });
  }

  static async limparExpirados() {
    return await this.destroy({
      where: {
        expiresat: {
          [require('sequelize').Op.lt]: new Date()
        }
      }
    });
  }

  static async isTokenBlacklisted(token) {
    const blacklistedToken = await this.buscarPorToken(token);
    return !!blacklistedToken;
  }

  isExpirado() {
    return new Date() > new Date(this.expiresat);
  }
}

BlacklistedToken.init({
  token: {
    type: DataTypes.TEXT,
    allowNull: false,
    unique: true
  },
  expiresat: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'blacklisted_tokens'
});

module.exports = BlacklistedToken;