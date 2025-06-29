const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');
const bcrypt = require('bcrypt');

class Usuario extends Model {
  async verificarSenha(senha) {
    return await bcrypt.compare(senha, this.senha);
  }

  getSanitizedData() {
    const { senha, ...dados } = this.toJSON();
    return dados;
  }

  static async buscarPorEmail(email) {
    return await this.findOne({ where: { email } });
  }

  static async buscarPorCPF(cpf) {
    return await this.findOne({ where: { cpf } });
  }

  static async buscarPorCNPJ(cnpj) {
    return await this.findOne({ where: { cnpj } });
  }

  static async contarPorTipo(tipo) {
    return await this.count({ where: { tipo } });
  }

  static async listarUsuariosJuridicos() {
    const { Endereco } = require('./index');
    return await this.findAll({
      where: { tipo: 'J' },
      attributes: { exclude: ['senha', 'cpf'] },
      include: [
        {
          model: Endereco,
          as: 'enderecos'
        }
      ]
    });
  }

  isAdmin() {
    return this.tipo === 'A';
  }

  isPessoaFisica() {
    return this.tipo === 'F';
  }

  isInstituicao() {
    return this.tipo === 'J';
  }
}

Usuario.init({
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
  sequelize,
  modelName: 'usuario',
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

module.exports = Usuario;