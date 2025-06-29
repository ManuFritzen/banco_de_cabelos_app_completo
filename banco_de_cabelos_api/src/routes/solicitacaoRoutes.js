const express = require('express');
const {
  listarSolicitacoes,
  obterSolicitacaoPorId,
  listarSolicitacoesPorUsuario,
  criarSolicitacao,
  criarSolicitacaoBase64,
  atualizarStatusSolicitacao,
  atualizarObservacaoSolicitacao,
  excluirSolicitacao,
  obterImagemLaudoMedico
} = require('../controllers/solicitacaoController');
const { auth, verificarTipo } = require('../middlewares/authMiddleware');
const { check } = require('express-validator');

const router = express.Router();

const validacoesStatus = [
  check('status_solicitacao_id')
    .isInt()
    .withMessage('ID do status inválido'),
  check('observacao')
    .optional()
    .isString()
    .withMessage('Observação deve ser um texto')
];

const validacoesObservacao = [
  check('observacao')
    .isString()
    .withMessage('Observação deve ser um texto')
];

router.get('/:id/laudo', obterImagemLaudoMedico);

router.use(auth);

router.get('/', verificarTipo(['J']), listarSolicitacoes);
router.get('/:id', obterSolicitacaoPorId);
router.get('/usuario/:usuario_id', listarSolicitacoesPorUsuario);
router.post('/', verificarTipo(['F']), criarSolicitacao);
router.post('/base64', verificarTipo(['F']), criarSolicitacaoBase64);
router.put('/:id/status', verificarTipo(['J', 'F']), validacoesStatus, atualizarStatusSolicitacao);
router.put('/:id/observacao', verificarTipo(['F']), validacoesObservacao, atualizarObservacaoSolicitacao);
router.delete('/:id', excluirSolicitacao);

module.exports = router;