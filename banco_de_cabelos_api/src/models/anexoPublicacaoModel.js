const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');
const Publicacao = require('./publicacaoModel');

class AnexoPublicacao extends Model {
  static async buscarPorPublicacao(publicacaoId) {
    return await this.findAll({
      where: { publicacao_id: publicacaoId }
    });
  }

  static async contarPorPublicacao(publicacaoId) {
    return await this.count({
      where: { publicacao_id: publicacaoId }
    });
  }

  async pertenceAPublicacao(publicacaoId) {
    return this.publicacao_id === parseInt(publicacaoId);
  }

  async getPublicacao() {
    if (!this.Publicacao) {
      return await Publicacao.findByPk(this.publicacao_id);
    }
    return this.Publicacao;
  }

  temFoto() {
    return this.foto && this.foto.length > 0;
  }

  getTamanhoFoto() {
    return this.foto ? this.foto.length : 0;
  }
}

AnexoPublicacao.init({
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
  foto: {
    type: DataTypes.BLOB,
    allowNull: false,
    validate: {
      notNull: { msg: 'A foto é obrigatória' }
    }
  }
}, {
  sequelize,
  modelName: 'anexo_publicacao',
  timestamps: false,
  tableName: 'anexo_publicacao'
});

AnexoPublicacao.belongsTo(Publicacao, { foreignKey: 'publicacao_id' });
Publicacao.hasMany(AnexoPublicacao, { foreignKey: 'publicacao_id' });

module.exports = AnexoPublicacao;