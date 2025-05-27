const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const TipoPeruca = require('./tipoPerucaModel');
const Usuario = require('./usuarioModel');
const Cor = require('./corModel');

const Peruca = sequelize.define('peruca', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tipo_peruca_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tipo_peruca',
      key: 'id'
    },
    validate: {
      notNull: { msg: 'O tipo de peruca é obrigatório' }
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
  cor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'cor',
      key: 'id'
    },
    validate: {
      notNull: { msg: 'A cor é obrigatória' }
    }
  },
  comprimento: {
    type: DataTypes.REAL,
    allowNull: true,
    validate: {
      isFloat: { msg: 'O comprimento deve ser um número' },
      min: {
        args: [0],
        msg: 'O comprimento deve ser maior que zero'
      }
    }
  },
  tamanho: {
    type: DataTypes.CHAR(1),
    allowNull: false,
    defaultValue: 'M',
    validate: {
      isIn: {
        args: [['P', 'M', 'G']],
        msg: 'O tamanho deve ser P, M ou G'
      }
    }
  },
  foto: {
    type: DataTypes.BLOB,
    allowNull: true
  },
  disponivel: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  hooks: {
    beforeCreate: async (peruca) => {
      if (peruca.instituicao_id) {
        const usuario = await Usuario.findByPk(peruca.instituicao_id);
        if (!usuario || usuario.tipo !== 'J') {
          throw new Error('A peruca deve estar associada a uma instituição (usuário tipo J)');
        }
      }
    },
    beforeUpdate: async (peruca) => {
      if (peruca.changed('instituicao_id')) {
        const usuario = await Usuario.findByPk(peruca.instituicao_id);
        if (!usuario || usuario.tipo !== 'J') {
          throw new Error('A peruca deve estar associada a uma instituição (usuário tipo J)');
        }
      }
    }
  }
});

Peruca.belongsTo(TipoPeruca, { foreignKey: 'tipo_peruca_id' });
TipoPeruca.hasMany(Peruca, { foreignKey: 'tipo_peruca_id' });

Peruca.belongsTo(Usuario, { as: 'Instituicao', foreignKey: 'instituicao_id' });
Usuario.hasMany(Peruca, { foreignKey: 'instituicao_id' });

Peruca.belongsTo(Cor, { foreignKey: 'cor_id' });
Cor.hasMany(Peruca, { foreignKey: 'cor_id' });

module.exports = Peruca;