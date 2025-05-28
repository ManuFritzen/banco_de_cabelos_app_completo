import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Formik } from 'formik';
import * as Yup from 'yup';
import * as ImagePicker from 'expo-image-picker';
import { solicitacaoBase64Servico } from '../../servicos/api/solicitacaoBase64';
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

const esquemaValidacao = Yup.object().shape({
  observacao: Yup.string()
});

const SolicitacaoPerucaTela: React.FC = () => {
  const navigation = useNavigation<any>();
  
  const [fotoLaudoMedico, setFotoLaudoMedico] = useState<any>(null);
  const [carregando, setCarregando] = useState(false);
  const [erroFoto, setErroFoto] = useState<string | undefined>(undefined);
  const [modalVisivel, setModalVisivel] = useState(false);
  
  
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
      setFotoLaudoMedico(resultado.assets[0]);
      setErroFoto(undefined);
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
      setFotoLaudoMedico(resultado.assets[0]);
      setErroFoto(undefined);
      fecharModal(); 
    }
  };
  
  const handleSubmit = async (values: { observacao: string }) => {
    
    // Validar a foto
    if (!fotoLaudoMedico) {
      setErroFoto('Foto do laudo médico é obrigatória');
      return;
    }
    
    setCarregando(true);
    
    try {
      // Verificar se a foto está no formato esperado pelo servidor
      const formatarFoto = () => {
        // Verifica se todos os campos necessários estão presentes
        if (!fotoLaudoMedico || !fotoLaudoMedico.uri) {
          Alert.alert('Erro', 'A foto selecionada é inválida. Por favor, selecione outra imagem.');
          return null;
        }
        
        // A URI da imagem no expo começa com 'file://' em dispositivos Android
        // e 'ph://' ou 'assets-library://' em iOS.
        const uri = fotoLaudoMedico.uri;
        
        // Determinar tipo baseado na extensão, se não fornecido
        let type = fotoLaudoMedico.type;
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
        
        let name = fotoLaudoMedico.fileName;
        if (!name) {
          // Obter o nome do arquivo da URI, garantindo que seja curto
          // Gerar um nome único e curto para evitar problemas
          const timestamp = new Date().getTime();
          name = `laudo_${timestamp % 10000}.jpg`;
        } else if (name.length > 30) {
          // Se o nome for muito longo, encurtar para evitar problemas
          const extension = name.split('.').pop() || 'jpg';
          name = `laudo_${Date.now() % 10000}.${extension}`;
        }
        
        return {
          uri,
          type,
          name
        };
      };
      
      const fotoFormatada = formatarFoto();
      if (!fotoFormatada) {
        throw new Error('Não foi possível formatar a foto para envio');
      }
      
      const dadosSolicitacao = {
        observacao: values.observacao?.trim() || '',
        foto_laudo_medico: fotoFormatada,
        status_solicitacao_id: 1 // Status "Pendente"
      };      
      
      // Enviar solicitação para o servidor
      try {
        const resposta = await solicitacaoBase64Servico.criarSolicitacaoBase64(dadosSolicitacao);
        console.log('✅ Sucesso! Resposta do servidor:', resposta.data);
      } catch (apiError) {
        console.error('❌ Erro na API:', apiError);
        throw apiError; // Re-throw para ser capturado pelo catch principal
      }
      
      // Mostra mensagem de sucesso
      Alert.alert(
        'Solicitação Enviada',
        'Sua solicitação de peruca foi enviada com sucesso! Uma instituição entrará em contato em breve.',
        [
          { 
            text: 'Ver Minhas Solicitações', 
            onPress: () => navigation.navigate('EmConstrucao', { titulo: 'Minhas Solicitações' }) 
          },
          { 
            text: 'OK', 
            onPress: () => navigation.goBack() 
          }
        ]
      );
    } catch (erro: any) {
      console.error('Erro completo:', erro);
      let mensagem = 'Erro ao registrar solicitação. Tente novamente.';
      
      if (erro.message === 'Network Error') {
        mensagem = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (erro.response) {
        if (erro.response.status === 401) {
          mensagem = 'Você precisa estar logado para realizar uma solicitação.';
          Alert.alert('Sessão expirada', mensagem, [
            { text: 'Ir para login', onPress: () => navigation.navigate('Login') }
          ]);
          return;
        } else if (erro.response.status === 400) {
          mensagem = erro.response.data?.message || 'Dados inválidos. Verifique os campos e tente novamente.';
        } else if (erro.response.status === 413) {
          mensagem = 'A imagem é muito grande. Por favor, escolha uma imagem menor ou diminua a qualidade da foto.';
        } else if (erro.response.status === 403) {
          mensagem = 'Você não tem permissão para realizar esta operação. Apenas pessoas físicas podem solicitar perucas.';
        } else {
          mensagem = erro.response.data?.message || `Erro ${erro.response.status}: Tente novamente mais tarde.`;
        }
      }
      
      Alert.alert('Erro', mensagem);
    } finally {
      setCarregando(false);
    }
  };
  
  return (
    <SafeContainer style={themeStyles.bgBackground}>
      <TouchableOpacity
        style={[themeStyles.bgPrimary, tw.pX4, tw.pY3]}
        onPress={abrirModal}
        activeOpacity={0.8}
      >
        <Row style={tw.justifyCenter}>
          <Ionicons name="images-outline" size={24} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={[tw.textWhite, tw.textLg, tw.fontBold]}>
            Selecionar Laudo Médico
          </Text>

          {fotoLaudoMedico && (
            <View style={[tw.bgBlue500, tw.roundedFull, tw.w5, tw.h5, tw.itemsCenter, tw.justifyCenter, tw.mL2]}>
              <Text style={[tw.textWhite, tw.textXs, tw.fontBold]}>
                1
              </Text>
            </View>
          )}
        </Row>
      </TouchableOpacity>
      
      <ScrollContainer style={tw.p4} keyboardShouldPersistTaps="handled">
        <Card style={tw.mB4}>
          <Titulo style={tw.mB2}>
            Solicitar Doação de Peruca
          </Titulo>

          <Paragrafo style={tw.mB4}>
            Para solicitar uma peruca, é necessário enviar um laudo médico
            comprovando a condição que causa a perda de cabelo.
            Sua solicitação será analisada por uma instituição parceira.
          </Paragrafo>

          <View style={[{ backgroundColor: '#EBF5FF' }, tw.p3, tw.roundedLg, tw.mB2]}>
            <Text style={[tw.textBlue800, tw.fontMedium]}>
              Informações importantes:
            </Text>
            <Text style={[tw.textBlue600, tw.textSm, tw.mT1]}>
              • O laudo médico deve estar legível e conter a assinatura do médico
            </Text>
            <Text style={[tw.textBlue600, tw.textSm]}>
              • Solicitações são analisadas em até 7 dias úteis
            </Text>
            <Text style={[tw.textBlue600, tw.textSm]}>
              • A disponibilidade de perucas depende das doações recebidas
            </Text>
          </View>
        </Card>
        
        <Formik
          initialValues={{ observacao: '' }}
          validationSchema={esquemaValidacao}
          onSubmit={handleSubmit}
        >
          {({ handleSubmit }) => (
            <Card>
              <Text style={[themeStyles.textText, tw.textSm, tw.mB1, tw.fontMedium]}>
                Laudo Médico (obrigatório)
              </Text>

              <View
                style={[
                  tw.border2,
                  { borderStyle: 'dashed' },
                  tw.roundedLg,
                  tw.p4,
                  tw.itemsCenter,
                  tw.justifyCenter,
                  tw.mB4,
                  erroFoto ? { borderColor: '#F87171' } : tw.borderGray300
                ]}
              >
                {fotoLaudoMedico ? (
                  <View style={tw.itemsCenter}>
                    <Image
                      source={{ uri: fotoLaudoMedico.uri }}
                      style={[tw.w36, tw.h36, tw.roundedLg, tw.mB2]}
                    />
                    <Text style={[tw.textGray600, tw.textXs]}>
                      Use o botão superior para trocar a imagem
                    </Text>
                  </View>
                ) : (
                  <View style={[tw.itemsCenter, tw.pY6]}>
                    <Ionicons name="document-text" size={48} color="#4EB296" />
                    <Text style={[tw.textGray600, tw.mT2]}>
                      Selecione uma foto usando o botão verde acima
                    </Text>
                  </View>
                )}
              </View>

              {erroFoto && (
                <Text style={[{ color: '#F87171' }, tw.textXs, tw.mB4]}>
                  {erroFoto}
                </Text>
              )}
              
              <CampoEntrada
                name="observacao"
                label="Observações (opcional)"
                placeholder="Descreva informações adicionais sobre sua solicitação, como tipo de peruca, cor preferida, etc."
                multiline
                numberOfLines={4}
                autoCapitalize="sentences"
              />

              <Botao
                titulo="Enviar Solicitação"
                onPress={handleSubmit}
                carregando={carregando}
                larguraTotal
                style={tw.mT4}
              />
              <View style={tw.h10} />

            </Card>
          )}
        </Formik>
      </ScrollContainer>
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisivel}
        onRequestClose={fecharModal}
      >
        <View style={[tw.flex1, tw.justifyEnd, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[tw.bgWhite, { borderTopLeftRadius: 20, borderTopRightRadius: 20 }, tw.p5]}>
            <View style={[tw.itemsCenter, tw.mB4]}>
              <Titulo>
                Selecionar Laudo Médico
              </Titulo>
            </View>

            <TouchableOpacity
              style={[tw.flexRow, tw.itemsCenter, tw.pY3, tw.borderB, tw.borderGray200]}
              onPress={tirarFoto}
            >
              <Ionicons name="camera-outline" size={24} color="#4EB296" style={{ marginRight: 12 }} />
              <Text style={themeStyles.textText}>
                Tirar foto
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[tw.flexRow, tw.itemsCenter, tw.pY3, tw.borderB, tw.borderGray200]}
              onPress={selecionarImagem}
            >
              <Ionicons name="image-outline" size={24} color="#4EB296" style={{ marginRight: 12 }} />
              <Text style={themeStyles.textText}>
                Escolher da galeria
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[tw.flexRow, tw.itemsCenter, tw.justifyCenter, tw.mT4, tw.pY3, tw.bgGray100, tw.roundedLg]}
              onPress={fecharModal}
            >
              <Text style={[themeStyles.textText, tw.fontMedium]}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeContainer>
  );
};

export default SolicitacaoPerucaTela;