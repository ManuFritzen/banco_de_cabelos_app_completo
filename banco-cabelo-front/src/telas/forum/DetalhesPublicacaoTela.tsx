import React, { useState, useEffect } from 'react';
import { View, ScrollView, ActivityIndicator, Alert, StatusBar, Text } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { publicacoesServico } from '../../servicos/api/publicacoes';
import CardPublicacao from '../../components/forum/CardPublicacao';
import SecaoComentarios from '../../components/forum/SecaoComentarios';
import { SafeContainer, Container } from '../../styles/componentes';
import tw from '../../styles/tailwind';
import themeStyles from '../../styles/theme';
import { Ionicons } from '@expo/vector-icons';

interface Comentario {
  id: number;
  conteudo: string;
  data_hora: string;
  usuario: {
    id: number;
    nome: string;
  };
}

interface Publicacao {
  id: number;
  titulo: string;
  conteudo: string;
  data_hora: string;
  qtd_curtidas: number;
  curtiu?: boolean; 
  usuario: {
    id: number;
    nome: string;
    tipo: string;
  };
  comentarios?: Comentario[];
  comentarios_count?: number;
  anexos?: {
    id: number;
    publicacao_id: number;
  }[];
}

interface RouteParams {
  publicacaoId: number;
}

const DetalhesPublicacaoTela: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { publicacaoId } = route.params as RouteParams;
  
  const [publicacao, setPublicacao] = useState<Publicacao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [qtdComentarios, setQtdComentarios] = useState(0);
  
  useEffect(() => {
    carregarPublicacao();
  }, [publicacaoId]);
  
  const carregarPublicacao = async () => {
    setCarregando(true);
    try {
      const resposta = await publicacoesServico.obterPublicacao(publicacaoId);
      const publicacaoData = resposta.data;
      setPublicacao(publicacaoData);

      const comentariosCount = publicacaoData.comentarios_count ?? publicacaoData.comentarios?.length ?? 0;
      setQtdComentarios(comentariosCount);
    } catch (erro) {
      console.error('Erro ao carregar detalhes da publicação:', erro);
      Alert.alert(
        'Erro',
        'Não foi possível carregar os detalhes da publicação. Tente novamente.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } finally {
      setCarregando(false);
    }
  };
  
  const atualizarContagemComentarios = (quantidade: number) => {
    setQtdComentarios(quantidade);

    if (publicacao) {
      const comentariosAtualizados = Array(quantidade).fill({ id: 0 });

      setPublicacao(prevPublicacao => {
        if (!prevPublicacao) return null;

        const publicacaoAtualizada: Publicacao = {
          ...prevPublicacao,
          comentarios: comentariosAtualizados,
          comentarios_count: quantidade
        };

        return publicacaoAtualizada;
      });
    }
  };
  
  const handleExcluirPublicacao = (id: number) => {
    navigation.goBack();
  };
  
  const handleCurtidaChange = (publicacaoId: number, curtiu: boolean, qtdCurtidas: number) => {
    setPublicacao(prevPublicacao => {
      if (!prevPublicacao) return null;
      
      return {
        ...prevPublicacao,
        curtiu,
        qtd_curtidas: qtdCurtidas
      };
    });
  };
  
  if (carregando) {
    return (
      <SafeContainer style={tw.bgWhite}>
        <StatusBar backgroundColor={themeStyles.color.primary} barStyle="light-content" />
        <Container style={[tw.flex1, tw.itemsCenter, tw.justifyCenter]}>
          <ActivityIndicator size="large" color={themeStyles.color.primary} />
        </Container>
      </SafeContainer>
    );
  }
  
  if (!publicacao) {
    return (
      <SafeContainer style={tw.bgWhite}>
        <StatusBar backgroundColor={themeStyles.color.primary} barStyle="light-content" />
        <Container style={[tw.flex1, tw.itemsCenter, tw.justifyCenter]}>
          <Ionicons name="alert-circle-outline" size={48} color="#9CA3AF" />
          <Text style={[tw.textGray600, tw.mT4, tw.textCenter]}>
            Publicação não encontrada ou excluída
          </Text>
        </Container>
      </SafeContainer>
    );
  }
  
  return (
    <SafeContainer style={tw.bgWhite}>
      <StatusBar backgroundColor={themeStyles.color.primary} barStyle="light-content" />
      <ScrollView style={tw.flex1}>
        <Container style={tw.p4}>
          <CardPublicacao
            publicacao={{
              ...publicacao,
              comentarios_count: qtdComentarios,
              comentarios: Array(qtdComentarios).fill({id: 0}), 
              curtiu: publicacao.curtiu 
            }}
            exibirCompleto={true}
            onDelete={handleExcluirPublicacao}
            onCurtidaChange={handleCurtidaChange}
          />
          
          <SecaoComentarios 
            publicacaoId={publicacao.id}
            atualizarContagem={atualizarContagemComentarios}
          />
        </Container>
      </ScrollView>
    </SafeContainer>
  );
};

export default DetalhesPublicacaoTela;