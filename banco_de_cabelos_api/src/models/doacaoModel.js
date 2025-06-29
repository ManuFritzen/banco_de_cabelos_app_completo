const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');
const Peruca = require('./perucaModel');
const Solicitacao = require('./solicitacaoModel');
const Usuario = require('./usuarioModel');

class Doacao extends Model {
  static async buscarPorInstituicao(instituicaoId, options = {}) {
    return await this.findAll({
      where: { instituicao_id: instituicaoId },
      ...options
    });
  }

  static async buscarPorSolicitacao(solicitacaoId, options = {}) {
    return await this.findAll({
      where: { solicitacao_id: solicitacaoId },
      ...options
    });
  }

  static async buscarPorPeruca(perucaId) {
    return await this.findOne({
      where: { peruca_id: perucaId }
    });
  }

  static async contarPorInstituicao(instituicaoId) {
    return await this.count({
      where: { instituicao_id: instituicaoId }
    });
  }

  getTempoDesdeDoacao() {
    return Math.abs(new Date() - new Date(this.data_hora)) / 36e5; // horas
  }

  podeSerExcluida(limitHoras = 24) {
    return this.getTempoDesdeDoacao() <= limitHoras;
  }

  async pertenceAInstituicao(instituicaoId) {
    return this.instituicao_id === parseInt(instituicaoId);
  }

  async getInstituicao() {
    if (!this.Instituicao) {
      return await Usuario.findByPk(this.instituicao_id);
    }
    return this.Instituicao;
  }
}

Doacao.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  peruca_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'peruca',
      key: 'id'
    },
    validate: {
      notNull: { msg: 'A peruca é obrigatória' }
    }
  },
  solicitacao_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'solicitacao',
      key: 'id'
    },
    validate: {
      notNull: { msg: 'A solicitação é obrigatória' }
    }
  },
  instituicao_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuario',
      key: 'id'
    },
    validate: {
      notNull: { msg: 'A instituição é obrigatória' }
    }
  },
  data_hora: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  observacao: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'doacao',
  hooks: {
    beforeCreate: async (doacao) => {
      if (doacao.instituicao_id) {
        const usuario = await Usuario.findByPk(doacao.instituicao_id);
        if (!usuario || usuario.tipo !== 'J') {
          throw new Error('A doação deve estar associada a uma instituição (usuário tipo J)');
        }
      }
    },
    beforeUpdate: async (doacao) => {
      if (doacao.changed('instituicao_id')) {
        const usuario = await Usuario.findByPk(doacao.instituicao_id);
        if (!usuario || usuario.tipo !== 'J') {
          throw new Error('A doação deve estar associada a uma instituição (usuário tipo J)');
        }
      }
    }
  }
});

Doacao.belongsTo(Peruca, { foreignKey: 'peruca_id' });
Peruca.hasMany(Doacao, { foreignKey: 'peruca_id' });

Doacao.belongsTo(Solicitacao, { foreignKey: 'solicitacao_id' });
Solicitacao.hasMany(Doacao, { foreignKey: 'solicitacao_id' });

Doacao.belongsTo(Usuario, { as: 'Instituicao', foreignKey: 'instituicao_id' });
Usuario.hasMany(Doacao, { foreignKey: 'instituicao_id' });

module.exports = Doacao;