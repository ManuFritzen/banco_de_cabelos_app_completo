import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { notificacoesAPI, Notificacao } from '../servicos/api/notificacoes';
import themeStyles from '../styles/theme';
import { fontes } from '../styles/fontes';
const { cores } = themeStyles;

const NotificacoesTela = () => {
  const navigation = useNavigation<any>();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [carregandoMais, setCarregandoMais] = useState(false);

  const carregarNotificacoes = useCallback(async (pagina = 1, adicionar = false) => {
    try {
      if (pagina === 1) {
        setCarregando(true);
      } else {
        setCarregandoMais(true);
      }

      const resposta = await notificacoesAPI.listar(pagina);
      
      if (resposta && resposta.success) {
        const notificacoesData = resposta.data || [];
        
        if (adicionar) {
          setNotificacoes(prev => [...prev, ...notificacoesData]);
        } else {
          setNotificacoes(notificacoesData);
        }
        
        setPaginaAtual(resposta.currentPage || 1);
        setTotalPaginas(resposta.totalPages || 1);
      }
    } catch (erro) {
      console.error('Erro ao carregar notificações:', erro);
      Alert.alert('Erro', 'Não foi possível carregar as notificações');
    } finally {
      setCarregando(false);
      setCarregandoMais(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    carregarNotificacoes();
  }, []);

  // Recarregar notificações quando a tela receber foco
  useFocusEffect(
    useCallback(() => {
      carregarNotificacoes();
    }, [carregarNotificacoes])
  );

  const marcarComoLida = async (notificacao: Notificacao) => {
    
    if (notificacao.lida) {
      navegarParaDestino(notificacao);
      return;
    }

    try {
      await notificacoesAPI.marcarComoLida(notificacao.id);
      
      // Atualizar localmente
      setNotificacoes(prev => prev.map(n => 
        n.id === notificacao.id ? { ...n, lida: true } : n
      ));
      
      navegarParaDestino(notificacao);
    } catch (erro) {
      console.error('Erro ao marcar como lida:', erro);
    }
  };

  const navegarParaDestino = (notificacao: Notificacao) => {
    
    if (notificacao.publicacao_id) {
      navigation.navigate('DetalhesPublicacao', { publicacaoId: notificacao.publicacao_id });
    } else if (notificacao.solicitacao_id) {
      navigation.navigate('DetalhesSolicitacao', { id: notificacao.solicitacao_id });
    } else if (notificacao.tipo === 'recebimento_cabelo') {
      if (notificacao.recebimento_id) {
        
        navigation.push('RecebimentosCabelo', { 
          openModal: true, 
          recebimentoId: notificacao.recebimento_id 
        });
      } else {
        navigation.navigate('RecebimentosCabelo');
      }
    }
  };

  const marcarTodasComoLidas = async () => {
    try {
      await notificacoesAPI.marcarTodasComoLidas();
      
      // Atualizar localmente
      setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
      
      Alert.alert('Sucesso', 'Todas as notificações foram marcadas como lidas');
    } catch (erro) {
      console.error('Erro ao marcar todas como lidas:', erro);
      Alert.alert('Erro', 'Não foi possível marcar as notificações como lidas');
    }
  };

  const excluirNotificacao = async (id: number) => {
    Alert.alert(
      'Excluir notificação',
      'Tem certeza que deseja excluir esta notificação?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await notificacoesAPI.excluir(id);
              setNotificacoes(prev => prev.filter(n => n.id !== id));
            } catch (erro) {
              console.error('Erro ao excluir notificação:', erro);
              Alert.alert('Erro', 'Não foi possível excluir a notificação');
            }
          }
        }
      ]
    );
  };

  const obterIconeNotificacao = (tipo: string) => {
    switch (tipo) {
      case 'curtida_publicacao':
      case 'curtida_comentario':
        return 'heart';
      case 'comentario':
      case 'resposta_comentario':
        return 'chatbubble';
      case 'solicitacao':
        return 'document-text';
      case 'recebimento_cabelo':
        return 'gift';
      default:
        return 'notifications';
    }
  };

  const renderNotificacao = ({ item }: { item: Notificacao }) => (
    <TouchableOpacity
      style={[styles.notificacaoCard, !item.lida && styles.naoLida]}
      onPress={() => marcarComoLida(item)}
      onLongPress={() => excluirNotificacao(item.id)}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={obterIconeNotificacao(item.tipo) as any}
          size={24}
          color={cores.primary}
        />
      </View>
      
      <View style={styles.conteudoContainer}>
        <Text style={[styles.titulo, !item.lida && styles.tituloNaoLido]}>
          {item.titulo}
        </Text>
        <Text style={styles.mensagem} numberOfLines={2}>
          {item.mensagem}
        </Text>
        <Text style={styles.dataHora}>
          {item.data_hora ? format(new Date(item.data_hora), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR }) : ''}
        </Text>
      </View>
      
      {!item.lida && <View style={styles.indicadorNaoLido} />}
    </TouchableOpacity>
  );

  const carregarMais = () => {
    if (!carregandoMais && paginaAtual < totalPaginas) {
      carregarNotificacoes(paginaAtual + 1, true);
    }
  };

  const renderFooter = () => {
    if (!carregandoMais) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={cores.primary} />
      </View>
    );
  };

  const renderVazio = () => (
    <View style={styles.vazioContainer}>
      <Ionicons name="notifications-off-outline" size={64} color={cores.gray} />
      <Text style={styles.vazioTexto}>Nenhuma notificação</Text>
    </View>
  );
  
  if (!cores || !fontes) {
    return null;
  }

  if (carregando) {
    return (
      <View style={styles.centroContainer}>
        <ActivityIndicator size="large" color={cores.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {notificacoes.length > 0 && (
        <TouchableOpacity
          style={styles.marcarTodasBotao}
          onPress={marcarTodasComoLidas}
        >
          <Ionicons name="checkmark-done" size={20} color={cores.primary} />
          <Text style={styles.marcarTodasTexto}>Marcar todas como lidas</Text>
        </TouchableOpacity>
      )}
      
      <FlatList
        data={notificacoes || []}
        keyExtractor={(item) => item?.id?.toString() || ''}
        renderItem={renderNotificacao}
        contentContainerStyle={styles.listaContainer}
        ItemSeparatorComponent={() => <View style={styles.separador} />}
        ListEmptyComponent={renderVazio}
        ListFooterComponent={renderFooter}
        onEndReached={carregarMais}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={() => {
              setAtualizando(true);
              carregarNotificacoes();
            }}
            colors={[cores.primary]}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.background,
  },
  centroContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: cores.background,
  },
  marcarTodasBotao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: cores.white,
    borderBottomWidth: 1,
    borderBottomColor: cores.lightGray,
  },
  marcarTodasTexto: {
    marginLeft: 8,
    fontSize: 16,
    color: cores.primary,
    fontFamily: fontes.principal.regular,
  },
  listaContainer: {
    flexGrow: 1,
  },
  notificacaoCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: cores.white,
  },
  naoLida: {
    backgroundColor: cores.primaryLight,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: cores.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  conteudoContainer: {
    flex: 1,
  },
  titulo: {
    fontSize: 16,
    fontFamily: fontes.principal.regular,
    color: cores.darkGray,
    marginBottom: 4,
  },
  tituloNaoLido: {
    fontFamily: fontes.principal.bold,
    color: cores.black,
  },
  mensagem: {
    fontSize: 14,
    fontFamily: fontes.principal.regular,
    color: cores.gray,
    marginBottom: 8,
  },
  dataHora: {
    fontSize: 12,
    fontFamily: fontes.principal.regular,
    color: cores.gray,
  },
  indicadorNaoLido: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: cores.primary,
    position: 'absolute',
    top: 16,
    right: 16,
  },
  separador: {
    height: 1,
    backgroundColor: cores.lightGray,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  vazioContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  vazioTexto: {
    marginTop: 16,
    fontSize: 18,
    color: cores.gray,
    fontFamily: fontes.principal.regular,
  },
});

export default NotificacoesTela;