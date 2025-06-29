const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');
const Usuario = require('./usuarioModel');

class Endereco extends Model {
  static async buscarPorUsuario(usuarioId) {
    return await this.findAll({
      where: { usuario_id: usuarioId }
    });
  }

  static async buscarPorCEP(cep) {
    return await this.findAll({
      where: { cep: cep.replace(/\D/g, '') }
    });
  }

  static async buscarPorCidade(cidade, options = {}) {
    return await this.findAll({
      where: { cidade },
      ...options
    });
  }

  static async buscarPorEstado(estado, options = {}) {
    return await this.findAll({
      where: { estado: estado.toUpperCase() },
      ...options
    });
  }

  async pertenceAUsuario(usuarioId) {
    return this.usuario_id === parseInt(usuarioId);
  }

  getEnderecoCompleto() {
    let endereco = `${this.rua}`;
    
    if (this.nro) {
      endereco += `, ${this.nro}`;
    }
    
    if (this.complemento) {
      endereco += `, ${this.complemento}`;
    }
    
    endereco += ` - ${this.bairro}, ${this.cidade}/${this.estado}`;
    endereco += ` - CEP: ${this.getCEPFormatado()}`;
    
    return endereco;
  }

  getCEPFormatado() {
    if (!this.cep) return '';
    return this.cep.replace(/(\d{5})(\d{3})/, '$1-$2');
  }

  async getUsuario() {
    if (!this.Usuario) {
      return await Usuario.findByPk(this.usuario_id);
    }
    return this.Usuario;
  }

  isValidCEP() {
    return /^\d{8}$/.test(this.cep);
  }
}

Endereco.init({
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
}, {
  sequelize,
  modelName: 'endereco'
});

Endereco.belongsTo(Usuario, { foreignKey: 'usuario_id' });
Usuario.hasMany(Endereco, { foreignKey: 'usuario_id', as: 'enderecos' });

module.exports = Endereco;