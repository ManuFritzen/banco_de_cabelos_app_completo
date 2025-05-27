const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Publicacao = require('./publicacaoModel');

const AnexoPublicacao = sequelize.define('anexo_publicacao', {
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
  timestamps: false,
  tableName: 'anexo_publicacao'
});

AnexoPublicacao.belongsTo(Publicacao, { foreignKey: 'publicacao_id' });
Publicacao.hasMany(AnexoPublicacao, { foreignKey: 'publicacao_id' });

module.exports = AnexoPublicacao;