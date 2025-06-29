const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');
const Usuario = require('./usuarioModel');

class Publicacao extends Model {
  static async buscarPorUsuario(usuarioId, options = {}) {
    return await this.findAll({
      where: { usuario_id: usuarioId },
      ...options
    });
  }

  static async buscarRecentes(limit = 10, options = {}) {
    return await this.findAll({
      order: [['data_hora', 'DESC']],
      limit,
      ...options
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

  getResumo(maxLength = 150) {
    if (this.conteudo.length <= maxLength) {
      return this.conteudo;
    }
    return this.conteudo.substring(0, maxLength) + '...';
  }

  temCurtidas() {
    return this.qtd_curtidas > 0;
  }
}

Publicacao.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuario',
      key: 'id'
    },
    validate: {
      notNull: { msg: 'O autor da publicação é obrigatório' }
    }
  },
  titulo: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'O título é obrigatório' }
    }
  },
  conteudo: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'O conteúdo é obrigatório' }
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
  modelName: 'publicacao'
});

Publicacao.belongsTo(Usuario, { foreignKey: 'usuario_id' });
Usuario.hasMany(Publicacao, { foreignKey: 'usuario_id' });

module.exports = Publicacao;