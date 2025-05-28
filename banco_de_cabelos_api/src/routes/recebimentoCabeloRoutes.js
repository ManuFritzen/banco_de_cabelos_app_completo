const express = require('express');
const {
    criarDoacaoCabelo,
    criarDoacaoCabeloBase64,
    listarTodasDoacoesCabelo,
    listarMinhasDoacoesCabelo,
    listarMeusRecebimentosDeCabelos,
    obterImagemCabelo,
    buscarRecebimentoPorId
} = require('../controllers/recebimentoCabeloController');
const { auth, verificarTipo } = require('../middlewares/authMiddleware');
const { check } = require('express-validator');

const router = express.Router();

const validacoesDoacaoCabelo = [
    check('instituicao_id')
        .isInt()
        .withMessage('ID da instituição inválido'),
    check('peso')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Peso deve ser um número maior que zero'),
    check('comprimento')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Comprimento deve ser um número maior que zero'),
    check('cor_id')
        .optional()
        .isInt()
        .withMessage('ID da cor inválido'),
    check('observacao')
        .optional()
        .isString()
        .withMessage('Observação deve ser um texto')
];

router.use(auth);

router.post('/', verificarTipo(['F']), validacoesDoacaoCabelo, criarDoacaoCabelo);
router.post('/base64', verificarTipo(['F']), validacoesDoacaoCabelo, criarDoacaoCabeloBase64);
router.get('/', verificarTipo(['A']), listarTodasDoacoesCabelo);
router.get('/pessoa', verificarTipo(['F']), listarMinhasDoacoesCabelo);
router.get('/instituicao', verificarTipo(['J']), listarMeusRecebimentosDeCabelos);
router.get('/imagem/:id', obterImagemCabelo);
router.get('/:id', buscarRecebimentoPorId);

module.exports = router;