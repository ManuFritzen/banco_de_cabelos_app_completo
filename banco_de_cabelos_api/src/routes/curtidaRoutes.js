const express = require('express');
const curtidaController = require('../controllers/curtidaController');
const { auth } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(auth);

router.post('/publicacao/:publicacaoId', curtidaController.curtirPublicacao);
router.delete('/publicacao/:publicacaoId', curtidaController.descurtirPublicacao);
router.get('/publicacao/:publicacaoId', curtidaController.listarCurtidasPublicacao);

router.post('/comentario/:comentarioId', curtidaController.curtirComentario);
router.delete('/comentario/:comentarioId', curtidaController.descurtirComentario);
router.get('/comentario/:comentarioId', curtidaController.listarCurtidasComentario);

module.exports = router;