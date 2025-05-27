const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Cabelo = require('./cabeloModel');
const Usuario = require('./usuarioModel');

const Recebimento = sequelize.define('recebimento', {
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