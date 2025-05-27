const express = require('express');
const {
  criarSuperAdmin,
  gerenciarTipoUsuario,
  listarTodosUsuarios,
  desativarUsuario,
  visualizarEstatisticas
} = require('../controllers/adminController');
const { auth, verificarTipo } = require('../middlewares/authMiddleware');
const { check } = require('express-validator');

const router = express.Router();

router.post('/setup', [
  check('nome').notEmpty().withMessage('O nome é obrigatório'),
  check('email').isEmail().withMessage('Email inválido'),
  check('senha').isLength({ min: 6 }).withMessage('A senha deve ter pelo menos 6 caracteres'),
  check('codigo_secreto').notEmpty().withMessage('O código secreto é obrigatório')
], criarSuperAdmin);

router.use(auth);
router.use(verificarTipo(['A'])); 

router.get('/usuarios', listarTodosUsuarios);
router.patch('/usuarios/:id/tipo', gerenciarTipoUsuario);
router.patch('/usuarios/:id/desativar', desativarUsuario);

router.get('/estatisticas', visualizarEstatisticas);

module.exports = router;