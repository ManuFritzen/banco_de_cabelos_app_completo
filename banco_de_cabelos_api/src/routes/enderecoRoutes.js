const express = require('express');
const {
  listarEnderecos,
  listarEnderecosPorUsuario,
  criarEndereco,
  atualizarEndereco,
  excluirEndereco,
  buscarCep
} = require('../controllers/enderecoController');
const { auth, verificarTipo } = require('../middlewares/authMiddleware');
const { check } = require('express-validator');

const router = express.Router();

const validacoesEndereco = [
  check('usuario_id')
    .isInt()
    .withMessage('ID do usuário inválido'),
  check('cidade_id')
    .isInt()
    .withMessage('ID da cidade inválido'),
  check('bairro')
    .notEmpty()
    .withMessage('Bairro é obrigatório'),
  check('rua')
    .notEmpty()
    .withMessage('Rua é obrigatória'),
  check('cep')
    .isLength({ min: 8, max: 8 })
    .withMessage('CEP deve ter 8 dígitos')
    .matches(/^\d{8}$/)
    .withMessage('CEP deve conter apenas números')
];
// Rotas públicas
router.get('/cep/:cep', buscarCep);
router.post('/cadastro', validacoesEndereco, criarEndereco);

// Aplicar autenticação para todas as outras rotas
router.use(auth);

router.get('/', verificarTipo(['J']), listarEnderecos);
router.get('/usuario/:usuario_id', listarEnderecosPorUsuario);
router.post('/', validacoesEndereco, criarEndereco);
router.put('/:id', atualizarEndereco);
router.delete('/:id', excluirEndereco);


module.exports = router;