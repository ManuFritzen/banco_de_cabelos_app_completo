import cliente from './cliente';
import * as FileSystem from 'expo-file-system';

interface NovaDoacaoCabelo {
  instituicao_id: number;
  peso?: number;
  comprimento?: number;
  cor_id?: number;
  observacao?: string;
  foto_cabelo?: any;
}

export const doacaoCabeloBase64Servico = {
  async criarDoacaoCabeloBase64(dados: NovaDoacaoCabelo) {
    try {
      let foto_cabelo_base64 = null;
      
      if (dados.foto_cabelo && dados.foto_cabelo.uri) {
        // Converter imagem para base64
        const base64 = await FileSystem.readAsStringAsync(dados.foto_cabelo.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        // Determinar o tipo MIME
        const mimeType = dados.foto_cabelo.type || 'image/jpeg';
        
        // Criar data URL
        foto_cabelo_base64 = `data:${mimeType};base64,${base64}`;
      }
      
      // Preparar dados para enviar como JSON
      const dadosJson = {
        instituicao_id: dados.instituicao_id,
        peso: dados.peso,
        comprimento: dados.comprimento,
        cor_id: dados.cor_id,
        observacao: dados.observacao,
        foto_cabelo_base64
      };
      
      // Enviar como JSON
      return await cliente.post('/recebimento/base64', dadosJson, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 60000 // 60 segundos para upload
      });
    } catch (erro) {
      console.error('Erro ao criar doação com base64:', erro);
      throw erro;
    }
  }
};