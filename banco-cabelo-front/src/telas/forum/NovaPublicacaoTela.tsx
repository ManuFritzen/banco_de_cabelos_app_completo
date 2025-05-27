import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Modal, Image, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Formik } from 'formik';
import * as Yup from 'yup';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { publicacoesServico, ImagemPublicacao } from '../../servicos/api/publicacoes';
import { anexoBase64Servico } from '../../servicos/api/anexoBase64';
import Botao from '../../components/comuns/Botao';
import CampoEntrada from '../../components/comuns/CampoEntrada';
import { useAutenticacao } from '../../contextos/AutenticacaoContexto';
import {
  SafeContainer,
  Card,
  Row
} from '../../styles/componentes';
import tw from '../../styles/tailwind';
import themeStyles from '../../styles/theme';

interface FormularioPublicacaoValues {
  titulo: string;
  conteudo: string;
}

const esquemaValidacao = Yup.object().shape({
  titulo: Yup.string().required('Título é obrigatório'),
  conteudo: Yup.string().required('Conteúdo é obrigatório')
});

const NovaPublicacaoTela: React.FC = () => {
  const navigation = useNavigation<any>();
  const { ehAdmin } = useAutenticacao();
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [imagens, setImagens] = useState<ImagemPublicacao[]>([]);
  const [modalVisivel, setModalVisivel] = useState(false);
  
  useEffect(() => {
    if (ehAdmin()) {
      Alert.alert(
        'Acesso Negado',
        'Administradores não podem criar publicações.',
        [
          { text: 'Voltar', onPress: () => navigation.goBack() }
        ],
        { cancelable: false }
      );
    }
  }, [ehAdmin, navigation]);
  
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
    try {
      // Verificar permissão para acessar a galeria
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permissão negada',
          'Precisamos de permissão para acessar sua galeria de fotos.'
        );
        return;
      }
      
      // Abrir seletor de imagens
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!resultado.canceled && resultado.assets && resultado.assets.length > 0) {
        const asset = resultado.assets[0];
        const fileName = asset.uri.split('/').pop() || 'foto.jpg';
        const fileType = `image/${fileName.split('.').pop()}`;
        
        // Adicionar imagem à lista
        const novaImagem: ImagemPublicacao = {
          uri: asset.uri,
          name: fileName,
          type: fileType
        };
        
        setImagens(prev => [...prev, novaImagem]);
      }
    } catch (erro) {
      console.error('Erro ao selecionar imagem:', erro);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };
  
  const removerImagem = (index: number) => {
    setImagens(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleSubmit = async (values: FormularioPublicacaoValues, { setSubmitting }: any) => {
    try {
      setMensagemErro(null);
      setCarregando(true);
      
      // Envia a publicação
      const resposta = await publicacoesServico.criarPublicacao({
        titulo: values.titulo,
        conteudo: values.conteudo
      });
      
      // Se houver imagens, fazer upload
      if (imagens.length > 0 && resposta.data) {
        // A resposta vem com dataValues ao invés de data
        const publicacaoId = resposta.data.dataValues?.id || resposta.data.id;
        
        if (!publicacaoId) {
          throw new Error('Falha ao obter ID da publicação criada');
        }
        
        // Upload de cada imagem em sequência
        for (const imagem of imagens) {
          try {
            await anexoBase64Servico.adicionarAnexoBase64({
              publicacaoId,
              imagem
            });
          } catch (erroAnexo: any) {
            console.error('Erro ao adicionar anexo:', erroAnexo);
            // Continue mesmo se uma imagem falhar
          }
        }
      }
      
      // Marca que houve nova publicação para forçar atualização na tela Home
      await AsyncStorage.setItem('publication_created', 'true');
      
      navigation.goBack();
    } catch (erro: any) {
      const mensagemErro = erro.response?.data?.message || 'Erro ao criar publicação. Tente novamente.';
      setMensagemErro(mensagemErro);
      Alert.alert('Erro', mensagemErro);
    } finally {
      setCarregando(false);
      setSubmitting(false);
    }
  };
  
  return (
    <SafeContainer style={themeStyles.bgBackground}>
      <TouchableOpacity
        style={[themeStyles.bgPrimary, tw.pX4, tw.pY3]}
        onPress={abrirModal}
        activeOpacity={0.8}
      >
        <View style={[tw.flexRow, tw.itemsCenter, tw.justifyCenter]}>
          <Ionicons name="images-outline" size={24} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={[tw.textWhite, tw.textLg, tw.fontBold]}>
            Inserir Imagens
          </Text>

          {imagens.length > 0 && (
            <View style={[tw.bgBlue500, tw.roundedFull, tw.w5, tw.h5, tw.itemsCenter, tw.justifyCenter, tw.mL2]}>
              <Text style={[tw.textWhite, tw.textXs, tw.fontBold]}>
                {imagens.length}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <Formik
        initialValues={{
          titulo: '',
          conteudo: ''
        }}
        validationSchema={esquemaValidacao}
        onSubmit={handleSubmit}
      >
        {({ handleSubmit, isSubmitting }) => (
          <ScrollView style={tw.flex1} contentContainerStyle={tw.p4}>
            <Card>
              {mensagemErro && (
                <Text style={[tw.textRed500, tw.mB4, tw.textCenter]}>
                  {mensagemErro}
                </Text>
              )}

              <CampoEntrada
                name="titulo"
                label="Título"
                placeholder="Digite o título da sua publicação"
                autoCapitalize="sentences"
              />

              <CampoEntrada
                name="conteudo"
                label="Conteúdo"
                placeholder="Digite o conteúdo da sua publicação"
                multiline
                numberOfLines={8}
                autoCapitalize="sentences"
              />

              <Botao
                titulo="Publicar"
                onPress={handleSubmit}
                carregando={isSubmitting || carregando}
                larguraTotal
                style={tw.mT4}
              />
            </Card>
          </ScrollView>
        )}
      </Formik>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisivel}
        onRequestClose={fecharModal}
      >
        <View style={[tw.flex1, tw.justifyCenter, tw.itemsCenter, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[tw.bgWhite, { width: '91.666667%' }, tw.roundedL, tw.p4]}>
            {/* Header do modal */}
            <Row style={[tw.justifyBetween, tw.mB4]}>
              <Text style={[tw.fontBold, tw.textLg]}>
                Fotos para publicação
              </Text>
              <TouchableOpacity onPress={fecharModal}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </Row>

            {imagens.length > 0 ? (
              <View style={tw.mB4}>
                <FlatList<ImagemPublicacao>
                  data={imagens}
                  keyExtractor={(_: ImagemPublicacao, index: number) => `imagem-${index}`}
                  horizontal
                  renderItem={({ item, index }: { item: ImagemPublicacao; index: number }) => (
                    <View style={[tw.mR2, tw.relative]}>
                      <Image
                        source={{ uri: item.uri }}
                        style={[tw.w24, tw.h24, tw.roundedLg]}
                      />
                      <TouchableOpacity
                        style={[tw.absolute, { top: 4, right: 4 }, tw.bgRed500, tw.roundedFull, tw.w6, tw.h6, tw.itemsCenter, tw.justifyCenter]}
                        onPress={() => removerImagem(index)}
                      >
                        <Ionicons name="close" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  )}
                />
              </View>
            ) : (
              <View style={[tw.itemsCenter, tw.justifyCenter, tw.pY6, tw.mB4]}>
                <Ionicons name="images-outline" size={48} color="#CCCCCC" />
                <Text style={[tw.textGray400, tw.mT2]}>
                  Nenhuma foto selecionada
                </Text>
              </View>
            )}

            <Row style={tw.justifyBetween}>
              <Botao
                titulo="Adicionar Foto"
                onPress={selecionarImagem}
                style={[tw.flex1, tw.mR2]}
              />
              <Botao
                titulo="Concluído"
                onPress={fecharModal}
                style={[tw.flex1, tw.mL2]}
              />
            </Row>
          </View>
        </View>
      </Modal>
    </SafeContainer>
  );
};

export default NovaPublicacaoTela;