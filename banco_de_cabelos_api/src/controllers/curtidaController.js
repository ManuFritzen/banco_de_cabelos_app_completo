const BaseController = require('./BaseController');
const { sequelize } = require('../../config/database');
const { asyncHandler, ApiError } = require('../utils/errorHandler');
const { Publicacao, Comentario } = require('../models');

class CurtidaController extends BaseController {
  async executarCurtida(tabela, campos, valores) {
    const placeholders = campos.map(campo => `:${campo}`).join(', ');
    const query = `INSERT INTO ${tabela} (${campos.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    
    const [result] = await sequelize.query(query, {
      replacements: valores,
      type: sequelize.QueryTypes.INSERT
    });
    
    return result[0];
  }

  async executarDescurtida(tabela, condicoes) {
    const whereClause = Object.keys(condicoes)
      .map(key => `${key} = :${key}`)
      .join(' AND ');
    
    const query = `DELETE FROM ${tabela} WHERE ${whereClause} RETURNING *`;
    
    const result = await sequelize.query(query, {
      replacements: condicoes,
      type: sequelize.QueryTypes.DELETE
    });
    
    return result[0];
  }

  async listarCurtidas(tabela, campoId, valorId) {
    const query = `
      SELECT u.id, u.nome, u.tipo, c.data_hora 
      FROM ${tabela} c 
      JOIN usuario u ON c.usuario_id = u.id 
      WHERE c.${campoId} = :valorId 
      ORDER BY c.data_hora DESC
    `;
    
    return await sequelize.query(query, {
      replacements: { valorId },
      type: sequelize.QueryTypes.SELECT
    });
  }

  curtirPublicacao = asyncHandler(async (req, res) => {
    const { publicacaoId } = req.params;
    const usuarioId = req.usuario.id;

    const publicacaoIdValidado = this.validateNumericId(publicacaoId, 'ID da publicação');
    
    const publicacao = await Publicacao.findByPk(publicacaoIdValidado);
    if (!publicacao) {
      throw new ApiError('Publicação não encontrada', 404);
    }

    try {
      const result = await this.executarCurtida(
        'curtida_publicacao',
        ['publicacao_id', 'usuario_id'],
        { publicacao_id: publicacaoIdValidado, usuario_id: usuarioId }
      );
      
      return this.sendSuccess(res, { data: result }, 'Publicação curtida com sucesso', 201);
    } catch (error) {
      if (error.original?.code === '23505') {
        return this.sendSuccess(res, { message: 'Você já curtiu esta publicação' }, null, 400);
      }
      throw error;
    }
  });

  descurtirPublicacao = asyncHandler(async (req, res) => {
    const { publicacaoId } = req.params;
    const usuarioId = req.usuario.id;

    const publicacaoIdValidado = this.validateNumericId(publicacaoId, 'ID da publicação');

    const result = await this.executarDescurtida('curtida_publicacao', {
      publicacao_id: publicacaoIdValidado,
      usuario_id: usuarioId
    });
    
    if (result.length === 0) {
      return this.sendSuccess(res, { message: 'Curtida não encontrada' }, null, 404);
    }

    return this.sendSuccess(res, { data: {} }, 'Curtida removida com sucesso');
  });

  listarCurtidasPublicacao = asyncHandler(async (req, res) => {
    const { publicacaoId } = req.params;
    
    const publicacaoIdValidado = this.validateNumericId(publicacaoId, 'ID da publicação');
    
    const result = await this.listarCurtidas(
      'curtida_publicacao',
      'publicacao_id',
      publicacaoIdValidado
    );
    
    return this.sendSuccess(res, { data: result });
  });

  curtirComentario = asyncHandler(async (req, res) => {
    const { comentarioId } = req.params;
    const usuarioId = req.usuario.id;

    const comentarioIdValidado = this.validateNumericId(comentarioId, 'ID do comentário');
    
    const comentario = await Comentario.findByPk(comentarioIdValidado);
    if (!comentario) {
      throw new ApiError('Comentário não encontrado', 404);
    }

    try {
      const result = await this.executarCurtida(
        'curtida_comentario',
        ['comentario_id', 'usuario_id'],
        { comentario_id: comentarioIdValidado, usuario_id: usuarioId }
      );
      
      return this.sendSuccess(res, { data: result }, 'Comentário curtido com sucesso', 201);
    } catch (error) {
      if (error.original?.code === '23505') {
        return this.sendSuccess(res, { message: 'Você já curtiu este comentário' }, null, 400);
      }
      throw error;
    }
  });

  descurtirComentario = asyncHandler(async (req, res) => {
    const { comentarioId } = req.params;
    const usuarioId = req.usuario.id;

    const comentarioIdValidado = this.validateNumericId(comentarioId, 'ID do comentário');

    const result = await this.executarDescurtida('curtida_comentario', {
      comentario_id: comentarioIdValidado,
      usuario_id: usuarioId
    });
    
    if (result.length === 0) {
      return this.sendSuccess(res, { message: 'Curtida não encontrada' }, null, 404);
    }

    return this.sendSuccess(res, { data: {} }, 'Curtida removida com sucesso');
  });

  listarCurtidasComentario = asyncHandler(async (req, res) => {
    const { comentarioId } = req.params;
    
    const comentarioIdValidado = this.validateNumericId(comentarioId, 'ID do comentário');
    
    const result = await this.listarCurtidas(
      'curtida_comentario',
      'comentario_id',
      comentarioIdValidado
    );
    
    return this.sendSuccess(res, { data: result });
  });
}

module.exports = new CurtidaController();