const BaseController = require('./BaseController');
const Notificacao = require('../models/notificacaoModel');
const Usuario = require('../models/usuarioModel');
const { Op } = require('sequelize');

class NotificacaoController extends BaseController {
  async listarNotificacoes(req, res, next) {
    try {
      const usuarioId = req.userId;
      const { page, limit, offset } = this.getPaginationParams(req);
      const { lida } = req.query;

      const where = { usuario_id: usuarioId };
      
      if (lida !== undefined) {
        where.lida = lida === 'true';
      }

      const notificacoes = await Notificacao.findAndCountAll({
        where,
        include: [
          {
            model: Usuario,
            as: 'UsuarioOrigem',
            attributes: ['id', 'nome', 'foto_perfil']
          }
        ],
        order: [['data_hora', 'DESC']],
        limit,
        offset
      });

      this.sendPaginatedResponse(res, notificacoes, page, limit);
    } catch (error) {
      next(this.handleError(error));
    }
  }

  async buscarNotificacao(req, res, next) {
    try {
      const notificacaoId = this.validateNumericId(req.params.id, 'ID da notificação');
      const usuarioId = req.userId;

      const notificacao = await Notificacao.findOne({
        where: {
          id: notificacaoId,
          usuario_id: usuarioId
        },
        include: [
          {
            model: Usuario,
            as: 'UsuarioOrigem',
            attributes: ['id', 'nome', 'foto_perfil']
          }
        ]
      });

      if (!notificacao) {
        return next(this.handleError(new Error('Notificação não encontrada')));
      }

      this.sendSuccess(res, { notificacao });
    } catch (error) {
      next(this.handleError(error));
    }
  }

  async marcarComoLida(req, res, next) {
    try {
      const notificacaoId = this.validateNumericId(req.params.id, 'ID da notificação');
      const usuarioId = req.userId;

      const [updated] = await Notificacao.update(
        { lida: true },
        {
          where: {
            id: notificacaoId,
            usuario_id: usuarioId
          }
        }
      );

      if (!updated) {
        return next(this.handleError(new Error('Notificação não encontrada')));
      }

      this.sendSuccess(res, {}, 'Notificação marcada como lida');
    } catch (error) {
      next(this.handleError(error));
    }
  }

  async marcarTodasComoLidas(req, res, next) {
    try {
      const usuarioId = req.userId;

      await Notificacao.update(
        { lida: true },
        {
          where: {
            usuario_id: usuarioId,
            lida: false
          }
        }
      );

      this.sendSuccess(res, {}, 'Todas as notificações foram marcadas como lidas');
    } catch (error) {
      next(this.handleError(error));
    }
  }

  async contarNaoLidas(req, res, next) {
    try {
      const usuarioId = req.userId;

      const count = await Notificacao.count({
        where: {
          usuario_id: usuarioId,
          lida: false
        }
      });

      this.sendSuccess(res, { count });
    } catch (error) {
      next(this.handleError(error));
    }
  }

  async deletarNotificacao(req, res, next) {
    try {
      const notificacaoId = this.validateNumericId(req.params.id, 'ID da notificação');
      const usuarioId = req.userId;

      const deleted = await Notificacao.destroy({
        where: {
          id: notificacaoId,
          usuario_id: usuarioId
        }
      });

      if (!deleted) {
        return next(this.handleError(new Error('Notificação não encontrada')));
      }

      this.sendSuccess(res, {}, 'Notificação deletada com sucesso');
    } catch (error) {
      next(this.handleError(error));
    }
  }

  static async criarNotificacao(dados) {
    try {
      const notificacao = await Notificacao.create(dados);
      return notificacao;
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      return null;
    }
  }

  static async criarNotificacaoComentario(comentario, publicacao) {
    if (comentario.usuario_id === publicacao.usuario_id) return;

    const nomeUsuario = comentario.Usuario?.nome || comentario.usuario?.nome || 'Alguém';
    
    await this.criarNotificacao({
      usuario_id: publicacao.usuario_id,
      tipo: 'comentario',
      titulo: 'Novo comentário em sua publicação',
      mensagem: `${nomeUsuario} comentou em sua publicação "${publicacao.titulo}"`,
      publicacao_id: publicacao.id,
      comentario_id: comentario.id,
      usuario_origem_id: comentario.usuario_id
    });
  }

  static async criarNotificacaoCurtidaPublicacao(curtida, publicacao, usuario) {
    if (usuario.id === publicacao.usuario_id) return;

    await this.criarNotificacao({
      usuario_id: publicacao.usuario_id,
      tipo: 'curtida_publicacao',
      titulo: 'Nova curtida em sua publicação',
      mensagem: `${usuario.nome} curtiu sua publicação "${publicacao.titulo}"`,
      publicacao_id: publicacao.id,
      usuario_origem_id: usuario.id
    });
  }

  static async criarNotificacaoCurtidaComentario(curtida, comentario, usuario) {
    if (usuario.id === comentario.usuario_id) return;

    await this.criarNotificacao({
      usuario_id: comentario.usuario_id,
      tipo: 'curtida_comentario',
      titulo: 'Nova curtida em seu comentário',
      mensagem: `${usuario.nome} curtiu seu comentário`,
      comentario_id: comentario.id,
      usuario_origem_id: usuario.id
    });
  }

  static async criarNotificacaoSolicitacao(solicitacao, status) {
    const titulos = {
      'Em Análise': 'Solicitação em análise',
      'Aprovada': 'Solicitação aprovada',
      'Recusada': 'Solicitação recusada',
      'Concluída': 'Solicitação concluída'
    };

    const mensagens = {
      'Em Análise': 'Sua solicitação de peruca está sendo analisada',
      'Aprovada': 'Sua solicitação de peruca foi aprovada!',
      'Recusada': 'Infelizmente sua solicitação de peruca foi recusada',
      'Concluída': 'Sua solicitação de peruca foi concluída com sucesso!'
    };

    await this.criarNotificacao({
      usuario_id: solicitacao.pessoa_fisica_id,
      tipo: 'solicitacao',
      titulo: titulos[status] || 'Atualização de solicitação',
      mensagem: mensagens[status] || `Sua solicitação teve o status alterado para: ${status}`,
      solicitacao_id: solicitacao.id
    });
  }

  static async criarNotificacaoRecebimentoCabelo(recebimento, doador) {
    await this.criarNotificacao({
      usuario_id: recebimento.instituicao_id || recebimento.Instituicao?.id,
      tipo: 'recebimento_cabelo',
      titulo: 'Nova doação de cabelo recebida',
      mensagem: `${doador.nome} doou cabelo para sua instituição`,
      recebimento_id: recebimento.id,
      usuario_origem_id: doador.id
    });
  }

  static async criarNotificacaoAnaliseStatus(analise, status, nomeInstituicao) {
    const titulos = {
      'Pendente': 'Análise iniciada',
      'Em Análise': 'Análise em andamento',
      'Aprovada': 'Análise aprovada',
      'Recusada': 'Análise recusada'
    };

    const mensagens = {
      'Pendente': `${nomeInstituicao} iniciou a análise da sua solicitação de peruca`,
      'Em Análise': `${nomeInstituicao} está analisando sua solicitação de peruca`,
      'Aprovada': `${nomeInstituicao} aprovou sua solicitação de peruca!`,
      'Recusada': `${nomeInstituicao} recusou sua solicitação de peruca`
    };

    await this.criarNotificacao({
      usuario_id: analise.Solicitacao?.pessoa_fisica_id,
      tipo: 'analise_status',
      titulo: titulos[status] || 'Atualização de análise',
      mensagem: mensagens[status] || `${nomeInstituicao} atualizou o status da sua análise para: ${status}`,
      solicitacao_id: analise.solicitacao_id,
      usuario_origem_id: analise.instituicao_id
    });
  }
}

module.exports = NotificacaoController;