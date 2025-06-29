const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const SolicitacaoInstituicao = sequelize.define('SolicitacaoInstituicao', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  solicitacao_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'solicitacao',
      key: 'id'
    }
  },
  instituicao_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuario',
      key: 'id'
    }
  },
  status_solicitacao_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1, // Pendente
    references: {
      model: 'status_solicitacao',
      key: 'id'
    }
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  data_analise: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  data_atualizacao: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'solicitacao_instituicao',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['solicitacao_id', 'instituicao_id']
    },
    {
      fields: ['status_solicitacao_id']
    },
    {
      fields: ['data_analise']
    }
  ]
});

module.exports = SolicitacaoInstituicao;