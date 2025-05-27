const express = require('express');
const { 
  listarPublicacoes,
  obterPublicacaoPorId,
  criarPublicacao,
  atualizarPublicacao,
  excluirPublicacao
} = require('../controllers/publicacaoController');
const { auth, authOptional } = require('../middlewares/authMiddleware');
const { check } = require('express-validator');

const router = express.Router();

const validacoesPublicacao = [
  check('titulo')
    .notEmpty().withMessage('O título é obrigatório')
    .isLength({ min: 3, max: 200 }).withMessage('O título deve ter entre 3 e 200 caracteres'),
  check('conteudo')
    .notEmpty().withMessage('O conteúdo é obrigatório')
];

router.get('/', authOptional, listarPublicacoes);
router.get('/:id', authOptional, obterPublicacaoPorId);

router.use(auth); 

router.post('/', validacoesPublicacao, criarPublicacao);
router.put('/:id', validacoesPublicacao, atualizarPublicacao);
router.delete('/:id', excluirPublicacao);

module.exports = router;