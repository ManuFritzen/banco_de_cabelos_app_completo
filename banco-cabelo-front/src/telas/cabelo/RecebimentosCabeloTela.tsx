import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Modal, Image, Alert, Linking, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useAutenticacao } from '../../contextos/AutenticacaoContexto';
import { doacaoCabeloServico } from '../../servicos/api/doacao-cabelo';
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

function formatarTelefone(telefone: string): string {
  const numeroLimpo = telefone.replace(/\D/g, '');
  
  if (numeroLimpo.length < 10 || numeroLimpo.length > 11) {
    return telefone;
  }
  
  if (numeroLimpo.length === 10) {
    return `(${numeroLimpo.substring(0, 2)}) ${numeroLimpo.substring(2, 6)}-${numeroLimpo.substring(6)}`;
  } else {
    return `(${numeroLimpo.substring(0, 2)}) ${numeroLimpo.substring(2, 7)}-${numeroLimpo.substring(7)}`;
  }
}

interface Cabelo {
  id: number;
  peso?: number;
  comprimento?: number;
  cor?: {
    id: number;
    nome: string;
  };
}

interface Doador {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
}

interface Recebimento {
  id: number;
  cabelo_id: number;
  data_hora: string;
  observacao?: string;
  cabelo: Cabelo;
  PessoaFisica: Doador;
}

const RecebimentosCabeloTela: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { usuario, ehInstituicao } = useAutenticacao();
  
  const [recebimentos, setRecebimentos] = useState<Recebimento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [recebimentoSelecionado, setRecebimentoSelecionado] = useState<Recebimento | null>(null);
  const [modalVisivel, setModalVisivel] = useState(false);

  useEffect(() => {
    if (!ehInstituicao()) {
      Alert.alert(
        'Acesso negado',
        'Esta área é exclusiva para instituições cadastradas.',
        [{ text: 'Voltar', onPress: () => navigation.goBack() }]
      );
    }
  }, [ehInstituicao, navigation]);

  const buscarRecebimentos = useCallback(async (pagina = 1, limparLista = true) => {
    if (!ehInstituicao()) return;

    try {
      setErro(null);
      if (limparLista) {
        setCarregando(true);
      } else {
        setCarregandoMais(true);
      }

      const response = await doacaoCabeloServico.listarRecebimentosInstituicao(pagina);
      const dados = response.data;

      setPaginaAtual(dados.currentPage);
      setTotalPaginas(dados.totalPages);

      if (limparLista) {
        setRecebimentos(dados.data);
      } else {
        setRecebimentos(prev => [...prev, ...dados.data]);
      }
    } catch (erro: any) {
      console.error('Erro ao buscar recebimentos:', erro);
      
      if (erro.response && erro.response.status === 401) {
        Alert.alert(
          'Sessão expirada',
          'Sua sessão expirou. Por favor, faça login novamente.',
          [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
        );
      } else {
        setErro('Não foi possível carregar os recebimentos de cabelo. Tente novamente.');
      }
    } finally {
      setCarregando(false);
      setCarregandoMais(false);
    }
  }, [ehInstituicao, navigation]);

  useFocusEffect(
    useCallback(() => {
    
      buscarRecebimentos(1, true);
    }, [buscarRecebimentos, navigation])
  );

  // Efeito para abrir modal automaticamente quando vem da notificação
  useEffect(() => {
    const abrirModalDaNotificacao = async () => {
      const params = route?.params;
    
      if (params?.openModal && params?.recebimentoId && !carregando) {
        
        try {
          const recebimento = await buscarRecebimentoPorId(params.recebimentoId);
          
          if (recebimento) {
            setTimeout(() => {
              verDetalhes(recebimento);
            }, 500);
          } else {
            Alert.alert(
              'Recebimento não encontrado',
              'Não foi possível encontrar os detalhes desta doação.',
              [{ text: 'OK' }]
            );
          }
        } catch (error) {
          console.error('Erro ao buscar recebimento:', error);
          Alert.alert(
            'Erro',
            'Não foi possível carregar os detalhes da doação.',
            [{ text: 'OK' }]
          );
        }
        
        // Limpar parâmetros para evitar reabrir o modal
        navigation.setParams({ openModal: false, recebimentoId: null });
      }
    };

    abrirModalDaNotificacao();
  }, [route?.params, carregando, navigation]);

  const carregarMais = () => {
    if (carregandoMais || paginaAtual >= totalPaginas) return;
    buscarRecebimentos(paginaAtual + 1, false);
  };

  const [imagemCabelo, setImagemCabelo] = useState<string | null>(null);
  const [carregandoImagem, setCarregandoImagem] = useState(false);

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

  const buscarRecebimentoPorId = async (id: number) => {
    try {
      const response = await doacaoCabeloServico.buscarRecebimentoPorId(id);
      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (erro) {
      console.error('Erro ao buscar recebimento por ID:', erro);
      return null;
    }
  };

  const verDetalhes = (recebimento: Recebimento) => {
    
    if (recebimento.cabelo?.id) {
      setCarregandoImagem(true);
    }
    
    setRecebimentoSelecionado(recebimento);
    setModalVisivel(true);
    
    if (recebimento.cabelo?.id) {
      buscarImagemCabelo(recebimento.cabelo.id);
    }
  };

  const fecharModal = () => {
    setModalVisivel(false);
    setRecebimentoSelecionado(null);
    setImagemCabelo(null);
  };

  const renderItem = ({ item }: { item: Recebimento }) => (
    <TouchableOpacity
      style={[tw.bgWhite, tw.roundedL, themeStyles.shadowSm, tw.p4, tw.mB4, {borderWidth: 1, borderColor: '#f0f0f0'}]}
      onPress={() => verDetalhes(item)}
      activeOpacity={0.7}
    >
      <Row style={tw.justifyBetween}>
        <Column>
          <Text style={[themeStyles.textText, tw.textLg, tw.fontBold, tw.mB1]}>
            {item.PessoaFisica?.nome || 'Doador anônimo'}
          </Text>
          
          <Text style={[tw.textGray600, tw.mB2]}>
            {new Date(item.data_hora).toLocaleDateString('pt-BR')}
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

  // Conteúdo quando não há recebimentos
  const renderEmpty = () => {
    if (carregando) return null;
    
    return (
      <View style={[tw.flex1, tw.justifyCenter, tw.itemsCenter, tw.p4]}>
        <Ionicons name="cut" size={64} color="#CCCCCC" />
        <Text style={[themeStyles.textText, tw.textLg, tw.fontBold, tw.mT4, tw.textCenter]}>
          Nenhum recebimento de cabelo
        </Text>
        <Text style={[tw.textGray600, tw.textCenter, tw.mT2]}>
          Sua instituição ainda não recebeu doações de cabelo.
        </Text>
      </View>
    );
  };

  // Conteúdo quando ocorre erro
  const renderError = () => {
    return (
      <View style={[tw.flex1, tw.justifyCenter, tw.itemsCenter, tw.p4]}>
        <Ionicons name="alert-circle" size={64} color="#FF6B6B" />
        <Text style={[themeStyles.textError, tw.textLg, tw.fontBold, tw.mT4, tw.textCenter]}>
          Erro ao carregar recebimentos
        </Text>
        <Text style={[tw.textGray600, tw.textCenter, tw.mT2]}>
          {erro}
        </Text>
        <TouchableOpacity
          style={[themeStyles.bgSecondary, tw.roundedLg, tw.pX4, tw.pY2, tw.mT4]}
          onPress={() => buscarRecebimentos(1, true)}
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
          
          <View style={[{ backgroundColor: '#FFFBEB' }, tw.border, tw.borderYellow200, tw.roundedLg, tw.p4, tw.mB4]}>
            <Text style={[{ color: '#975A16' }, tw.fontBold, tw.textBase, tw.mB1]}>
              Importante!
            </Text>
            <Text style={{ color: '#975A16' }}>
              Entre em contato com o doador através do telefone listado abaixo para 
              combinar a entrega ou retirada do cabelo doado.
            </Text>
          </View>
          
          {recebimentoSelecionado && (
            <>
              <View style={[tw.itemsCenter, tw.mB4]}>
                {recebimentoSelecionado.cabelo?.id ? (
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
                    {recebimentoSelecionado.cabelo?.comprimento 
                      ? `${recebimentoSelecionado.cabelo.comprimento} cm` 
                      : 'Não informado'}
                  </Text>
                </Row>
                
                <Row style={tw.mB1}>
                  <Text style={[tw.textGray600, tw.mR2]}>Peso:</Text>
                  <Text style={themeStyles.textText}>
                    {recebimentoSelecionado.cabelo?.peso 
                      ? `${recebimentoSelecionado.cabelo.peso} g` 
                      : 'Não informado'}
                  </Text>
                </Row>
                
                <Row style={tw.mB1}>
                  <Text style={[tw.textGray600, tw.mR2]}>Cor:</Text>
                  <Text style={themeStyles.textText}>
                    {recebimentoSelecionado.cabelo?.cor?.nome || 'Não informada'}
                  </Text>
                </Row>
                
                {recebimentoSelecionado.observacao && (
                  <View style={tw.mT2}>
                    <Text style={[tw.textGray600, tw.mB1]}>Observações:</Text>
                    <Text style={[themeStyles.textText, { backgroundColor: '#F9FAFB' }, tw.p3, tw.roundedLg]}>
                      {recebimentoSelecionado.observacao}
                    </Text>
                  </View>
                )}
              </View>
              
              <View style={tw.mB4}>
                <Text style={[themeStyles.textText, tw.fontBold, tw.mB2]}>Dados do Doador</Text>
                
                <Row style={tw.mB1}>
                  <Text style={[tw.textGray600, tw.mR2]}>Nome:</Text>
                  <Text style={themeStyles.textText}>
                    {recebimentoSelecionado.PessoaFisica?.nome || 'Não informado'}
                  </Text>
                </Row>
                
                <Row style={tw.mB1}>
                  <Text style={[tw.textGray600, tw.mR2]}>Email:</Text>
                  <Text style={themeStyles.textText}>
                    {recebimentoSelecionado.PessoaFisica?.email || 'Não informado'}
                  </Text>
                </Row>
                
                <Row style={tw.mB1}>
                  <Text style={[tw.textGray600, tw.mR2]}>Telefone:</Text>
                  <Text style={themeStyles.textText}>
                    {recebimentoSelecionado.PessoaFisica?.telefone ? 
                      formatarTelefone(recebimentoSelecionado.PessoaFisica.telefone) : 
                      'Não informado'}
                  </Text>
                </Row>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <SafeContainer style={tw.bgWhite}>

      <Container style={tw.p5}>
        {carregando && !carregandoMais ? (
          <View style={[tw.flex1, tw.justifyCenter, tw.itemsCenter]}>
            <ActivityIndicator size="large" color={themeStyles.color.secondary} />
            <Text style={[tw.textGray600, tw.mT4]}>
              Carregando recebimentos...
            </Text>
          </View>
        ) : erro ? (
          renderError()
        ) : (
          <FlatList
            data={recebimentos}
            renderItem={renderItem}
            keyExtractor={(item: Recebimento) => String(item.id)}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
            onEndReached={carregarMais}
            onEndReachedThreshold={0.1}
            contentContainerStyle={{ 
              flexGrow: 1, 
              ...(recebimentos.length === 0 && { justifyContent: 'center' }) 
            }}
          />
        )}
      </Container>
      
      {renderModal()}
    </SafeContainer>
  );
};

export default RecebimentosCabeloTela;