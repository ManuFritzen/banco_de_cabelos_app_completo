const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Usuario = require('./usuarioModel');

const Endereco = sequelize.define('endereco', {
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
      notNull: { msg: 'O ID do usuário é obrigatório' }
    }
  },
  bairro: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'O bairro é obrigatório' }
    }
  },
  rua: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'A rua é obrigatória' }
    }
  },
  cep: {
    type: DataTypes.CHAR(8),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'O CEP é obrigatório' },
      is: {
        args: /^\d{8}$/,
        msg: 'CEP inválido. Deve conter 8 dígitos numéricos'
      }
    }
  },
  nro: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  complemento: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cidade: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'A cidade é obrigatória' }
    }
  },
  estado: {
    type: DataTypes.CHAR(2),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'O estado é obrigatório' },
      is: {
        args: /^[A-Z]{2}$/,
        msg: 'O estado deve ser uma sigla de 2 letras maiúsculas'
      }
    }
  },
  ibge: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

Endereco.belongsTo(Usuario, { foreignKey: 'usuario_id' });
Usuario.hasMany(Endereco, { foreignKey: 'usuario_id' });

module.exports = Endereco;