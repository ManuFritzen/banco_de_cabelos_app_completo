const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const bcrypt = require('bcrypt');

const Usuario = sequelize.define('usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'O nome é obrigatório' }
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: {
      msg: 'Este email já está em uso'
    },
    validate: {
      isEmail: { msg: 'Email inválido' },
      notEmpty: { msg: 'O email é obrigatório' }
    }
  },
  senha: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'A senha é obrigatória' },
      len: {
        args: [6, 100],
        msg: 'A senha deve ter pelo menos 6 caracteres'
      }
    }
  },
  tipo: {
    type: DataTypes.CHAR(1),
    allowNull: false,
    defaultValue: 'F',
    validate: {
      isIn: {
        args: [['F', 'J', 'A']], // F = Físico, J = Jurídico, A = Admin
        msg: 'O tipo deve ser F (Físico), J (Jurídico) ou A (Admin)'
      }
    }
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  cpf: {
    type: DataTypes.CHAR(11),
    allowNull: true,
    unique: true,
    validate: {
      is: {
        args: /^\d{11}$/,
        msg: 'CPF inválido - deve conter apenas 11 números'
      }
    }
  },
  cnpj: {
    type: DataTypes.CHAR(14),
    allowNull: true,
    unique: true,
    validate: {
      is: {
        args: /^\d{14}$/,
        msg: 'CNPJ inválido - deve conter apenas 14 números'
      }
    }
  },
  telefone: {
    type: DataTypes.STRING(11), 
    allowNull: true,
    unique: true,
    validate: {
      is: {
        args: /^\d{10,11}$/,
        msg: 'Telefone inválido - deve conter 10 ou 11 números'
      }
    }
  },
  foto_perfil: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null
  }

}, {
  hooks: {
    beforeCreate: async (usuario) => {
      if (usuario.senha) {
        const salt = await bcrypt.genSalt(10);
        usuario.senha = await bcrypt.hash(usuario.senha, salt);
      }
    },
    beforeUpdate: async (usuario) => {
      if (usuario.changed('senha')) {
        const salt = await bcrypt.genSalt(10);
        usuario.senha = await bcrypt.hash(usuario.senha, salt);
      }
    }
  },
  validate: {
    tipoValidation() {
      if (this.tipo === 'J' && !this.cnpj) {
        throw new Error('CNPJ é obrigatório para usuários do tipo Jurídico');
      }
      
      if (this.tipo === 'F' && !this.cpf) {
        throw new Error('CPF é obrigatório para usuários do tipo Físico');
      }
    }
  }
});

Usuario.prototype.verificarSenha = async function(senha) {
  return await bcrypt.compare(senha, this.senha);
};

module.exports = Usuario;