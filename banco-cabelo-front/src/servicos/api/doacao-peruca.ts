import cliente from './cliente';

interface NovaDoacao {
  peruca_id: number;
  solicitacao_id: number;
  observacao?: string;
}

export const doacaoPerucaServico = {
  
  async listarDoacoes(pagina = 1, limite = 10) {
    return cliente.get('/doacoes', {
      params: { page: pagina, limit: limite }
    });
  },
  
  async obterDoacao(id: number) {
    return cliente.get(`/doacoes/${id}`);
  },
  
  async listarDoacoesPorInstituicao(instituicaoId: number, pagina = 1, limite = 10) {
    return cliente.get(`/doacoes/instituicao/${instituicaoId}`, {
      params: { page: pagina, limit: limite }
    });
  },

  async listarDoacoesPorSolicitacao(solicitacaoId: number) {
    return cliente.get(`/doacoes/solicitacao/${solicitacaoId}`);
  },
  
  async criarDoacao(dados: NovaDoacao) {
    return cliente.post('/doacoes', dados);
  },
  
  async atualizarDoacao(id: number, observacao: string) {
    return cliente.put(`/doacoes/${id}`, { observacao });
  },
  
  async excluirDoacao(id: number) {
    return cliente.delete(`/doacoes/${id}`);
  }
};