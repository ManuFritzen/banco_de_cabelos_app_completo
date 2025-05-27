const { Publicacao, Usuario, Comentario, AnexoPublicacao } = require('../models');
const { ApiError, asyncHandler, handleSequelizeError } = require('../utils/errorHandler');
const { sequelize } = require('../../config/database');
const { QueryTypes } = require('sequelize');
const BaseController = require('./BaseController');

class PublicacaoController extends BaseController {
  static LIMITE_COMENTARIOS_PREVIEW = 3;
  static TIPO_ADMIN = 'A';
  static QTD_CURTIDAS_INICIAL = 0;
  getDefaultIncludes() {
    return [
      {
        model: Usuario,
        attributes: ['id', 'nome', 'tipo']
      },
      {
        model: Comentario,
        limit: PublicacaoController.LIMITE_COMENTARIOS_PREVIEW,
        order: [['data_hora', 'DESC']],
        include: [
          {
            model: Usuario,
            attributes: ['id', 'nome']
          }
        ]
      },
      {
        model: AnexoPublicacao,
        attributes: ['id']
      }
    ];
  }

  async verificarPermissaoPublicacao(usuarioId, publicacaoOuId, tipoUsuario = null) {
    const publicacao = typeof publicacaoOuId === 'object' 
      ? publicacaoOuId 
      : await Publicacao.findByPk(publicacaoOuId);
    
    if (!publicacao) {
      throw new ApiError('Publicação não encontrada', 404);
    }
    
    if (publicacao.usuario_id !== usuarioId && tipoUsuario !== PublicacaoController.TIPO_ADMIN) {
      throw new ApiError('Você não tem permissão para acessar esta publicação', 403);
    }
    
    return publicacao;
  }

  async verificarCurtida(publicacaoId, usuarioId) {
    if (!usuarioId) return false;
    
    const curtidaExistente = await sequelize.query(
      'SELECT 1 FROM curtida_publicacao WHERE publicacao_id = :publicacaoId AND usuario_id = :usuarioId',
      { 
        replacements: { publicacaoId, usuarioId }, 
        type: QueryTypes.SELECT 
      }
    );
    
    return curtidaExistente.length > 0;
  }

  async adicionarInfoPublicacao(publicacao, usuarioId, incluirContagem = false) {
    const publicacaoJSON = publicacao.toJSON();
    
    publicacaoJSON.curtiu = await this.verificarCurtida(publicacao.id, usuarioId);
    
    if (incluirContagem) {
      publicacaoJSON.comentarios_count = await Comentario.count({
        where: { publicacao_id: publicacao.id }
      });
    }
    
    return publicacaoJSON;
  }

  listarPublicacoes = asyncHandler(async (req, res) => {
    const { page, limit, offset } = this.getPaginationParams(req);
    const includeComentariosCount = req.query.includeComentariosCount === 'true';
    const usuarioId = req.usuario ? req.usuario.id : null;

    const publicacoes = await Publicacao.findAndCountAll({
      include: this.getDefaultIncludes(),
      order: [['data_hora', 'DESC']],
      limit,
      offset
    });

    const publicacoesProcessadas = await Promise.all(
      publicacoes.rows.map(publicacao => 
        this.adicionarInfoPublicacao(publicacao, usuarioId, includeComentariosCount)
      )
    );

    this.sendPaginatedResponse(res, {
      ...publicacoes,
      rows: publicacoesProcessadas
    }, page, limit);
  });

  obterPublicacaoPorId = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const includeComentariosCount = req.query.includeComentariosCount === 'true';
    const usuarioId = req.usuario ? req.usuario.id : null;

    const publicacao = await Publicacao.findByPk(id, {
      include: [
        {
          model: Usuario,
          attributes: ['id', 'nome', 'tipo']
        },
        {
          model: Comentario,
          include: [
            {
              model: Usuario,
              attributes: ['id', 'nome']
            }
          ],
          order: [['data_hora', 'DESC']]
        },
        {
          model: AnexoPublicacao,
          attributes: ['id']
        }
      ]
    });

    if (!publicacao) {
      throw new ApiError('Publicação não encontrada', 404);
    }

    const publicacaoProcessada = await this.adicionarInfoPublicacao(
      publicacao, 
      usuarioId, 
      includeComentariosCount
    );

    this.sendSuccess(res, publicacaoProcessada);
  });

  criarPublicacao = asyncHandler(async (req, res) => {
    const { titulo, conteudo } = req.body;
    const usuario_id = req.usuario.id;
    
    try {
      const dadosPublicacao = {
        titulo,
        conteudo,
        usuario_id,
        data_hora: new Date(),
        qtd_curtidas: PublicacaoController.QTD_CURTIDAS_INICIAL
      };
      
      const publicacao = await Publicacao.create(dadosPublicacao);
      
      this.sendSuccess(res, publicacao, 'Publicação criada com sucesso', 201);
    } catch (error) {
      throw handleSequelizeError(error);
    }
  });

  atualizarPublicacao = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { titulo, conteudo } = req.body;
    
    const publicacao = await this.verificarPermissaoPublicacao(
      req.usuario.id, 
      id,
      req.usuario.tipo
    );
    
    try {
      await publicacao.update({ titulo, conteudo });
      
      this.sendSuccess(res, publicacao, 'Publicação atualizada com sucesso');
    } catch (error) {
      throw handleSequelizeError(error);
    }
  });

  excluirPublicacao = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const publicacao = await this.verificarPermissaoPublicacao(
      req.usuario.id, 
      id, 
      req.usuario.tipo
    );
    
    await publicacao.destroy();
    
    this.sendSuccess(res, {}, 'Publicação excluída com sucesso');
  });
}

module.exports = new PublicacaoController();