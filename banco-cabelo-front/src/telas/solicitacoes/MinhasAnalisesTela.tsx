import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  RefreshControl, 
  TouchableOpacity, 
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { useAutenticacao } from '../../contextos/AutenticacaoContexto';
import { solicitacoesInstituicaoServico, SolicitacaoInstituicao, DadosAtualizacaoAnalise } from '../../servicos/api/solicitacoes-instituicao';
import {
  SafeContainer,
  Container,
  Row
} from '../../styles/componentes';
import tw from '../../styles/tailwind';
import themeStyles from '../../styles/theme';

const MinhasAnalisesTela: React.FC = () => {
  const navigation = useNavigation<any>();
  const { usuario, ehInstituicao } = useAutenticacao();
  
  const [analises, setAnalises] = useState<SolicitacaoInstituicao[]>([]);
  const [analisesFiltradas, setAnalisesFiltradas] = useState<SolicitacaoInstituicao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [analiseSelecionada, setAnaliseSelecionada] = useState<SolicitacaoInstituicao | null>(null);
  const [statusSelecionado, setStatusSelecionado] = useState<number>(1);
  const [observacoes, setObservacoes] = useState('');
  const [salvandoStatus, setSalvandoStatus] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<number | 'todos'>('todos');
  const [termoBusca, setTermoBusca] = useState('');

  const carregarAnalises = useCallback(async (pagina = 1, limparLista = true) => {
    if (!ehInstituicao()) return;

    try {
      if (limparLista) {
        setCarregando(true);
      }

      const response = await solicitacoesInstituicaoServico.listarAnalisesPorInstituicao(pagina);
      const dados = response.data;

      setPaginaAtual(dados.currentPage);
      setTotalPaginas(dados.totalPages);

      if (limparLista) {
        setAnalises(dados.data);
        setAnalisesFiltradas(dados.data);
      } else {
        const novasAnalises = [...analises, ...dados.data];
        setAnalises(novasAnalises);
        setAnalisesFiltradas(novasAnalises);
      }
    } catch (erro) {
      console.error('Erro ao carregar análises:', erro);
      Alert.alert('Erro', 'Não foi possível carregar as análises.');
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [ehInstituicao]);

  useFocusEffect(
    useCallback(() => {
      carregarAnalises(1, true);
    }, [carregarAnalises])
  );

  const handleAtualizar = () => {
    setAtualizando(true);
    carregarAnalises(1, true);
  };

  const carregarMaisItens = () => {
    if (carregando || paginaAtual >= totalPaginas) return;
    carregarAnalises(paginaAtual + 1, false);
  };

  const abrirModalStatus = (analise: SolicitacaoInstituicao) => {
    setAnaliseSelecionada(analise);
    setStatusSelecionado(analise.status_solicitacao_id);
    setObservacoes(analise.observacoes || '');
    setModalVisivel(true);
  };

  const fecharModal = () => {
    setModalVisivel(false);
    setAnaliseSelecionada(null);
    setObservacoes('');
  };

  const salvarStatus = async () => {
    if (!analiseSelecionada) return;

    try {
      setSalvandoStatus(true);

      const dados: DadosAtualizacaoAnalise = {
        status_solicitacao_id: statusSelecionado,
        observacoes: observacoes || undefined
      };

      await solicitacoesInstituicaoServico.atualizarStatusAnalise(analiseSelecionada.id, dados);
      
      Alert.alert('Sucesso', 'Status da análise atualizado com sucesso!');
      
      // Recarregar a lista para garantir atualização
      await carregarAnalises(1, true);
      
      fecharModal();
    } catch (erro) {
      console.error('Erro ao atualizar status:', erro);
      Alert.alert('Erro', 'Não foi possível atualizar o status da análise.');
    } finally {
      setSalvandoStatus(false);
    }
  };

  const removerAnalise = async (analise: SolicitacaoInstituicao) => {
    Alert.alert(
      'Confirmar Remoção',
      'Tem certeza que deseja remover esta análise? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await solicitacoesInstituicaoServico.removerAnalise(analise.id);
              Alert.alert('Sucesso', 'Análise removida com sucesso!');
              
              // Remover da lista
              setAnalises(prev => prev.filter(a => a.id !== analise.id));
            } catch (erro) {
              console.error('Erro ao remover análise:', erro);
              Alert.alert('Erro', 'Não foi possível remover a análise.');
            }
          }
        }
      ]
    );
  };

  const getNomeStatus = (statusId: number): string => {
    switch (statusId) {
      case 1:
        return 'Pendente';
      case 2:
        return 'Em análise';
      case 3:
        return 'Aprovada';
      case 4:
        return 'Recusada';
      case 6:
        return 'Cancelada pelo solicitante';
      default:
        return `Status ${statusId}`;
    }
  };

  const getEstiloStatus = (statusId: number) => {
    switch (statusId) {
      case 1:
        return { bg: tw.bgYellow100, text: { color: '#d97706' } };
      case 2:
        return { bg: tw.bgBlue100, text: { color: '#3b82f6' } };
      case 3:
        return { bg: tw.bgGreen100, text: { color: '#10b981' } };
      case 4:
        return { bg: tw.bgRed100, text: { color: '#ef4444' } };
      case 6:
        return { bg: tw.bgGray100, text: { color: '#6b7280' } };
      default:
        return { bg: tw.bgGray100, text: tw.textGray600 };
    }
  };

  const renderItem = ({ item }: { item: SolicitacaoInstituicao }) => {
    const estiloStatus = getEstiloStatus(item.status_solicitacao_id);
    
    return (
      <View style={[tw.bgWhite, tw.p4, tw.roundedLg, tw.shadow, tw.mB4]}>
        <Row style={[tw.justifyBetween, tw.mB2]}>
          <View style={[tw.pX2, tw.pY1, tw.roundedFull, estiloStatus.bg]}>
            <Text style={[tw.textXs, tw.fontMedium, estiloStatus.text]}>
              {item.StatusSolicitacao?.nome || getNomeStatus(item.status_solicitacao_id)}
            </Text>
          </View>
          
          <Text style={[tw.textXs, tw.textGray500]}>
            {format(new Date(item.data_analise), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </Text>
        </Row>
        
        <View style={tw.mB2}>
          <Text style={[tw.textLg, tw.fontMedium]}>
            {item.Solicitacao?.PessoaFisica?.nome || 'Solicitante'}
          </Text>
          <Text style={[tw.textSm, tw.textGray600]}>
            Solicitação de Peruca
          </Text>
        </View>
        
        {item.observacoes && (
          <View style={tw.mB3}>
            <Text style={[tw.textXs, tw.textGray600, tw.mB1]}>Suas observações:</Text>
            <Text style={themeStyles.textText}>
              {item.observacoes.length > 100
                ? item.observacoes.substring(0, 100) + '...'
                : item.observacoes}
            </Text>
          </View>
        )}
        
        <Row style={[tw.justifyBetween, tw.mT2, tw.itemsCenter]}>
          <View style={tw.flexRow}>
            <Ionicons name="person-outline" size={16} style={[tw.textGray600, tw.mR1]} />
            <Text style={tw.textGray600}>
              {item.Solicitacao?.PessoaFisica?.telefone || 'Telefone não informado'}
            </Text>
          </View>
          
          <Row>
            {item.status_solicitacao_id !== 6 && (
              <TouchableOpacity
                style={[themeStyles.bgSecondary, tw.pX3, tw.pY1, tw.roundedFull, tw.mR2]}
                onPress={() => abrirModalStatus(item)}
              >
                <Text style={[tw.textWhite, tw.textXs]}>Atualizar</Text>
              </TouchableOpacity>
            )}
            
            {item.status_solicitacao_id <= 2 && (
              <TouchableOpacity
                style={[tw.bgRed500, tw.pX3, tw.pY1, tw.roundedFull]}
                onPress={() => removerAnalise(item)}
              >
                <Text style={[tw.textWhite, tw.textXs]}>Remover</Text>
              </TouchableOpacity>
            )}
          </Row>
        </Row>
      </View>
    );
  };

  const renderFooter = () => {
    if (!carregando || paginaAtual === 1) return null;
    
    return (
      <View style={[tw.pY4, tw.itemsCenter]}>
        <ActivityIndicator size="small" color={themeStyles.color.secondary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (carregando) return null;
    
    let mensagem = 'Você ainda não analisou nenhuma solicitação.';
    let submensagem = 'Acesse a lista de solicitações para começar a analisar.';
    let icone = 'document-text-outline';
    
    if (termoBusca || filtroStatus !== 'todos') {
      mensagem = 'Nenhuma análise encontrada';
      if (termoBusca) {
        submensagem = `Nenhuma análise encontrada com o nome "${termoBusca}"`;
        icone = 'search-outline';
      } else if (filtroStatus !== 'todos') {
        const statusLabels: {[key: number]: string} = {
          1: 'pendentes',
          2: 'em análise',
          3: 'aprovadas',
          4: 'recusadas',
          6: 'canceladas'
        };
        submensagem = `Nenhuma análise ${statusLabels[filtroStatus as number]} encontrada`;
        icone = 'filter-outline';
      }
    }
    
    return (
      <View style={[tw.flex1, tw.justifyCenter, tw.itemsCenter, tw.p8]}>
        <Ionicons name={icone as any} size={64} color="#d1d5db" />
        <Text style={[tw.textGray500, tw.textCenter, tw.mT4]}>
          {mensagem}
        </Text>
        <Text style={[tw.textGray500, tw.textCenter, tw.mT2]}>
          {submensagem}
        </Text>
        {(termoBusca || filtroStatus !== 'todos') && (
          <TouchableOpacity
            style={[themeStyles.bgSecondary, tw.pX4, tw.pY2, tw.rounded, tw.mT4]}
            onPress={() => {
              setTermoBusca('');
              setFiltroStatus('todos');
            }}
          >
            <Text style={[tw.textWhite, tw.fontMedium]}>Limpar filtros</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  useEffect(() => {
    let filtradas = analises;
    
    // Filtro por busca
    if (termoBusca.trim() !== '') {
      const termoLowerCase = termoBusca.toLowerCase();
      filtradas = filtradas.filter(analise => 
        analise.Solicitacao?.PessoaFisica?.nome?.toLowerCase().includes(termoLowerCase)
      );
    }
    
    // Filtro por status
    if (filtroStatus !== 'todos') {
      filtradas = filtradas.filter(analise => 
        analise.status_solicitacao_id === filtroStatus
      );
    }
    
    setAnalisesFiltradas(filtradas);
  }, [analises, termoBusca, filtroStatus]);

  return (
    <SafeContainer style={themeStyles.bgBackground}>
      
      <View style={[{ backgroundColor: '#f8f9fa' }, tw.pB3]}>
        <View style={[tw.pX4]}>
          <View style={[tw.flexRow, tw.itemsCenter, tw.bgWhite, tw.rounded, tw.pX3, tw.mB3]}>
            <Ionicons name="search" size={20} color="#999" style={tw.mR2} />
            <TextInput
              placeholder="Buscar por nome do solicitante..."
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
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[tw.pX1]}
          >
            {[
              { key: 'todos', label: 'Todas', icon: 'list-outline' },
              { key: 1, label: 'Pendente', icon: 'time-outline' },
              { key: 2, label: 'Em análise', icon: 'eye-outline' },
              { key: 3, label: 'Aprovada', icon: 'checkmark-circle-outline' },
              { key: 4, label: 'Recusada', icon: 'close-circle-outline' },
              { key: 6, label: 'Cancelada', icon: 'ban-outline' }
            ].map((filtro) => (
              <TouchableOpacity
                key={filtro.key}
                style={[
                  tw.flexRow,
                  tw.itemsCenter,
                  tw.pX3,
                  tw.pY2,
                  tw.mR2,
                  tw.rounded,
                  filtroStatus === filtro.key ? themeStyles.bgSecondary : tw.bgWhite,
                  { borderWidth: 1, borderColor: filtroStatus === filtro.key ? '#4EB296' : '#e5e7eb' }
                ]}
                onPress={() => setFiltroStatus(filtro.key as any)}
              >
                <Ionicons 
                  name={filtro.icon as any} 
                  size={16} 
                  color={filtroStatus === filtro.key ? '#FFF' : '#6b7280'} 
                  style={tw.mR1} 
                />
                <Text style={[
                  tw.textSm,
                  tw.fontMedium,
                  filtroStatus === filtro.key ? tw.textWhite : tw.textGray600
                ]}>
                  {filtro.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      <Container style={tw.p4}>
        {carregando && analises.length === 0 ? (
          <View style={[tw.flex1, tw.justifyCenter, tw.itemsCenter]}>
            <ActivityIndicator size="large" color={themeStyles.color.secondary} />
            <Text style={[tw.textGray600, tw.mT4]}>
              Carregando análises...
            </Text>
          </View>
        ) : (
          <FlatList
            data={analisesFiltradas}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
            refreshControl={
              <RefreshControl
                refreshing={atualizando}
                onRefresh={handleAtualizar}
                colors={[themeStyles.color.secondary]}
              />
            }
            onEndReached={carregarMaisItens}
            onEndReachedThreshold={0.1}
            contentContainerStyle={{ 
              flexGrow: 1, 
              ...(analisesFiltradas.length === 0 && { justifyContent: 'center' }) 
            }}
          />
        )}
      </Container>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisivel}
        onRequestClose={fecharModal}
      >
        <View style={[tw.flex1, {backgroundColor: 'rgba(0, 0, 0, 0.5)'}, tw.justifyCenter, tw.itemsCenter]}>
          <ScrollView
            style={[tw.bgWhite, tw.roundedL, tw.p5, {width: '90%', maxHeight: '70%'}]}
          >
            <Row style={[tw.justifyBetween, tw.mB4]}>
              <Text style={[themeStyles.textText, tw.textXl, tw.fontBold]}>
                Atualizar Status
              </Text>
              <TouchableOpacity onPress={fecharModal}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </Row>
            
            {analiseSelecionada && (
              <>
                <View style={tw.mB4}>
                  <Text style={[themeStyles.textText, tw.fontMedium, tw.mB1]}>
                    Solicitante: {analiseSelecionada.Solicitacao?.PessoaFisica?.nome}
                  </Text>
                  <Text style={[tw.textGray600, tw.textSm, tw.mB1]}>
                    Email: {analiseSelecionada.Solicitacao?.PessoaFisica?.email}
                  </Text>
                  <Text style={[tw.textGray600, tw.textSm, tw.mB1]}>
                    Telefone: {analiseSelecionada.Solicitacao?.PessoaFisica?.telefone}
                  </Text>
                  <Text style={[tw.textGray600, tw.textSm, tw.mB1]}>
                    Data da Solicitação: {analiseSelecionada.Solicitacao?.data_hora ? format(new Date(analiseSelecionada.Solicitacao.data_hora), "d 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Não informado'}
                  </Text>
                  {analiseSelecionada.Solicitacao?.observacoes && (
                    <>
                      <Text style={[tw.textGray600, tw.textSm, tw.mB1]}>
                        Observações da Solicitação:
                      </Text>
                      <Text style={[themeStyles.textText, tw.textSm, tw.mB1]}>
                        {analiseSelecionada.Solicitacao.observacoes}
                      </Text>
                    </>
                  )}
                  <Text style={[tw.textGray600, tw.textSm]}>
                    Solicitação de Peruca
                  </Text>
                </View>
                
                <View style={tw.mB4}>
                  <Text style={[themeStyles.textText, tw.fontMedium, tw.mB3]}>Status da Análise</Text>
                  {analiseSelecionada.status_solicitacao_id >= 3 || analiseSelecionada.status_solicitacao_id === 6 ? (
                    <View style={[tw.pY3, tw.pX4, tw.bgGray100, tw.roundedLg]}>
                      <Text style={[tw.textGray600, tw.textCenter, tw.fontMedium]}>
                        Status final: {getNomeStatus(analiseSelecionada.status_solicitacao_id)}
                      </Text>
                      <Text style={[tw.textGray500, tw.textCenter, tw.textSm, tw.mT1]}>
                        {analiseSelecionada.status_solicitacao_id === 6 
                          ? 'Solicitação cancelada pelo solicitante'
                          : 'Não é possível alterar análises aprovadas ou recusadas'
                        }
                      </Text>
                    </View>
                  ) : (
                    <View style={[tw.flexRow, tw.flexWrap, tw.justifyBetween]}>
                      {[1, 2, 3, 4].map((status) => (
                        <TouchableOpacity
                          key={status}
                          style={[
                            tw.pX3, tw.pY2, tw.itemsCenter, tw.mB2, tw.rounded,
                            { width: '48%' },
                            statusSelecionado === status ? themeStyles.bgSecondary : tw.bgGray200
                          ]}
                          onPress={() => setStatusSelecionado(status)}
                        >
                          <Text style={[
                            statusSelecionado === status ? tw.textWhite : tw.textGray700,
                            tw.fontMedium,
                            tw.textSm,
                            tw.textCenter
                          ]}>
                            {getNomeStatus(status)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
                
                <View style={tw.mB4}>
                  <Text style={[themeStyles.textText, tw.fontMedium, tw.mB2]}>Observações</Text>
                  <TextInput
                    style={[
                      tw.border, 
                      tw.borderGray300, 
                      tw.roundedLg, 
                      tw.p3, 
                      tw.textGray700,
                      { minHeight: 80, textAlignVertical: 'top' }
                    ]}
                    multiline
                    placeholder="Digite suas observações..."
                    value={observacoes}
                    onChangeText={setObservacoes}
                    editable={analiseSelecionada?.status_solicitacao_id < 3 && analiseSelecionada?.status_solicitacao_id !== 6}
                  />
                </View>
                
                <TouchableOpacity
                  style={[
                    themeStyles.bgPrimary, 
                    tw.roundedLg, 
                    tw.pY3, 
                    tw.itemsCenter,
                    (analiseSelecionada.status_solicitacao_id >= 3 || analiseSelecionada.status_solicitacao_id === 6 || salvandoStatus) && tw.opacity50
                  ]}
                  onPress={salvarStatus}
                  disabled={salvandoStatus || analiseSelecionada.status_solicitacao_id >= 3 || analiseSelecionada.status_solicitacao_id === 6}
                >
                  {salvandoStatus ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={[tw.textWhite, tw.fontBold]}>Salvar Status</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </SafeContainer>
  );
};

export default MinhasAnalisesTela;