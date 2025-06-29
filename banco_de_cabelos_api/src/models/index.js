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
const SolicitacaoInstituicao = require('./solicitacaoInstituicaoModel');
const Doacao = require('./doacaoModel');
const Recebimento = require('./recebimentoModel');
const Publicacao = require('./publicacaoModel');
const Comentario = require('./comentarioModel');
const AnexoPublicacao = require('./anexoPublicacaoModel');
const BlacklistedToken = require('./blackListModel');
const Notificacao = require('./notificacaoModel');

SolicitacaoInstituicao.belongsTo(Solicitacao, { foreignKey: 'solicitacao_id', as: 'Solicitacao' });
SolicitacaoInstituicao.belongsTo(Usuario, { foreignKey: 'instituicao_id', as: 'Instituicao' });
SolicitacaoInstituicao.belongsTo(StatusSolicitacao, { foreignKey: 'status_solicitacao_id', as: 'StatusSolicitacao' });

Solicitacao.hasMany(SolicitacaoInstituicao, { foreignKey: 'solicitacao_id', as: 'SolicitacoesInstituicao' });

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
  SolicitacaoInstituicao,
  Doacao,
  Recebimento,
  Publicacao,
  Comentario,
  AnexoPublicacao,
  BlacklistedToken,
  Notificacao
};