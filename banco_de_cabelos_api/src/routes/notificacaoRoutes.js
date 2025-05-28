const express = require('express');
const router = express.Router();
const NotificacaoController = require('../controllers/notificacaoController');
const { auth } = require('../middlewares/authMiddleware');

const notificacaoController = new NotificacaoController();

router.use(auth);

router.get('/', (req, res, next) => notificacaoController.listarNotificacoes(req, res, next));

router.get('/count', (req, res, next) => notificacaoController.contarNaoLidas(req, res, next));

router.get('/:id', (req, res, next) => notificacaoController.buscarNotificacao(req, res, next));

router.put('/:id/lida', (req, res, next) => notificacaoController.marcarComoLida(req, res, next));

router.put('/todas/lidas', (req, res, next) => notificacaoController.marcarTodasComoLidas(req, res, next));

router.delete('/:id', (req, res, next) => notificacaoController.deletarNotificacao(req, res, next));

module.exports = router;