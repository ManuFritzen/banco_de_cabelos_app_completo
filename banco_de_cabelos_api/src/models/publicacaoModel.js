const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Usuario = require('./usuarioModel');

const Publicacao = sequelize.define('publicacao', {
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
});

Publicacao.belongsTo(Usuario, { foreignKey: 'usuario_id' });
Usuario.hasMany(Publicacao, { foreignKey: 'usuario_id' });

module.exports = Publicacao;