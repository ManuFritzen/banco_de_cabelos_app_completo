const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Usuario = require('./usuarioModel');
const Publicacao = require('./publicacaoModel');
const Comentario = require('./comentarioModel');
const Solicitacao = require('./solicitacaoModel');

const Notificacao = sequelize.define('Notificacao', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Usuario,
      key: 'id'
    }
  },
  tipo: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  titulo: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  mensagem: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  lida: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  data_hora: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  publicacao_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Publicacao,
      key: 'id'
    }
  },
  comentario_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Comentario,
      key: 'id'
    }
  },
  solicitacao_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Solicitacao,
      key: 'id'
    }
  },
  recebimento_id: {
    type: DataTypes.INTEGER
  },
  usuario_origem_id: {
    type: DataTypes.INTEGER,
    references: {
      model: Usuario,
      key: 'id'
    }
  }
}, {
  tableName: 'notificacao',
  timestamps: false,
  indexes: [
    {
      fields: ['usuario_id']
    },
    {
      fields: ['lida']
    },
    {
      fields: ['data_hora'],
      order: [['data_hora', 'DESC']]
    }
  ]
});

// Associações
Notificacao.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'Usuario' });
Notificacao.belongsTo(Usuario, { foreignKey: 'usuario_origem_id', as: 'UsuarioOrigem' });
Notificacao.belongsTo(Publicacao, { foreignKey: 'publicacao_id' });
Notificacao.belongsTo(Comentario, { foreignKey: 'comentario_id' });
Notificacao.belongsTo(Solicitacao, { foreignKey: 'solicitacao_id' });

// Associações inversas
Usuario.hasMany(Notificacao, { foreignKey: 'usuario_id', as: 'Notificacoes' });
Usuario.hasMany(Notificacao, { foreignKey: 'usuario_origem_id', as: 'NotificacoesEnviadas' });

module.exports = Notificacao;