const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');

class TipoPeruca extends Model {
  static async buscarPorNome(nome) {
    return await this.findOne({
      where: { nome }
    });
  }

  static async buscarPorSigla(sigla) {
    return await this.findOne({
      where: { sigla }
    });
  }

  static async listarTodos() {
    return await this.findAll({
      order: [['nome', 'ASC']]
    });
  }

  getDisplayName() {
    return this.sigla ? `${this.nome} (${this.sigla})` : this.nome;
  }

  toString() {
    return this.nome;
  }
}

TipoPeruca.init({
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
}, {
  sequelize,
  modelName: 'tipo_peruca'
});

module.exports = TipoPeruca;