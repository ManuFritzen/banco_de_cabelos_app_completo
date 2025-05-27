const { Solicitacao, StatusSolicitacao, Usuario } = require('../models');
const { ApiError, asyncHandler, handleSequelizeError } = require('../utils/errorHandler');
const jwt = require('jsonwebtoken');
const { upload, fileToByteaBuffer } = require('../middlewares/uploadMiddleware');
const BaseController = require('./BaseController');
const { Validators } = require('../utils/validators');

class SolicitacaoController extends BaseController {
  static TIPO_PESSOA_FISICA = 'F';
  static TIPO_INSTITUICAO = 'J';
  static STATUS_PENDENTE = 1;
  static STATUS_EM_ANALISE = 2;
  getDefaultIncludes() {
    return [
      {
        model: StatusSolicitacao,
        attributes: ['id', 'nome']
      }
    ];
  }

  construirFiltrosSolicitacao(query) {
    return Validators.validateSolicitacaoFilters(query);
  }

  async verificarPermissaoSolicitacao(usuarioId, solicitacaoOuId, tipoUsuario) {
    const solicitacao = typeof solicitacaoOuId === 'object' 
      ? solicitacaoOuId 
      : await Solicitacao.findByPk(solicitacaoOuId);
    
    if (!solicitacao) {
      throw new ApiError('Solicitação não encontrada', 404);
    }
    
    const usuarioIdNum = parseInt(usuarioId, 10);
    const solicitanteIdNum = parseInt(solicitacao.pessoa_fisica_id, 10);
    
    if (usuarioIdNum !== solicitanteIdNum && tipoUsuario !== SolicitacaoController.TIPO_INSTITUICAO) {
      throw new ApiError('Você não tem permissão para acessar esta solicitação', 403);
    }
    
    return solicitacao;
  }

  async processarLaudoMedico(arquivo) {
    if (!arquivo) {
      throw new ApiError('O laudo médico é obrigatório', 400);
    }
    
    try {
      const foto = fileToByteaBuffer(arquivo.path);
      await this.removeUploadedFile(arquivo.path);
      return foto;
    } catch (error) {
      await this.removeUploadedFile(arquivo.path);
      throw error;
    }
  }

  async buscarSolicitacaoCompleta(id) {
    try {
      const solicitacao = await Solicitacao.findByPk(id, {
        include: this.getDefaultIncludes()
      });
      
      if (!solicitacao) {
        console.log(`Solicitação com ID ${id} não encontrada no banco`);
      }
      
      return solicitacao;
    } catch (error) {
      console.error('Erro ao buscar solicitação completa:', error);
      throw error;
    }
  }

  listarSolicitacoes = asyncHandler(async (req, res) => {
    const { page, limit, offset } = this.getPaginationParams(req);
    const where = this.construirFiltrosSolicitacao(req.query);
    
    const solicitacoes = await Solicitacao.findAndCountAll({
      where,
      include: this.getDefaultIncludes(),
      order: [['data_hora', 'DESC']],
      limit,
      offset
    });
    
    this.sendPaginatedResponse(res, solicitacoes, page, limit);
  });

  obterSolicitacaoPorId = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const idValidado = this.validateNumericId(id, 'ID da solicitação');
    
    const solicitacao = await this.buscarSolicitacaoCompleta(idValidado);
    
    if (!solicitacao) {
      throw new ApiError('Solicitação não encontrada', 404);
    }
    
    await this.verificarPermissaoSolicitacao(
      req.usuario.id, 
      solicitacao, 
      req.usuario.tipo
    );
    
    const solicitacaoJSON = JSON.parse(JSON.stringify(solicitacao));
    
    this.sendSuccess(res, solicitacaoJSON);
  });

  listarSolicitacoesPorUsuario = asyncHandler(async (req, res) => {
    const { usuario_id } = req.params;
    const { page, limit, offset } = this.getPaginationParams(req);
    
    const usuarioIdValidado = this.validateNumericId(usuario_id, 'ID do usuário');
    
    const usuario = await Usuario.findByPk(usuarioIdValidado);
    if (!usuario) {
      throw new ApiError('Usuário não encontrado', 404);
    }
    
    if (usuario.tipo !== SolicitacaoController.TIPO_PESSOA_FISICA) {
      throw new ApiError('O ID fornecido não pertence a uma pessoa física', 400);
    }
    
    this.checkPermission(
      parseInt(req.usuario.id), 
      usuarioIdValidado,
      req.usuario.tipo,
      [SolicitacaoController.TIPO_INSTITUICAO]
    );
    
    const solicitacoes = await Solicitacao.findAndCountAll({
      where: { pessoa_fisica_id: usuarioIdValidado },
      include: [
        {
          model: StatusSolicitacao,
          attributes: ['id', 'nome']
        }
      ],
      order: [['data_hora', 'DESC']],
      limit,
      offset
    });
    
    this.sendPaginatedResponse(res, solicitacoes, page, limit);
  });

  criarSolicitacao = asyncHandler(async (req, res) => {
    upload.single('foto_laudo_medico')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      
      try {
        await this.validarCriacaoSolicitacao(req);
        
        const foto_laudo_medico = await this.processarLaudoMedico(req.file);
        
        const validacao = Validators.validateSolicitacaoData({ observacao: req.body.observacao });
        if (!validacao.isValid) {
          const erros = Object.entries(validacao.errors)
            .map(([campo, msgs]) => `${campo}: ${msgs.join(', ')}`)
            .join('; ');
          throw new ApiError(erros, 400);
        }
        
        const dadosSolicitacao = {
          pessoa_fisica_id: req.usuario.id,
          status_solicitacao_id: SolicitacaoController.STATUS_PENDENTE,
          foto_laudo_medico,
          observacao: validacao.sanitized.observacao || null
        };
        
        const solicitacao = await Solicitacao.create(dadosSolicitacao);
        const solicitacaoCompleta = await this.buscarSolicitacaoCompleta(solicitacao.id);
        
        const solicitacaoJSON = JSON.parse(JSON.stringify(solicitacaoCompleta));
        
        this.sendSuccess(res, solicitacaoJSON, 'Solicitação criada com sucesso', 201);
      } catch (error) {
        if (req.file) await this.removeUploadedFile(req.file.path);
        throw handleSequelizeError(error);
      }
    });
  });

  async validarCriacaoSolicitacao(req) {
    if (req.usuario.tipo !== SolicitacaoController.TIPO_PESSOA_FISICA) {
      throw new ApiError('Apenas pessoas físicas podem fazer solicitações', 403);
    }
  }

  atualizarStatusSolicitacao = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status_solicitacao_id, observacao } = req.body;
    
    const idValidado = this.validateNumericId(id, 'ID da solicitação');
    
    const validacao = Validators.validateSolicitacaoData({ status_solicitacao_id, observacao });
    if (!validacao.isValid) {
      const erros = Object.entries(validacao.errors)
        .map(([campo, msgs]) => `${campo}: ${msgs.join(', ')}`)
        .join('; ');
      throw new ApiError(erros, 400);
    }
    
    const solicitacao = await Solicitacao.findByPk(idValidado);
    if (!solicitacao) {
      throw new ApiError('Solicitação não encontrada', 404);
    }
    
    this.checkPermission(
      req.usuario.tipo,
      SolicitacaoController.TIPO_INSTITUICAO,
      req.usuario.tipo,
      [SolicitacaoController.TIPO_INSTITUICAO]
    );
    
    await this.validarStatusSolicitacao(validacao.sanitized.status_solicitacao_id || status_solicitacao_id);
    
    try {
      await solicitacao.update({
        status_solicitacao_id: validacao.sanitized.status_solicitacao_id || status_solicitacao_id,
        observacao: validacao.sanitized.observacao !== undefined ? validacao.sanitized.observacao : solicitacao.observacao
      });
      
      const solicitacaoAtualizada = await this.buscarSolicitacaoCompleta(idValidado);
      
      const solicitacaoJSON = JSON.parse(JSON.stringify(solicitacaoAtualizada));
      
      this.sendSuccess(res, solicitacaoJSON, 'Status da solicitação atualizado com sucesso');
    } catch (error) {
      throw handleSequelizeError(error);
    }
  });

  async validarStatusSolicitacao(statusId) {
    const statusSolicitacao = await StatusSolicitacao.findByPk(statusId);
    if (!statusSolicitacao) {
      throw new ApiError('Status de solicitação inválido', 400);
    }
  }

  atualizarObservacaoSolicitacao = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { observacao } = req.body;
    
    const idValidado = this.validateNumericId(id, 'ID da solicitação');
    
    const validacao = Validators.validateSolicitacaoData({ observacao });
    if (!validacao.isValid) {
      const erros = Object.entries(validacao.errors)
        .map(([campo, msgs]) => `${campo}: ${msgs.join(', ')}`)
        .join('; ');
      throw new ApiError(erros, 400);
    }
    
    const solicitacao = await this.verificarPermissaoSolicitacao(
      req.usuario.id,
      idValidado,
      null
    );
    
    try {
      await solicitacao.update({ observacao: validacao.sanitized.observacao });
      
      const solicitacaoAtualizada = await this.buscarSolicitacaoCompleta(idValidado);
      
      const solicitacaoJSON = JSON.parse(JSON.stringify(solicitacaoAtualizada));
      
      this.sendSuccess(res, solicitacaoJSON, 'Observação da solicitação atualizada com sucesso');
    } catch (error) {
      throw handleSequelizeError(error);
    }
  });

  excluirSolicitacao = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const idValidado = this.validateNumericId(id, 'ID da solicitação');
    
    const solicitacao = await Solicitacao.findByPk(idValidado, {
      include: [
        {
          model: StatusSolicitacao,
          attributes: ['id', 'nome']
        }
      ]
    });
    
    if (!solicitacao) {
      throw new ApiError('Solicitação não encontrada', 404);
    }
    
    await this.validarExclusaoSolicitacao(solicitacao);
    
    this.checkPermission(req.usuario.id, solicitacao.pessoa_fisica_id);
    
    try {
      await solicitacao.destroy();
      
      this.sendSuccess(res, {}, 'Solicitação excluída com sucesso');
    } catch (error) {
      throw handleSequelizeError(error);
    }
  });

  async validarExclusaoSolicitacao(solicitacao) {
    if (solicitacao.status_solicitacao_id > SolicitacaoController.STATUS_EM_ANALISE) {
      throw new ApiError('Solicitações já aprovadas, concluídas ou recusadas não podem ser excluídas', 400);
    }
  }

  obterImagemLaudoMedico = async (req, res) => {
    try {
      const { id } = req.params;
      
      let idValidado;
      try {
        idValidado = this.validateNumericId(id, 'ID da solicitação');
      } catch (error) {
        return res.status(400).json({ 
          success: false, 
          message: error.message 
        });
      }
      
      const token = this.extrairToken(req);
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Autenticação necessária para acessar este recurso'
        });
      }
      
      const { usuarioId, tipoUsuario } = await this.decodificarToken(token, res);
      if (!usuarioId) return;
      
      const solicitacao = await Solicitacao.findByPk(idValidado, {
        attributes: ['id', 'pessoa_fisica_id', 'foto_laudo_medico']
      });
      
      if (!solicitacao) {
        return res.status(404).json({
          success: false,
          message: 'Solicitação não encontrada'
        });
      }
      
      if (!solicitacao.foto_laudo_medico || solicitacao.foto_laudo_medico.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Laudo médico não encontrado'
        });
      }
      
      const temPermissao = await this.verificarPermissaoLaudo(
        usuarioId, 
        solicitacao.pessoa_fisica_id, 
        tipoUsuario
      );
      
      if (!temPermissao) {
        return res.status(403).json({
          success: false,
          message: 'Você não tem permissão para acessar este laudo'
        });
      }
      
      res.set('Content-Type', 'image/jpeg');
      res.set('Cache-Control', 'no-cache');
      return res.send(solicitacao.foto_laudo_medico);
      
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao processar a solicitação',
        error: error.message
      });
    }
  };

  extrairToken(req) {
    let token = req.query.token;
    
    if (!token && req.headers.authorization) {
      token = req.headers.authorization.replace('Bearer ', '');
    }
    
    return token;
  }

  async decodificarToken(token, res) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return {
        usuarioId: parseInt(decoded.id, 10),
        tipoUsuario: decoded.tipo
      };
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
      return {};
    }
  }

  criarSolicitacaoBase64 = asyncHandler(async (req, res) => {
    const { observacao, foto_laudo_medico, filename, status_solicitacao_id } = req.body;
    const pessoa_fisica_id = req.usuario.id;
    
    if (req.usuario.tipo !== SolicitacaoController.TIPO_PESSOA_FISICA) {
      throw new ApiError('Apenas pessoas físicas podem criar solicitações', 403);
    }
    
    if (!foto_laudo_medico || !foto_laudo_medico.startsWith('data:')) {
      throw new ApiError('Laudo médico é obrigatório', 400);
    }
    
    try {
      const matches = foto_laudo_medico.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new ApiError('Formato de imagem inválido', 400);
      }
      
      const imageBuffer = Buffer.from(matches[2], 'base64');
      
      const validacao = Validators.validateSolicitacaoData({ observacao });
      
      const dadosSolicitacao = {
        pessoa_fisica_id,
        status_solicitacao_id: status_solicitacao_id || 1,
        observacao: validacao.sanitized.observacao || observacao || '',
        foto_laudo_medico: imageBuffer
      };
      
      const solicitacao = await Solicitacao.create(dadosSolicitacao);
      const solicitacaoCompleta = await this.buscarSolicitacaoCompleta(solicitacao.id);
      
      const solicitacaoJSON = JSON.parse(JSON.stringify(solicitacaoCompleta));
      
      this.sendSuccess(res, solicitacaoJSON, 'Solicitação criada com sucesso', 201);
    } catch (error) {
      throw error;
    }
  });

  async verificarPermissaoLaudo(usuarioId, pessoaFisicaId, tipoUsuario) {
    const pessoaFisicaIdNum = parseInt(pessoaFisicaId, 10);
    const ehProprioUsuario = usuarioId === pessoaFisicaIdNum;
    const ehInstituicao = tipoUsuario === SolicitacaoController.TIPO_INSTITUICAO;
    
    return ehProprioUsuario || ehInstituicao;
  }
}

module.exports = new SolicitacaoController();