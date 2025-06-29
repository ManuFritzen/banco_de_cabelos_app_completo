const BaseService = require('./BaseService');
const { Usuario, Endereco } = require('../models');
const { ApiError } = require('../utils/errorHandler');
const { Validators } = require('../utils/validators');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

class UsuarioService extends BaseService {
  constructor() {
    super(Usuario);
  }

  async criarUsuario(dadosUsuario) {
    const dadosValidados = this.validarDadosUsuario(dadosUsuario);
    
    await this.verificarDuplicatas(dadosValidados);
    
    return await this.create(dadosValidados);
  }

  async autenticarUsuario(email, senha) {
    if (!Validators.isValidEmail(email)) {
      throw new ApiError('Email inválido', 400);
    }

    const usuario = await Usuario.buscarPorEmail(email);
    if (!usuario) {
      throw new ApiError('Credenciais inválidas', 401);
    }

    const senhaCorreta = await usuario.verificarSenha(senha);
    if (!senhaCorreta) {
      throw new ApiError('Credenciais inválidas', 401);
    }

    const token = this.gerarToken(usuario);
    
    return {
      token,
      usuario: this.sanitizarUsuario(usuario)
    };
  }

  async obterUsuarioCompleto(id) {
    return await this.findById(id, {
      attributes: { exclude: ['senha'] },
      include: [
        {
          model: Endereco,
          as: 'enderecos'
        }
      ]
    });
  }

  async listarUsuariosJuridicos() {
    return await Usuario.listarUsuariosJuridicos();
  }

  async atualizarUsuario(id, dadosAtualizacao, usuarioLogado) {
    this.verificarPermissaoUsuario(usuarioLogado.id, id);
    
    const usuario = await this.findById(id);
    const dadosValidados = this.validarDadosAtualizacao(dadosAtualizacao, usuario);
    
    return await usuario.update(dadosValidados);
  }

  validarDadosUsuario(dados) {
    const validation = Validators.validateUserData(dados);
    if (!validation.isValid) {
      const errorMessages = Object.entries(validation.errors)
        .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
        .join('; ');
      throw new ApiError(errorMessages, 400);
    }

    return this.sanitizeData(dados, ['nome', 'email']);
  }

  validarDadosAtualizacao(dados, usuarioExistente) {
    const dadosParaValidar = {
      nome: dados.nome || usuarioExistente.nome,
      email: dados.email || usuarioExistente.email,
      tipo: dados.tipo || usuarioExistente.tipo,
      cnpj: dados.cnpj,
      cpf: dados.cpf,
      telefone: dados.telefone
    };

    return this.validarDadosUsuario(dadosParaValidar);
  }

  async verificarDuplicatas(dados) {
    const verificacoes = [];

    if (dados.email) {
      verificacoes.push(
        Usuario.buscarPorEmail(dados.email)
          .then(user => user && new ApiError('Email já está em uso', 409))
      );
    }

    if (dados.cpf) {
      verificacoes.push(
        Usuario.buscarPorCPF(dados.cpf)
          .then(user => user && new ApiError('CPF já está em uso', 409))
      );
    }

    if (dados.cnpj) {
      verificacoes.push(
        Usuario.buscarPorCNPJ(dados.cnpj)
          .then(user => user && new ApiError('CNPJ já está em uso', 409))
      );
    }

    const erros = (await Promise.all(verificacoes)).filter(Boolean);
    if (erros.length > 0) {
      throw erros[0];
    }
  }

  verificarPermissaoUsuario(usuarioLogadoId, targetId) {
    if (parseInt(usuarioLogadoId) !== parseInt(targetId)) {
      throw new ApiError('Você não tem permissão para acessar este recurso', 403);
    }
  }

  gerarToken(usuario) {
    return jwt.sign(
      { 
        id: usuario.id, 
        email: usuario.email,
        tipo: usuario.tipo,
        nome: usuario.nome
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
  }

  sanitizarUsuario(usuario) {
    const { senha, ...usuarioSanitizado } = usuario.toJSON ? usuario.toJSON() : usuario;
    return usuarioSanitizado;
  }
}

module.exports = new UsuarioService();