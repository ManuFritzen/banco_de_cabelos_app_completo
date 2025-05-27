const express = require('express');
const { 
  listarPerucas,
  obterPerucaPorId,
  listarPerucasPorInstituicao,
  criarPeruca,
  criarPerucaBase64,
  atualizarPeruca,
  excluirPeruca,
  obterImagemPeruca,
  listarCores,
  listarTiposPeruca
} = require('../controllers/perucaController');
const { auth, verificarTipo } = require('../middlewares/authMiddleware');
const { check } = require('express-validator');

const router = express.Router();

const validacoesPeruca = [
  check('tipo_peruca_id')
    .isInt()
    .withMessage('ID do tipo de peruca inválido'),
  check('cor_id')
    .optional()
    .isInt()
    .withMessage('ID da cor inválido'),
  check('comprimento')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Comprimento deve ser um número maior que zero'),
  check('tamanho')
    .optional()
    .isIn(['P', 'M', 'G'])
    .withMessage('Tamanho deve ser P, M ou G')
];

router.get('/', listarPerucas);
router.get('/cores', listarCores);
router.get('/tipos', listarTiposPeruca);
router.get('/:id', obterPerucaPorId);
router.get('/instituicao/:instituicao_id', listarPerucasPorInstituicao);
router.get('/:id/imagem', obterImagemPeruca);

router.use(auth); 

router.post('/', verificarTipo(['J']), criarPeruca);
router.post('/base64', verificarTipo(['J']), validacoesPeruca, criarPerucaBase64);
router.put('/:id', verificarTipo(['J']), atualizarPeruca);
router.delete('/:id', verificarTipo(['J']), excluirPeruca);

module.exports = router;