const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');
const Cabelo = require('./cabeloModel');
const Usuario = require('./usuarioModel');

class Recebimento extends Model {
  static async buscarPorInstituicao(instituicaoId, options = {}) {
    return await this.findAll({
      where: { instituicao_id: instituicaoId },
      order: [['data_hora', 'DESC']],
      ...options
    });
  }

  static async buscarPorDoador(pessoaFisicaId, options = {}) {
    return await this.findAll({
      where: { pessoa_fisica_id: pessoaFisicaId },
      order: [['data_hora', 'DESC']],
      ...options
    });
  }

  static async buscarPorCabelo(cabeloId) {
    return await this.findOne({
      where: { cabelo_id: cabeloId }
    });
  }

  static async contarPorInstituicao(instituicaoId) {
    return await this.count({
      where: { instituicao_id: instituicaoId }
    });
  }

  static async contarPorDoador(pessoaFisicaId) {
    return await this.count({
      where: { pessoa_fisica_id: pessoaFisicaId }
    });
  }

  async pertenceAInstituicao(instituicaoId) {
    return this.instituicao_id === parseInt(instituicaoId);
  }

  async pertenceADoador(pessoaFisicaId) {
    return this.pessoa_fisica_id === parseInt(pessoaFisicaId);
  }

  async getInstituicao() {
    if (!this.Instituicao) {
      return await Usuario.findByPk(this.instituicao_id);
    }
    return this.Instituicao;
  }

  async getDoador() {
    if (!this.PessoaFisica) {
      return await Usuario.findByPk(this.pessoa_fisica_id);
    }
    return this.PessoaFisica;
  }

  async getCabelo() {
    if (!this.Cabelo) {
      return await Cabelo.findByPk(this.cabelo_id);
    }
    return this.Cabelo;
  }

  temObservacao() {
    return this.observacao && this.observacao.trim().length > 0;
  }

  getTempoRecebimento() {
    const agora = new Date();
    const dataRecebimento = new Date(this.data_hora);
    const diffMs = agora - dataRecebimento;
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDias === 0) {
      return 'Hoje';
    } else if (diffDias === 1) {
      return 'Ontem';
    } else {
      return `${diffDias} dias atrás`;
    }
  }
}

Recebimento.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  cabelo_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'cabelo',
      key: 'id'
    },
    validate: {
      notNull: { msg: 'O cabelo é obrigatório' }
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
  pessoa_fisica_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuario',
      key: 'id'
    },
    validate: {
      notNull: { msg: 'O doador é obrigatório' }
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
  modelName: 'recebimento',
  hooks: {
    beforeCreate: async (recebimento) => {
      const instituicao = await Usuario.findByPk(recebimento.instituicao_id);
      if (!instituicao || instituicao.tipo !== 'J') {
        throw new Error('O recebimento deve estar associado a uma instituição (usuário tipo J)');
      }
      
      const pessoaFisica = await Usuario.findByPk(recebimento.pessoa_fisica_id);
      if (!pessoaFisica || pessoaFisica.tipo !== 'F') {
        throw new Error('O recebimento deve estar associado a um doador pessoa física (usuário tipo F)');
      }
    },
    beforeUpdate: async (recebimento) => {
      if (recebimento.changed('instituicao_id')) {
        const instituicao = await Usuario.findByPk(recebimento.instituicao_id);
        if (!instituicao || instituicao.tipo !== 'J') {
          throw new Error('O recebimento deve estar associado a uma instituição (usuário tipo J)');
        }
      }
      
      if (recebimento.changed('pessoa_fisica_id')) {
        const pessoaFisica = await Usuario.findByPk(recebimento.pessoa_fisica_id);
        if (!pessoaFisica || pessoaFisica.tipo !== 'F') {
          throw new Error('O recebimento deve estar associado a um doador pessoa física (usuário tipo F)');
        }
      }
    }
  }
});

Recebimento.belongsTo(Cabelo, { foreignKey: 'cabelo_id' });
Cabelo.hasMany(Recebimento, { foreignKey: 'cabelo_id' });

Recebimento.belongsTo(Usuario, { as: 'Instituicao', foreignKey: 'instituicao_id' });
Usuario.hasMany(Recebimento, { as: 'RecebimentosInstituicao', foreignKey: 'instituicao_id' });

Recebimento.belongsTo(Usuario, { as: 'PessoaFisica', foreignKey: 'pessoa_fisica_id' });
Usuario.hasMany(Recebimento, { as: 'RecebimentosPessoaFisica', foreignKey: 'pessoa_fisica_id' });

module.exports = Recebimento;