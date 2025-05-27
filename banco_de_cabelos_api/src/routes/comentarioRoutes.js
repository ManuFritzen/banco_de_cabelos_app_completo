const express = require('express');
const { 
  listarComentariosPorPublicacao,
  obterComentarioPorId,
  criarComentario,
  atualizarComentario,
  excluirComentario
} = require('../controllers/comentarioController');
const { auth } = require('../middlewares/authMiddleware');
const { check } = require('express-validator');

const router = express.Router();

const validacoesComentario = [
  check('conteudo')
    .notEmpty().withMessage('O conteúdo é obrigatório')
    .isLength({ min: 1, max: 1000 }).withMessage('O comentário deve ter entre 1 e 1000 caracteres')
];

router.get('/publicacao/:publicacao_id', listarComentariosPorPublicacao);
router.get('/:id', obterComentarioPorId);

router.use(auth);

router.post('/publicacao/:publicacao_id', validacoesComentario, criarComentario);
router.put('/:id', validacoesComentario, atualizarComentario);
router.delete('/:id', excluirComentario);

module.exports = router;