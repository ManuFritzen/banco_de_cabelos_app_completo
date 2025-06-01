const { Endereco, Usuario } = require('../models');
const { ApiError, asyncHandler, handleSequelizeError } = require('../utils/errorHandler');
const ViaCepService = require('../services/viaCepService');
const BaseController = require('./BaseController');
const { Validators } = require('../utils/validators');

class EnderecoController extends BaseController {
  getDefaultIncludes() {
    return [
      {
        model: Usuario,
        attributes: ['id', 'nome', 'email', 'tipo']
      }
    ];
  }

  async verificarPermissaoEndereco(usuarioId, enderecoOuId) {
    const endereco = typeof enderecoOuId === 'object' 
      ? enderecoOuId 
      : await Endereco.findByPk(enderecoOuId);
    
    if (!endereco) {
      throw new ApiError('Endereço não encontrado', 404);
    }
    
    if (usuarioId !== endereco.usuario_id) {
      throw new ApiError('Você não tem permissão para acessar este endereço', 403);
    }
    
    return endereco;
  }

  async processarDadosCep(cep) {
    const dadosViaCep = await ViaCepService.consultarCep(cep);
    
    return {
      cep,
      cidade: dadosViaCep.localidade,
      estado: dadosViaCep.uf,
      ibge: dadosViaCep.ibge,
      bairro: dadosViaCep.bairro,
      rua: dadosViaCep.logradouro
    };
  }

  listarEnderecos = asyncHandler(async (req, res) => {
    const { page, limit, offset } = this.getPaginationParams(req);
    
    const enderecos = await Endereco.findAndCountAll({
      include: this.getDefaultIncludes(),
      limit,
      offset
    });
    
    this.sendPaginatedResponse(res, enderecos, page, limit);
  });

  listarEnderecosPorUsuario = asyncHandler(async (req, res) => {
    const { usuario_id } = req.params;
    
    const usuarioIdValidado = this.validateNumericId(usuario_id, 'ID do usuário');
    
    const usuario = await Usuario.findByPk(usuarioIdValidado);
    if (!usuario) {
      throw new ApiError('Usuário não encontrado', 404);
    }
    
    this.checkPermission(req.usuario.id, usuarioIdValidado);
    
    const enderecos = await Endereco.findAll({
      where: { usuario_id: usuarioIdValidado }
    });
    
    this.sendSuccess(res, enderecos, null, 200);
  });

  criarEndereco = asyncHandler(async (req, res) => {
    const { bairro, rua, cep, nro, complemento, usuario_id } = req.body;
    
    // Se há autenticação, usar o ID do usuário autenticado
    // Se não há autenticação, usar o usuario_id do body (para cadastro)
    const finalUsuarioId = req.usuario?.id || usuario_id;
    
    if (!cep || !Validators.isValidCEP(cep)) {
      throw new ApiError('CEP inválido. Use o formato 00000-000 ou 00000000', 400);
    }
    
    const validacao = Validators.validateAddressData({ bairro, rua, nro, complemento });
    if (!validacao.isValid) {
      const erros = Object.entries(validacao.errors)
        .map(([campo, msgs]) => `${campo}: ${msgs.join(', ')}`)
        .join('; ');
      throw new ApiError(erros, 400);
    }
    
    if (!finalUsuarioId) {
      throw new ApiError('ID do usuário é obrigatório', 400);
    }
    
    const usuario = await Usuario.findByPk(finalUsuarioId);
    if (!usuario) {
      throw new ApiError('Usuário não encontrado', 404);
    }
    
    try {
      const dadosCep = await this.processarDadosCep(cep);
      
      const dadosEndereco = {
        usuario_id: finalUsuarioId,
        bairro: validacao.sanitized.bairro || dadosCep.bairro,
        rua: validacao.sanitized.rua || dadosCep.rua,
        cep: dadosCep.cep,
        nro: validacao.sanitized.nro,
        complemento: validacao.sanitized.complemento,
        cidade: dadosCep.cidade,
        estado: dadosCep.estado,
        ibge: dadosCep.ibge
      };
      
      const endereco = await Endereco.create(dadosEndereco);
      
      this.sendSuccess(res, endereco, 'Endereço criado com sucesso', 201);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw handleSequelizeError(error);
    }
  });

  atualizarEndereco = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { bairro, rua, cep, nro, complemento } = req.body;
    
    const idValidado = this.validateNumericId(id, 'ID do endereço');
    
    if (cep && !Validators.isValidCEP(cep)) {
      throw new ApiError('CEP inválido. Use o formato 00000-000 ou 00000000', 400);
    }
    
    const validacao = Validators.validateAddressData({ bairro, rua, nro, complemento, cep });
    if (!validacao.isValid) {
      const erros = Object.entries(validacao.errors)
        .map(([campo, msgs]) => `${campo}: ${msgs.join(', ')}`)
        .join('; ');
      throw new ApiError(erros, 400);
    }
    
    const endereco = await this.verificarPermissaoEndereco(req.usuario.id, idValidado);
    
    try {
      const dadosAtualizacao = await this.construirDadosAtualizacao(
        { bairro: validacao.sanitized.bairro, rua: validacao.sanitized.rua, cep: validacao.sanitized.cep, nro: validacao.sanitized.nro, complemento: validacao.sanitized.complemento },
        endereco
      );
      
      await endereco.update(dadosAtualizacao);
      
      const enderecoAtualizado = await Endereco.findByPk(idValidado);
      
      this.sendSuccess(res, enderecoAtualizado, 'Endereço atualizado com sucesso');
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw handleSequelizeError(error);
    }
  });

  async construirDadosAtualizacao(dados, enderecoAtual) {
    const { bairro, rua, cep, nro, complemento } = dados;
    const dadosAtualizacao = {};
    
    if (cep && cep !== enderecoAtual.cep) {
      const dadosCep = await this.processarDadosCep(cep);
      
      Object.assign(dadosAtualizacao, {
        cep: dadosCep.cep,
        cidade: dadosCep.cidade,
        estado: dadosCep.estado,
        ibge: dadosCep.ibge
      });
      
      if (!bairro && dadosCep.bairro) {
        dadosAtualizacao.bairro = dadosCep.bairro;
      }
      if (!rua && dadosCep.rua) {
        dadosAtualizacao.rua = dadosCep.rua;
      }
    }
    
    if (bairro !== undefined) dadosAtualizacao.bairro = bairro;
    if (rua !== undefined) dadosAtualizacao.rua = rua;
    if (nro !== undefined) dadosAtualizacao.nro = nro;
    if (complemento !== undefined) dadosAtualizacao.complemento = complemento;
    
    return dadosAtualizacao;
  }

  excluirEndereco = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const idValidado = this.validateNumericId(id, 'ID do endereço');
    
    const endereco = await this.verificarPermissaoEndereco(req.usuario.id, idValidado);
    
    await endereco.destroy();
    
    this.sendSuccess(res, {}, 'Endereço excluído com sucesso');
  });

  buscarCep = asyncHandler(async (req, res) => {
    const { cep } = req.params;
    
    if (!cep || !Validators.isValidCEP(cep)) {
      throw new ApiError('CEP inválido. Use o formato 00000-000 ou 00000000', 400);
    }
    
    try {
      const dadosViaCep = await ViaCepService.consultarCep(cep);
      
      this.sendSuccess(res, dadosViaCep);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Erro ao consultar o CEP', 500);
    }
  });
}

module.exports = new EnderecoController();