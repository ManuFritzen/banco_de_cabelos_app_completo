const BaseService = require('./BaseService');
const { Usuario } = require('../models');
const { ApiError } = require('../utils/errorHandler');
const { Validators } = require('../utils/validators');

class AdminService extends BaseService {
  constructor() {
    super(Usuario);
  }

  async criarSuperAdmin(dadosAdmin) {
    const { nome, email, senha, telefone } = dadosAdmin;
    
    this.validarDadosAdmin(dadosAdmin);
    
    const adminExistente = await Usuario.findOne({ where: { tipo: 'A' } });
    if (adminExistente) {
      throw new ApiError('Um super administrador já existe no sistema', 400);
    }
    
    return await this.create({
      nome,
      email,
      senha, 
      tipo: 'A', 
      telefone: telefone || null
    });
  }

  async gerenciarTipoUsuario(id, novoTipo, adminId) {
    const usuario = await this.findById(id);
    
    if (usuario.id === adminId) {
      throw new ApiError('Você não pode alterar seu próprio tipo de usuário', 400);
    }
    
    if (!Validators.isValidUserType(novoTipo)) {
      throw new ApiError('Tipo de usuário inválido', 400);
    }
    
    if (usuario.tipo === 'A' && novoTipo !== 'A') {
      const outrosAdmins = await Usuario.count({ 
        where: { tipo: 'A', id: { [require('sequelize').Op.ne]: id } } 
      });
      
      if (outrosAdmins === 0) {
        throw new ApiError('Não é possível remover o último administrador do sistema', 400);
      }
    }
    
    return await usuario.update({ tipo: novoTipo });
  }

  async obterEstatisticasUsuarios() {
    const totalUsuarios = await Usuario.count();
    const usuariosPorTipo = await Usuario.findAll({
      attributes: [
        'tipo',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'total']
      ],
      group: ['tipo'],
      raw: true
    });
    
    const estatisticas = {
      total: totalUsuarios,
      por_tipo: {}
    };
    
    usuariosPorTipo.forEach(stat => {
      const tipoNome = this.obterNomeTipo(stat.tipo);
      estatisticas.por_tipo[tipoNome] = parseInt(stat.total);
    });
    
    return estatisticas;
  }

  validarDadosAdmin(dados) {
    const { nome, email, senha, telefone } = dados;
    
    const nomeValidation = Validators.validateName(nome);
    if (!nomeValidation.isValid) {
      throw new ApiError(nomeValidation.errors.join(', '), 400);
    }
    
    if (!Validators.isValidEmail(email)) {
      throw new ApiError('Email inválido', 400);
    }
    
    const senhaValidation = Validators.validatePassword(senha);
    if (!senhaValidation.isValid) {
      throw new ApiError(senhaValidation.errors.join(', '), 400);
    }
    
    if (telefone && !Validators.isValidPhone(telefone)) {
      throw new ApiError('Telefone inválido', 400);
    }
  }

  obterNomeTipo(tipo) {
    const tipos = {
      'F': 'pessoa_fisica',
      'J': 'instituicao',
      'A': 'administrador'
    };
    return tipos[tipo] || 'desconhecido';
  }
}

module.exports = new AdminService();