import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Formik } from 'formik';
import * as Yup from 'yup';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { publicacoesServico } from '../../servicos/api/publicacoes';
import Botao from '../../components/comuns/Botao';
import CampoEntrada from '../../components/comuns/CampoEntrada';
import { useAutenticacao } from '../../contextos/AutenticacaoContexto';
import {
  SafeContainer,
  Card
} from '../../styles/componentes';
import tw from '../../styles/tailwind';
import themeStyles from '../../styles/theme';

interface FormularioPublicacaoValues {
  titulo: string;
  conteudo: string;
}

type ParamsRoute = RouteProp<{
  EditarPublicacao: {
    publicacaoId: number;
  };
}, 'EditarPublicacao'>;

const esquemaValidacao = Yup.object().shape({
  titulo: Yup.string().required('Título é obrigatório'),
  conteudo: Yup.string().required('Conteúdo é obrigatório')
});

const EditarPublicacaoTela: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<ParamsRoute>();
  const { publicacaoId } = route.params;
  const { usuario } = useAutenticacao();
  
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [carregandoPublicacao, setCarregandoPublicacao] = useState(true);
  const [publicacao, setPublicacao] = useState<any>(null);
  
  useEffect(() => {
    const buscarPublicacao = async () => {
      try {
        setCarregandoPublicacao(true);
        const resposta = await publicacoesServico.obterPublicacao(publicacaoId);
        // A resposta agora vem diretamente em resposta.data
        if (resposta.data) {
          const dadosPublicacao = resposta.data;
          
          if (dadosPublicacao.usuario && dadosPublicacao.usuario.id !== usuario?.id) {
            Alert.alert(
              'Acesso Negado',
              'Você não tem permissão para editar esta publicação.',
              [
                { text: 'Voltar', onPress: () => navigation.goBack() }
              ],
              { cancelable: false }
            );
            return;
          }
          
          setPublicacao(dadosPublicacao);
        } else {
          Alert.alert('Erro', 'Não foi possível encontrar a publicação.');
          navigation.goBack();
        }
      } catch (erro: any) {
        console.error('Erro ao buscar publicação:', erro);
        const mensagem = erro.response?.data?.message || 'Erro ao carregar publicação.';
        Alert.alert('Erro', mensagem);
        navigation.goBack();
      } finally {
        setCarregandoPublicacao(false);
      }
    };
    
    buscarPublicacao();
  }, [publicacaoId]);
  
  const voltar = () => {
    navigation.goBack();
  };
  
  const handleSubmit = async (values: FormularioPublicacaoValues, { setSubmitting }: any) => {
    try {
      setMensagemErro(null);
      setCarregando(true);
      
      await publicacoesServico.atualizarPublicacao(publicacaoId, {
        titulo: values.titulo,
        conteudo: values.conteudo
      });
      
      Alert.alert('Sucesso', 'Publicação atualizada com sucesso!');
      
      // Marca que houve alteração para forçar atualização na tela Home
      await AsyncStorage.setItem('publication_updated', 'true');
      
      // Volta para a tela anterior após o envio
      navigation.goBack();
    } catch (erro: any) {
      // Tratar erro ao atualizar publicação
      const mensagemErro = erro.response?.data?.message || 'Erro ao atualizar publicação. Tente novamente.';
      setMensagemErro(mensagemErro);
      Alert.alert('Erro', mensagemErro);
    } finally {
      setCarregando(false);
      setSubmitting(false);
    }
  };
  
  if (carregandoPublicacao) {
    return (
      <SafeContainer style={themeStyles.bgBackground}>
        <View style={[tw.flex1, tw.justifyCenter, tw.itemsCenter]}>
          <ActivityIndicator size="large" color="#4EB296" />
          <Text style={[tw.mT4, tw.textGray600]}>Carregando publicação...</Text>
        </View>
      </SafeContainer>
    );
  }
  
  return (
    <SafeContainer style={themeStyles.bgBackground}>
      <ScrollView style={tw.flex1} keyboardShouldPersistTaps="always">
        <View style={[tw.flex1, tw.p6]}>
          <TouchableOpacity
            style={[tw.w10, tw.h10, tw.itemsCenter, tw.justifyCenter, tw.mB4]}
            onPress={voltar}
          >
            <Ionicons name="arrow-back" size={24} color="#4EB296" />
          </TouchableOpacity>
          
          <View style={[tw.itemsCenter, tw.mB8]}>
            <Text style={[themeStyles.textText, tw.text2xl, tw.fontBold, tw.textCenter]}>
              Editar Publicação
            </Text>
          </View>
          
          {publicacao && (
            <Formik
              initialValues={{
                titulo: publicacao.titulo || '',
                conteudo: publicacao.conteudo || ''
              }}
              validationSchema={esquemaValidacao}
              onSubmit={handleSubmit}
            >
              {({ handleSubmit, isSubmitting }) => (
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
                    titulo="Salvar Alterações"
                    onPress={handleSubmit}
                    carregando={isSubmitting || carregando}
                    larguraTotal
                    style={tw.mT4}
                  />
                </Card>
              )}
            </Formik>
          )}
        </View>
      </ScrollView>
    </SafeContainer>
  );
};

export default EditarPublicacaoTela;