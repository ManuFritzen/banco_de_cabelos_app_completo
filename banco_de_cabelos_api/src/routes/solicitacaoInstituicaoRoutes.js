const express = require('express');
const router = express.Router();
const solicitacaoInstituicaoController = require('../controllers/solicitacaoInstituicaoController');
const { auth } = require('../middlewares/authMiddleware');

// Todas as rotas precisam de autenticação
router.use(auth);

// POST /api/solicitacoes-instituicao/analisar/:solicitacao_id - Analisar uma solicitação
router.post('/analisar/:solicitacao_id', solicitacaoInstituicaoController.analisarSolicitacao);

// GET /api/solicitacoes-instituicao - Listar análises da instituição logada
router.get('/', solicitacaoInstituicaoController.listarAnalisesPorInstituicao);

// GET /api/solicitacoes-instituicao/:id - Obter detalhes de uma análise específica
router.get('/:id', solicitacaoInstituicaoController.obterAnalise);

// PUT /api/solicitacoes-instituicao/:id - Atualizar status de uma análise
router.put('/:id', solicitacaoInstituicaoController.atualizarStatusAnalise);

// DELETE /api/solicitacoes-instituicao/:id - Remover uma análise (se pendente)
router.delete('/:id', solicitacaoInstituicaoController.removerAnalise);

module.exports = router;