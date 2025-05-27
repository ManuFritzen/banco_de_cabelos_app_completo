import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Modal, Image, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useAutenticacao } from '../../contextos/AutenticacaoContexto';
import { doacaoCabeloServico } from '../../servicos/api/doacao-cabelo';
import { instituicoesServico } from '../../servicos/api/instituicoes';
import cliente from '../../servicos/api/cliente';
import { Buffer } from 'buffer';
import {
  SafeContainer,
  Container,
  Row,
  Column
} from '../../styles/componentes';
import tw from '../../styles/tailwind';
import themeStyles from '../../styles/theme';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Cabelo {
  id: number;
  peso?: number;
  comprimento?: number;
  cor?: {
    id: number;
    nome: string;
  };
}

interface Instituicao {
  id: number;
  nome_fantasia?: string;
  razao_social?: string;
  nome?: string;
  email: string;
  telefone?: string;
}

interface Doacao {
  id: number;
  cabelo_id: number;
  data_hora: string;
  observacao?: string;
  cabelo: Cabelo;
  Instituicao?: Instituicao;
  instituicao?: Instituicao; 
}

const MinhasDoacoesCabeloTela: React.FC = () => {
  const navigation = useNavigation<any>();
  const { usuario, ehPessoaFisica } = useAutenticacao();
  const [doacoes, setDoacoes] = useState<Doacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [doacaoSelecionada, setDoacaoSelecionada] = useState<Doacao | null>(null);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [imagemCabelo, setImagemCabelo] = useState<string | null>(null);
  const [carregandoImagem, setCarregandoImagem] = useState(false);
  const [buscandoInstituicoes, setBuscandoInstituicoes] = useState(false);

  useEffect(() => {
    if (!ehPessoaFisica()) {
      Alert.alert(
        'Acesso negado',
        'Esta área é exclusiva para pessoas físicas.',
        [{ text: 'Voltar', onPress: () => navigation.goBack() }]
      );
    } else {
      buscarDoacoes(1, true);
    }
  }, [ehPessoaFisica, navigation]);

  const buscarDoacoes = async (pagina = 1, limparLista = true) => {
    if (!ehPessoaFisica()) return;

    try {
      setErro(null);
      if (limparLista) {
        setCarregando(true);
      } else {
        setCarregandoMais(true);
      }

      const response = await doacaoCabeloServico.listarMinhasDoacoesCabelo(pagina);
      const dados = response.data;
      
      console.log('Resposta da API (minhas doações):', JSON.stringify(dados, null, 2));
      
      const doacoesComInstituicao = dados.data.map((doacao: any) => {
        if (doacao.Instituicao) {
          return doacao;
        } else if (doacao.instituicao) {
          return {
            ...doacao,
            Instituicao: doacao.instituicao
          };
        } else if (doacao.instituicao_id) {
          return {
            ...doacao,
            Instituicao: {
              id: doacao.instituicao_id
            }
          };
        }
        
        return doacao;
      });
      
      setPaginaAtual(dados.currentPage);
      setTotalPaginas(dados.totalPages);

      if (limparLista) {
        setDoacoes(doacoesComInstituicao);
      } else {
        setDoacoes(prev => [...prev, ...doacoesComInstituicao]);
      }
      
      buscarDetalhesInstituicoes(doacoesComInstituicao);
    } catch (erro: any) {
      console.error('Erro ao buscar doações:', erro);
      
      if (erro.response && erro.response.status === 401) {
        Alert.alert(
          'Sessão expirada',
          'Sua sessão expirou. Por favor, faça login novamente.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      } else {
        setErro('Não foi possível carregar as doações de cabelo. Tente novamente.');
      }
    } finally {
      setCarregando(false);
      setCarregandoMais(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      buscarDoacoes(1, true);
    }, [])
  );

  const carregarMais = () => {
    if (carregandoMais || paginaAtual >= totalPaginas) return;
    buscarDoacoes(paginaAtual + 1, false);
  };

  const buscarImagemCabelo = async (cabeloId: number) => {
    try {
      setCarregandoImagem(true);
      
      const response = await cliente.get(`/recebimento/imagem/${cabeloId}`, {
        responseType: 'arraybuffer'
      });
      
      // Converter arraybuffer para base64
      const base64 = Buffer.from(response.data, 'binary').toString('base64');
      const imageUrl = `data:image/jpeg;base64,${base64}`;
      setImagemCabelo(imageUrl);
    } catch (erro) {
      console.error('Erro ao buscar imagem do cabelo:', erro);
      setImagemCabelo(null);
    } finally {
      setCarregandoImagem(false);
    }
  };

  const formatarData = (data: string) => {
    try {
      return format(new Date(data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch (erro) {
      return data;
    }
  };

  const buscarDetalhesInstituicoes = async (doacoesAtuais: Doacao[]) => {
    if (!doacoesAtuais || doacoesAtuais.length === 0 || buscandoInstituicoes) return;
    
    try {
      setBuscandoInstituicoes(true);
      
      const idsInstituicoes = [...new Set(doacoesAtuais
        .filter(doacao => doacao.Instituicao?.id || doacao.instituicao?.id)
        .map(doacao => (doacao.Instituicao?.id || doacao.instituicao?.id)!)
      )];
      
      console.log('IDs de instituições para buscar:', idsInstituicoes);
      
      // Busca detalhes para cada instituição
      for (const id of idsInstituicoes) {
        try {
          console.log(`Buscando detalhes da instituição ID ${id}...`);
          const resposta = await instituicoesServico.obterInstituicao(id);
          
          if (resposta.data && resposta.data.data) {
            const instituicao = resposta.data.data;
            console.log(`Instituição ${id} encontrada:`, instituicao.nome_fantasia || instituicao.nome);
            
            // Atualiza todas as doações com esta instituição
            setDoacoes(docsAtuais => docsAtuais.map(doacao => {
              const doacaoId = doacao.Instituicao?.id || doacao.instituicao?.id;
              
              if (doacaoId === id) {
                return {
                  ...doacao,
                  Instituicao: {
                    id: instituicao.id,
                    nome_fantasia: instituicao.nome_fantasia,
                    razao_social: instituicao.razao_social,
                    nome: instituicao.nome,
                    email: instituicao.email,
                    telefone: instituicao.telefone || instituicao.celular
                  }
                };
              }
              
              return doacao;
            }));
          }
        } catch (erro) {
          console.error(`Erro ao buscar detalhes da instituição ${id}:`, erro);
        }
      }
    } catch (erro) {
      console.error('Erro ao buscar detalhes das instituições:', erro);
    } finally {
      setBuscandoInstituicoes(false);
    }
  };
  
  const verDetalhes = (doacao: Doacao) => {
    if (doacao.cabelo?.id) {
      setCarregandoImagem(true);
    }
    
    setDoacaoSelecionada(doacao);
    setModalVisivel(true);
    
    if (doacao.cabelo?.id) {
      buscarImagemCabelo(doacao.cabelo.id);
    }
  };

  const fecharModal = () => {
    setModalVisivel(false);
    setDoacaoSelecionada(null);
    setImagemCabelo(null);
  };

  const formatarTelefone = (telefone?: string): string => {
    if (!telefone) return 'Não informado';
    
    const numeroLimpo = telefone.replace(/\D/g, '');
    
    if (numeroLimpo.length < 10 || numeroLimpo.length > 11) {
      return telefone;
    }
    
    if (numeroLimpo.length === 10) {
      return `(${numeroLimpo.substring(0, 2)}) ${numeroLimpo.substring(2, 6)}-${numeroLimpo.substring(6)}`;
    } else {
      return `(${numeroLimpo.substring(0, 2)}) ${numeroLimpo.substring(2, 7)}-${numeroLimpo.substring(7)}`;
    }
  };

  const navegarParaBuscarInstituicoes = () => {
    navigation.navigate('BuscarInstituicoes');
  };

  const renderItem = ({ item }: { item: Doacao }) => (
    <TouchableOpacity
      style={[tw.bgWhite, tw.roundedL, themeStyles.shadowSm, tw.p4, tw.mB4, {borderWidth: 1, borderColor: '#f0f0f0'}]}
      onPress={() => verDetalhes(item)}
      activeOpacity={0.7}
    >
      <Row style={tw.justifyBetween}>
        <Column>
          <Text style={[themeStyles.textText, tw.textLg, tw.fontBold, tw.mB1]}>
            {item.Instituicao?.nome_fantasia || item.Instituicao?.razao_social || item.Instituicao?.nome || 
             item.instituicao?.nome_fantasia || item.instituicao?.razao_social || item.instituicao?.nome || 
             'Instituição não identificada'}
          </Text>
          
          <Text style={[tw.textGray600, tw.mB2]}>
            {formatarData(item.data_hora)}
          </Text>
          
          <View style={[tw.flexRow, tw.flexWrap]}>
            {item.cabelo?.comprimento && (
              <View style={[tw.bgGray100, tw.roundedFull, tw.pX3, tw.pY1, tw.mR2, tw.mB2, tw.flexRow, tw.itemsCenter]}>
                <Ionicons name="resize" size={16} color={themeStyles.color.secondary} style={{ marginRight: 4 }} />
                <Text style={[themeStyles.textText, tw.textXs]}>
                  {item.cabelo.comprimento} cm
                </Text>
              </View>
            )}
            
            {item.cabelo?.peso && (
              <View style={[tw.bgGray100, tw.roundedFull, tw.pX3, tw.pY1, tw.mR2, tw.mB2, tw.flexRow, tw.itemsCenter]}>
                <Ionicons name="scale" size={16} color={themeStyles.color.secondary} style={{ marginRight: 4 }} />
                <Text style={[themeStyles.textText, tw.textXs]}>
                  {item.cabelo.peso} g
                </Text>
              </View>
            )}
            
            {item.cabelo?.cor && (
              <View style={[tw.bgGray100, tw.roundedFull, tw.pX3, tw.pY1, tw.mR2, tw.mB2, tw.flexRow, tw.itemsCenter]}>
                <Ionicons name="color-palette" size={16} color={themeStyles.color.secondary} style={{ marginRight: 4 }} />
                <Text style={[themeStyles.textText, tw.textXs]}>
                  {item.cabelo.cor.nome}
                </Text>
              </View>
            )}
          </View>
        </Column>
        
        <View style={tw.mL2}>
          <TouchableOpacity
            style={[themeStyles.bgSecondary, tw.roundedLg, tw.pX3, tw.pY2]}
            onPress={() => verDetalhes(item)}
          >
            <Text style={[tw.textWhite, tw.textXs, tw.fontMedium]}>
              Ver detalhes
            </Text>
          </TouchableOpacity>
        </View>
      </Row>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!carregandoMais) return null;
    
    return (
      <View style={[tw.pY4, tw.flexRow, tw.justifyCenter]}>
        <ActivityIndicator size="small" color={themeStyles.color.secondary} />
      </View>
    );
  };

  // Conteúdo quando não há doações
  const renderEmpty = () => {
    if (carregando) return null;
    
    return (
      <View style={[tw.flex1, tw.justifyCenter, tw.itemsCenter, tw.p4]}>
        <Ionicons name="heart" size={64} color="#CCCCCC" />
        <Text style={[themeStyles.textText, tw.textLg, tw.fontBold, tw.mT4, tw.textCenter]}>
          Nenhuma doação de cabelo
        </Text>
        <Text style={[tw.textGray600, tw.textCenter, tw.mT2]}>
          Você ainda não registrou nenhuma doação de cabelo.
        </Text>
        <TouchableOpacity
          style={[themeStyles.bgSecondary, tw.roundedLg, tw.pX4, tw.pY2, tw.mT4]}
          onPress={navegarParaBuscarInstituicoes}
        >
          <Text style={[tw.textWhite, tw.fontMedium]}>
            Doar Cabelo
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Conteúdo quando ocorre erro
  const renderError = () => {
    return (
      <View style={[tw.flex1, tw.justifyCenter, tw.itemsCenter, tw.p4]}>
        <Ionicons name="alert-circle" size={64} color="#FF6B6B" />
        <Text style={[themeStyles.textError, tw.textLg, tw.fontBold, tw.mT4, tw.textCenter]}>
          Erro ao carregar doações
        </Text>
        <Text style={[tw.textGray600, tw.textCenter, tw.mT2]}>
          {erro}
        </Text>
        <TouchableOpacity
          style={[themeStyles.bgSecondary, tw.roundedLg, tw.pX4, tw.pY2, tw.mT4]}
          onPress={() => buscarDoacoes(1, true)}
        >
          <Text style={[tw.textWhite, tw.fontMedium]}>
            Tentar novamente
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisivel}
      onRequestClose={fecharModal}
    >
      <View style={[tw.flex1, {backgroundColor: 'rgba(0, 0, 0, 0.5)'}, tw.justifyCenter, tw.itemsCenter]}>
        <ScrollView
          style={[tw.bgWhite, tw.roundedL, tw.p5, {width: '90%', maxHeight: '85%', borderWidth: 1, borderColor: '#f0f0f0'}]}
        >
          <Row style={[tw.justifyBetween, tw.mB4]}>
            <Text style={[themeStyles.textText, tw.textXl, tw.fontBold]}>
              Detalhes da Doação
            </Text>
            <TouchableOpacity onPress={fecharModal}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </Row>
          
          <View style={[{ backgroundColor: '#E6F7FF' }, tw.border, tw.borderBlue200, tw.roundedLg, tw.p4, tw.mB4]}>
            <Text style={[{ color: '#0077B6' }, tw.fontBold, tw.textBase, tw.mB1]}>
              Informativo
            </Text>
            <Text style={{ color: '#0077B6' }}>
              Sua doação de cabelo foi registrada. Você pode entrar em contato com a instituição para obter mais informações sobre o processo de doação.
            </Text>
          </View>
          
          {doacaoSelecionada && (
            <>
              <View style={[tw.itemsCenter, tw.mB4]}>
                {doacaoSelecionada.cabelo?.id ? (
                  carregandoImagem ? (
                    <View style={[tw.wFull, tw.h48, tw.bgGray200, tw.roundedLg, tw.itemsCenter, tw.justifyCenter]}>
                      <ActivityIndicator size="large" color={themeStyles.color.secondary} />
                      <Text style={[tw.textGray500, tw.mT2]}>Carregando imagem...</Text>
                    </View>
                  ) : imagemCabelo ? (
                    <Image
                      source={{ uri: imagemCabelo }}
                      style={[tw.wFull, tw.h48, tw.roundedLg]}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[tw.wFull, tw.h48, tw.bgGray200, tw.roundedLg, tw.itemsCenter, tw.justifyCenter]}>
                      <Ionicons name="alert-circle-outline" size={48} color="#999999" />
                      <Text style={[tw.textGray500, tw.mT2]}>Falha ao carregar imagem</Text>
                    </View>
                  )
                ) : (
                  <View style={[tw.wFull, tw.h48, tw.bgGray200, tw.roundedLg, tw.itemsCenter, tw.justifyCenter]}>
                    <Ionicons name="image-outline" size={48} color="#999999" />
                    <Text style={[tw.textGray500, tw.mT2]}>Sem imagem</Text>
                  </View>
                )}
              </View>
              
              <View style={tw.mB4}>
                <Text style={[themeStyles.textText, tw.fontBold, tw.mB2]}>Informações do Cabelo</Text>
                
                <Row style={tw.mB1}>
                  <Text style={[tw.textGray600, tw.mR2]}>Comprimento:</Text>
                  <Text style={themeStyles.textText}>
                    {doacaoSelecionada.cabelo?.comprimento 
                      ? `${doacaoSelecionada.cabelo.comprimento} cm` 
                      : 'Não informado'}
                  </Text>
                </Row>
                
                <Row style={tw.mB1}>
                  <Text style={[tw.textGray600, tw.mR2]}>Peso:</Text>
                  <Text style={themeStyles.textText}>
                    {doacaoSelecionada.cabelo?.peso 
                      ? `${doacaoSelecionada.cabelo.peso} g` 
                      : 'Não informado'}
                  </Text>
                </Row>
                
                <Row style={tw.mB1}>
                  <Text style={[tw.textGray600, tw.mR2]}>Cor:</Text>
                  <Text style={themeStyles.textText}>
                    {doacaoSelecionada.cabelo?.cor?.nome || 'Não informada'}
                  </Text>
                </Row>
                
                {doacaoSelecionada.observacao && (
                  <View style={tw.mT2}>
                    <Text style={[tw.textGray600, tw.mB1]}>Observações:</Text>
                    <Text style={[themeStyles.textText, { backgroundColor: '#F9FAFB' }, tw.p3, tw.roundedLg]}>
                      {doacaoSelecionada.observacao}
                    </Text>
                  </View>
                )}
              </View>
              
              <View style={tw.mB4}>
                <Text style={[themeStyles.textText, tw.fontBold, tw.mB2]}>Dados da Instituição</Text>
                
                <Row style={tw.mB1}>
                  <Text style={[tw.textGray600, tw.mR2]}>Nome:</Text>
                  <Text style={themeStyles.textText}>
                    {doacaoSelecionada.Instituicao?.nome_fantasia || doacaoSelecionada.Instituicao?.razao_social || doacaoSelecionada.Instituicao?.nome ||
                     doacaoSelecionada.instituicao?.nome_fantasia || doacaoSelecionada.instituicao?.razao_social || doacaoSelecionada.instituicao?.nome || 
                     'Não informado'}
                  </Text>
                </Row>
                
                <Row style={tw.mB1}>
                  <Text style={[tw.textGray600, tw.mR2]}>Email:</Text>
                  <Text style={themeStyles.textText}>
                    {doacaoSelecionada.Instituicao?.email || doacaoSelecionada.instituicao?.email || 'Não informado'}
                  </Text>
                </Row>
                
                <Row style={tw.mB1}>
                  <Text style={[tw.textGray600, tw.mR2]}>Telefone:</Text>
                  <Text style={themeStyles.textText}>
                    {formatarTelefone(doacaoSelecionada.Instituicao?.telefone || doacaoSelecionada.instituicao?.telefone)}
                  </Text>
                </Row>

                <TouchableOpacity
                  style={[tw.flexRow, tw.itemsCenter, tw.justifyCenter, themeStyles.bgSecondary, tw.roundedLg, tw.pY2, tw.pX4, tw.mT4]}
                  onPress={() => {
                    fecharModal();
                    navigation.navigate('BuscarInstituicoes');
                  }}
                >
                  <Ionicons name="heart" size={18} color="#FFFFFF" style={tw.mR2} />
                  <Text style={[tw.textWhite, tw.fontMedium]}>
                    Fazer Nova Doação
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <SafeContainer style={themeStyles.bgBackground}>
      <Row style={[themeStyles.bgPrimary, tw.pX4, tw.pY3]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[tw.textWhite, tw.textLg, tw.fontBold, tw.mL3]}>
          Minhas Doações de Cabelo
        </Text>
      </Row>

      <Container style={tw.p5}>
        {carregando && !carregandoMais ? (
          <View style={[tw.flex1, tw.justifyCenter, tw.itemsCenter]}>
            <ActivityIndicator size="large" color={themeStyles.color.secondary} />
            <Text style={[tw.textGray600, tw.mT4]}>
              Carregando doações...
            </Text>
          </View>
        ) : erro ? (
          renderError()
        ) : (
          <FlatList
            data={doacoes}
            renderItem={renderItem}
            keyExtractor={(item: Doacao) => String(item.id)}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
            onEndReached={carregarMais}
            onEndReachedThreshold={0.1}
            contentContainerStyle={{ 
              flexGrow: 1, 
              ...(doacoes.length === 0 && { justifyContent: 'center' }) 
            }}
          />
        )}
      </Container>
      
      {renderModal()}
    </SafeContainer>
  );
};

export default MinhasDoacoesCabeloTela;