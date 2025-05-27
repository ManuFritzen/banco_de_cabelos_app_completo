import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Image, ScrollView, Alert, Modal, Dimensions, Share, Platform } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as FileSystem from 'expo-file-system';
import { solicitacoesServico } from '../../servicos/api/solicitacoes';
import cliente from '../../servicos/api/cliente';
import { Buffer } from 'buffer';
import { useAutenticacao } from '../../contextos/AutenticacaoContexto';
import Botao from '../../components/comuns/Botao';
import {
  SafeContainer,
  Container,
  Row,
  Titulo,
  Paragrafo,
  Card
} from '../../styles/componentes';
import tw from '../../styles/tailwind';
import themeStyles from '../../styles/theme';

type DetalhesSolicitacaoRouteProp = RouteProp<{
  DetalhesSolicitacao: {
    id: number;
  };
}, 'DetalhesSolicitacao'>;

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
  PessoaFisica?: {
    id: number;
    nome: string;
    email: string;
    telefone: string;
  };
}

const DetalhesSolicitacaoTela: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<DetalhesSolicitacaoRouteProp>();
  const { id } = route.params;
  const { usuario, ehInstituicao } = useAutenticacao();
  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;
  
  const [solicitacao, setSolicitacao] = useState<Solicitacao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [laudoCarregando, setLaudoCarregando] = useState(true);
  const [urlLaudo, setUrlLaudo] = useState<string>('');
  const [telaCheia, setTelaCheia] = useState(false);
  const [downloading, setDownloading] = useState(false);
  
  const abrirTelaCheia = () => {
    if (!urlLaudo) {
      Alert.alert('Erro', 'Não há imagem de laudo para visualizar.');
      return;
    }
    setTelaCheia(true);
  };
  
  const baixarLaudo = async () => {
    try {
      if (!urlLaudo) {
        Alert.alert('Erro', 'Não há imagem de laudo para baixar.');
        return;
      }
      
      setDownloading(true);
      
      const fileName = `laudo-medico-solicitacao-${id}.jpg`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      // Base64 data (remove o prefixo da data URI)
      const base64Data = urlLaudo.split(',')[1];
      
      // Escrever o arquivo no sistema de arquivos
      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Compartilha o arquivo (única maneira de "fazer download" no celular)
      await Share.share({
        title: `Laudo Médico - Solicitação #${id}`,
        url: fileUri,
      });
      
      setDownloading(false);
    } catch (erro) {
      console.error('Erro ao baixar imagem:', erro);
      setDownloading(false);
      Alert.alert('Erro', 'Não foi possível baixar a imagem do laudo.');
    }
  };
  
  const buscarSolicitacao = async () => {
    try {
      
      const resposta = await solicitacoesServico.obterSolicitacao(id);
      
      // A resposta agora vem diretamente em resposta.data
      const solicitacaoData = resposta.data;
      setSolicitacao(solicitacaoData);
      
      // Verificar se o usuário é o dono da solicitação
      const ehDonoSolicitacao = usuario?.id === solicitacaoData.pessoa_fisica_id;
      const ehTipoInstituicao = usuario?.tipo === 'J';
   
      
      try {
        // Buscar imagem usando o mesmo método que o RecebimentosCabeloTela utiliza para cabelos
        setLaudoCarregando(true);
        
        try {
          const response = await cliente.get(`/solicitacoes/${id}/laudo`, {
            responseType: 'arraybuffer'
          });
          
          // Converter arraybuffer para base64 usando método simplificado
          const base64 = Buffer.from(response.data, 'binary').toString('base64');
          
          if (base64.length === 0) {
            console.error('String base64 vazia após conversão');
            throw new Error('Imagem vazia após conversão para base64');
          }
          
          const imageUrl = `data:image/jpeg;base64,${base64}`;
          setUrlLaudo(imageUrl);
          setLaudoCarregando(false);
        } catch (erro) {
          console.error('Erro ao obter laudo médico:', erro);
          setLaudoCarregando(false);
        }
      } catch (erroLaudo) {
        console.error('Erro ao obter laudo médico:', erroLaudo);
        setLaudoCarregando(false);
      }
    } catch (erro) {
      console.error('Erro ao buscar detalhes da solicitação:', erro);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes da solicitação.');
    } finally {
      setCarregando(false);
    }
  };
  
  useEffect(() => {
    buscarSolicitacao();
  }, [id]);
  
  const voltar = () => {
    navigation.goBack();
  };
  
  const cancelarSolicitacao = () => {
    Alert.alert(
      'Cancelar Solicitação',
      'Tem certeza que deseja cancelar esta solicitação? Esta ação não pode ser desfeita.',
      [
        { text: 'Não', style: 'cancel' },
        { text: 'Sim, Cancelar', onPress: confirmarCancelamento, style: 'destructive' }
      ]
    );
  };
  
  const confirmarCancelamento = async () => {
    try {
      await solicitacoesServico.excluirSolicitacao(id);
      Alert.alert('Sucesso', 'Solicitação cancelada com sucesso.', [
        { text: 'OK', onPress: () => navigation.navigate('MinhasSolicitacoes') }
      ]);
    } catch (erro: any) {
      console.error('Erro ao cancelar solicitação:', erro);
      
      // Verificar se é um erro da API com mensagem específica
      const mensagemErro = erro.response?.data?.message || 'Não foi possível cancelar a solicitação.';
      Alert.alert('Erro', mensagemErro);
    }
  };
  
  const atualizarStatus = (novoStatusId: number) => {
    if (!ehInstituicao()) return;
    
    const nomeStatus = getNomeStatus(novoStatusId);
    
    Alert.alert(
      `Atualizar para ${nomeStatus}`,
      `Confirma a alteração do status para "${nomeStatus}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => confirmarAtualizacaoStatus(novoStatusId) }
      ]
    );
  };
  
  const confirmarAtualizacaoStatus = async (novoStatusId: number) => {
    try {
      await solicitacoesServico.atualizarStatusSolicitacao(
        id,
        novoStatusId,
        solicitacao?.observacao
      );
      Alert.alert('Sucesso', 'Status atualizado com sucesso.');
      buscarSolicitacao(); // Recarregar dados
    } catch (erro) {
      console.error('Erro ao atualizar status:', erro);
      Alert.alert('Erro', 'Não foi possível atualizar o status da solicitação.');
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
  
  const formatarData = (dataString: string) => {
    try {
      const data = new Date(dataString);
      return format(data, "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
    } catch (erro) {
      return dataString;
    }
  };
  
  if (carregando) {
    return (
      <SafeContainer style={themeStyles.bgBackground}>
        <Row style={[themeStyles.bgPrimary, tw.pX4, tw.pY3]}>
          <TouchableOpacity onPress={voltar}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={[tw.textWhite, tw.textLg, tw.fontBold, tw.mL3]}>
            Carregando...
          </Text>
        </Row>
        
        <View style={[tw.flex1, tw.itemsCenter, tw.justifyCenter]}>
          <ActivityIndicator size="large" color="#4EB296" />
        </View>
      </SafeContainer>
    );
  }
  
  if (!solicitacao) {
    return (
      <SafeContainer style={themeStyles.bgBackground}>
        <Row style={[themeStyles.bgPrimary, tw.pX4, tw.pY3]}>
          <TouchableOpacity onPress={voltar}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={[tw.textWhite, tw.textLg, tw.fontBold, tw.mL3]}>
            Erro
          </Text>
        </Row>
        
        <Container style={[tw.itemsCenter, tw.justifyCenter]}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF6B6B" />
          <Text style={[tw.textLg, tw.fontBold, tw.mT4, tw.textCenter]}>
            Solicitação não encontrada
          </Text>
          <Botao 
            titulo="Voltar" 
            onPress={voltar} 
            variante="primario" 
            style={tw.mT6} 
          />
        </Container>
      </SafeContainer>
    );
  }
  
  const estiloStatus = getEstiloStatus(solicitacao.status_solicitacao_id);
  const podeExcluir = solicitacao.status_solicitacao_id <= 2; // Só pode excluir se estiver pendente ou em análise
  
  // Modal para visualização em tela cheia
  const renderModalTelaCheia = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={telaCheia}
      onRequestClose={() => setTelaCheia(false)}
    >
      <View style={[tw.flex1, { backgroundColor: 'rgba(0, 0, 0, 0.9)' }, tw.justifyCenter, tw.itemsCenter]}>
        <TouchableOpacity
          style={[tw.absolute, tw.top0, tw.right0, tw.p4, tw.z10]}
          onPress={() => setTelaCheia(false)}
        >
          <Ionicons name="close-circle" size={36} color="#FFFFFF" />
        </TouchableOpacity>
        
        <Image
          source={{ uri: urlLaudo }}
          style={{ width: windowWidth * 0.9, height: windowHeight * 0.8 }}
          resizeMode="contain"
        />
      </View>
    </Modal>
  );

  return (
    <SafeContainer style={themeStyles.bgBackground}>
      <Row style={[themeStyles.bgPrimary, tw.pX4, tw.pY3]}>
        <TouchableOpacity onPress={voltar}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[tw.textWhite, tw.textLg, tw.fontBold, tw.mL3]}>
          Detalhes da Solicitação
        </Text>
      </Row>
      
      {renderModalTelaCheia()}
      
      <ScrollView
        contentContainerStyle={tw.p4}
        showsVerticalScrollIndicator={false}
      >
        <Card style={tw.mB4}>
          <Row style={tw.justifyBetween}>
            <View style={[tw.pX3, tw.pY1, tw.roundedFull, estiloStatus.bg]}>
              <Text style={[tw.textSm, tw.fontMedium, estiloStatus.text]}>
                {solicitacao.StatusSolicitacao?.nome || getNomeStatus(solicitacao.status_solicitacao_id)}
              </Text>
            </View>
            
            <Text style={tw.textGray500}>
              #{solicitacao.id}
            </Text>
          </Row>
          
          <Text style={[tw.textSm, tw.textGray500, tw.mT3]}>
            Solicitado em
          </Text>
          <Text style={[themeStyles.textText, tw.fontMedium]}>
            {formatarData(solicitacao.data_hora)}
          </Text>
          
          {ehInstituicao() && solicitacao.PessoaFisica && (
            <View style={tw.mT4}>
              <Text style={[tw.textSm, tw.textGray500]}>
                Solicitante
              </Text>
              <Text style={[themeStyles.textText, tw.fontMedium]}>
                {solicitacao.PessoaFisica.nome}
              </Text>
              <Text style={[themeStyles.textText]}>
                {solicitacao.PessoaFisica.email}
              </Text>
              <Text style={[themeStyles.textText]}>
                {solicitacao.PessoaFisica.telefone}
              </Text>
            </View>
          )}
        </Card>
        
        <Card style={tw.mB4}>
          <Titulo style={tw.mB2}>Observações</Titulo>
          {solicitacao.observacao ? (
            <Paragrafo>
              {solicitacao.observacao}
            </Paragrafo>
          ) : (
            <Text style={tw.textGray500}>
              Nenhuma observação fornecida
            </Text>
          )}
        </Card>
        
        <Card style={tw.mB6}>
          <Titulo style={tw.mB3}>Laudo Médico</Titulo>
          
          {solicitacao ? (
            <View style={tw.itemsCenter}>
              <View style={[tw.w80, { height: 300 }, tw.roundedLg, tw.border, tw.borderGray200, tw.itemsCenter, tw.justifyCenter]}>
                {!laudoCarregando && urlLaudo ? (
                  <>
                    <TouchableOpacity onPress={abrirTelaCheia} activeOpacity={0.8}>
                      <Image
                        source={{ uri: urlLaudo }}
                        style={{ width: 270, height: 270 }}
                        onLoadStart={() => console.log('Iniciando carregamento da imagem')}
                        onLoadEnd={() => {
                          setLaudoCarregando(false);
                        }}
                        onError={(e) => {
                          console.error('Erro ao carregar imagem por URL:', e.nativeEvent.error);
                          setLaudoCarregando(false);
                          Alert.alert('Erro', 'Não foi possível carregar o laudo médico. Nossa equipe foi notificada.');
                        }}
                        resizeMode="contain"
                      />
                      <View style={[tw.absolute, tw.inset0, tw.itemsCenter, tw.justifyCenter, { backgroundColor: 'rgba(0,0,0,0.1)' }]}>
                        <Ionicons name="expand-outline" size={32} color="rgba(255,255,255,0.8)" />
                      </View>
                    </TouchableOpacity>
                  </>
                ) : (
                  <Text style={[tw.textGray600, tw.textCenter, tw.p4]}>
                    Carregando laudo médico... {'\n'}
                    Se a imagem não aparecer, tente recarregar a página.
                  </Text>
                )}
                
                {laudoCarregando && (
                  <ActivityIndicator 
                    size="large" 
                    color="#4EB296" 
                    style={[tw.absolute, tw.inset0, { backgroundColor: 'rgba(255,255,255,0.7)' }]} 
                  />
                )}
              </View>
              <View style={tw.mT4}>
                <Row style={tw.justifyCenter}>
                  <TouchableOpacity 
                    style={[tw.flexRow, tw.itemsCenter, tw.justifyCenter, tw.pY2, tw.pX4, tw.bgBlue100, tw.roundedFull, tw.mR2]}
                    onPress={async () => {
                      try {
                        // Forçar o recarregamento da imagem
                        setLaudoCarregando(true);
                        setUrlLaudo('');
                        
                        // Buscar imagem como arraybuffer e converter para base64
                        try {
                          const response = await cliente.get(`/solicitacoes/${id}/laudo`, {
                            responseType: 'arraybuffer'
                          });
                          
                          // Converter arraybuffer para base64
                          const base64 = Buffer.from(response.data, 'binary').toString('base64');
                          const imageUrl = `data:image/jpeg;base64,${base64}`;
                          setUrlLaudo(imageUrl);
                        } catch (erro) {
                          console.error('Erro ao recarregar laudo médico:', erro);
                        } finally {
                          setLaudoCarregando(false);
                        }
                      } catch (erro) {
                        console.error('Erro no recarregamento do laudo:', erro);
                        setLaudoCarregando(false);
                      }
                    }}
                  >
                    <Ionicons name="reload" size={16} color="#0077CC" />
                    <Text style={[tw.textBlue700, tw.fontMedium, tw.mL2]}>Recarregar</Text>
                  </TouchableOpacity>
                </Row>
                
                {urlLaudo && (
                  <Row style={[tw.justifyCenter, tw.mT2]}>
                    <TouchableOpacity 
                      style={[tw.flexRow, tw.itemsCenter, tw.justifyCenter, tw.pY2, tw.pX4, tw.bgGreen100, tw.roundedFull, tw.mR2]}
                      onPress={abrirTelaCheia}
                    >
                      <Ionicons name="expand" size={16} color="#10B981" />
                      <Text style={[tw.textGreen700, tw.fontMedium, tw.mL2]}>Tela Cheia</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[tw.flexRow, tw.itemsCenter, tw.justifyCenter, tw.pY2, tw.pX4, tw.bgPurple100, tw.roundedFull]}
                      onPress={baixarLaudo}
                      disabled={downloading}
                    >
                      {downloading ? (
                        <ActivityIndicator size="small" color="#7E22CE" style={tw.mR2} />
                      ) : (
                        <Ionicons name="download-outline" size={16} color="#7E22CE" />
                      )}
                      <Text style={[tw.textPurple700, tw.fontMedium, tw.mL2]}>
                        {downloading ? 'Baixando...' : 'Baixar'}
                      </Text>
                    </TouchableOpacity>
                  </Row>
                )}
                
                <Text style={[tw.textGray500, tw.textSm, tw.textCenter, tw.mT2]}>
                  Se não for possível visualizar, tente recarregar ou baixar a imagem.
                </Text>
              </View>
            </View>
          ) : (
            <Text style={tw.textGray500}>
              Não foi possível carregar o laudo médico
            </Text>
          )}
        </Card>
        
        {ehInstituicao() && (
          <Card style={tw.mB6}>
            <Titulo style={tw.mB3}>Atualizar Status</Titulo>
            
            <Row style={[tw.flexWrap, tw.mT2, tw.mB4]}>
              <TouchableOpacity
                style={[tw.mR2, tw.mB2, tw.pX3, tw.pY1, tw.roundedFull, solicitacao.status_solicitacao_id === 1 ? tw.bgYellow500 : tw.bgYellow100]}
                onPress={() => atualizarStatus(1)}
              >
                <Text style={[tw.textSm, solicitacao.status_solicitacao_id === 1 ? tw.textWhite : tw.textYellow800]}>
                  Pendente
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[tw.mR2, tw.mB2, tw.pX3, tw.pY1, tw.roundedFull, solicitacao.status_solicitacao_id === 2 ? tw.bgBlue500 : tw.bgBlue100]}
                onPress={() => atualizarStatus(2)}
              >
                <Text style={[tw.textSm, solicitacao.status_solicitacao_id === 2 ? tw.textWhite : tw.textBlue800]}>
                  Em análise
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[tw.mR2, tw.mB2, tw.pX3, tw.pY1, tw.roundedFull, solicitacao.status_solicitacao_id === 3 ? tw.bgGreen500 : tw.bgGreen100]}
                onPress={() => atualizarStatus(3)}
              >
                <Text style={[tw.textSm, solicitacao.status_solicitacao_id === 3 ? tw.textWhite : tw.textGreen800]}>
                  Aprovada
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[tw.mR2, tw.mB2, tw.pX3, tw.pY1, tw.roundedFull, solicitacao.status_solicitacao_id === 4 ? tw.bgRed500 : tw.bgRed100]}
                onPress={() => atualizarStatus(4)}
              >
                <Text style={[tw.textSm, solicitacao.status_solicitacao_id === 4 ? tw.textWhite : tw.textRed800]}>
                  Recusada
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[tw.mR2, tw.mB2, tw.pX3, tw.pY1, tw.roundedFull, solicitacao.status_solicitacao_id === 5 ? tw.bgPurple500 : tw.bgPurple100]}
                onPress={() => atualizarStatus(5)}
              >
                <Text style={[tw.textSm, solicitacao.status_solicitacao_id === 5 ? tw.textWhite : tw.textPurple800]}>
                  Concluída
                </Text>
              </TouchableOpacity>
            </Row>
          </Card>
        )}
        
        {podeExcluir && !ehInstituicao() && (
          <Botao
            titulo="Cancelar Solicitação"
            onPress={cancelarSolicitacao}
            variante="danger"
            larguraTotal
            style={tw.mB6}
          />
        )}
        
        <View style={tw.h10} />
      </ScrollView>
    </SafeContainer>
  );
};

export default DetalhesSolicitacaoTela;