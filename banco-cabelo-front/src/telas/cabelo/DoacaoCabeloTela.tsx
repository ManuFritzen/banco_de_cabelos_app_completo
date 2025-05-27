import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Alert, Modal, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { doacaoCabeloServico } from '../../servicos/api/doacao-cabelo';
import { doacaoCabeloBase64Servico } from '../../servicos/api/doacaoCabeloBase64';
import { instituicoesServico } from '../../servicos/api/instituicoes';
import {
  SafeContainer,
  Titulo,
  Paragrafo,
  Card,
  Row,
} from '../../styles/componentes';
import Botao from '../../components/comuns/Botao';
import CampoEntrada from '../../components/comuns/CampoEntrada';
import tw from '../../styles/tailwind';
import themeStyles from '../../styles/theme';

interface Instituicao {
  id: number;
  nome: string;
}

interface Cor {
  id: number;
  nome: string;
  codigo_hex?: string;
}

interface RouteParams {
  instituicaoId: number;
}

const esquemaValidacao = Yup.object().shape({
  comprimento: Yup.string()
    .required('Comprimento é obrigatório')
    .test('is-valid-number', 'Comprimento deve ser um número válido', value => 
      !isNaN(parseFloat(value)) && parseFloat(value) > 0
    ),
  peso: Yup.string().test('is-valid-number', 'Peso deve ser um número válido', value => 
    !value || !isNaN(parseFloat(value))
  ),
  observacao: Yup.string(),
  corId: Yup.string().required('Selecione a cor do cabelo'),
});

const DoacaoCabeloTela: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { instituicaoId } = route.params as RouteParams;
  
  const [instituicao, setInstituicao] = useState<Instituicao | null>(null);
  const [fotoCabelo, setFotoCabelo] = useState<any>(null);
  const [carregando, setCarregando] = useState(false);
  const [carregandoInstituicao, setCarregandoInstituicao] = useState(true);
  const [carregandoCores, setCarregandoCores] = useState(true);
  const [cores, setCores] = useState<Cor[]>([]);
  const [erroFoto, setErroFoto] = useState<string | undefined>(undefined);
  const [modalVisivel, setModalVisivel] = useState(false);
  
  useEffect(() => {
    const buscarDados = async () => {
      try {
        const respostaInstituicao = await instituicoesServico.obterInstituicao(instituicaoId);
        const instituicaoData = respostaInstituicao.data;
        console.log('Dados da instituição:', instituicaoData);
        setInstituicao(instituicaoData);
        
        try {
          const respostaCores = await doacaoCabeloServico.listarCores();
          setCores(respostaCores.data.data || []);
        } catch (erroCores) {
          console.error('Erro ao buscar cores:', erroCores);
          setCores([]);
        } finally {
          setCarregandoCores(false);
        }
      } catch (erro: any) {
        console.error('Erro ao buscar instituição:', erro);
        
        if (erro.response && erro.response.status === 401) {
          Alert.alert(
            'Autenticação necessária', 
            'Você precisa estar logado para realizar uma doação.',
            [
              { 
                text: 'Ir para login', 
                onPress: () => navigation.navigate('Login')
              }
            ]
          );
          // Definir um valor fictício para a instituição para evitar problemas de renderização
          setInstituicao({
            id: instituicaoId,
            nome: 'Instituição'
          });
        } else {
          Alert.alert('Erro', 'Não foi possível carregar os dados da instituição.');
        }
      } finally {
        setCarregandoInstituicao(false);
      }
    };
    
    buscarDados();
  }, [instituicaoId, navigation]);
  
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
      setFotoCabelo(resultado.assets[0]);
      setErroFoto(undefined);
      fecharModal();
    }
  };
  
  // Função para tirar foto com a câmera
  const tirarFoto = async () => {
    // Solicitar permissão para acessar a câmera
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
      setFotoCabelo(resultado.assets[0]);
      setErroFoto(undefined);
      fecharModal(); 
    }
  };
  
  // Função para enviar doação
  const handleSubmit = async (values: { comprimento: string; peso: string; corId: string; observacao: string }) => {
    // Validar a foto
    if (!fotoCabelo) {
      setErroFoto('Foto do cabelo é obrigatória');
      return;
    }
    
    // Enviar doação
    setCarregando(true);
    
    try {
      // Verificar se a foto está no formato esperado pelo servidor
      const formatarFoto = () => {
        // Verifica se todos os campos necessários estão presentes
        if (!fotoCabelo || !fotoCabelo.uri) {
          Alert.alert('Erro', 'A foto selecionada é inválida. Por favor, selecione outra imagem.');
          return null;
        }
        
        // A URI da imagem no expo começa com 'file://' em dispositivos Android
        // e 'ph://' ou 'assets-library://' em iOS.
        const uri = fotoCabelo.uri;
        
        // Determinar tipo baseado na extensão, se não fornecido
        let type = fotoCabelo.type;
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
        
        let name = fotoCabelo.fileName;
        if (!name) {
          // Obter o nome do arquivo da URI, garantindo que seja curto
          // Gerar um nome único e curto para evitar problemas
          const timestamp = new Date().getTime();
          name = `foto_${timestamp % 10000}.jpg`;
        } else if (name.length > 30) {
          // Se o nome for muito longo, encurtar para evitar problemas
          const extension = name.split('.').pop() || 'jpg';
          name = `foto_${Date.now() % 10000}.${extension}`;
        }
        
        console.log('Foto formatada:', { uri, type, name });
        
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
      
      const dadosDoacao = {
        instituicao_id: instituicaoId,
        peso: values.peso ? parseFloat(values.peso) : undefined,
        comprimento: parseFloat(values.comprimento),
        cor_id: values.corId ? parseInt(values.corId) : undefined,
        observacao: values.observacao,
        foto_cabelo: fotoFormatada
      };
      
      console.log('Tentando criar doação usando Base64...');
      // Enviar para a API usando Base64
      const resposta = await doacaoCabeloBase64Servico.criarDoacaoCabeloBase64(dadosDoacao);
      
      console.log('Resposta da API:', resposta.status);
      
      // Mostra mensagem de sucesso
      Alert.alert(
        'Doação Registrada',
        'Sua doação de cabelo foi registrada com sucesso!',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.goBack() 
          }
        ]
      );
    } catch (erro: any) {
      console.error('Erro completo:', erro);
      
      let mensagem = 'Erro ao registrar doação. Tente novamente.';
      
      if (erro.message === 'Network Error') {
        mensagem = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (erro.response) {
        if (erro.response.status === 401) {
          mensagem = 'Você precisa estar logado para realizar uma doação.';
          Alert.alert('Sessão expirada', mensagem, [
            { text: 'Ir para login', onPress: () => navigation.navigate('Login') }
          ]);
          return;
        } else if (erro.response.status === 400) {
          mensagem = erro.response.data?.message || 'Dados inválidos. Verifique os campos e tente novamente.';
        } else if (erro.response.status === 413) {
          mensagem = 'A imagem é muito grande. Por favor, escolha uma imagem menor.';
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
      <StatusBar backgroundColor={themeStyles.color.primary} barStyle="light-content" />
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

          {fotoCabelo && (
            <View style={[themeStyles.bgSecondary, tw.roundedFull, tw.w5, tw.h5, tw.itemsCenter, tw.justifyCenter, tw.mL2]}>
              <Text style={[tw.textWhite, tw.textXs, tw.fontBold]}>
                1
              </Text>
            </View>
          )}
        </Row>
      </TouchableOpacity>
      
      <ScrollView style={tw.flex1} contentContainerStyle={tw.p6} keyboardShouldPersistTaps="handled">
        {carregandoInstituicao ? (
          <Card style={[tw.itemsCenter, tw.border, { borderColor: 'rgba(255, 255, 255, 0.15)', borderWidth: 1, borderRadius: 16 }, tw.p6]}>
            <ActivityIndicator size="large" color={themeStyles.color.primary} style={tw.mB4} />
            <Text style={tw.textGray600}>
              Carregando dados da instituição...
            </Text>
          </Card>
        ) : (
          <>
            <Card style={[tw.mB4, tw.border, { borderColor: 'rgba(255, 255, 255, 0.15)', borderWidth: 1, borderRadius: 16 }, tw.p6]}>
              <Titulo style={tw.mB2}>
                Instituição Selecionada
              </Titulo>

              <Text style={[themeStyles.textPrimary, tw.fontBold, tw.text2xl, tw.mB4]}>
                {instituicao?.nome}
              </Text>

              <Paragrafo style={tw.mB2}>
                Estamos felizes em receber sua doação de cabelo!
                Preencha os dados abaixo para registrar sua contribuição.
              </Paragrafo>
            </Card>
            
            <Formik
              initialValues={{
                peso: '',
                comprimento: '',
                corId: '',
                observacao: ''
              }}
              validationSchema={esquemaValidacao}
              onSubmit={handleSubmit}
            >
              {(formikProps) => (
                <Card style={[tw.border, { borderColor: 'rgba(255, 255, 255, 0.15)', borderWidth: 1, borderRadius: 16 }, tw.p6]}>
                  <CampoEntrada
                    name="peso"
                    label="Peso (gramas - opcional)"
                    placeholder="Digite o peso aproximado"
                    keyboardType="numeric"
                  />
                  
                  <CampoEntrada
                    name="comprimento"
                    label="Comprimento (cm)"
                    placeholder="Digite o comprimento do cabelo"
                    keyboardType="numeric"
                  />
                  
                  <Text style={[themeStyles.textText, tw.textSm, tw.mB1, tw.fontMedium]}>
                    Foto do Cabelo
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
                      erroFoto ? { borderColor: themeStyles.color.error } : tw.borderGray300
                    ]}
                  >
                    {fotoCabelo ? (
                      <View style={tw.itemsCenter}>
                        <Image
                          source={{ uri: fotoCabelo.uri }}
                          style={[tw.w36, tw.h36, tw.roundedLg, tw.mB2]}
                        />
                        <Text style={[tw.textGray600, tw.textXs]}>
                          Use o botão superior para trocar a imagem
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
                  
                  {erroFoto && (
                    <Text style={[{ color: themeStyles.color.error }, tw.textXs, tw.mB4]}>
                      {erroFoto}
                    </Text>
                  )}
                  
                  <View style={tw.mB4}>
                    <Text style={[themeStyles.textText, tw.textSm, tw.mB1, tw.fontMedium]}>
                      Cor do Cabelo
                    </Text>
                    <View style={[
                      tw.border,
                      tw.roundedLg,
                      formikProps.touched.corId && formikProps.errors.corId ? { borderColor: themeStyles.color.error } : tw.borderGray300
                    ]}>
                      {carregandoCores ? (
                        <View style={[tw.h12, tw.justifyCenter, tw.itemsCenter]}>
                          <ActivityIndicator size="small" color={themeStyles.color.primary} />
                        </View>
                      ) : (
                        <Picker
                          selectedValue={formikProps.values.corId}
                          onValueChange={(itemValue: string) => {
                            formikProps.setFieldValue('corId', itemValue);
                            formikProps.setFieldTouched('corId', true);
                          }}
                          style={{ height: 50 }}
                        >
                          <Picker.Item label="Selecione a cor do cabelo" value="" />
                          {cores.map((cor) => (
                            <Picker.Item 
                              key={cor.id} 
                              label={cor.nome} 
                              value={String(cor.id)}
                              color={cor.codigo_hex || '#000000'} 
                            />
                          ))}
                        </Picker>
                      )}
                    </View>
                    {formikProps.touched.corId && formikProps.errors.corId ? (
                      <Text style={[{ color: themeStyles.color.error }, tw.textXs, tw.mT1]}>
                        {formikProps.errors.corId as string}
                      </Text>
                    ) : null}
                  </View>
                  
                  <CampoEntrada
                    name="observacao"
                    label="Observações (opcional)"
                    placeholder="Descreva informações adicionais sobre o cabelo doado"
                    multiline
                    numberOfLines={4}
                    autoCapitalize="sentences"
                  />
                  
                  <Botao
                    titulo="REGISTRAR DOAÇÃO"
                    onPress={formikProps.handleSubmit}
                    carregando={carregando}
                    variante="secundario"
                    larguraTotal
                    tamanhoTexto="normal"
                    style={{ backgroundColor: '#6366F1', shadowOpacity: 0.3, marginTop: 16, marginBottom: 8 }}
                  />
                </Card>
              )}
            </Formik>
          </>
        )}
      </ScrollView>
      
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

export default DoacaoCabeloTela;