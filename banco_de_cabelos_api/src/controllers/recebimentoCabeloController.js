const { Cabelo, Recebimento, Usuario, Cor } = require('../models');
const { ApiError, asyncHandler, handleSequelizeError } = require('../utils/errorHandler');
const { upload, fileToByteaBuffer } = require('../middlewares/uploadMiddleware');
const { sequelize } = require('../../config/database');
const BaseController = require('./BaseController');
const { Validators } = require('../utils/validators');
const fs = require('fs').promises;
const path = require('path');

class RecebimentoCabeloController extends BaseController {
  static TIPO_PESSOA_FISICA = 'F';
  static TIPO_INSTITUICAO = 'J';
  static TIPO_ADMIN = 'A';
  getDefaultIncludes() {
    return [
      {
        model: Cabelo,
        include: [
          {
            model: Cor,
            attributes: ['id', 'nome']
          }
        ]
      },
      {
        model: Usuario,
        as: 'Instituicao',
        attributes: ['id', 'nome', 'email', 'tipo']
      },
      {
        model: Usuario,
        as: 'PessoaFisica',
        attributes: ['id', 'nome', 'email', 'tipo', 'telefone']
      }
    ];
  }

  async validarDoacaoCabelo(req) {
    const { cor_id, instituicao_id, peso, comprimento, observacao } = req.body;
    
    if (req.usuario.tipo !== RecebimentoCabeloController.TIPO_PESSOA_FISICA) {
      throw new ApiError('Apenas pessoas físicas podem doar cabelo', 403);
    }

    const validacao = Validators.validateCabeloData({ peso, comprimento, cor_id, instituicao_id, observacao });
    if (!validacao.isValid) {
      const erros = Object.entries(validacao.errors)
        .map(([campo, msgs]) => `${campo}: ${msgs.join(', ')}`)
        .join('; ');
      throw new ApiError(erros, 400);
    }

    const instituicao = await Usuario.findByPk(validacao.sanitized.instituicao_id || instituicao_id);
    if (!instituicao) {
      throw new ApiError('Instituição não encontrada', 404);
    }

    if (instituicao.tipo !== RecebimentoCabeloController.TIPO_INSTITUICAO) {
      throw new ApiError('O ID fornecido não pertence a uma instituição', 400);
    }

    if (validacao.sanitized.cor_id) {
      const cor = await Cor.findByPk(validacao.sanitized.cor_id);
      if (!cor) {
        throw new ApiError('Cor não encontrada', 404);
      }
    }

    return validacao.sanitized;
  }

  async processarFotoCabelo(arquivo) {
    if (!arquivo) return null;
    
    try {
      const foto = fileToByteaBuffer(arquivo.path);
      await this.removeUploadedFile(arquivo.path);
      return foto;
    } catch (error) {
      await this.removeUploadedFile(arquivo.path);
      throw error;
    }
  }

  construirDadosCabelo(dadosValidados, foto) {
    return {
      peso: dadosValidados.peso || null,
      comprimento: dadosValidados.comprimento || null,
      cor_id: dadosValidados.cor_id || null,
      foto
    };
  }

  construirDadosRecebimento(cabeloId, req, dadosValidados) {
    return {
      cabelo_id: cabeloId,
      instituicao_id: dadosValidados.instituicao_id,
      pessoa_fisica_id: req.usuario.id,
      data_hora: new Date(),
      observacao: dadosValidados.observacao || null
    };
  }

  async verificarPermissaoImagem(req, recebimento) {
    const isPessoaFisica = req.usuario.id === recebimento.pessoa_fisica_id;
    const isInstituicao = req.usuario.tipo === RecebimentoCabeloController.TIPO_INSTITUICAO;
    
    if (!isPessoaFisica && !isInstituicao) {
      throw new ApiError('Você não tem permissão para acessar a imagem', 403);
    }
  }

  criarDoacaoCabelo = asyncHandler(async (req, res) => {
    upload.single('foto_cabelo')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }

      try {
        const dadosValidados = await this.validarDoacaoCabelo(req);
        
        const foto = await this.processarFotoCabelo(req.file);
        const dadosCabelo = this.construirDadosCabelo(dadosValidados, foto);
        
        const result = await sequelize.transaction(async (t) => {
          const cabelo = await Cabelo.create(dadosCabelo, { transaction: t });
          
          const dadosRecebimento = this.construirDadosRecebimento(cabelo.id, req, dadosValidados);
          const recebimento = await Recebimento.create(dadosRecebimento, { transaction: t });

          return { cabelo, recebimento };
        });

        const recebimentoCompleto = await Recebimento.findByPk(result.recebimento.id, {
          include: this.getDefaultIncludes()
        });

        this.sendSuccess(res, recebimentoCompleto, 'Doação de cabelo registrada com sucesso', 201);
      } catch (error) {
        if (req.file) await this.removeUploadedFile(req.file.path);
        throw handleSequelizeError(error);
      }
    });
  });

  listarTodasDoacoesCabelo = asyncHandler(async (req, res) => {
    const { page, limit, offset } = this.getPaginationParams(req);

    this.checkPermission(
      req.usuario.tipo, 
      RecebimentoCabeloController.TIPO_ADMIN,
      req.usuario.tipo,
      [RecebimentoCabeloController.TIPO_ADMIN]
    );

    const doacoes = await Recebimento.findAndCountAll({
      include: this.getDefaultIncludes(),
      order: [['data_hora', 'DESC']],
      limit,
      offset
    });
    
    this.sendPaginatedResponse(res, doacoes, page, limit);
  });

  listarMeusRecebimentosDeCabelos = asyncHandler(async (req, res) => {
    const instituicao_id = req.usuario.id;
    const { page, limit, offset } = this.getPaginationParams(req);

    this.checkPermission(
      req.usuario.tipo,
      RecebimentoCabeloController.TIPO_INSTITUICAO,
      req.usuario.tipo,
      [RecebimentoCabeloController.TIPO_INSTITUICAO]
    );

    const recebimentos = await Recebimento.findAndCountAll({
      where: { instituicao_id },
      include: [
        {
          model: Cabelo,
          include: [
            {
              model: Cor,
              attributes: ['id', 'nome']
            }
          ]
        },
        {
          model: Usuario,
          as: 'PessoaFisica',
          attributes: ['id', 'nome', 'email', 'tipo', 'telefone']
        }
      ],
      order: [['data_hora', 'DESC']],
      limit,
      offset
    });
    
    this.sendPaginatedResponse(res, recebimentos, page, limit);
  });

  listarMinhasDoacoesCabelo = asyncHandler(async (req, res) => {
    const pessoa_fisica_id = req.usuario.id;
    const { page, limit, offset } = this.getPaginationParams(req);

    this.checkPermission(
      req.usuario.tipo,
      RecebimentoCabeloController.TIPO_PESSOA_FISICA,
      req.usuario.tipo,
      [RecebimentoCabeloController.TIPO_PESSOA_FISICA]
    );

    const recebimentos = await Recebimento.findAndCountAll({
      where: { pessoa_fisica_id },
      include: [
        {
          model: Cabelo,
          include: [
            {
              model: Cor,
              attributes: ['id', 'nome']
            }
          ]
        },
        {
          model: Usuario,
          as: 'Instituicao',
          attributes: ['id', 'nome', 'email', 'tipo']
        }
      ],
      order: [['data_hora', 'DESC']],
      limit,
      offset
    });

    this.sendPaginatedResponse(res, recebimentos, page, limit);
  });

  obterImagemCabelo = asyncHandler(async (req, res) => {
    const cabeloId = req.params.id;

    const cabeloIdValidado = this.validateNumericId(cabeloId, 'ID do cabelo');

    const cabelo = await Cabelo.findByPk(cabeloIdValidado);
    if (!cabelo || !cabelo.foto) {
      throw new ApiError('Cabelo não encontrado ou sem foto', 404);
    }

    const recebimento = await Recebimento.findOne({
      where: { cabelo_id: cabeloIdValidado },
      include: [
        {
          model: Usuario,
          as: 'Instituicao',
          attributes: ['id', 'nome', 'email', 'tipo']
        }
      ]
    });

    await this.verificarPermissaoImagem(req, recebimento);

    res.set('Content-Type', 'image/jpeg');
    res.send(cabelo.foto);
  });

  criarDoacaoCabeloBase64 = asyncHandler(async (req, res) => {
    const t = await sequelize.transaction();
    
    try {
      await this.validarDoacaoCabelo(req);
      
      const { cor_id, instituicao_id, peso, comprimento, observacao, foto_cabelo_base64 } = req.body;
      
      let fotoBuffer = null;
      if (foto_cabelo_base64) {
        try {
          const matches = foto_cabelo_base64.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
          if (!matches) {
            throw new Error('Formato de imagem Base64 inválido');
          }
          
          const imageData = matches[2];
          fotoBuffer = Buffer.from(imageData, 'base64');
          
          if (fotoBuffer.length > 5 * 1024 * 1024) {
            throw new Error('A imagem é muito grande. Máximo permitido: 5MB');
          }
        } catch (erro) {
          throw new ApiError('Erro ao processar imagem: ' + erro.message, 400);
        }
      }
      
      const cabelo = await Cabelo.create({
        peso: peso || 0,
        comprimento,
        cor_id,
        observacao,
        foto: fotoBuffer
      }, { transaction: t });
      
      const recebimento = await Recebimento.create({
        cabelo_id: cabelo.id,
        instituicao_id,
        pessoa_fisica_id: req.usuario.id,
        data_hora: new Date()
      }, { transaction: t });
      
      await t.commit();
      
      this.sendSuccess(res, { 
        id: recebimento.id,
        cabelo_id: cabelo.id 
      }, 'Doação de cabelo registrada com sucesso', 201);
    } catch (erro) {
      await t.rollback();
      throw erro;
    }
  });
}

module.exports = new RecebimentoCabeloController();