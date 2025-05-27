const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const StatusSolicitacao = require('./statusSolicitacaoModel');
const Usuario = require('./usuarioModel');

const Solicitacao = sequelize.define('solicitacao', {
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