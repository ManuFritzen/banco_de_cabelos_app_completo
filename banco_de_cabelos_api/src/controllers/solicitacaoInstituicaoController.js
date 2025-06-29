const { SolicitacaoInstituicao, Solicitacao, Usuario, StatusSolicitacao } = require('../models');
const { ApiError, asyncHandler, handleSequelizeError } = require('../utils/errorHandler');
const BaseController = require('./BaseController');
const NotificacaoController = require('./notificacaoController');

class SolicitacaoInstituicaoController extends BaseController {
  static TIPO_INSTITUICAO = 'J';
  static STATUS_PENDENTE = 1;
  static STATUS_EM_ANALISE = 2;
  static STATUS_APROVADA = 3;
  static STATUS_RECUSADA = 4;
  static STATUS_CONCLUIDA = 5;

  getDefaultIncludes() {
    return [
      {
        model: Solicitacao,
        as: 'Solicitacao',
        include: [
          {
            model: Usuario,
            as: 'PessoaFisica',
            attributes: ['id', 'nome', 'email', 'telefone']
          }
        ]
      },
      {
        model: Usuario,
        as: 'Instituicao',
        attributes: ['id', 'nome', 'email']
      },
      {
        model: StatusSolicitacao,
        as: 'StatusSolicitacao',
        attributes: ['id', 'nome']
      }
    ];
  }

  // Criar uma análise de solicitação para uma instituição
  analisarSolicitacao = asyncHandler(async (req, res) => {
    const { solicitacao_id } = req.params;
    const { observacoes } = req.body;
    const instituicao_id = req.usuario.id;

    // Verificar se o usuário é uma instituição
    if (req.usuario.tipo !== SolicitacaoInstituicaoController.TIPO_INSTITUICAO) {
      throw new ApiError('Apenas instituições podem analisar solicitações', 403);
    }

    const solicitacaoIdValidado = this.validateNumericId(solicitacao_id, 'ID da solicitação');

    // Verificar se a solicitação existe
    const solicitacao = await Solicitacao.findByPk(solicitacaoIdValidado);
    if (!solicitacao) {
      throw new ApiError('Solicitação não encontrada', 404);
    }

    // Verificar se a instituição já analisou esta solicitação
    const analiseExistente = await SolicitacaoInstituicao.findOne({
      where: {
        solicitacao_id: solicitacaoIdValidado,
        instituicao_id: instituicao_id
      }
    });

    if (analiseExistente) {
      throw new ApiError('Esta instituição já analisou esta solicitação', 400);
    }

    // Criar a análise
    const novaAnalise = await SolicitacaoInstituicao.create({
      solicitacao_id: solicitacaoIdValidado,
      instituicao_id: instituicao_id,
      status_solicitacao_id: SolicitacaoInstituicaoController.STATUS_PENDENTE,
      observacoes: observacoes || null,
      data_analise: new Date()
    });

    // Buscar a análise criada com todos os includes
    const analiseCompleta = await SolicitacaoInstituicao.findByPk(novaAnalise.id, {
      include: this.getDefaultIncludes()
    });

    const analiseJson = analiseCompleta.toJSON();
    this.sendSuccess(res, analiseJson, 'Solicitação adicionada para análise com sucesso', 201);
  });

  // Atualizar status de uma análise
  atualizarStatusAnalise = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status_solicitacao_id, observacoes } = req.body;
    const instituicao_id = req.usuario.id;

    if (req.usuario.tipo !== SolicitacaoInstituicaoController.TIPO_INSTITUICAO) {
      throw new ApiError('Apenas instituições podem atualizar análises', 403);
    }

    const idValidado = this.validateNumericId(id, 'ID da análise');

    // Buscar a análise
    const analise = await SolicitacaoInstituicao.findByPk(idValidado);
    if (!analise) {
      throw new ApiError('Análise não encontrada', 404);
    }

    // Verificar se a instituição é dona da análise
    if (analise.instituicao_id !== instituicao_id) {
      throw new ApiError('Você não tem permissão para atualizar esta análise', 403);
    }

    // Validar status
    if (![SolicitacaoInstituicaoController.STATUS_PENDENTE, 
          SolicitacaoInstituicaoController.STATUS_EM_ANALISE,
          SolicitacaoInstituicaoController.STATUS_APROVADA, 
          SolicitacaoInstituicaoController.STATUS_RECUSADA,
          SolicitacaoInstituicaoController.STATUS_CONCLUIDA].includes(parseInt(status_solicitacao_id))) {
      throw new ApiError('Status inválido', 400);
    }

    // Atualizar a análise
    await analise.update({
      status_solicitacao_id: parseInt(status_solicitacao_id),
      observacoes: observacoes || analise.observacoes,
      data_atualizacao: new Date()
    });

    // Buscar a análise atualizada
    const analiseAtualizada = await SolicitacaoInstituicao.findByPk(idValidado, {
      include: this.getDefaultIncludes()
    });

    // Criar notificação para o solicitante sobre a atualização de status
    try {
      const statusNomes = {
        1: 'Pendente',
        2: 'Em Análise', 
        3: 'Aprovada',
        4: 'Recusada',
        5: 'Concluída'
      };
      
      const statusNome = statusNomes[parseInt(status_solicitacao_id)] || 'Atualizada';
      const nomeInstituicao = analiseAtualizada.Instituicao?.nome || 'Uma instituição';
      
      await NotificacaoController.criarNotificacaoAnaliseStatus(
        analiseAtualizada.toJSON(),
        statusNome,
        nomeInstituicao
      );
    } catch (erroNotificacao) {
      console.error('Erro ao criar notificação de análise:', erroNotificacao);
      // Não falha a operação principal se a notificação falhar
    }

    const analiseJson = analiseAtualizada.toJSON();
    this.sendSuccess(res, analiseJson, 'Status da análise atualizado com sucesso');
  });

  // Listar análises de uma instituição
  listarAnalisesPorInstituicao = asyncHandler(async (req, res) => {
    const { page, limit, offset } = this.getPaginationParams(req);
    const instituicao_id = req.usuario.id;

    if (req.usuario.tipo !== SolicitacaoInstituicaoController.TIPO_INSTITUICAO) {
      throw new ApiError('Apenas instituições podem ver suas análises', 403);
    }

    const analises = await SolicitacaoInstituicao.findAndCountAll({
      where: { instituicao_id: instituicao_id },
      include: this.getDefaultIncludes(),
      limit,
      offset,
      order: [['data_analise', 'DESC']]
    });

    this.sendPaginatedResponse(res, analises, page, limit);
  });

  // Obter detalhes de uma análise específica
  obterAnalise = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const instituicao_id = req.usuario.id;

    if (req.usuario.tipo !== SolicitacaoInstituicaoController.TIPO_INSTITUICAO) {
      throw new ApiError('Apenas instituições podem ver análises', 403);
    }

    const idValidado = this.validateNumericId(id, 'ID da análise');

    const analise = await SolicitacaoInstituicao.findByPk(idValidado, {
      include: this.getDefaultIncludes()
    });

    if (!analise) {
      throw new ApiError('Análise não encontrada', 404);
    }

    // Verificar se a instituição é dona da análise
    if (analise.instituicao_id !== instituicao_id) {
      throw new ApiError('Você não tem permissão para ver esta análise', 403);
    }

    const analiseJson = analise.toJSON();
    this.sendSuccess(res, analiseJson);
  });

  // Remover uma análise (se ainda estiver pendente)
  removerAnalise = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const instituicao_id = req.usuario.id;

    if (req.usuario.tipo !== SolicitacaoInstituicaoController.TIPO_INSTITUICAO) {
      throw new ApiError('Apenas instituições podem remover análises', 403);
    }

    const idValidado = this.validateNumericId(id, 'ID da análise');

    const analise = await SolicitacaoInstituicao.findByPk(idValidado);
    if (!analise) {
      throw new ApiError('Análise não encontrada', 404);
    }

    // Verificar se a instituição é dona da análise
    if (analise.instituicao_id !== instituicao_id) {
      throw new ApiError('Você não tem permissão para remover esta análise', 403);
    }

    // Só pode remover se estiver pendente
    if (analise.status_solicitacao_id !== SolicitacaoInstituicaoController.STATUS_PENDENTE) {
      throw new ApiError('Só é possível remover análises pendentes', 400);
    }

    await analise.destroy();
    this.sendSuccess(res, {}, 'Análise removida com sucesso');
  });
}

module.exports = new SolicitacaoInstituicaoController();