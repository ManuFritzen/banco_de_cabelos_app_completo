const BaseController = require('./BaseController');
const { Comentario, Publicacao, Usuario } = require('../models');
const { ApiError, asyncHandler } = require('../utils/errorHandler');
const { sequelize } = require('../../config/database');
const { QueryTypes } = require('sequelize');
const { Validators } = require('../utils/validators');
const NotificacaoController = require('./notificacaoController');

class ComentarioController extends BaseController {
  async verificarCurtida(comentarioId, usuarioId) {
    if (!usuarioId) return false;
    
    const curtida = await sequelize.query(
      'SELECT 1 FROM curtida_comentario WHERE comentario_id = :comentarioId AND usuario_id = :usuarioId',
      { 
        replacements: { comentarioId, usuarioId }, 
        type: QueryTypes.SELECT 
      }
    );
    
    return curtida.length > 0;
  }

  async adicionarInfoCurtida(comentarios, usuarioId) {
    if (Array.isArray(comentarios)) {
      return Promise.all(
        comentarios.map(async (comentario) => {
          const comentarioJSON = comentario.toJSON();
          comentarioJSON.curtiu = await this.verificarCurtida(comentario.id, usuarioId);
          return comentarioJSON;
        })
      );
    } else {
      const comentarioJSON = comentarios.toJSON();
      comentarioJSON.curtiu = await this.verificarCurtida(comentarios.id, usuarioId);
      return comentarioJSON;
    }
  }

  listarComentariosPorPublicacao = asyncHandler(async (req, res) => {
    const { publicacao_id } = req.params;
    const usuario_id = req.usuario?.id || null;
    const { page, limit, offset } = this.getPaginationParams(req);
    
    // Validar publicacao_id
    const publicacaoIdValidado = this.validateNumericId(publicacao_id, 'ID da publicação');
    
    const publicacao = await Publicacao.findByPk(publicacaoIdValidado);
    if (!publicacao) {
      throw new ApiError('Publicação não encontrada', 404);
    }
    
    const comentarios = await Comentario.findAndCountAll({
      where: { publicacao_id },
      include: [{
        model: Usuario,
        attributes: ['id', 'nome', 'tipo']
      }],
      order: [['data_hora', 'DESC']], 
      limit,
      offset
    });
    
    const comentariosComCurtidas = await this.adicionarInfoCurtida(comentarios.rows, usuario_id);
    
    return this.sendSuccess(res, {
      count: comentarios.count,
      totalPages: Math.ceil(comentarios.count / limit),
      currentPage: page,
      data: comentariosComCurtidas
    });
  });

  obterComentarioPorId = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const usuario_id = req.usuario?.id || null;
    
    const idValidado = this.validateNumericId(id, 'ID do comentário');
    
    const comentario = await Comentario.findByPk(idValidado, {
      include: [{
        model: Usuario,
        attributes: ['id', 'nome', 'tipo']
      }]
    });
    
    if (!comentario) {
      throw new ApiError('Comentário não encontrado', 404);
    }
    
    const comentarioComCurtida = await this.adicionarInfoCurtida(comentario, usuario_id);
    
    return this.sendSuccess(res, { data: comentarioComCurtida });
  });

  criarComentario = asyncHandler(async (req, res) => {
    const { publicacao_id } = req.params;
    const { conteudo } = req.body;
    const usuario_id = req.usuario.id;
    
    const publicacaoIdValidado = this.validateNumericId(publicacao_id, 'ID da publicação');
    
    if (!conteudo || Validators.isEmpty(conteudo.trim())) {
      throw new ApiError('Conteúdo do comentário é obrigatório', 400);
    }
    
    if (conteudo.trim().length > 500) {
      throw new ApiError('Conteúdo do comentário não pode ter mais de 500 caracteres', 400);
    }
    
    const publicacao = await Publicacao.findByPk(publicacaoIdValidado);
    if (!publicacao) {
      throw new ApiError('Publicação não encontrada', 404);
    }
    
    const comentario = await Comentario.create({
      publicacao_id: publicacaoIdValidado,
      usuario_id,
      conteudo: conteudo.trim(),
      data_hora: new Date(),
      qtd_curtidas: 0
    });
    
    const comentarioCompleto = await Comentario.findByPk(comentario.id, {
      include: [{
        model: Usuario,
        attributes: ['id', 'nome', 'tipo']
      }]
    });
    
    // Criar notificação para o autor da publicação (se não for o próprio)
    if (publicacao.usuario_id !== usuario_id) {
      await NotificacaoController.criarNotificacaoComentario(
        comentarioCompleto,
        publicacao
      );
    }
    
    return this.sendSuccess(res, { data: comentarioCompleto }, 'Comentário criado com sucesso', 201);
  });

  atualizarComentario = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { conteudo } = req.body;
    const usuario_id = req.usuario.id;
    
    const idValidado = this.validateNumericId(id, 'ID do comentário');
    
    if (!conteudo || Validators.isEmpty(conteudo.trim())) {
      throw new ApiError('Conteúdo do comentário é obrigatório', 400);
    }
    
    if (conteudo.trim().length > 500) {
      throw new ApiError('Conteúdo do comentário não pode ter mais de 500 caracteres', 400);
    }
    
    const comentario = await Comentario.findByPk(idValidado);
    if (!comentario) {
      throw new ApiError('Comentário não encontrado', 404);
    }
    
    if (!this.checkPermission(usuario_id, comentario.usuario_id)) {
      throw new ApiError('Você não tem permissão para editar este comentário', 403);
    }
    
    await comentario.update({ conteudo: conteudo.trim() });
    
    return this.sendSuccess(res, { data: comentario }, 'Comentário atualizado com sucesso');
  });

  excluirComentario = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const usuario_id = req.usuario.id;
    
    const idValidado = this.validateNumericId(id, 'ID do comentário');
    
    const comentario = await Comentario.findByPk(idValidado);
    if (!comentario) {
      throw new ApiError('Comentário não encontrado', 404);
    }
    
    const hasPermission = this.checkPermission(
      usuario_id, 
      comentario.usuario_id, 
      req.usuario.tipo,
      ['A']
    );
    
    if (!hasPermission) {
      throw new ApiError('Você não tem permissão para excluir este comentário', 403);
    }
    
    await comentario.destroy();
    
    return this.sendSuccess(res, { data: {} }, 'Comentário excluído com sucesso');
  });
}

module.exports = new ComentarioController();