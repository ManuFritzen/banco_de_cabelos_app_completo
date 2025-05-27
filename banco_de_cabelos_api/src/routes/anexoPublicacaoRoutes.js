const express = require('express');
const { 
  listarAnexosPorPublicacao,
  obterAnexoPorId,
  adicionarAnexo,
  adicionarAnexoBase64,
  excluirAnexo
} = require('../controllers/anexoPublicacaoController');
const { auth } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/publicacao/:publicacao_id', listarAnexosPorPublicacao);
router.get('/:id', obterAnexoPorId);

router.use(auth); 

router.post('/publicacao/:publicacao_id', adicionarAnexo);

router.post('/publicacao/:publicacao_id/base64', adicionarAnexoBase64);

router.delete('/:id', excluirAnexo);

module.exports = router;