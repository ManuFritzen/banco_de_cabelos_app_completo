const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');
const Usuario = require('./usuarioModel');
const Publicacao = require('./publicacaoModel');
const Comentario = require('./comentarioModel');
const Solicitacao = require('./solicitacaoModel');

class Notificacao extends Model {
  static async buscarPorUsuario(usuarioId, options = {}) {
    return await this.findAll({
      where: { usuario_id: usuarioId },
      order: [['data_hora', 'DESC']],
      ...options
    });
  }

  static async buscarNaoLidas(usuarioId) {
    return await this.findAll({
      where: { 
        usuario_id: usuarioId,
        lida: false 
      },
      order: [['data_hora', 'DESC']]
    });
  }

  static async contarNaoLidas(usuarioId) {
    return await this.count({
      where: { 
        usuario_id: usuarioId,
        lida: false 
      }
    });
  }

  static async marcarTodasComoLidas(usuarioId) {
    return await this.update(
      { lida: true },
      { where: { usuario_id: usuarioId, lida: false } }
    );
  }

  async marcarComoLida() {
    return await this.update({ lida: true });
  }

  async pertenceAUsuario(usuarioId) {
    return this.usuario_id === parseInt(usuarioId);
  }

  isLida() {
    return this.lida === true;
  }

  async getUsuario() {
    if (!this.Usuario) {
      return await Usuario.findByPk(this.usuario_id);
    }
    return this.Usuario;
  }

  async getUsuarioOrigem() {
    if (!this.UsuarioOrigem && this.usuario_origem_id) {
      return await Usuario.findByPk(this.usuario_origem_id);
    }
    return this.UsuarioOrigem;
  }

  getTempoDecorrido() {
    const agora = new Date();
    const dataNotificacao = new Date(this.data_hora);
    const diffMs = agora - dataNotificacao;
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHoras < 1) {
      return 'Agora';
    } else if (diffHoras < 24) {
      return `${diffHoras}h atrás`;
    } else {
      const diffDias = Math.floor(diffHoras / 24);
      return `${diffDias}d atrás`;
    }
  }
}

Notificacao.init({
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
  sequelize,
  modelName: 'Notificacao',
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