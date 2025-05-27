const BaseController = require('./BaseController');
const { Doacao, Peruca, Solicitacao, Usuario, TipoPeruca, Cor, StatusSolicitacao, sequelize } = require('../models');
const { ApiError, asyncHandler } = require('../utils/errorHandler');
const { Op } = require('sequelize');
const { Validators } = require('../utils/validators');

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
    const { page, limit, offset } = this.getPaginationParams(req);
    const where = req.usuario.tipo === 'A' ? {} : await this.construirFiltrosListagem(req);
    
    const doacoes = await Doacao.findAndCountAll({
      where,
      include: this.getDefaultIncludes(),
      limit,
      offset,
      order: [['data_hora', 'DESC']]
    });
    
    return this.sendPaginatedResponse(res, doacoes, page, limit);
  });

  obterDoacaoPorId = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const idValidado = this.validateNumericId(id, 'ID da doação');
    
    const doacao = await Doacao.findByPk(idValidado, {
      include: this.getDefaultIncludes()
    });
    
    if (!doacao) {
      throw new ApiError('Doação não encontrada', 404);
    }
    
    const temPermissao = await this.verificarPermissaoDoacao(req, doacao);
    if (!temPermissao) {
      throw new ApiError('Você não tem permissão para visualizar esta doação', 403);
    }
    
    return this.sendSuccess(res, { data: doacao });
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
    const { peruca_id, solicitacao_id, observacao } = req.body;
    const instituicao_id = req.usuario.id;
    
    const perucaIdValidado = this.validateNumericId(peruca_id, 'ID da peruca');
    const solicitacaoIdValidado = this.validateNumericId(solicitacao_id, 'ID da solicitação');
    
    let observacaoSanitizada = null;
    if (observacao && !Validators.isEmpty(observacao.trim())) {
      observacaoSanitizada = this.sanitizeInput(observacao, { removeExtraSpaces: true });
      if (observacaoSanitizada.length > 500) {
        throw new ApiError('Observação não pode ter mais de 500 caracteres', 400);
      }
    }
    
    await this.validarCriacaoDoacao(perucaIdValidado, solicitacaoIdValidado, instituicao_id);
    
    const doacao = await sequelize.transaction(async (t) => {
      const novaDoacao = await Doacao.create({
        peruca_id: perucaIdValidado,
        solicitacao_id: solicitacaoIdValidado,
        instituicao_id,
        data_hora: new Date(),
        observacao: observacaoSanitizada
      }, { transaction: t });
      
      await Peruca.update(
        { disponivel: false }, 
        { where: { id: perucaIdValidado }, transaction: t }
      );
      
      return novaDoacao;
    });
    
    const doacaoCompleta = await Doacao.findByPk(doacao.id, {
      include: this.getDefaultIncludes()
    });
    
    return this.sendSuccess(res, { data: doacaoCompleta }, 'Doação registrada com sucesso', 201);
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
    const { id } = req.params;
    const { observacao } = req.body;
    
    const idValidado = this.validateNumericId(id, 'ID da doação');
    
    let observacaoSanitizada = null;
    if (observacao && !Validators.isEmpty(observacao.trim())) {
      observacaoSanitizada = this.sanitizeInput(observacao, { removeExtraSpaces: true });
      if (observacaoSanitizada.length > 500) {
        throw new ApiError('Observação não pode ter mais de 500 caracteres', 400);
      }
    }
    
    const doacao = await Doacao.findByPk(idValidado);
    if (!doacao) {
      throw new ApiError('Doação não encontrada', 404);
    }
    
    if (doacao.instituicao_id !== req.usuario.id) {
      throw new ApiError('Você não tem permissão para atualizar esta doação', 403);
    }
    
    await doacao.update({ observacao: observacaoSanitizada });
    
    const doacaoAtualizada = await Doacao.findByPk(idValidado, {
      include: this.getDefaultIncludes()
    });
    
    return this.sendSuccess(res, { data: doacaoAtualizada }, 'Doação atualizada com sucesso');
  });

  excluirDoacao = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const idValidado = this.validateNumericId(id, 'ID da doação');
    
    const doacao = await Doacao.findByPk(idValidado);
    if (!doacao) {
      throw new ApiError('Doação não encontrada', 404);
    }
    
    if (doacao.instituicao_id !== req.usuario.id) {
      throw new ApiError('Você não tem permissão para excluir esta doação', 403);
    }
    
    const horasDesdeDoacao = Math.abs(new Date() - new Date(doacao.data_hora)) / 36e5;
    if (horasDesdeDoacao > DoacaoController.HORAS_LIMITE_EXCLUSAO) {
      throw new ApiError(
        `Só é possível excluir doações realizadas nas últimas ${DoacaoController.HORAS_LIMITE_EXCLUSAO} horas`, 
        400
      );
    }

    await sequelize.transaction(async (t) => {
      const peruca = await Peruca.findByPk(doacao.peruca_id, { transaction: t });
      
      if (peruca) {
        await peruca.update({ disponivel: true }, { transaction: t });
      }
      
      await doacao.destroy({ transaction: t });
    });
    
    return this.sendSuccess(res, { data: {} }, 'Doação excluída com sucesso e peruca disponível novamente');
  });
}

module.exports = new DoacaoController();