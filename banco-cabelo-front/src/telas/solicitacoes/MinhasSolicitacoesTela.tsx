import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { solicitacoesServico } from '../../servicos/api/solicitacoes';
import { useAutenticacao } from '../../contextos/AutenticacaoContexto';
import Botao from '../../components/comuns/Botao';
import {
  SafeContainer,
  Container,
  Row
} from '../../styles/componentes';
import tw from '../../styles/tailwind';
import themeStyles from '../../styles/theme';

interface Solicitacao {
  id: number;
  pessoa_fisica_id: number;
  status_solicitacao_id: number;
  data_hora: string;
  observacao: string;
  StatusSolicitacao: {
    id: number;
    nome: string;
  };
}

const MinhasSolicitacoesTela: React.FC = () => {
  const navigation = useNavigation<any>();
  const { usuario } = useAutenticacao();
  
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  
  
  const buscarSolicitacoes = async () => {
    if (!usuario) return;
    
    try {
      const resposta = await solicitacoesServico.listarSolicitacoesPorUsuario(usuario.id);
      setSolicitacoes(resposta.data.data);
    } catch (erro) {
      console.error('Erro ao buscar solicitações:', erro);
    }
  };
  
  // Atualizar dados quando a tela receber foco
  useFocusEffect(
    useCallback(() => {
      setCarregando(true);
      buscarSolicitacoes()
        .finally(() => setCarregando(false));
    }, [])
  );
  
  // Função para atualizar a lista (pull-to-refresh)
  const handleAtualizar = async () => {
    setAtualizando(true);
    await buscarSolicitacoes();
    setAtualizando(false);
  };
  
  const voltar = () => {
    navigation.goBack();
  };
  
  const navegarParaDetalhesSolicitacao = (id: number) => {
    navigation.navigate('DetalhesSolicitacao', { id });
  };
  
  const navegarParaNovaSolicitacao = () => {
    navigation.navigate('SolicitacaoPeruca');
  };
  
  const formatarData = (dataString: string) => {
    try {
      const data = new Date(dataString);
      return format(data, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch (erro) {
      return dataString;
    }
  };
  
  // Retorna o estilo e cor do status
  const getEstiloStatus = (statusId: number) => {
    switch (statusId) {
      case 1: // Pendente
        return { bg: tw.bgYellow100, text: tw.textYellow800 };
      case 2: // Em análise
        return { bg: tw.bgBlue100, text: tw.textBlue800 };
      case 3: // Aprovada
        return { bg: tw.bgGreen100, text: tw.textGreen800 };
      case 4: // Recusada
        return { bg: tw.bgRed100, text: tw.textRed800 };
      case 5: // Concluída
        return { bg: tw.bgPurple100, text: tw.textPurple800 };
      default:
        return { bg: tw.bgGray100, text: tw.textGray800 };
    }
  };
  
  // Retorna o nome do status baseado no ID
  const getNomeStatus = (statusId: number): string => {
    switch (statusId) {
      case 1: return "Pendente";
      case 2: return "Em análise";
      case 3: return "Aprovada";
      case 4: return "Recusada";
      case 5: return "Concluída";
      default: return `Status ${statusId}`;
    }
  };
  
  // Renderizar item da lista
  const renderItem = ({ item }: { item: Solicitacao }) => {
    const estiloStatus = getEstiloStatus(item.status_solicitacao_id);

    return (
      <TouchableOpacity
        style={[tw.bgWhite, tw.p4, tw.roundedLg, tw.shadow, tw.mB4]}
        onPress={() => navegarParaDetalhesSolicitacao(item.id)}
      >
        <Row style={[tw.justifyBetween, tw.mB2]}>
          <View style={[tw.pX2, tw.pY1, tw.roundedFull, estiloStatus.bg]}>
            <Text style={[tw.textXs, tw.fontMedium, estiloStatus.text]}>
              {item.StatusSolicitacao?.nome || getNomeStatus(item.status_solicitacao_id)}
            </Text>
          </View>

          <Text style={[tw.textXs, tw.textGray500]}>
            {formatarData(item.data_hora)}
          </Text>
        </Row>

        {item.observacao && (
          <View style={tw.mB3}>
            <Text style={themeStyles.textText}>
              {item.observacao.length > 100
                ? item.observacao.substring(0, 100) + '...'
                : item.observacao}
            </Text>
          </View>
        )}

        <Row style={[tw.justifyEnd, tw.mT2]}>
          <Text style={[themeStyles.textPrimary, tw.textSm, tw.fontMedium, tw.mR1]}>
            Ver detalhes
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#4EB296" />
        </Row>
      </TouchableOpacity>
    );
  };
  
  // Renderizar mensagem quando não houver solicitações
  const renderEmpty = () => {
    if (carregando) return null;

    return (
      <View style={[tw.flex1, tw.itemsCenter, tw.justifyCenter, tw.pY8]}>
        <Ionicons name="document-text-outline" size={48} color="#4EB296" />
        <Text style={[tw.textGray600, tw.textCenter, tw.mT4]}>
          Você ainda não tem solicitações.
        </Text>
        <View style={tw.mT4}>
          <Botao
            titulo="Fazer Nova Solicitação"
            onPress={navegarParaNovaSolicitacao}
            variante="primario"
            style={tw.mT2}
          />
        </View>
      </View>
    );
  };
  
  return (
    <SafeContainer style={themeStyles.bgBackground}>
      
      <Container>
        {carregando ? (
          <View style={[tw.flex1, tw.itemsCenter, tw.justifyCenter]}>
            <ActivityIndicator size="large" color="#4EB296" />
          </View>
        ) : (
          <FlatList
            data={solicitacoes}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 16, flexGrow: 1 }}
            refreshControl={
              <RefreshControl
                refreshing={atualizando}
                onRefresh={handleAtualizar}
                colors={['#4EB296']}
              />
            }
            ListEmptyComponent={renderEmpty}
          />
        )}
      </Container>

      {solicitacoes.length > 0 && (
        <TouchableOpacity
          style={[tw.absolute, { right: 24, bottom: 24 }, tw.w14, tw.h14, themeStyles.bgPrimary, tw.roundedFull, tw.itemsCenter, tw.justifyCenter, tw.shadowLg]}
          onPress={navegarParaNovaSolicitacao}
        >
          <Ionicons name="add" size={30} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </SafeContainer>
  );
};

export default MinhasSolicitacoesTela;