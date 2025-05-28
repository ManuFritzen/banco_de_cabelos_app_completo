const Usuario = require('./usuarioModel');
const Endereco = require('./enderecoModel');
const Estado = require('./estadoModel');
const Cidade = require('./cidadeModel');
const TipoPeruca = require('./tipoPerucaModel');
const Cor = require('./corModel');
const StatusSolicitacao = require('./statusSolicitacaoModel');
const Peruca = require('./perucaModel');
const Cabelo = require('./cabeloModel');
const Solicitacao = require('./solicitacaoModel');
const Doacao = require('./doacaoModel');
const Recebimento = require('./recebimentoModel');
const Publicacao = require('./publicacaoModel');
const Comentario = require('./comentarioModel');
const AnexoPublicacao = require('./anexoPublicacaoModel');
const BlacklistedToken = require('./blackListModel');
const Notificacao = require('./notificacaoModel');

module.exports = {
  Usuario,
  Endereco,
  Estado,
  Cidade,
  TipoPeruca,
  Cor,
  StatusSolicitacao,
  Peruca,
  Cabelo,
  Solicitacao,
  Doacao,
  Recebimento,
  Publicacao,
  Comentario,
  AnexoPublicacao,
  BlacklistedToken,
  Notificacao
};