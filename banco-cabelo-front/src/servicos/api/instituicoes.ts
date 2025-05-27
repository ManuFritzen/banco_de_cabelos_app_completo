import cliente from './cliente';

export const instituicoesServico = {
  
  async listarInstituicoes() {
    return cliente.get('/usuarios/instituicoes');
  },
  
  async obterInstituicao(id: number) {
    return cliente.get(`/usuarios/${id}`);
  }
};