const { Usuario, Endereco, BlacklistedToken } = require('../models');
const jwt = require('jsonwebtoken');
const { ApiError, asyncHandler, handleSequelizeError } = require('../utils/errorHandler');
const fs = require('fs').promises;
const path = require('path');
const BaseController = require('./BaseController');
const { Validators } = require('../utils/validators');
require('dotenv').config();

class UsuarioController extends BaseController {
  static TIPO_JURIDICO = 'J';
  static TIPO_PESSOA_FISICA = 'F';
  static TIPO_ADMIN = 'A';
  static MAX_FILE_SIZE = 5 * 1024 * 1024; 
  static UPLOAD_PATH = path.resolve(__dirname, '../../uploads/perfil');
  static VALID_IMAGE_TYPES = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp'
  };
  getUsuarioAttributes(excludeFields = ['senha']) {
    return { exclude: excludeFields };
  }

  async verificarPermissaoUsuario(usuarioId, targetId) {
    if (usuarioId !== parseInt(targetId)) {
      throw new ApiError('Você não tem permissão para acessar este recurso', 403);
    }
  }

  async validarDocumento(tipo, valor, campo) {
    switch(tipo) {
      case 'cpf':
        if (!Validators.isValidCPF(valor)) {
          throw new ApiError(`${campo} inválido.`, 400);
        }
        break;
      case 'cnpj':
        if (!Validators.isValidCNPJ(valor)) {
          throw new ApiError(`${campo} inválido.`, 400);
        }
        break;
      case 'email':
        if (!Validators.isValidEmail(valor)) {
          throw new ApiError(`${campo} inválido.`, 400);
        }
        break;
      default:
        throw new ApiError('Tipo de documento inválido', 400);
    }
  }

  async verificarDocumentoExistente(campo, valor) {
    const usuario = await Usuario.findOne({ where: { [campo]: valor } });
    return !!usuario;
  }

  gerarTokenJWT(usuario) {
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

  async processarFotoPerfil(dataUrl, id) {
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
      throw new ApiError('Formato de imagem inválido', 400);
    }
    
    const mimeType = matches[1];
    const imageBuffer = Buffer.from(matches[2], 'base64');
    
    if (imageBuffer.length > UsuarioController.MAX_FILE_SIZE) {
      throw new ApiError('Arquivo muito grande. Máximo permitido: 5MB', 400);
    }
    
    const extensao = UsuarioController.VALID_IMAGE_TYPES[mimeType] || '.jpg';
    const nomeUnico = `${Date.now()}_${id}${extensao}`;
    
    return { imageBuffer, nomeUnico, mimeType };
  }

  async removerFotoAntiga(nomeArquivo) {
    if (!nomeArquivo) return;
    
    const caminhoArquivo = path.join(UsuarioController.UPLOAD_PATH, nomeArquivo);
    try {
      await fs.unlink(caminhoArquivo);
    } catch (err) {
      console.error('Erro ao remover foto antiga:', err);
    }
  }

  listarUsuariosJuridicos = asyncHandler(async (req, res) => {
    const usuarios = await Usuario.findAll({
      where: { tipo: UsuarioController.TIPO_JURIDICO },
      attributes: this.getUsuarioAttributes(['senha', 'cpf']),
      include: [
        {
          model: Endereco,
          as: 'enderecos'
        }
      ]
    });
    
    const usuariosJSON = JSON.parse(JSON.stringify(usuarios));
    
    this.sendSuccess(res, { data: usuariosJSON });
  });

  obterUsuarioPorId = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const idValidado = this.validateNumericId(id, 'ID do usuário');
    
    const usuario = await Usuario.findByPk(idValidado, {
      attributes: this.getUsuarioAttributes(),
      include: [
        {
          model: Endereco,
          as: 'enderecos'
        }
      ]
    });
    
    if (!usuario) {
      throw new ApiError('Usuário não encontrado', 404);
    }
    
    const usuarioJSON = JSON.parse(JSON.stringify(usuario));
    
    this.sendSuccess(res, usuarioJSON);
  });

  criarUsuario = asyncHandler(async (req, res) => {
    const { nome, email, senha, tipo, cnpj, cpf, telefone } = req.body;
    
    const dadosValidados = this.validateAndSanitizeUserData(req.body);
    
    try {
      const novoUsuario = await Usuario.create({
        nome: dadosValidados.nome,
        email: dadosValidados.email,
        senha,
        tipo: dadosValidados.tipo || tipo,
        cnpj: dadosValidados.cnpj || cnpj,
        cpf: dadosValidados.cpf || cpf,
        telefone: dadosValidados.telefone || telefone
      });
      
      const usuarioSanitizado = this.sanitizeUser(novoUsuario.toJSON());
      
      this.sendSuccess(res, usuarioSanitizado, 'Usuário criado com sucesso', 201);
    } catch (error) {
      throw handleSequelizeError(error);
    }
  });

  atualizarUsuario = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { nome, email, senha, tipo, cnpj, cpf, telefone } = req.body;
    
    const idValidado = this.validateNumericId(id, 'ID do usuário');
    
    await this.verificarPermissaoUsuario(req.usuario.id, idValidado);
    
    const usuario = await Usuario.findByPk(idValidado);
    if (!usuario) {
      throw new ApiError('Usuário não encontrado', 404);
    }
    
    const dadosParaAtualizar = {};
    if (nome || email || tipo || cnpj || cpf || telefone) {
      const dadosValidados = this.validateAndSanitizeUserData({
        nome: nome || usuario.nome,
        email: email || usuario.email,
        tipo: tipo || usuario.tipo,
        cnpj,
        cpf,
        telefone
      });
      
      if (nome) dadosParaAtualizar.nome = dadosValidados.nome;
      if (email) dadosParaAtualizar.email = dadosValidados.email;
      if (tipo) dadosParaAtualizar.tipo = tipo;
      if (cnpj) dadosParaAtualizar.cnpj = cnpj;
      if (cpf) dadosParaAtualizar.cpf = cpf;
      if (telefone) dadosParaAtualizar.telefone = telefone;
    }
    
    if (senha) dadosParaAtualizar.senha = senha;
    
    try {
      await usuario.update(dadosParaAtualizar);
      
      const usuarioSanitizado = this.sanitizeUser(usuario.toJSON());
      
      this.sendSuccess(res, usuarioSanitizado, 'Usuário atualizado com sucesso');
    } catch (error) {
      throw handleSequelizeError(error);
    }
  });

  excluirUsuario = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const idValidado = this.validateNumericId(id, 'ID do usuário');
    
    const usuario = await Usuario.findByPk(idValidado);
    if (!usuario) {
      throw new ApiError('Usuário não encontrado', 404);
    }

    await this.verificarPermissaoUsuario(req.usuario.id, idValidado);
    
    await usuario.destroy();
    
    this.sendSuccess(res, {}, 'Usuário excluído com sucesso');
  });

  login = asyncHandler(async (req, res) => {
    const { email, senha } = req.body;
    
    if (!email || !senha) {
      throw new ApiError('Por favor, forneça email e senha', 400);
    }
    
    if (!Validators.isValidEmail(email)) {
      throw new ApiError('Email inválido', 400);
    }
    
    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) {
      throw new ApiError('Credenciais inválidas', 401);
    }
    
    const senhaCorreta = await usuario.verificarSenha(senha);
    if (!senhaCorreta) {
      throw new ApiError('Credenciais inválidas', 401);
    }
    
    const token = this.gerarTokenJWT(usuario);
    
    const response = {
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo
      }
    };
    
    this.sendSuccess(res, response, 'Login realizado com sucesso');
  });

  logout = asyncHandler(async (req, res) => {
    const token = req.token;
    
    if (!token) {
      throw new ApiError('Nenhum token fornecido', 401);
    }
    
    try {
      const tokenInvalidado = await BlacklistedToken.findOne({ where: { token } });
      if (tokenInvalidado) {
        return this.sendSuccess(res, null, 'Logout já realizado anteriormente');
      }
      
      const expiresat = await this.obterDataExpiracaoToken(token);
      
      await BlacklistedToken.create({ token, expiresat });
      
      this.sendSuccess(res, null, 'Logout realizado com sucesso');
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Erro ao processar logout', 500);
    }
  });

  async obterDataExpiracaoToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return new Date(decoded.exp * 1000);
    } catch (tokenError) {
      const expiresat = new Date();
      expiresat.setDate(expiresat.getDate() + 1);
      return expiresat;
    }
  }

  verificarCPFExistente = asyncHandler(async (req, res) => {
    const { cpf } = req.params;
    
    const cpfLimpo = cpf.replace(/\D/g, '');
    
    await this.validarDocumento('cpf', cpfLimpo, 'CPF');
    
    const existe = await this.verificarDocumentoExistente('cpf', cpfLimpo);
    
    if (existe) {
      return res.status(409).json({
        success: false,
        message: 'CPF já está cadastrado'
      });
    }
    
    this.sendSuccess(res, null, 'CPF disponível');
  });

  verificarCNPJExistente = asyncHandler(async (req, res) => {
    const { cnpj } = req.params;
    
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    
    await this.validarDocumento('cnpj', cnpjLimpo, 'CNPJ');
    
    const existe = await this.verificarDocumentoExistente('cnpj', cnpjLimpo);
    
    if (existe) {
      return res.status(409).json({
        success: false,
        message: 'CNPJ já está cadastrado'
      });
    }
    
    this.sendSuccess(res, null, 'CNPJ disponível');
  });

  verificarEmailExistente = asyncHandler(async (req, res) => {
    const { email } = req.params;
    
    await this.validarDocumento('email', email, 'E-mail');
    
    const existe = await this.verificarDocumentoExistente('email', email);
    
    if (existe) {
      return res.status(409).json({
        success: false,
        message: 'E-mail já está cadastrado'
      });
    }
    
    this.sendSuccess(res, null, 'E-mail disponível');
  });

  uploadFotoPerfilBase64 = asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const { foto } = req.body;
      
      const idValidado = this.validateNumericId(id, 'ID do usuário');
      
      await this.verificarPermissaoUsuario(req.usuario.id, idValidado);
      
      if (!foto) {
        throw new ApiError('Dados da foto não fornecidos', 400);
      }
      
      const usuario = await Usuario.findByPk(idValidado);
      if (!usuario) {
        throw new ApiError('Usuário não encontrado', 404);
      }
      
      const { imageBuffer, nomeUnico } = await this.processarFotoPerfil(foto, idValidado);
      
      await this.removerFotoAntiga(usuario.foto_perfil);
      
      const caminhoArquivo = path.join(UsuarioController.UPLOAD_PATH, nomeUnico);
      await fs.mkdir(UsuarioController.UPLOAD_PATH, { recursive: true });
      await fs.writeFile(caminhoArquivo, imageBuffer);
      
      usuario.foto_perfil = nomeUnico;
      await usuario.save();
      
      this.sendSuccess(res, { foto: nomeUnico }, 'Foto de perfil atualizada com sucesso');
    } catch (error) {
      console.error('Erro no upload base64:', error);
      throw error;
    }
  });

  uploadFotoPerfil = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const idValidado = this.validateNumericId(id, 'ID do usuário');
    
    await this.verificarPermissaoUsuario(req.usuario.id, idValidado);
    
    if (!req.file) {
      throw new ApiError('Nenhuma imagem foi enviada', 400);
    }
    
    const usuario = await Usuario.findByPk(idValidado);
    if (!usuario) {
      throw new ApiError('Usuário não encontrado', 404);
    }
    
    await this.removerFotoAntiga(usuario.foto_perfil);
    
    usuario.foto_perfil = req.file.filename;
    await usuario.save();
    
    const response = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      foto_perfil: usuario.foto_perfil
    };
    
    this.sendSuccess(res, response, 'Foto de perfil atualizada com sucesso');
  });

  buscarFotoPerfil = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const idValidado = this.validateNumericId(id, 'ID do usuário');
    
    const usuario = await Usuario.findByPk(idValidado, {
      attributes: ['foto_perfil']
    });
    
    if (!usuario || !usuario.foto_perfil) {
      return res.status(404).json({
        success: false,
        message: 'Foto de perfil não encontrada'
      });
    }
    
    const caminhoFoto = path.join(UsuarioController.UPLOAD_PATH, usuario.foto_perfil);
    
    try {
      await fs.access(caminhoFoto);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Arquivo de foto não encontrado'
      });
    }
    
    res.sendFile(caminhoFoto);
  });

  buscarFotoPerfilBase64 = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const idValidado = this.validateNumericId(id, 'ID do usuário');
    
    const usuario = await Usuario.findByPk(idValidado, {
      attributes: ['foto_perfil']
    });
    
    if (!usuario || !usuario.foto_perfil) {
      return res.status(404).json({
        success: false,
        message: 'Foto de perfil não encontrada'
      });
    }
    
    const caminhoFoto = path.join(UsuarioController.UPLOAD_PATH, usuario.foto_perfil);
    
    try {
      await fs.stat(caminhoFoto);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Arquivo de foto não encontrado'
      });
    }
    
    const buffer = await fs.readFile(caminhoFoto);
    const base64 = buffer.toString('base64');
    
    const ext = path.extname(usuario.foto_perfil).toLowerCase();
    const mimeType = this.obterMimeType(ext);
    
    const dataUrl = `data:${mimeType};base64,${base64}`;
    
    this.sendSuccess(res, { foto: dataUrl });
  });

  obterMimeType(extensao) {
    const mimeTypes = {
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg'
    };
    
    return mimeTypes[extensao] || 'image/jpeg';
  }

  removerFotoPerfil = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const idValidado = this.validateNumericId(id, 'ID do usuário');
    
    await this.verificarPermissaoUsuario(req.usuario.id, idValidado);
    
    const usuario = await Usuario.findByPk(idValidado);
    if (!usuario) {
      throw new ApiError('Usuário não encontrado', 404);
    }
    
    if (!usuario.foto_perfil) {
      throw new ApiError('Usuário não possui foto de perfil', 400);
    }
    
    await this.removerFotoAntiga(usuario.foto_perfil);
    
    usuario.foto_perfil = null;
    await usuario.save();
    
    this.sendSuccess(res, null, 'Foto de perfil removida com sucesso');
  });
}

module.exports = new UsuarioController();