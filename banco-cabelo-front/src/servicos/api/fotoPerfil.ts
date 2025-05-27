import cliente from './cliente';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const fotoPerfilServico = {
  // Buscar foto de perfil como base64
  async buscarFotoBase64(usuarioId: number): Promise<string | null> {
    try {
      const response = await cliente.get(`/usuarios/${usuarioId}/foto-base64`);
      
      if (response.data && response.data.foto) {
        return response.data.foto; // Retorna o data URL completo
      }
      return null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Foto não encontrada é um caso normal
        console.log('Foto de perfil não encontrada para usuário:', usuarioId);
        return null;
      }
      console.error('Erro ao buscar foto:', error.response?.data || error.message);
      return null;
    }
  },
  // Upload de foto de perfil
  async uploadFoto(usuarioId: number, foto: any) {
    console.log('Iniciando upload de foto para usuário:', usuarioId);
    console.log('Dados da foto:', foto);
    console.log('Plataforma:', Platform.OS);
    
    try {
      const token = await SecureStore.getItemAsync('token');
      const url = `${cliente.defaults.baseURL}/usuarios/${usuarioId}/foto`;
      
      const formData = new FormData();
      
      // Para Android, precisamos de uma abordagem diferente
      if (Platform.OS === 'android') {
        formData.append('foto', {
          uri: foto.uri,
          type: foto.type || 'image/jpeg',
          name: foto.fileName || foto.name || 'photo.jpg',
        } as any);
      } else {
        // iOS
        formData.append('foto', {
          uri: foto.uri.replace('file://', ''),
          type: foto.type || 'image/jpeg',
          name: foto.fileName || foto.name || 'photo.jpg',
        } as any);
      }
      
      console.log('FormData criado, fazendo upload...');
      
      // Usar fetch nativo
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          // NÃO definir Content-Type, deixar o fetch definir automaticamente
        },
        body: formData
      });
      
      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
      }
      
      try {
        const data = JSON.parse(responseText);
        console.log('Upload concluído com sucesso:', data);
        return { data };
      } catch (parseError) {
        console.log('Resposta não é JSON válido:', responseText);
        return { data: { success: true, message: 'Upload concluído' } };
      }
      
    } catch (error: any) {
      console.error('Erro detalhado no upload:', error);
      console.error('Stack:', error.stack);
      throw error;
    }
  },
  
  async obterUrlFotoAsync(usuarioId: number): Promise<string> {
    const baseURL = cliente.defaults.baseURL || '';
    const timestamp = new Date().getTime();
    
    // Sempre buscar o token do SecureStore
    let token = '';
    try {
      token = await SecureStore.getItemAsync('token') || '';
    } catch (error) {
      console.log('Erro ao obter token do SecureStore:', error);
    }
    
    console.log('Token para URL da foto:', token ? 'Presente' : 'Ausente');
    
    // URL com token como parâmetro, semelhante à imagem de peruca
    return `${baseURL}/usuarios/${usuarioId}/foto?token=${token}&_t=${timestamp}`;
  },
  
  // Versão síncrona mantida para compatibilidade
  obterUrlFoto(usuarioId: number): string {
    const baseURL = cliente.defaults.baseURL || '';
    const timestamp = new Date().getTime();
    
    let token = '';
    if (cliente.defaults.headers.common['Authorization']) {
      token = String(cliente.defaults.headers.common['Authorization']).replace('Bearer ', '');
    }
    
    return `${baseURL}/usuarios/${usuarioId}/foto?token=${token}&_t=${timestamp}`;
  },
  
  async removerFoto(usuarioId: number) {
    return cliente.delete(`/usuarios/${usuarioId}/foto`);
  }
};