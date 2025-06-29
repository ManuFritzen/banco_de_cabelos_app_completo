const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');

class Cor extends Model {
  static async buscarPorNome(nome) {
    return await this.findOne({
      where: { nome }
    });
  }

  static async listarTodas() {
    return await this.findAll({
      order: [['nome', 'ASC']]
    });
  }

  toString() {
    return this.nome;
  }
}

Cor.init({
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
}, {
  sequelize,
  modelName: 'cor'
});

module.exports = Cor;