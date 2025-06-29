const BaseView = require('./BaseView');

class DoacaoView extends BaseView {
  static list(doacoes) {
    return this.success(doacoes);
  }

  static paginated(result, page, limit) {
    return super.paginated(result.rows, result.count, page, limit);
  }

  static single(doacao) {
    return this.success(doacao);
  }

  static created(doacao) {
    return super.created(doacao, 'Doação registrada com sucesso');
  }

  static updated(doacao) {
    return super.updated(doacao, 'Doação atualizada com sucesso');
  }

  static deleted() {
    return super.deleted('Doação excluída com sucesso e peruca disponível novamente');
  }

  static byInstitution(doacoes, page, limit) {
    return super.paginated(doacoes, doacoes.count, page, limit);
  }

  static bySolicitacao(doacoes) {
    return this.success({ 
      count: doacoes.length, 
      data: doacoes 
    });
  }
}

module.exports = DoacaoView;