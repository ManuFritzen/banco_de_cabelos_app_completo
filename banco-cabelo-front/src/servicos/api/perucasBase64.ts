import cliente from './cliente';
import * as FileSystem from 'expo-file-system';

interface NovaPeruca {
  tipo_peruca_id: number;
  cor_id: number;
  comprimento?: number;
  tamanho: 'P' | 'M' | 'G';
  foto_peruca?: any;
}

export const perucasBase64Servico = {
  async criarPerucaBase64(dados: NovaPeruca) {
    try {
      let foto_peruca_base64 = null;
      
      if (dados.foto_peruca && dados.foto_peruca.uri) {
        // Converter imagem para base64
        const base64 = await FileSystem.readAsStringAsync(dados.foto_peruca.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        // Determinar o tipo MIME
        const mimeType = dados.foto_peruca.type || 'image/jpeg';
        
        // Criar data URL
        foto_peruca_base64 = `data:${mimeType};base64,${base64}`;
      }
      
      // Preparar dados para enviar como JSON
      const dadosJson = {
        tipo_peruca_id: dados.tipo_peruca_id,
        cor_id: dados.cor_id,
        comprimento: dados.comprimento,
        tamanho: dados.tamanho,
        foto_peruca_base64
      };
      
      // Enviar como JSON
      return await cliente.post('/perucas/base64', dadosJson, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 60000 // 60 segundos para upload
      });
    } catch (erro) {
      console.error('Erro ao criar peruca com base64:', erro);
      throw erro;
    }
  }
};