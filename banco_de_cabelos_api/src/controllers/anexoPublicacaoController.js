const BaseController = require('./BaseController');
const { AnexoPublicacao, Publicacao } = require('../models');
const { ApiError, asyncHandler } = require('../utils/errorHandler');
const { upload, fileToByteaBuffer } = require('../middlewares/uploadMiddleware');
const fs = require('fs');
const { Validators } = require('../utils/validators');

class AnexoPublicacaoController extends BaseController {
  listarAnexosPorPublicacao = asyncHandler(async (req, res) => {
    const { publicacao_id } = req.params;
    
    if (!publicacao_id || !Validators.PATTERNS.ONLY_NUMBERS.test(publicacao_id)) {
      throw new ApiError('ID da publicação inválido', 400);
    }
    
    const publicacao = await Publicacao.findByPk(publicacao_id);
    if (!publicacao) {
      throw new ApiError('Publicação não encontrada', 404);
    }
    
    const anexos = await AnexoPublicacao.findAll({
      where: { publicacao_id },
      attributes: ['id', 'publicacao_id']
    });
    
    return this.sendSuccess(res, { 
      count: anexos.length,
      data: anexos 
    });
  });

  obterAnexoPorId = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    if (!id || !Validators.PATTERNS.ONLY_NUMBERS.test(id)) {
      throw new ApiError('ID do anexo inválido', 400);
    }
    
    const anexo = await AnexoPublicacao.findByPk(id);
    if (!anexo) {
      throw new ApiError('Anexo não encontrado', 404);
    }
    
    res.set('Content-Type', 'image/jpeg'); 
    res.status(200).send(anexo.foto);
  });

  adicionarAnexo = asyncHandler(async (req, res) => {
    upload.single('foto_anexo')(req, res, async (err) => {
      if (err) {
        return this.sendSuccess(res, { message: err.message }, null, 400);
      }
      
      if (!req.file) {
        return this.sendSuccess(res, { message: 'Nenhum arquivo enviado' }, null, 400);
      }
      
      const { publicacao_id } = req.params;
      const usuario_id = req.usuario.id;
      
      try {
        if (!publicacao_id || !Validators.PATTERNS.ONLY_NUMBERS.test(publicacao_id)) {
          await this.removeUploadedFile(req.file.path);
          throw new ApiError('ID da publicação inválido', 400);
        }
        
        const publicacao = await Publicacao.findByPk(publicacao_id);
        if (!publicacao) {
          await this.removeUploadedFile(req.file.path);
          throw new ApiError('Publicação não encontrada', 404);
        }
        
        const hasPermission = this.checkPermission(
          usuario_id, 
          publicacao.usuario_id, 
          req.usuario.tipo,
          [] 
        );
        
        if (!hasPermission) {
          await this.removeUploadedFile(req.file.path);
          throw new ApiError('Você não tem permissão para adicionar anexos a esta publicação', 403);
        }
        
        const fileBuffer = fileToByteaBuffer(req.file.path);
        
        const anexo = await AnexoPublicacao.create({
          publicacao_id,
          foto: fileBuffer
        });
        
        await this.removeUploadedFile(req.file.path);
        
        return this.sendSuccess(res, {
          data: {
            id: anexo.id,
            publicacao_id: anexo.publicacao_id
          }
        }, 'Anexo adicionado com sucesso', 201);
        
      } catch (error) {
        await this.removeUploadedFile(req.file.path);
        throw error;
      }
    });
  });

  adicionarAnexoBase64 = asyncHandler(async (req, res) => {
    const { publicacao_id } = req.params;
    const { foto_anexo, filename } = req.body;
    const usuario_id = req.usuario.id;
    
    try {
      if (!publicacao_id || !Validators.PATTERNS.ONLY_NUMBERS.test(publicacao_id)) {
        throw new ApiError('ID da publicação inválido', 400);
      }
      
      if (!foto_anexo || !foto_anexo.startsWith('data:')) {
        throw new ApiError('Imagem inválida', 400);
      }
      
      const publicacao = await Publicacao.findByPk(publicacao_id);
      if (!publicacao) {
        throw new ApiError('Publicação não encontrada', 404);
      }
      
      const hasPermission = this.checkPermission(
        usuario_id, 
        publicacao.usuario_id, 
        req.usuario.tipo,
        []
      );
      
      if (!hasPermission) {
        throw new ApiError('Você não tem permissão para adicionar anexos a esta publicação', 403);
      }
      
      const matches = foto_anexo.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        throw new ApiError('Formato de imagem inválido', 400);
      }
      
      const imageBuffer = Buffer.from(matches[2], 'base64');
      
      const anexo = await AnexoPublicacao.create({
        publicacao_id,
        foto: imageBuffer
      });
      
      return this.sendSuccess(res, {
        data: {
          id: anexo.id,
          publicacao_id: anexo.publicacao_id
        }
      }, 'Anexo adicionado com sucesso', 201);
      
    } catch (error) {
      throw error;
    }
  });

  excluirAnexo = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const usuario_id = req.usuario.id;
    
    if (!id || !Validators.PATTERNS.ONLY_NUMBERS.test(id)) {
      throw new ApiError('ID do anexo inválido', 400);
    }
    
    const anexo = await AnexoPublicacao.findByPk(id);
    if (!anexo) {
      throw new ApiError('Anexo não encontrado', 404);
    }
    
    const publicacao = await Publicacao.findByPk(anexo.publicacao_id);
    
    const hasPermission = this.checkPermission(
      usuario_id, 
      publicacao.usuario_id, 
      req.usuario.tipo,
      [] 
    );
    
    if (!hasPermission) {
      throw new ApiError('Você não tem permissão para excluir este anexo', 403);
    }
    
    await anexo.destroy();
    
    return this.sendSuccess(res, { data: {} }, 'Anexo excluído com sucesso');
  });
}

module.exports = new AnexoPublicacaoController();