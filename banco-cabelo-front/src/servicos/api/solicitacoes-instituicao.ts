import cliente from './cliente';

export interface SolicitacaoInstituicao {
  id: number;
  solicitacao_id: number;
  instituicao_id: number;
  status_solicitacao_id: number;
  observacoes?: string;
  data_analise: string;
  data_atualizacao?: string;
  Solicitacao?: {
    id: number;
    pessoa_fisica_id: number;
    tipo_peruca_id: number;
    cor_id: number;
    comprimento: number;
    tamanho: string;
    observacoes?: string;
    data_hora: string;
    PessoaFisica?: {
      id: number;
      nome: string;
      email: string;
      telefone?: string;
    };
    TipoPeruca?: {
      id: number;
      nome: string;
      sigla: string;
    };
    Cor?: {
      id: number;
      nome: string;
    };
  };
  Instituicao?: {
    id: number;
    nome: string;
    email: string;
  };
  StatusSolicitacao?: {
    id: number;
    nome: string;
  };
}

export interface DadosAtualizacaoAnalise {
  status_solicitacao_id: number;
  observacoes?: string;
}

export const solicitacoesInstituicaoServico = {
  // Analisar uma solicitação (criar análise para a instituição)
  async analisarSolicitacao(solicitacaoId: number, observacoes?: string) {
    return cliente.post(`/solicitacoes-instituicao/analisar/${solicitacaoId}`, {
      observacoes
    });
  },

  // Listar análises da instituição logada
  async listarAnalisesPorInstituicao(pagina = 1, limite = 10) {
    return cliente.get('/solicitacoes-instituicao', {
      params: {
        page: pagina,
        limit: limite
      }
    });
  },

  // Obter detalhes de uma análise específica
  async obterAnalise(id: number) {
    return cliente.get(`/solicitacoes-instituicao/${id}`);
  },

  // Atualizar status de uma análise
  async atualizarStatusAnalise(id: number, dados: DadosAtualizacaoAnalise) {
    return cliente.put(`/solicitacoes-instituicao/${id}`, dados);
  },

  // Remover uma análise (se pendente)
  async removerAnalise(id: number) {
    return cliente.delete(`/solicitacoes-instituicao/${id}`);
  }
};