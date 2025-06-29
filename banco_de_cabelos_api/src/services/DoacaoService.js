const BaseService = require('./BaseService');
const { Doacao, Peruca, Solicitacao, Usuario, TipoPeruca, Cor, StatusSolicitacao } = require('../models');
const { ApiError } = require('../utils/errorHandler');
const { Validators } = require('../utils/validators');
const { Op } = require('sequelize');

class DoacaoService extends BaseService {
  static HORAS_LIMITE_EXCLUSAO = 24;
  static STATUS_APROVADA = 'Aprovada';

  constructor() {
    super(Doacao);
  }

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

  async listarDoacoes(usuario, paginacao) {
    const where = await this.construirFiltrosPorUsuario(usuario);
    
    return await this.findAll({
      where,
      include: this.getDefaultIncludes(),
      ...paginacao,
      order: [['data_hora', 'DESC']]
    });
  }

  async obterDoacaoCompleta(id, usuario) {
    const doacao = await this.findById(id, {
      include: this.getDefaultIncludes()
    });

    await this.verificarPermissaoVisualizacao(usuario, doacao);
    
    return doacao;
  }

  async criarDoacao(dadosDoacao, instituicaoId) {
    const { peruca_id, solicitacao_id, observacao } = dadosDoacao;
    
    const observacaoSanitizada = this.processarObservacao(observacao);
    
    await this.validarCriacaoDoacao(peruca_id, solicitacao_id, instituicaoId);
    
    return await this.executeInTransaction(async (transaction) => {
      const novaDoacao = await this.create({
        peruca_id,
        solicitacao_id,
        instituicao_id: instituicaoId,
        data_hora: new Date(),
        observacao: observacaoSanitizada
      }, { transaction });
      
      await Peruca.update(
        { disponivel: false }, 
        { where: { id: peruca_id }, transaction }
      );
      
      return await this.findById(novaDoacao.id, {
        include: this.getDefaultIncludes()
      });
    });
  }

  async atualizarDoacao(id, dadosAtualizacao, instituicaoId) {
    const { observacao } = dadosAtualizacao;
    const observacaoSanitizada = this.processarObservacao(observacao);
    
    const doacao = await this.findById(id);
    
    if (doacao.instituicao_id !== instituicaoId) {
      throw new ApiError('Você não tem permissão para atualizar esta doação', 403);
    }
    
    await doacao.update({ observacao: observacaoSanitizada });
    
    return await this.findById(id, {
      include: this.getDefaultIncludes()
    });
  }

  async excluirDoacao(id, instituicaoId) {
    const doacao = await this.findById(id);
    
    if (doacao.instituicao_id !== instituicaoId) {
      throw new ApiError('Você não tem permissão para excluir esta doação', 403);
    }
    
    this.validarPrazoExclusao(doacao);
    
    return await this.executeInTransaction(async (transaction) => {
      const peruca = await Peruca.findByPk(doacao.peruca_id, { transaction });
      
      if (peruca) {
        await peruca.update({ disponivel: true }, { transaction });
      }
      
      await doacao.destroy({ transaction });
    });
  }

  async construirFiltrosPorUsuario(usuario) {
    const where = {};
    
    if (usuario.tipo === 'J') {
      where.instituicao_id = usuario.id;
    } else if (usuario.tipo === 'F') {
      const solicitacoes = await Solicitacao.buscarPorUsuario(usuario.id, {
        attributes: ['id']
      });
      const solicitacoesIds = solicitacoes.map(s => s.id);
      
      where.solicitacao_id = { [Op.in]: solicitacoesIds };
    }
    
    return where;
  }

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
    
    const doacaoExistente = await Doacao.buscarPorPeruca(peruca_id);
    if (doacaoExistente) {
      throw new ApiError('Esta peruca já foi doada', 400);
    }
    
    const solicitacao = await Solicitacao.findByPk(solicitacao_id, {
      include: [{ model: StatusSolicitacao, attributes: ['nome'] }]
    });
    
    if (!solicitacao) {
      throw new ApiError('Solicitação não encontrada', 404);
    }
    
    if (solicitacao.StatusSolicitacao.nome !== DoacaoService.STATUS_APROVADA) {
      throw new ApiError('Só é possível doar para solicitações aprovadas', 400);
    }
  }

  async verificarPermissaoVisualizacao(usuario, doacao) {
    const { id: usuarioId, tipo } = usuario;
    const ehInstituicaoDoadora = tipo === 'J' && usuarioId === doacao.instituicao_id;
    const ehPessoaFisicaReceptora = tipo === 'F' && 
      doacao.Solicitacao?.PessoaFisica?.id === usuarioId;
    const ehAdmin = tipo === 'A';

    if (!ehInstituicaoDoadora && !ehPessoaFisicaReceptora && !ehAdmin) {
      throw new ApiError('Você não tem permissão para visualizar esta doação', 403);
    }
  }

  processarObservacao(observacao) {
    if (!observacao || Validators.isEmpty(observacao.trim())) {
      return null;
    }
    
    const observacaoSanitizada = Validators.sanitizeInput(observacao, { removeExtraSpaces: true });
    
    if (observacaoSanitizada.length > 500) {
      throw new ApiError('Observação não pode ter mais de 500 caracteres', 400);
    }
    
    return observacaoSanitizada;
  }

  validarPrazoExclusao(doacao) {
    const horasDesdeDoacao = Math.abs(new Date() - new Date(doacao.data_hora)) / 36e5;
    if (horasDesdeDoacao > DoacaoService.HORAS_LIMITE_EXCLUSAO) {
      throw new ApiError(
        `Só é possível excluir doações realizadas nas últimas ${DoacaoService.HORAS_LIMITE_EXCLUSAO} horas`, 
        400
      );
    }
  }
}

module.exports = new DoacaoService();