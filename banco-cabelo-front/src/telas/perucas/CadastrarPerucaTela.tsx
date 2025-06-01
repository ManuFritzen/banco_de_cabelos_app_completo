import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, Modal, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { perucasServico } from '../../servicos/api/perucas';
import { perucasBase64Servico } from '../../servicos/api/perucasBase64';
import Botao from '../../components/comuns/Botao';
import CampoEntrada from '../../components/comuns/CampoEntrada';
import {
  SafeContainer,
  Card,
  Titulo,
  Paragrafo,
  Row,
  ScrollContainer
} from '../../styles/componentes';
import tw from '../../styles/tailwind';
import themeStyles from '../../styles/theme';

interface TipoPeruca {
  id: number;
  nome: string;
  sigla: string;
}

interface Cor {
  id: number;
  nome: string;
}

const CadastrarPerucaTela: React.FC = () => {
  const navigation = useNavigation<any>();
  
  const [tipoPerucaId, setTipoPerucaId] = useState('');
  const [corId, setCorId] = useState('');
  const [comprimento, setComprimento] = useState('');
  const [tamanho, setTamanho] = useState<'P' | 'M' | 'G'>('M');
  const [fotoPeruca, setFotoPeruca] = useState<any>(null);
  const [tiposPeruca, setTiposPeruca] = useState<TipoPeruca[]>([]);
  const [cores, setCores] = useState<Cor[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [erros, setErros] = useState<{ 
    tipoPerucaId?: string; 
    corId?: string; 
    comprimento?: string; 
    tamanho?: string;
    fotoPeruca?: string;
  }>({});
  
  
  useEffect(() => {
    const carregarDados = async () => {
      try {
        const [coresResp, tiposResp] = await Promise.all([
          perucasServico.listarCores(),
          perucasServico.listarTiposPeruca()
        ]);
        
        console.log('Resposta cores:', coresResp);
        console.log('Resposta tipos:', tiposResp);
        
        if (coresResp.data && coresResp.data.data && Array.isArray(coresResp.data.data)) {
          setCores(coresResp.data.data);
          console.log('Cores definidas:', coresResp.data.data);
        } else {
          console.warn('Formato inesperado da resposta de cores:', coresResp.data);
        }
        
        if (tiposResp.data && tiposResp.data.data && Array.isArray(tiposResp.data.data)) {
          setTiposPeruca(tiposResp.data.data);
          console.log('Tipos definidos:', tiposResp.data.data);
        } else {
          console.warn('Formato inesperado da resposta de tipos:', tiposResp.data);
        }
      } catch (erro) {
        console.error('Erro ao carregar dados:', erro);
        // Fallback para dados mock em caso de erro
        const tiposMock = [
          { id: 1, nome: 'Peruca Natural', sigla: 'PN' },
          { id: 2, nome: 'Peruca Sintética', sigla: 'PS' },
          { id: 3, nome: 'Peruca Mista', sigla: 'PM' },
        ];
        
        const coresMock = [
          { id: 1, nome: 'Preto' },
          { id: 2, nome: 'Castanho Escuro' },
          { id: 3, nome: 'Castanho Claro' },
          { id: 4, nome: 'Loiro' },
          { id: 5, nome: 'Ruivo' },
          { id: 6, nome: 'Grisalho' },
        ];
        
        setTiposPeruca(tiposMock);
        setCores(coresMock);
        console.log('Usando dados mock:', { tiposMock, coresMock });
      }
    };
    
    carregarDados();
  }, []);
  
  const voltar = () => {
    navigation.goBack();
  };
  
  const abrirModal = () => {
    setModalVisivel(true);
  };
  
  const fecharModal = () => {
    setModalVisivel(false);
  };
  
  const selecionarImagem = async () => {
    const permissaoGaleria = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissaoGaleria.status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos da permissão para acessar sua galeria de fotos.');
      return;
    }
    
    // Abre a galeria para seleção com qualidade reduzida e redimensionamento automático
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5, // Qualidade reduzida para diminuir o tamanho do arquivo
      allowsMultipleSelection: false,
      exif: false, // Não incluir dados EXIF para reduzir o tamanho
      base64: false, // Não incluir dados base64 para evitar problemas de memória
    });
    
    if (!resultado.canceled) {
      console.log('Imagem selecionada:', resultado.assets[0]);
      setFotoPeruca(resultado.assets[0]);
      // Limpa o erro de foto, se houver
      setErros(prev => ({ ...prev, fotoPeruca: undefined }));
      fecharModal(); 
    }
  };
  
  const tirarFoto = async () => {
    const permissaoCamera = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissaoCamera.status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos da permissão para acessar sua câmera.');
      return;
    }
    
    // Abre a câmera com configurações otimizadas para reduzir o tamanho do arquivo
    const resultado = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5, // Qualidade reduzida para diminuir o tamanho do arquivo
      exif: false, // Não incluir dados EXIF para reduzir o tamanho
      base64: false, // Não incluir dados base64 para evitar problemas de memória
    });
    
    if (!resultado.canceled) {
      console.log('Foto tirada:', resultado.assets[0]);
      setFotoPeruca(resultado.assets[0]);
      // Limpa o erro de foto, se houver
      setErros(prev => ({ ...prev, fotoPeruca: undefined }));
      fecharModal(); 
    }
  };
  
  const handleCadastrarPeruca = async () => {
    // Resetar erros
    setErros({});
    
    // Validar campos
    let temErros = false;
    const novosErros: any = {};
    
    if (!tipoPerucaId) {
      novosErros.tipoPerucaId = 'Tipo de peruca é obrigatório';
      temErros = true;
    }
    
    if (!corId) {
      novosErros.corId = 'Cor é obrigatória';
      temErros = true;
    }
    
    if (!comprimento.trim()) {
      novosErros.comprimento = 'Comprimento é obrigatório';
      temErros = true;
    } else if (isNaN(parseFloat(comprimento)) || parseFloat(comprimento) <= 0) {
      novosErros.comprimento = 'Comprimento deve ser um número válido';
      temErros = true;
    }
    
    if (!tamanho) {
      novosErros.tamanho = 'Tamanho é obrigatório';
      temErros = true;
    }
    
    if (!fotoPeruca) {
      novosErros.fotoPeruca = 'Foto da peruca é obrigatória';
      temErros = true;
    }
    
    if (temErros) {
      setErros(novosErros);
      return;
    }
    
    // Cadastrar peruca
    setCarregando(true);
    
    try {
      const formatarFoto = () => {
        if (!fotoPeruca || !fotoPeruca.uri) {
          Alert.alert('Erro', 'A foto selecionada é inválida. Por favor, selecione outra imagem.');
          return null;
        }
        
        // A URI da imagem no expo começa com 'file://' em dispositivos Android
        // e 'ph://' ou 'assets-library://' em iOS.
        const uri = fotoPeruca.uri;
        
        // Determinar tipo baseado na extensão, se não fornecido
        let type = fotoPeruca.type;
        if (!type) {
          const extension = uri.split('.').pop()?.toLowerCase();
          if (extension === 'jpg' || extension === 'jpeg') {
            type = 'image/jpeg';
          } else if (extension === 'png') {
            type = 'image/png';
          } else {
            type = 'image/jpeg'; // valor padrão
          }
        } else if (type === 'image') {
          // Corrigir tipo incorreto
          type = 'image/jpeg';
        }
        
        // Determinar nome do arquivo, se não fornecido
        let name = fotoPeruca.fileName;
        if (!name) {
          // Obter o nome do arquivo da URI, garantindo que seja curto
          // Gerar um nome único e curto para evitar problemas
          const timestamp = new Date().getTime();
          name = `peruca_${timestamp % 10000}.jpg`;
        } else if (name.length > 30) {
          // Se o nome for muito longo, encurtar para evitar problemas
          const extension = name.split('.').pop() || 'jpg';
          name = `peruca_${Date.now() % 10000}.${extension}`;
        }
        
        console.log('Foto formatada:', { uri, type, name });
        
        return {
          uri,
          type,
          name
        };
      };
      
      // Obter a foto formatada
      const fotoFormatada = formatarFoto();
      if (!fotoFormatada) {
        throw new Error('Não foi possível formatar a foto para envio');
      }
      
      // Dados da peruca formatados para corresponder ao esperado pela API
      const dadosPeruca = {
        tipo_peruca_id: parseInt(tipoPerucaId),
        cor_id: parseInt(corId),
        comprimento: parseFloat(comprimento),
        tamanho,
        foto_peruca: fotoFormatada
      };
      
      console.log('Tentando criar peruca usando Base64...', {tipoPerucaId, corId, tamanho, comprimento});
      const resposta = await perucasBase64Servico.criarPerucaBase64(dadosPeruca);
      
      console.log('Resposta da API:', resposta.status);
      
      // Mostra mensagem de sucesso
      Alert.alert(
        'Peruca Cadastrada',
        'A peruca foi cadastrada com sucesso!',
        [
          { 
            text: 'Ver Minhas Perucas', 
            onPress: () => navigation.navigate('ListaPerucas') 
          },
          { 
            text: 'OK', 
            onPress: () => navigation.goBack() 
          }
        ]
      );
    } catch (erro: any) {
      console.error('Erro completo:', erro);
      
      let mensagemErro = 'Erro ao cadastrar peruca. Tente novamente.';
      
      if (erro.message === 'Network Error') {
        mensagemErro = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (erro.response) {
        if (erro.response.status === 401) {
          mensagemErro = 'Você precisa estar logado para cadastrar uma peruca.';
          Alert.alert('Sessão expirada', mensagemErro, [
            { text: 'Ir para login', onPress: () => navigation.navigate('Login') }
          ]);
          return;
        } else if (erro.response.status === 400) {
          mensagemErro = erro.response.data?.message || 'Dados inválidos. Verifique os campos e tente novamente.';
        } else if (erro.response.status === 413) {
          mensagemErro = 'A imagem é muito grande. Por favor, escolha uma imagem menor.';
        } else {
          mensagemErro = erro.response.data?.message || `Erro ${erro.response.status}: Tente novamente mais tarde.`;
        }
      }
      
      Alert.alert('Erro', mensagemErro);
    } finally {
      setCarregando(false);
    }
  };
  
  return (
    <SafeContainer style={themeStyles.bgBackground}>      
      <TouchableOpacity
        style={[themeStyles.bgPrimary, tw.pX4, tw.pY4]}
        onPress={abrirModal}
        activeOpacity={0.8}
      >
        <Row style={tw.justifyCenter}>
          <Ionicons name="images-outline" size={24} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={[tw.textWhite, tw.textLg, tw.fontBold]}>
            Selecionar Imagem
          </Text>

          {fotoPeruca && (
            <View style={[themeStyles.bgSecondary, tw.roundedFull, tw.w5, tw.h5, tw.itemsCenter, tw.justifyCenter, tw.mL2]}>
              <Text style={[tw.textWhite, tw.textXs, tw.fontBold]}>
                1
              </Text>
            </View>
          )}
        </Row>
      </TouchableOpacity>
      
      <ScrollContainer style={tw.p4}>
        <Card style={tw.mB4}>
          <Titulo style={tw.mB2}>
            Nova Peruca
          </Titulo>

          <Paragrafo style={tw.mB2}>
            Preencha os dados abaixo para cadastrar uma nova peruca disponível para doação.
          </Paragrafo>
        </Card>

        <Card>
          <Text style={[themeStyles.textText, tw.textSm, tw.mB1, tw.fontMedium]}>
            Tipo de Peruca
          </Text>

          <View style={tw.mB4}>
            <View style={[tw.flexRow, tw.flexWrap]}>
              {tiposPeruca && tiposPeruca.length > 0 ? (
                tiposPeruca.map((tipo) => (
                  <TouchableOpacity
                    key={tipo.id}
                    style={[
                      tw.border, tw.roundedFull, tw.pX4, tw.pY2, tw.mR2, tw.mB2,
                      tipoPerucaId === tipo.id.toString()
                        ? [themeStyles.bgPrimary, { borderColor: '#4EB296' }]
                        : [tw.bgWhite, tw.borderGray300]
                    ]}
                    onPress={() => setTipoPerucaId(tipo.id.toString())}
                  >
                    <Text
                      style={[
                        tipoPerucaId === tipo.id.toString()
                          ? tw.textWhite
                          : tw.textGray700
                      ]}
                    >
                      {tipo.nome}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={[tw.textGray500, tw.textSm, tw.mY2]}>
                  Carregando tipos de peruca...
                </Text>
              )}
            </View>

            {erros.tipoPerucaId && (
              <Text style={[themeStyles.textError, tw.textXs, tw.mT1]}>
                {erros.tipoPerucaId}
              </Text>
            )}
          </View>
          
          <Text style={[themeStyles.textText, tw.textSm, tw.mB1, tw.fontMedium]}>
            Cor
          </Text>

          <View style={tw.mB4}>
            <View style={[tw.flexRow, tw.flexWrap]}>
              {cores && cores.length > 0 ? (
                cores.map((cor) => (
                  <TouchableOpacity
                    key={cor.id}
                    style={[
                      tw.border, tw.roundedFull, tw.pX4, tw.pY2, tw.mR2, tw.mB2,
                      corId === cor.id.toString()
                        ? [themeStyles.bgPrimary, { borderColor: '#4EB296' }]
                        : [tw.bgWhite, tw.borderGray300]
                    ]}
                    onPress={() => setCorId(cor.id.toString())}
                  >
                    <Text
                      style={[
                        corId === cor.id.toString()
                          ? tw.textWhite
                          : tw.textGray700
                      ]}
                    >
                      {cor.nome}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={[tw.textGray500, tw.textSm, tw.mY2]}>
                  Carregando cores disponíveis...
                </Text>
              )}
            </View>

            {erros.corId && (
              <Text style={[themeStyles.textError, tw.textXs, tw.mT1]}>
                {erros.corId}
              </Text>
            )}
          </View>
          
          <CampoEntrada
            label="Comprimento (cm)"
            valor={comprimento}
            onChangeText={setComprimento}
            placeholder="Digite o comprimento do cabelo"
            keyboardType="numeric"
            mensagemErro={erros.comprimento}
          />
          
          <Text style={[themeStyles.textText, tw.textSm, tw.mB1, tw.fontMedium]}>
            Tamanho
          </Text>

          <Row style={tw.mB4}>
            <TouchableOpacity
              style={[
                tw.flex1, tw.border, tw.roundedLLg, tw.pY3, tw.itemsCenter,
                tamanho === 'P'
                  ? [themeStyles.bgPrimary, { borderColor: '#4EB296' }]
                  : [tw.bgWhite, tw.borderGray300]
              ]}
              onPress={() => setTamanho('P')}
            >
              <Text
                style={[
                  tw.fontMedium,
                  tamanho === 'P' ? tw.textWhite : tw.textGray700
                ]}
              >
                P
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                tw.flex1, tw.borderT, tw.borderB, tw.pY3, tw.itemsCenter,
                tamanho === 'M'
                  ? [themeStyles.bgPrimary, { borderColor: '#4EB296' }]
                  : [tw.bgWhite, tw.borderGray300]
              ]}
              onPress={() => setTamanho('M')}
            >
              <Text
                style={[
                  tw.fontMedium,
                  tamanho === 'M' ? tw.textWhite : tw.textGray700
                ]}
              >
                M
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                tw.flex1, tw.border, tw.roundedRLg, tw.pY3, tw.itemsCenter,
                tamanho === 'G'
                  ? [themeStyles.bgPrimary, { borderColor: '#4EB296' }]
                  : [tw.bgWhite, tw.borderGray300]
              ]}
              onPress={() => setTamanho('G')}
            >
              <Text
                style={[
                  tw.fontMedium,
                  tamanho === 'G' ? tw.textWhite : tw.textGray700
                ]}
              >
                G
              </Text>
            </TouchableOpacity>
          </Row>

          {erros.tamanho && (
            <Text style={[themeStyles.textError, tw.textXs, tw.mB4]}>
              {erros.tamanho}
            </Text>
          )}
          
          <Text style={[themeStyles.textText, tw.textSm, tw.mB1, tw.fontMedium]}>
            Foto da Peruca{fotoPeruca ? ' ✓' : ''}
          </Text>

          <View
            style={[
              tw.border2, 
              tw.borderDashed, 
              tw.roundedLg, 
              tw.p4, 
              tw.itemsCenter, 
              tw.justifyCenter, 
              tw.mB4,
              fotoPeruca ? { borderColor: themeStyles.color.primary } : 
              erros.fotoPeruca ? { borderColor: themeStyles.color.error } : tw.borderGray300
            ]}
          >
            {fotoPeruca ? (
              <View style={tw.itemsCenter}>
                <Image
                  source={{ uri: fotoPeruca.uri }}
                  style={[tw.w36, tw.h36, tw.roundedLg, tw.mB2]}
                  resizeMode="cover"
                />
                <Text style={[tw.textGray600, tw.textXs]}>
                  Use o botão superior para trocar a imagem
                </Text>
                <Text style={[tw.textGray500, tw.textXs, tw.mT1]}>
                  {fotoPeruca.uri ? fotoPeruca.uri.substring(0, 30) + '...' : 'URI não disponível'}
                </Text>
              </View>
            ) : (
              <View style={[tw.itemsCenter, tw.pY6]}>
                <Ionicons name="camera" size={48} color={themeStyles.color.primary} />
                <Text style={[tw.textGray600, tw.mT2]}>
                  Selecione uma foto usando o botão verde acima
                </Text>
              </View>
            )}
          </View>
            
          {erros.fotoPeruca && (
            <Text style={[{ color: themeStyles.color.error }, tw.textXs, tw.mB4]}>
              {erros.fotoPeruca}
            </Text>
          )}

          <Botao
            titulo="Cadastrar Peruca"
            onPress={handleCadastrarPeruca}
            carregando={carregando}
            larguraTotal
            style={tw.mT4}
          />
        </Card>
      </ScrollContainer>
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisivel}
        onRequestClose={fecharModal}
      >
        <View style={[tw.flex1, tw.justifyEnd, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[tw.bgWhite, tw.roundedTl, tw.p5]}>
            <View style={[tw.itemsCenter, tw.mB4]}>
              <Text style={[tw.textLg, tw.fontBold, { color: '#1E293B' }]}>
                Selecionar Foto
              </Text>
            </View>

            <TouchableOpacity
              style={[tw.flexRow, tw.itemsCenter, tw.pY3, tw.borderB, tw.borderGray200]}
              onPress={tirarFoto}
            >
              <Ionicons name="camera-outline" size={24} color={themeStyles.color.primary} style={{ marginRight: 12 }} />
              <Text style={{ color: '#1E293B' }}>
                Tirar foto
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[tw.flexRow, tw.itemsCenter, tw.pY3, tw.borderB, tw.borderGray200]}
              onPress={selecionarImagem}
            >
              <Ionicons name="image-outline" size={24} color={themeStyles.color.primary} style={{ marginRight: 12 }} />
              <Text style={{ color: '#1E293B' }}>
                Escolher da galeria
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[tw.flexRow, tw.itemsCenter, tw.justifyCenter, tw.mT4, tw.pY3, tw.bgGray100, tw.roundedLg]}
              onPress={fecharModal}
            >
              <Text style={[{ color: '#1E293B' }, tw.fontMedium]}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeContainer>
  );
};

export default CadastrarPerucaTela;