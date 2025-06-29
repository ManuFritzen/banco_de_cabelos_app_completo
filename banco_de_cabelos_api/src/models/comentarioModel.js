const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');
const Publicacao = require('./publicacaoModel');
const Usuario = require('./usuarioModel');

class Comentario extends Model {
  static async buscarPorPublicacao(publicacaoId, options = {}) {
    return await this.findAll({
      where: { publicacao_id: publicacaoId },
      order: [['data_hora', 'DESC']],
      ...options
    });
  }

  static async buscarPorUsuario(usuarioId, options = {}) {
    return await this.findAll({
      where: { usuario_id: usuarioId },
      ...options
    });
  }

  static async contarPorPublicacao(publicacaoId) {
    return await this.count({
      where: { publicacao_id: publicacaoId }
    });
  }

  static async contarPorUsuario(usuarioId) {
    return await this.count({
      where: { usuario_id: usuarioId }
    });
  }

  async pertenceAUsuario(usuarioId) {
    return this.usuario_id === parseInt(usuarioId);
  }

  async incrementarCurtidas() {
    return await this.update({ 
      qtd_curtidas: this.qtd_curtidas + 1 
    });
  }

  async decrementarCurtidas() {
    const novaQuantidade = Math.max(0, this.qtd_curtidas - 1);
    return await this.update({ 
      qtd_curtidas: novaQuantidade 
    });
  }

  async getAutor() {
    if (!this.Usuario) {
      return await Usuario.findByPk(this.usuario_id);
    }
    return this.Usuario;
  }

  async getPublicacao() {
    if (!this.Publicacao) {
      return await Publicacao.findByPk(this.publicacao_id);
    }
    return this.Publicacao;
  }

  temCurtidas() {
    return this.qtd_curtidas > 0;
  }

  getResumo(maxLength = 100) {
    if (this.conteudo.length <= maxLength) {
      return this.conteudo;
    }
    return this.conteudo.substring(0, maxLength) + '...';
  }
}

Comentario.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  publicacao_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'publicacao',
      key: 'id'
    },
    validate: {
      notNull: { msg: 'A publicação é obrigatória' }
    }
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuario',
      key: 'id'
    },
    validate: {
      notNull: { msg: 'O autor do comentário é obrigatório' }
    }
  },
  conteudo: {
    type: DataTypes.STRING(1000),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'O conteúdo é obrigatório' },
      len: {
        args: [1, 1000],
        msg: 'O comentário deve ter entre 1 e 1000 caracteres'
      }
    }
  },
  data_hora: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  qtd_curtidas: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      isInt: { msg: 'A quantidade de curtidas deve ser um número inteiro' },
      min: {
        args: [0],
        msg: 'A quantidade de curtidas não pode ser negativa'
      }
    }
  }
}, {
  sequelize,
  modelName: 'comentario'
});

Comentario.belongsTo(Publicacao, { foreignKey: 'publicacao_id' });
Publicacao.hasMany(Comentario, { foreignKey: 'publicacao_id' });

Comentario.belongsTo(Usuario, { foreignKey: 'usuario_id' });
Usuario.hasMany(Comentario, { foreignKey: 'usuario_id' });

module.exports = Comentario;