const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');
const StatusSolicitacao = require('./statusSolicitacaoModel');
const Usuario = require('./usuarioModel');

class Solicitacao extends Model {
  static async buscarPorUsuario(usuarioId, options = {}) {
    return await this.findAll({
      where: { pessoa_fisica_id: usuarioId },
      ...options
    });
  }

  static async buscarPorStatus(statusId, options = {}) {
    return await this.findAll({
      where: { status_solicitacao_id: statusId },
      ...options
    });
  }

  static async contarPorUsuario(usuarioId) {
    return await this.count({
      where: { pessoa_fisica_id: usuarioId }
    });
  }

  static async contarPorStatus(statusId) {
    return await this.count({
      where: { status_solicitacao_id: statusId }
    });
  }

  isPendente() {
    return this.status_solicitacao_id === 1;
  }

  isEmAnalise() {
    return this.status_solicitacao_id === 2;
  }

  isAprovada() {
    return this.status_solicitacao_id === 3;
  }

  isRecusada() {
    return this.status_solicitacao_id === 4;
  }

  podeSerExcluida() {
    return this.status_solicitacao_id <= 2; // Apenas pendente ou em análise
  }

  async pertenceAUsuario(usuarioId) {
    return this.pessoa_fisica_id === parseInt(usuarioId);
  }

  async getPessoaFisica() {
    if (!this.PessoaFisica) {
      return await Usuario.findByPk(this.pessoa_fisica_id);
    }
    return this.PessoaFisica;
  }

  async getStatus() {
    if (!this.StatusSolicitacao) {
      return await StatusSolicitacao.findByPk(this.status_solicitacao_id);
    }
    return this.StatusSolicitacao;
  }

  temLaudoMedico() {
    return this.foto_laudo_medico && this.foto_laudo_medico.length > 0;
  }
}

Solicitacao.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  status_solicitacao_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'status_solicitacao',
      key: 'id'
    },
    validate: {
      notNull: { msg: 'O status da solicitação é obrigatório' }
    }
  },
  pessoa_fisica_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuario',
      key: 'id'
    },
    validate: {
      notNull: { msg: 'O usuário solicitante é obrigatório' }
    }
  },
  data_hora: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  foto_laudo_medico: {
    type: DataTypes.BLOB,
    allowNull: false,
    validate: {
      notNull: { msg: 'O laudo médico é obrigatório' }
    }
  },
  observacao: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'solicitacao',
  hooks: {
    beforeCreate: async (solicitacao) => {
      if (solicitacao.pessoa_fisica_id) {
        const usuario = await Usuario.findByPk(solicitacao.pessoa_fisica_id);
        if (!usuario || usuario.tipo !== 'F') {
          throw new Error('A solicitação deve estar associada a uma pessoa física (usuário tipo F)');
        }
      }
    },
    beforeUpdate: async (solicitacao) => {
      if (solicitacao.changed('pessoa_fisica_id')) {
        const usuario = await Usuario.findByPk(solicitacao.pessoa_fisica_id);
        if (!usuario || usuario.tipo !== 'F') {
          throw new Error('A solicitação deve estar associada a uma pessoa física (usuário tipo F)');
        }
      }
    }
  }
});

Solicitacao.belongsTo(StatusSolicitacao, { foreignKey: 'status_solicitacao_id' });
StatusSolicitacao.hasMany(Solicitacao, { foreignKey: 'status_solicitacao_id' });

Solicitacao.belongsTo(Usuario, { as: 'PessoaFisica', foreignKey: 'pessoa_fisica_id' });
Usuario.hasMany(Solicitacao, { foreignKey: 'pessoa_fisica_id' });

module.exports = Solicitacao;