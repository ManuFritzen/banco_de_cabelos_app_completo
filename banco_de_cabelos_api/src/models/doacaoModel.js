const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Peruca = require('./perucaModel');
const Solicitacao = require('./solicitacaoModel');
const Usuario = require('./usuarioModel');

const Doacao = sequelize.define('doacao', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  peruca_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'peruca',
      key: 'id'
    },
    validate: {
      notNull: { msg: 'A peruca é obrigatória' }
    }
  },
  solicitacao_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'solicitacao',
      key: 'id'
    },
    validate: {
      notNull: { msg: 'A solicitação é obrigatória' }
    }
  },
  instituicao_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuario',
      key: 'id'
    },
    validate: {
      notNull: { msg: 'A instituição é obrigatória' }
    }
  },
  data_hora: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  observacao: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  hooks: {
    beforeCreate: async (doacao) => {
      if (doacao.instituicao_id) {
        const usuario = await Usuario.findByPk(doacao.instituicao_id);
        if (!usuario || usuario.tipo !== 'J') {
          throw new Error('A doação deve estar associada a uma instituição (usuário tipo J)');
        }
      }
    },
    beforeUpdate: async (doacao) => {
      if (doacao.changed('instituicao_id')) {
        const usuario = await Usuario.findByPk(doacao.instituicao_id);
        if (!usuario || usuario.tipo !== 'J') {
          throw new Error('A doação deve estar associada a uma instituição (usuário tipo J)');
        }
      }
    }
  }
});

Doacao.belongsTo(Peruca, { foreignKey: 'peruca_id' });
Peruca.hasMany(Doacao, { foreignKey: 'peruca_id' });

Doacao.belongsTo(Solicitacao, { foreignKey: 'solicitacao_id' });
Solicitacao.hasMany(Doacao, { foreignKey: 'solicitacao_id' });

Doacao.belongsTo(Usuario, { as: 'Instituicao', foreignKey: 'instituicao_id' });
Usuario.hasMany(Doacao, { foreignKey: 'instituicao_id' });

module.exports = Doacao;