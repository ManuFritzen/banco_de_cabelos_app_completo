const BaseController = require('./BaseController');
const { Doacao, Peruca, Solicitacao, Usuario, TipoPeruca, Cor, StatusSolicitacao, sequelize } = require('../models');
const { ApiError, asyncHandler } = require('../utils/errorHandler');
const { Op } = require('sequelize');
const { Validators } = require('../utils/validators');
const DoacaoService = require('../services/DoacaoService');
const DoacaoView = require('../views/DoacaoView');

class DoacaoController extends BaseController {
  static HORAS_LIMITE_EXCLUSAO = 24;
  static STATUS_PENDENTE = 1;
  static STATUS_EM_ANALISE = 2;
  static STATUS_APROVADA = 'Aprovada';

  getDefaultIncludes() {
    return [
      {
        model: Peruca,
        include: [
          { model: TipoPeruca, attributes: ['id', 'nome', 'sigla'] },
          { model: Cor, attributes: ['id', 'nome'] }
        ]
      },
      {
        model: Solicitacao,
        include: [
          { model: Usuario, as: 'PessoaFisica', attributes: ['id', 'nome', 'email', 'tipo'] }
        ]
      },
      {
        model: Usuario,
        as: 'Instituicao',
        attributes: ['id', 'nome', 'email', 'tipo']
      }
    ];
  }

  async verificarPermissaoDoacao(req, doacaoOuId) {
    const doacao = typeof doacaoOuId === 'object' 
      ? doacaoOuId 
      : await Doacao.findByPk(doacaoOuId, {
          include: [{
            model: Solicitacao,
            include: [{ model: Usuario, as: 'PessoaFisica', attributes: ['id'] }]
          }]
        });

    if (!doacao) {
      throw new ApiError('Doação não encontrada', 404);
    }

    const { id: usuarioId, tipo } = req.usuario;
    const ehInstituicaoDoadora = tipo === 'J' && usuarioId === doacao.instituicao_id;
    const ehPessoaFisicaReceptora = tipo === 'F' && 
      doacao.Solicitacao?.PessoaFisica?.id === usuarioId;

    return this.checkPermission(
      usuarioId,
      ehInstituicaoDoadora || ehPessoaFisicaReceptora ? usuarioId : null,
      tipo,
      ['A']
    );
  }

  async construirFiltrosListagem(req) {
    const where = {};
    
    if (req.usuario.tipo === 'J') {
      where.instituicao_id = req.usuario.id;
    } else if (req.usuario.tipo === 'F') {
      const solicitacoesIds = await Solicitacao.findAll({
        where: { pessoa_fisica_id: req.usuario.id },
        attributes: ['id']
      }).then(sols => sols.map(s => s.id));
      
      where.solicitacao_id = { [Op.in]: solicitacoesIds };
    }
    
    return where;
  }

  listarDoacoes = asyncHandler(async (req, res) => {
    try {
      const { page, limit, offset } = this.getPaginationParams(req);
      const paginacao = { limit, offset };
      
      const doacoes = await DoacaoService.listarDoacoes(req.usuario, paginacao);
      const view = DoacaoView.paginated(doacoes, page, limit);
      return res.status(200).json(view);
    } catch (error) {
      return this.handleControllerError(error, res);
    }
  });

  obterDoacaoPorId = asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const doacao = await DoacaoService.obterDoacaoCompleta(id, req.usuario);
      const view = DoacaoView.single(doacao);
      return res.status(200).json(view);
    } catch (error) {
      return this.handleControllerError(error, res);
    }
  });

  obterDoacoesPorInstituicao = asyncHandler(async (req, res) => {
    const { instituicao_id } = req.params;
    const { page, limit, offset } = this.getPaginationParams(req);
    
    const instituicaoIdValidado = this.validateNumericId(instituicao_id, 'ID da instituição');
    
    const instituicao = await Usuario.findOne({
      where: { id: instituicaoIdValidado, tipo: 'J' }
    });
    
    if (!instituicao) {
      throw new ApiError('Instituição não encontrada', 404);
    }
    
    const hasPermission = this.checkPermission(
      req.usuario.id,
      instituicaoIdValidado,
      req.usuario.tipo,
      ['A']
    );
    
    if (!hasPermission) {
      throw new ApiError('Você não tem permissão para visualizar estas doações', 403);
    }
    
    const doacoes = await Doacao.findAndCountAll({
      where: { instituicao_id: instituicaoIdValidado },
      include: this.getDefaultIncludes(),
      limit,
      offset,
      order: [['data_hora', 'DESC']]
    });
    
    return this.sendPaginatedResponse(res, doacoes, page, limit);
  });

  obterDoacoesPorSolicitacao = asyncHandler(async (req, res) => {
    const { solicitacao_id } = req.params;
    
    const solicitacaoIdValidado = this.validateNumericId(solicitacao_id, 'ID da solicitação');
    
    const solicitacao = await Solicitacao.findByPk(solicitacaoIdValidado, {
      include: [{ model: Usuario, as: 'PessoaFisica', attributes: ['id'] }]
    });
    
    if (!solicitacao) {
      throw new ApiError('Solicitação não encontrada', 404);
    }
    
    const ehPessoaFisica = req.usuario.tipo === 'F' && 
      req.usuario.id === solicitacao.PessoaFisica.id;
    
    const ehInstituicaoComDoacao = req.usuario.tipo === 'J' && 
      await Doacao.findOne({
        where: { solicitacao_id: solicitacaoIdValidado, instituicao_id: req.usuario.id }
      });
    
    if (!this.checkPermission(req.usuario.id, null, req.usuario.tipo, ['A']) && 
        !ehPessoaFisica && !ehInstituicaoComDoacao) {
      throw new ApiError('Você não tem permissão para visualizar estas doações', 403);
    }
    
    const doacoes = await Doacao.findAll({
      where: { solicitacao_id: solicitacaoIdValidado },
      include: this.getDefaultIncludes(),
      order: [['data_hora', 'DESC']]
    });
    
    return this.sendSuccess(res, { count: doacoes.length, data: doacoes });
  });

  criarDoacao = asyncHandler(async (req, res) => {
    try {
      const dadosDoacao = {
        peruca_id: this.validateNumericId(req.body.peruca_id, 'ID da peruca'),
        solicitacao_id: this.validateNumericId(req.body.solicitacao_id, 'ID da solicitação'),
        observacao: req.body.observacao
      };
      
      const doacao = await DoacaoService.criarDoacao(dadosDoacao, req.usuario.id);
      const view = DoacaoView.created(doacao);
      return res.status(201).json(view);
    } catch (error) {
      return this.handleControllerError(error, res);
    }
  });

  async validarCriacaoDoacao(peruca_id, solicitacao_id, instituicao_id) {
    const peruca = await Peruca.findByPk(peruca_id);
    if (!peruca) {
      throw new ApiError('Peruca não encontrada', 404);
    }
    
    if (peruca.instituicao_id !== instituicao_id) {
      throw new ApiError('Você só pode doar perucas cadastradas pela sua instituição', 403);
    }
    
    if (!peruca.disponivel) {
      throw new ApiError('Esta peruca já foi doada e não está mais disponível', 400);
    }
    
    const doacaoExistente = await Doacao.findOne({ where: { peruca_id } });
    if (doacaoExistente) {
      throw new ApiError('Esta peruca já foi doada', 400);
    }
    
    const solicitacao = await Solicitacao.findByPk(solicitacao_id, {
      include: [{ model: StatusSolicitacao, attributes: ['nome'] }]
    });
    
    if (!solicitacao) {
      throw new ApiError('Solicitação não encontrada', 404);
    }
    
    if (solicitacao.StatusSolicitacao.nome !== DoacaoController.STATUS_APROVADA) {
      throw new ApiError('Só é possível doar para solicitações aprovadas', 400);
    }
  }

  atualizarDoacao = asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      const dadosAtualizacao = { observacao: req.body.observacao };
      
      const doacao = await DoacaoService.atualizarDoacao(id, dadosAtualizacao, req.usuario.id);
      const view = DoacaoView.updated(doacao);
      return res.status(200).json(view);
    } catch (error) {
      return this.handleControllerError(error, res);
    }
  });

  excluirDoacao = asyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      await DoacaoService.excluirDoacao(id, req.usuario.id);
      const view = DoacaoView.deleted();
      return res.status(200).json(view);
    } catch (error) {
      return this.handleControllerError(error, res);
    }
  });
}

module.exports = new DoacaoController();