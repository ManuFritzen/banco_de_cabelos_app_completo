const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Publicacao = require('./publicacaoModel');
const Usuario = require('./usuarioModel');

const Comentario = sequelize.define('comentario', {
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
});

Comentario.belongsTo(Publicacao, { foreignKey: 'publicacao_id' });
Publicacao.hasMany(Comentario, { foreignKey: 'publicacao_id' });

Comentario.belongsTo(Usuario, { foreignKey: 'usuario_id' });
Usuario.hasMany(Comentario, { foreignKey: 'usuario_id' });

module.exports = Comentario;