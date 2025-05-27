const express = require('express');
const { 
  listarUsuariosJuridicos, 
  obterUsuarioPorId, 
  criarUsuario, 
  atualizarUsuario, 
  excluirUsuario, 
  login,
  logout,
  verificarCPFExistente,
  verificarCNPJExistente,
  verificarEmailExistente,
  uploadFotoPerfil,
  uploadFotoPerfilBase64,
  buscarFotoPerfil,
  buscarFotoPerfilBase64,
  removerFotoPerfil
} = require('../controllers/usuarioController');
const { auth, verificarTipo } = require('../middlewares/authMiddleware');
const { upload: uploadPerfil } = require('../middlewares/uploadPerfilMiddleware');
const { check } = require('express-validator');

const router = express.Router();

const validacoesUsuario = [
  check('nome')
    .notEmpty().withMessage('O nome é obrigatório')
    .isLength({ min: 3, max: 100 }).withMessage('O nome deve ter entre 3 e 100 caracteres'),
  check('email')
    .notEmpty().withMessage('O email é obrigatório')
    .isEmail().withMessage('Email inválido'),
  check('senha')
    .notEmpty().withMessage('A senha é obrigatória')
    .isLength({ min: 6 }).withMessage('A senha deve ter pelo menos 6 caracteres'),
  check('tipo')
    .notEmpty().withMessage('O tipo é obrigatório')
    .isIn(['F', 'J']).withMessage('O tipo deve ser F (Físico) ou J (Jurídico)'),
  check('cnpj')
    .if(check('tipo').equals('J'))
    .notEmpty().withMessage('CNPJ é obrigatório para usuários Jurídicos')
    .isLength({ min: 14, max: 14 }).withMessage('CNPJ deve ter 14 dígitos'),
  check('cpf')
    .if(check('tipo').equals('F'))
    .notEmpty().withMessage('CPF é obrigatório para usuários Físicos')
    .isLength({ min: 11, max: 11 }).withMessage('CPF deve ter 11 dígitos')
];

router.post('/login', [
  check('email').isEmail().withMessage('Email inválido'),
  check('senha').notEmpty().withMessage('Senha é obrigatória')
], login);


router.get('/verificar/cpf/:cpf', verificarCPFExistente);
router.get('/verificar/cnpj/:cnpj', verificarCNPJExistente);
router.get('/verificar/email/:email', verificarEmailExistente);

router.post('/', validacoesUsuario, criarUsuario);

router.use(auth); 
router.post('/logout', logout);
router.get('/instituicoes', listarUsuariosJuridicos);
router.get('/:id', obterUsuarioPorId);
router.put('/:id', validacoesUsuario, atualizarUsuario);
router.delete('/:id', excluirUsuario);
router.post('/:id/foto', uploadPerfil.single('foto'), uploadFotoPerfil);
router.post('/:id/foto-base64', uploadFotoPerfilBase64);
router.get('/:id/foto', buscarFotoPerfil);
router.get('/:id/foto-base64', buscarFotoPerfilBase64);
router.delete('/:id/foto', removerFotoPerfil);

module.exports = router;