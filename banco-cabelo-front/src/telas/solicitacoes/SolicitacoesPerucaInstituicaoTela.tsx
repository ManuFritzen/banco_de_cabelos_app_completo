import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  RefreshControl, 
  TouchableOpacity, 
  ActivityIndicator,
  ScrollView,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { useAutenticacao } from '../../contextos/AutenticacaoContexto';
import { solicitacoesServico } from '../../servicos/api/solicitacoes';
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
  data_solicitacao: string;
  data_hora: string;
  observacao: string;
  StatusSolicitacao?: {
    id: number;
    nome: string;
  };
  contadores?: {
    total_analises: number;
    pendentes: number;
    em_analise: number;
    aprovadas: number;
    recusadas: number;
    tem_analises: boolean;
  };
  usuario: {
    id: number;
    nome: string;
    email: string;
    telefone: string;
  };
}

const SolicitacoesPerucaInstituicaoTela: React.FC = () => {
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');
  const [solicitacoesFiltradas, setSolicitacoesFiltradas] = useState<Solicitacao[]>([]);
  
  const { usuario } = useAutenticacao();
  const navigation = useNavigation<any>();

  const carregarSolicitacoes = useCallback(async () => {
    if (!usuario) return;
    
    try {
      setCarregando(true);
      const params: any = {};
      
      try {
        const resposta = await solicitacoesServico.listarSolicitacoes(params);
        
        const solicitacoesFormatadas = resposta.data.data?.map((item: any) => ({
          ...item,
          usuario: item.PessoaFisica || {}
        })) || [];
        
        setSolicitacoes(solicitacoesFormatadas);
        setSolicitacoesFiltradas(solicitacoesFormatadas);
      } catch (erro: any) {
        console.error('Erro detalhado ao carregar solicitações:', erro.response?.data || erro);
      }
    } catch (erro) {
      console.error('Erro ao carregar solicitações:', erro);
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [usuario]);

  const atualizarLista = () => {
    setAtualizando(true);
    carregarSolicitacoes();
  };

  useFocusEffect(
    useCallback(() => {
      carregarSolicitacoes();
    }, [carregarSolicitacoes])
  );
  
  useEffect(() => {
    if (termoBusca.trim() === '') {
      setSolicitacoesFiltradas(solicitacoes);
      return;
    }
    
    const termoLowerCase = termoBusca.toLowerCase();
    const filtradas = solicitacoes.filter(item => 
      item.usuario?.nome?.toLowerCase().includes(termoLowerCase)
    );
    
    setSolicitacoesFiltradas(filtradas);
  }, [termoBusca, solicitacoes]);

  const irParaDetalhes = (id: number) => {
    navigation.navigate('DetalhesSolicitacao' as never, { id } as never);
  };

  const getEstiloStatus = (statusId: number) => {
    switch (statusId) {
      case 1: // Pendente
        return { bg: tw.bgYellow100, text: tw.textYellow800 };
      case 2: // Em análise
        return { bg: tw.bgBlue100, text: tw.textBlue800 };
      case 3: // Aprovada
        return { bg: tw.bgGreen100, text: tw.textGreen800 };
      case 4: // Rejeitada
        return { bg: tw.bgRed100, text: tw.textRed800 };
      case 5: // Concluída
        return { bg: tw.bgPurple100, text: tw.textPurple800 };
      case 6: // Cancelada
        return { bg: tw.bgGray300, text: tw.textGray800 };
      default:
        return { bg: tw.bgGray100, text: tw.textGray800 };
    }
  };


  const renderItem = ({ item }: { item: Solicitacao }) => {
    const estiloStatus = getEstiloStatus(item.status_solicitacao_id);
    
    return (
      <TouchableOpacity
        style={[tw.bgWhite, tw.p4, tw.roundedLg, tw.shadow, tw.mB4]}
        onPress={() => irParaDetalhes(item.id)}
      >
        <View style={[tw.mB2]}>
          <Text style={[tw.textXs, tw.textGray500]}>
            {format(new Date(item.data_hora || item.data_solicitacao), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </Text>
        </View>
        
        <View style={tw.mB2}>
          <Text style={[tw.textLg, tw.fontMedium]}>{item.usuario?.nome || 'Usuário'}</Text>
        </View>
        
        {item.observacao && (
          <View style={tw.mB3}>
            <Text style={themeStyles.textText}>
              {item.observacao.length > 100
                ? item.observacao.substring(0, 100) + '...'
                : item.observacao}
            </Text>
          </View>
        )}
        
        {item.contadores && item.contadores.tem_analises && (
          <View style={[tw.mB3, tw.pY2, tw.pX3, tw.bgGray100, tw.roundedLg]}>
            <Text style={[tw.textXs, tw.textGray600, tw.mB1]}>Status das análises:</Text>
            <Row style={[tw.flexWrap]}>
              {item.contadores.pendentes > 0 && (
                <View style={[tw.bgYellow100, tw.pX2, tw.pY1, tw.roundedFull, tw.mR2, tw.mB1]}>
                  <Text style={[tw.textXs, { color: '#d97706' }]}>
                    ⏳ {item.contadores.pendentes} pendente{item.contadores.pendentes > 1 ? 's' : ''}
                  </Text>
                </View>
              )}
              {item.contadores.em_analise > 0 && (
                <View style={[tw.bgBlue100, tw.pX2, tw.pY1, tw.roundedFull, tw.mR2, tw.mB1]}>
                  <Text style={[tw.textXs, { color: '#3b82f6' }]}>
                    🔍 {item.contadores.em_analise} em análise
                  </Text>
                </View>
              )}
              {item.contadores.aprovadas > 0 && (
                <View style={[tw.bgGreen100, tw.pX2, tw.pY1, tw.roundedFull, tw.mR2, tw.mB1]}>
                  <Text style={[tw.textXs, { color: '#10b981' }]}>
                    ✓ {item.contadores.aprovadas} aprovada{item.contadores.aprovadas > 1 ? 's' : ''}
                  </Text>
                </View>
              )}
              {item.contadores.recusadas > 0 && (
                <View style={[tw.bgRed100, tw.pX2, tw.pY1, tw.roundedFull, tw.mR2, tw.mB1]}>
                  <Text style={[tw.textXs, { color: '#ef4444' }]}>
                    ✗ {item.contadores.recusadas} recusada{item.contadores.recusadas > 1 ? 's' : ''}
                  </Text>
                </View>
              )}
            </Row>
          </View>
        )}
        
        <Row style={[tw.justifyBetween, tw.mT2, tw.itemsCenter]}>
          <View style={tw.flexRow}>
            <Ionicons name="call-outline" size={16} style={[tw.textGray600, tw.mR1]} />
            <Text style={tw.textGray600}>{item.usuario?.telefone || 'Não informado'}</Text>
          </View>
          
          <Row style={[tw.justifyEnd]}>
            <Text style={[themeStyles.textPrimary, tw.textSm, tw.fontMedium, tw.mR1]}>
              Ver detalhes
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#4EB296" />
          </Row>
        </Row>
      </TouchableOpacity>
    );
  };


  const ListaVazia = () => {
    let mensagem = 'Não há solicitações para sua instituição';
    
    if (termoBusca) {
      mensagem = `Nenhuma solicitação encontrada com o nome "${termoBusca}"`;
    }
    
    return (
      <View style={[tw.flex1, tw.justifyCenter, tw.itemsCenter, tw.p5]}>
        <Ionicons name="document-text-outline" size={50} style={[tw.textGray400, tw.mB3]} />
        <Text style={[tw.textLg, tw.fontMedium, tw.textCenter, tw.mB1]}>
          Nenhuma solicitação encontrada
        </Text>
        <Text style={[tw.textGray600, tw.textCenter, tw.mB3]}>
          {mensagem}
        </Text>
      </View>
    );
  };

  return (
    <SafeContainer style={themeStyles.bgBackground}>

      <View style={[{ backgroundColor: '#f8f9fa' }]}>
        <View style={[tw.pX4]}>
          <View style={[tw.flexRow, tw.itemsCenter, tw.bgWhite, tw.rounded, tw.pX3]}>
            <Ionicons name="search" size={20} color="#999" style={tw.mR2} />
            <TextInput
              placeholder="Buscar por nome..."
              value={termoBusca}
              onChangeText={setTermoBusca}
              style={[tw.flex1, { fontSize: 14 }]}
              clearButtonMode="while-editing"
            />
            {termoBusca.length > 0 && (
              <TouchableOpacity onPress={() => setTermoBusca('')}>
                <Ionicons name="close-circle" size={16} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <Container>
        {carregando && !atualizando ? (
          <View style={[tw.flex1, tw.itemsCenter, tw.justifyCenter]}>
            <ActivityIndicator size="large" color="#4EB296" />
          </View>
        ) : (
          <FlatList
            data={solicitacoesFiltradas}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 16, flexGrow: 1 }}
            ListEmptyComponent={ListaVazia}
            refreshControl={
              <RefreshControl
                refreshing={atualizando}
                onRefresh={atualizarLista}
                colors={['#4EB296']}
              />
            }
          />
        )}
      </Container>
    </SafeContainer>
  );
};

export default SolicitacoesPerucaInstituicaoTela;