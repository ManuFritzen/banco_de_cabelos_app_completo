const { Peruca, TipoPeruca, Usuario, Cor } = require('../models');
const { ApiError, asyncHandler, handleSequelizeError } = require('../utils/errorHandler');
const { upload, fileToByteaBuffer } = require('../middlewares/uploadMiddleware');
const BaseController = require('./BaseController');
const { Validators } = require('../utils/validators');
const fs = require('fs').promises;
const path = require('path');

class PerucaController extends BaseController {
  static TIPO_INSTITUICAO = 'J';
  static TAMANHO_DEFAULT = 'M';
  getDefaultIncludes() {
    return [
      {
        model: TipoPeruca,
        attributes: ['id', 'nome', 'sigla']
      },
      {
        model: Usuario,
        as: 'Instituicao',
        attributes: ['id', 'nome', 'email', 'tipo']
      },
      {
        model: Cor,
        attributes: ['id', 'nome']
      }
    ];
  }

  construirFiltrosPeruca(query) {
    return Validators.validatePerucaFilters(query);
  }

  async verificarPermissaoPeruca(usuarioId, perucaOuId, tipoUsuario) {
    const peruca = typeof perucaOuId === 'object' 
      ? perucaOuId 
      : await Peruca.findByPk(perucaOuId);
    
    if (!peruca) {
      throw new ApiError('Peruca não encontrada', 404);
    }
    
    if (peruca.instituicao_id !== usuarioId && tipoUsuario !== PerucaController.TIPO_INSTITUICAO) {
      throw new ApiError('Você não tem permissão para acessar esta peruca', 403);
    }
    
    return peruca;
  }

  async validarEntidadesRelacionadas(dados, arquivo = null) {
    const { tipo_peruca_id, cor_id } = dados;
    
    try {
      if (tipo_peruca_id) {
        const tipoPeruca = await TipoPeruca.findByPk(tipo_peruca_id);
        if (!tipoPeruca) {
          throw new ApiError('Tipo de peruca não encontrado', 404);
        }
      }
      
      if (cor_id) {
        const cor = await Cor.findByPk(cor_id);
        if (!cor) {
          throw new ApiError('Cor não encontrada', 404);
        }
      }
    } catch (error) {
      if (arquivo) await this.removeUploadedFile(arquivo.path);
      throw error;
    }
  }

  async processarFotoPeruca(arquivo) {
    if (!arquivo) return null;
    
    try {
      const foto = fileToByteaBuffer(arquivo.path);
      await this.removeUploadedFile(arquivo.path);
      return foto;
    } catch (error) {
      await this.removeUploadedFile(arquivo.path);
      throw error;
    }
  }

  listarPerucas = asyncHandler(async (req, res) => {
    const { page, limit, offset } = this.getPaginationParams(req);
    const where = this.construirFiltrosPeruca(req.query);
    
    const perucas = await Peruca.findAndCountAll({
      where,
      include: this.getDefaultIncludes(),
      limit,
      offset,
      order: [['id', 'DESC']]
    });
    
    this.sendPaginatedResponse(res, perucas, page, limit);
  });

  obterPerucaPorId = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const idValidado = this.validateNumericId(id, 'ID da peruca');
    
    const peruca = await Peruca.findByPk(idValidado, {
      include: this.getDefaultIncludes()
    });
    
    if (!peruca) {
      throw new ApiError('Peruca não encontrada', 404);
    }
    
    // Converte para objeto plano para evitar referências circulares
    const perucaJson = peruca.toJSON();
    
    this.sendSuccess(res, perucaJson);
  });

  listarPerucasPorInstituicao = asyncHandler(async (req, res) => {
    const { instituicao_id } = req.params;
    
    const instituicaoIdValidado = this.validateNumericId(instituicao_id, 'ID da instituição');
    
    const instituicao = await Usuario.findByPk(instituicaoIdValidado);
    if (!instituicao) {
      throw new ApiError('Instituição não encontrada', 404);
    }
    
    if (instituicao.tipo !== PerucaController.TIPO_INSTITUICAO) {
      throw new ApiError('O ID fornecido não pertence a uma instituição', 400);
    }
    
    const { page, limit, offset } = this.getPaginationParams(req);
    
    const perucas = await Peruca.findAndCountAll({
      where: { instituicao_id: instituicaoIdValidado },
      include: [
        {
          model: TipoPeruca,
          attributes: ['id', 'nome', 'sigla']
        },
        {
          model: Cor,
          attributes: ['id', 'nome']
        }
      ],
      limit,
      offset,
      order: [['id', 'DESC']]
    });
    
    this.sendPaginatedResponse(res, perucas, page, limit);
  });

  criarPeruca = asyncHandler(async (req, res) => {
    upload.single('foto_peruca')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      
      try {
        await this.validarCriacaoPeruca(req);
        await this.validarEntidadesRelacionadas(req.body, req.file);
        
        const dadosPeruca = await this.construirDadosPeruca(req);
        const peruca = await Peruca.create(dadosPeruca);
        
        const perucaCompleta = await Peruca.findByPk(peruca.id, {
          include: this.getDefaultIncludes()
        });
        
        // Converte para objeto plano para evitar referências circulares
        const perucaJson = perucaCompleta.toJSON();
        
        this.sendSuccess(res, perucaJson, 'Peruca cadastrada com sucesso', 201);
      } catch (error) {
        if (req.file) await this.removeUploadedFile(req.file.path);
        throw handleSequelizeError(error);
      }
    });
  });

  async validarCriacaoPeruca(req) {
    if (req.usuario.tipo !== PerucaController.TIPO_INSTITUICAO) {
      throw new ApiError('Apenas instituições podem cadastrar perucas', 403);
    }
  }

  async construirDadosPeruca(req) {
    const { tipo_peruca_id, cor_id, comprimento, tamanho } = req.body;
    
    const validacao = Validators.validatePerucaData({ tipo_peruca_id, cor_id, comprimento, tamanho });
    if (!validacao.isValid) {
      const erros = Object.entries(validacao.errors)
        .map(([campo, msgs]) => `${campo}: ${msgs.join(', ')}`)
        .join('; ');
      throw new ApiError(erros, 400);
    }
    
    const foto = await this.processarFotoPeruca(req.file);
    
    return {
      tipo_peruca_id: validacao.sanitized.tipo_peruca_id || tipo_peruca_id,
      instituicao_id: req.usuario.id,
      cor_id: validacao.sanitized.cor_id || cor_id,
      comprimento: validacao.sanitized.comprimento || null,
      tamanho: validacao.sanitized.tamanho || PerucaController.TAMANHO_DEFAULT,
      foto
    };
  }

  atualizarPeruca = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const idValidado = this.validateNumericId(id, 'ID da peruca');
    
    const peruca = await this.verificarPermissaoPeruca(req.usuario.id, idValidado, req.usuario.tipo);
    
    // Verifica se é uma requisição multipart/form-data
    const contentType = req.headers['content-type'] || '';
    const isMultipart = contentType.includes('multipart/form-data');
    
    if (isMultipart) {
      // Se for multipart, processa com upload usando Promise
      return new Promise((resolve, reject) => {
        upload.single('foto_peruca')(req, res, async (err) => {
          if (err) {
            return res.status(400).json({
              success: false,
              message: err.message
            });
          }
          
          try {
            await this.validarEntidadesRelacionadas(req.body, req.file);
            
            const dadosAtualizacao = await this.construirDadosAtualizacao(req);
            await peruca.update(dadosAtualizacao);
            
            const perucaAtualizada = await Peruca.findByPk(idValidado, {
              include: this.getDefaultIncludes()
            });
            
            // Converte para objeto plano para evitar referências circulares
            const perucaJson = perucaAtualizada.toJSON();
            
            this.sendSuccess(res, perucaJson, 'Peruca atualizada com sucesso');
            resolve();
          } catch (error) {
            if (req.file) await this.removeUploadedFile(req.file.path);
            const erro = handleSequelizeError(error);
            res.status(erro.statusCode || 500).json({
              success: false,
              message: erro.message
            });
            reject(erro);
          }
        });
      });
    } else {
      // Se for JSON, processa diretamente
      try {
        await this.validarEntidadesRelacionadas(req.body);
        
        const dadosAtualizacao = await this.construirDadosAtualizacao(req);
        await peruca.update(dadosAtualizacao);
        
        const perucaAtualizada = await Peruca.findByPk(idValidado, {
          include: this.getDefaultIncludes()
        });
        
        // Converte para objeto plano para evitar referências circulares
        const perucaJson = perucaAtualizada.toJSON();
        
        this.sendSuccess(res, perucaJson, 'Peruca atualizada com sucesso');
      } catch (error) {
        throw handleSequelizeError(error);
      }
    }
  });

  async construirDadosAtualizacao(req) {
    const { tipo_peruca_id, cor_id, comprimento, tamanho, disponivel } = req.body;
    
    const validacao = Validators.validatePerucaData({ tipo_peruca_id, cor_id, comprimento, tamanho });
    if (!validacao.isValid) {
      const erros = Object.entries(validacao.errors)
        .map(([campo, msgs]) => `${campo}: ${msgs.join(', ')}`)
        .join('; ');
      throw new ApiError(erros, 400);
    }
    
    const dadosAtualizacao = {};
    
    if (tipo_peruca_id !== undefined && validacao.sanitized.tipo_peruca_id) {
      dadosAtualizacao.tipo_peruca_id = validacao.sanitized.tipo_peruca_id;
    }
    if (cor_id !== undefined && validacao.sanitized.cor_id) {
      dadosAtualizacao.cor_id = validacao.sanitized.cor_id;
    }
    if (comprimento !== undefined && validacao.sanitized.comprimento) {
      dadosAtualizacao.comprimento = validacao.sanitized.comprimento;
    }
    if (tamanho !== undefined && validacao.sanitized.tamanho) {
      dadosAtualizacao.tamanho = validacao.sanitized.tamanho;
    }
    if (disponivel !== undefined) {
      dadosAtualizacao.disponivel = disponivel === true || disponivel === 'true';
    }
    
    const foto = await this.processarFotoPeruca(req.file);
    if (foto) dadosAtualizacao.foto = foto;
    
    return dadosAtualizacao;
  }

  excluirPeruca = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const idValidado = this.validateNumericId(id, 'ID da peruca');
    
    const peruca = await this.verificarPermissaoPeruca(req.usuario.id, idValidado, req.usuario.tipo);
    
    await this.validarExclusaoPeruca(peruca);
    
    await peruca.destroy();
    
    this.sendSuccess(res, {}, 'Peruca excluída com sucesso');
  });

  async validarExclusaoPeruca(peruca) {
    const doacoes = await peruca.getDoacoes();
    if (doacoes && doacoes.length > 0) {
      throw new ApiError('Esta peruca não pode ser excluída pois já foi doada', 400);
    }
  }

  obterImagemPeruca = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const idValidado = this.validateNumericId(id, 'ID da peruca');
    
    const peruca = await Peruca.findByPk(idValidado, {
      attributes: ['foto']
    });
    
    if (!peruca || !peruca.foto) {
      throw new ApiError('Imagem não encontrada', 404);
    }
    
    res.set('Content-Type', 'image/jpeg'); 
    res.send(peruca.foto);
  });

  listarCores = asyncHandler(async (_req, res) => {
    const cores = await Cor.findAll({
      attributes: ['id', 'nome'],
      order: [['nome', 'ASC']]
    });
    
    this.sendSuccess(res, cores);
  });

  listarTiposPeruca = asyncHandler(async (_req, res) => {
    const tipos = await TipoPeruca.findAll({
      attributes: ['id', 'nome', 'sigla'],
      order: [['nome', 'ASC']]
    });
    
    this.sendSuccess(res, tipos);
  });

  criarPerucaBase64 = asyncHandler(async (req, res) => {
    try {
      this.checkPermission(
        req.usuario.tipo,
        PerucaController.TIPO_INSTITUICAO,
        req.usuario.tipo,
        [PerucaController.TIPO_INSTITUICAO]
      );
      
      const { tipo_peruca_id, cor_id, comprimento, tamanho, foto_peruca_base64 } = req.body;
      
      const validacao = Validators.validatePerucaData({ tipo_peruca_id, cor_id, comprimento, tamanho });
      if (!validacao.isValid) {
        const erros = Object.entries(validacao.errors)
          .map(([campo, msgs]) => `${campo}: ${msgs.join(', ')}`)
          .join('; ');
        throw new ApiError(erros, 400);
      }
      
      await this.validarEntidadesRelacionadas(req.body);
      
      let fotoBuffer = null;
      if (foto_peruca_base64) {
        try {
          const matches = foto_peruca_base64.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
          if (!matches) {
            throw new Error('Formato de imagem Base64 inválido');
          }
          
          const imageData = matches[2];
          fotoBuffer = Buffer.from(imageData, 'base64');
          
          if (fotoBuffer.length > 5 * 1024 * 1024) {
            throw new Error('A imagem é muito grande. Máximo permitido: 5MB');
          }
        } catch (erro) {
          throw new ApiError('Erro ao processar imagem: ' + erro.message, 400);
        }
      }
      
      const peruca = await Peruca.create({
        tipo_peruca_id: validacao.sanitized.tipo_peruca_id || tipo_peruca_id,
        instituicao_id: req.usuario.id,
        cor_id: validacao.sanitized.cor_id || cor_id,
        comprimento: validacao.sanitized.comprimento || null,
        tamanho: validacao.sanitized.tamanho || PerucaController.TAMANHO_DEFAULT,
        foto: fotoBuffer
      });
      
      this.sendSuccess(res, { 
        id: peruca.id 
      }, 'Peruca criada com sucesso', 201);
    } catch (erro) {
      throw erro;
    }
  });
}

module.exports = new PerucaController();