const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');

class StatusSolicitacao extends Model {
  static async buscarPorNome(nome) {
    return await this.findOne({
      where: { nome }
    });
  }

  static async listarTodos() {
    return await this.findAll({
      order: [['id', 'ASC']]
    });
  }

  static async buscarPendente() {
    return await this.buscarPorNome('Pendente');
  }

  static async buscarEmAnalise() {
    return await this.buscarPorNome('Em análise');
  }

  static async buscarAprovada() {
    return await this.buscarPorNome('Aprovada');
  }

  static async buscarRecusada() {
    return await this.buscarPorNome('Recusada');
  }

  isPendente() {
    return this.nome === 'Pendente';
  }

  isEmAnalise() {
    return this.nome === 'Em análise';
  }

  isAprovada() {
    return this.nome === 'Aprovada';
  }

  isRecusada() {
    return this.nome === 'Recusada';
  }

  isFinal() {
    return this.isAprovada() || this.isRecusada();
  }

  getCorStatus() {
    const cores = {
      'Pendente': '#FFA500',
      'Em análise': '#007BFF',
      'Aprovada': '#28A745',
      'Recusada': '#DC3545'
    };
    return cores[this.nome] || '#6C757D';
  }
}

StatusSolicitacao.init({
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
}, {
  sequelize,
  modelName: 'status_solicitacao'
});

module.exports = StatusSolicitacao;