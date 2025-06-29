const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');

class Estado extends Model {
  static async buscarPorSigla(sigla) {
    return await this.findOne({
      where: { sigla: sigla.toUpperCase() }
    });
  }

  static async listarTodos() {
    return await this.findAll({
      order: [['nome', 'ASC']]
    });
  }

  toString() {
    return `${this.nome} (${this.sigla})`;
  }
}

Estado.init({
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
}, {
  sequelize,
  modelName: 'estado'
});

module.exports = Estado;