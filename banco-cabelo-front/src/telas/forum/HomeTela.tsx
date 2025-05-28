import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { publicacoesServico } from '../../servicos/api/publicacoes';
import { useAutenticacao } from '../../contextos/AutenticacaoContexto';
import CardPublicacao from '../../components/forum/CardPublicacao';
import HomeHeader from '../../components/forum/HomeHeader';
import {
  SafeContainer,
  Container
} from '../../styles/componentes';
import tw from '../../styles/tailwind';
import themeStyles from '../../styles/theme';

interface Anexo {
  id: number;
  publicacao_id: number;
}

interface Publicacao {
  id: number;
  titulo: string;
  conteudo: string;
  data_hora: string;
  qtd_curtidas: number;
  usuario: {
    id: number;
    nome: string;
    tipo: string;
  };
  comentarios: any[];
  comentarios_count?: number;
  comentariosCount?: number;
  anexos?: Anexo[];
}

const HomeTela: React.FC = () => {
  const navigation = useNavigation<any>();
  const { usuario, ehAdmin } = useAutenticacao();
  
  const [publicacoes, setPublicacoes] = useState<Publicacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [carregandoMais, setCarregandoMais] = useState(false);
  
  // Carregar publicações quando o componente montar
  useEffect(() => {
    const carregarPublicacoesInicial = async () => {
      setCarregando(true);
      await buscarPublicacoes(1, true);
      setCarregando(false);
    };
    
    carregarPublicacoesInicial();
  }, []);
  
  const buscarPublicacoes = async (pagina = 1, limpar = false) => {
    try {
      const resposta = await publicacoesServico.listarPublicacoes(pagina);
      
      const publicacoesProcessadas = resposta.data.data.map((pub: any) => {

        const totalComentarios = pub.comentarios_count !== undefined ? pub.comentarios_count :
                                pub.comentariosCount !== undefined ? pub.comentariosCount :
                                pub.comentarios?.length || 0;


        // Retornar objeto modificado com array de comentários completo
        return {
          ...pub,
          comentarios_count: totalComentarios,
          // Criar um array com objetos vazios mas válidos para a contagem
          comentarios: Array(totalComentarios).fill({id: 0})
        };
      });

      if (limpar) {
        setPublicacoes(publicacoesProcessadas);
      } else {
        setPublicacoes(prevPublicacoes => [
          ...prevPublicacoes,
          ...publicacoesProcessadas
        ]);
      }

      setTotalPaginas(resposta.data.totalPages);
    } catch (erro) {
      console.error('Erro ao buscar publicações:', erro);
    }
  };
  
  // Atualizar dados quando a tela receber foco
  useFocusEffect(
    useCallback(() => {
      
      const verificarAtualizacoes = async () => {
        try {
          const publicationCreated = await AsyncStorage.getItem('publication_created');
          const publicationUpdated = await AsyncStorage.getItem('publication_updated');
          const commentChanges = await AsyncStorage.getItem('comment_changes');
          
          // Se houver qualquer mudança, recarregar
          if (publicationCreated || publicationUpdated || commentChanges) {
            setCarregando(true);
            setPagina(1);
            await buscarPublicacoes(1, true);
            
            // Limpar as flags
            if (publicationCreated) {
              await AsyncStorage.removeItem('publication_created');
            }
            if (publicationUpdated) {
              await AsyncStorage.removeItem('publication_updated');
            }
            if (commentChanges) {
              await AsyncStorage.removeItem('comment_changes');
            }
          }
        } catch (error) {
          console.error('Erro ao verificar atualizações:', error);
        } finally {
          setCarregando(false);
        }
      };

      verificarAtualizacoes();
    }, [])
  );
  
  // Função para atualizar a lista (pull-to-refresh)
  const handleAtualizar = async () => {
    setAtualizando(true);
    setPagina(1);
    await buscarPublicacoes(1, true);
    setAtualizando(false);
  };
  
  // Função para carregar mais publicações (paginação)
  const handleCarregarMais = async () => {
    if (carregandoMais || pagina >= totalPaginas) return;
    
    setCarregandoMais(true);
    const novaPagina = pagina + 1;
    await buscarPublicacoes(novaPagina);
    setPagina(novaPagina);
    setCarregandoMais(false);
  };
  
  const navegarParaNovaPublicacao = () => {
    navigation.navigate('NovaPublicacao');
  };
  
  const handlePublicacaoExcluida = (publicacaoId: number) => {
    setPublicacoes(prevPublicacoes => 
      prevPublicacoes.filter(publicacao => publicacao.id !== publicacaoId)
    );
  };
  
  const handleCurtidaChange = (publicacaoId: number, curtiu: boolean, qtdCurtidas: number) => {
    setPublicacoes(prevPublicacoes => 
      prevPublicacoes.map(publicacao => 
        publicacao.id === publicacaoId 
          ? { ...publicacao, curtiu, qtd_curtidas: qtdCurtidas }
          : publicacao
      )
    );
  };

  const renderItem = ({ item }: { item: Publicacao }) => {
    return (
      <CardPublicacao
        publicacao={item}
        onDelete={handlePublicacaoExcluida}
        onCurtidaChange={handleCurtidaChange}
      />
    );
  };
  
  const renderFooter = () => {
    if (!carregandoMais) return null;

    return (
      <View style={[tw.pY4, tw.itemsCenter]}>
        <ActivityIndicator size="small" color="#4EB296" />
      </View>
    );
  };
  
  const renderEmpty = () => {
    if (carregando) return null;

    return (
      <View style={[tw.flex1, tw.itemsCenter, tw.justifyCenter, tw.pY8]}>
        <Ionicons name="chatbubble-ellipses-outline" size={48} color="#4EB296" />
        <Text style={[tw.textGray600, tw.textCenter, tw.mT4]}>
          Nenhuma publicação encontrada.
        </Text>
        <Text style={[tw.textGray600, tw.textCenter]}>
          Seja o primeiro a compartilhar algo!
        </Text>
      </View>
    );
  };
  
  return (
    <SafeContainer style={themeStyles.bgBackground}>
      <HomeHeader ehAdmin={ehAdmin()} />

      <Container>
        {carregando ? (
          <View style={[tw.flex1, tw.itemsCenter, tw.justifyCenter]}>
            <ActivityIndicator size="large" color="#4EB296" />
          </View>
        ) : (
          <FlatList
            data={publicacoes}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 16 }}
            refreshControl={
              <RefreshControl
                refreshing={atualizando}
                onRefresh={handleAtualizar}
                colors={['#4EB296']}
              />
            }
            onEndReached={handleCarregarMais}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
          />
        )}
      </Container>

      {!ehAdmin() && (
        <TouchableOpacity
          style={[tw.absolute, { right: 24, bottom: 24 }, tw.w14, tw.h14, themeStyles.bgPrimary, tw.roundedFull, tw.itemsCenter, tw.justifyCenter, tw.shadowLg]}
          onPress={navegarParaNovaPublicacao}
        >
          <Ionicons name="add" size={30} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </SafeContainer>
  );
};

export default HomeTela;