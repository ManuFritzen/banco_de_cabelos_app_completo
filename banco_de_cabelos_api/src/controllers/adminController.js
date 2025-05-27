const BaseController = require('./BaseController');
const { Usuario, sequelize } = require('../models');
const { ApiError, asyncHandler } = require('../utils/errorHandler');
const { Validators } = require('../utils/validators');

class AdminController extends BaseController {
  criarSuperAdmin = asyncHandler(async (req, res) => {
    const { nome, email, senha, telefone } = req.body;
    
    const nomeValidation = Validators.validateName(nome);
    if (!nomeValidation.isValid) {
      throw new ApiError(nomeValidation.errors.join(', '), 400);
    }
    
    if (!Validators.isValidEmail(email)) {
      throw new ApiError('Email inválido', 400);
    }
    
    const senhaValidation = Validators.validatePassword(senha);
    if (!senhaValidation.isValid) {
      throw new ApiError(senhaValidation.errors.join(', '), 400);
    }
    
    if (telefone && !Validators.isValidPhone(telefone)) {
      throw new ApiError('Telefone inválido', 400);
    }
    
    const adminExistente = await Usuario.findOne({ where: { tipo: 'A' } });
    
    if (adminExistente) {
      throw new ApiError('Um super administrador já existe no sistema', 400);
    }
    
    const adminUser = await Usuario.create({
      nome,
      email,
      senha, 
      tipo: 'A', 
      telefone: telefone || null
    });
    
    const adminSemSenha = this.sanitizeUser(adminUser.toJSON());
    
    return this.sendSuccess(res, { data: adminSemSenha }, 'Super administrador criado com sucesso', 201);
  });

  gerenciarTipoUsuario = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { novo_tipo } = req.body;
    
    if (!Validators.isValidUserType(novo_tipo)) {
      throw new ApiError('Tipo de usuário inválido. Use F, J ou A', 400);
    }
    
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      throw new ApiError('Usuário não encontrado', 404);
    }
    
    if (usuario.id === req.usuario.id && novo_tipo !== 'A') {
      throw new ApiError('Você não pode rebaixar seu próprio usuário administrador', 403);
    }
    
    await usuario.update({ tipo: novo_tipo });
    
    const usuarioAtualizado = this.sanitizeUser(usuario.toJSON());
    
    return this.sendSuccess(
      res, 
      { data: usuarioAtualizado }, 
      `Usuário atualizado para o tipo ${novo_tipo} com sucesso`
    );
  });

  listarTodosUsuarios = asyncHandler(async (req, res) => {
    const { page, limit, offset } = this.getPaginationParams(req);
    const { tipo } = req.query;
    
    if (tipo && !Validators.isValidUserType(tipo)) {
      throw new ApiError('Tipo de usuário inválido. Use F, J ou A', 400);
    }
    
    const where = tipo ? { tipo } : {};
    
    const usuarios = await Usuario.findAndCountAll({
      where,
      attributes: { exclude: ['senha'] },
      limit,
      offset,
      order: [['id', 'ASC']]
    });
    
    return this.sendPaginatedResponse(res, usuarios, page, limit);
  });

  desativarUsuario = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      throw new ApiError('Usuário não encontrado', 404);
    }
    
    if (usuario.id === req.usuario.id) {
      throw new ApiError('Você não pode desativar seu próprio usuário administrador', 403);
    }
    
    await usuario.update({ ativo: false });
    
    return this.sendSuccess(res, { data: {} }, 'Usuário desativado com sucesso');
  });

  visualizarEstatisticas = asyncHandler(async (req, res) => {
    const [stats] = await Promise.all([
      Promise.all([
        Usuario.count({ where: { tipo: 'F' } }),
        Usuario.count({ where: { tipo: 'J' } }),
        sequelize.models.solicitacao.count(),
        sequelize.models.peruca.count(),
        sequelize.models.doacao.count(),
        sequelize.models.recebimento.count(),
        sequelize.models.publicacao.count(),
        sequelize.models.comentario.count()
      ])
    ]);
    
    const [
      totalUsuariosF, 
      totalUsuariosJ,
      totalSolicitacoes,
      totalPerucas,
      totalDoacoes,
      totalRecebimentos,
      totalPublicacoes,
      totalComentarios
    ] = stats;
    
    const data = {
      usuarios: {
        pessoasFisicas: totalUsuariosF,
        instituicoes: totalUsuariosJ,
        total: totalUsuariosF + totalUsuariosJ
      },
      doacoes: {
        solicitacoes: totalSolicitacoes,
        perucas: totalPerucas,
        doacoesRealizadas: totalDoacoes,
        recebimentosCabelo: totalRecebimentos
      },
      forum: {
        publicacoes: totalPublicacoes,
        comentarios: totalComentarios
      }
    };
    
    return this.sendSuccess(res, { data });
  });
}

module.exports = new AdminController();