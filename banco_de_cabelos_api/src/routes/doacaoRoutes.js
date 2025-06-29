const express = require('express');
const {
  listarDoacoes,
  obterDoacaoPorId,
  obterDoacoesPorInstituicao,
  obterDoacoesPorSolicitacao,
  criarDoacao,
  atualizarDoacao,
  excluirDoacao
} = require('../controllers/doacaoController');
const { auth, verificarTipo } = require('../middlewares/authMiddleware');
const { check } = require('express-validator');

const router = express.Router();

router.use(auth);

const validacoesDoacao = [
  check('peruca_id')
    .isInt()
    .withMessage('ID da peruca inválido'),
  check('solicitacao_id')
    .isInt()
    .withMessage('ID da solicitação inválido'),
  check('observacao')
    .optional()
    .isString()
    .withMessage('Observação deve ser um texto')
];

router.get('/', verificarTipo(['A', 'J']), listarDoacoes);
router.get('/instituicao/:instituicao_id', obterDoacoesPorInstituicao); 
router.get('/solicitacao/:solicitacao_id', obterDoacoesPorSolicitacao); 
router.get('/:id', obterDoacaoPorId); 

router.post('/', verificarTipo(['J']), validacoesDoacao, criarDoacao);
router.put('/:id', verificarTipo(['J']), atualizarDoacao);
router.delete('/:id', verificarTipo(['J']), excluirDoacao);

module.exports = router;