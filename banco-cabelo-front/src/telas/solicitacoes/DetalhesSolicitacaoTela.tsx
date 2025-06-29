import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, Image, ScrollView, Alert, Modal, Dimensions, Share, Platform } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as FileSystem from 'expo-file-system';
import { solicitacoesServico } from '../../servicos/api/solicitacoes';
import { solicitacoesInstituicaoServico } from '../../servicos/api/solicitacoes-instituicao';
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
  contadores?: {
    total_analises: number;
    pendentes: number;
    em_analise: number;
    aprovadas: number;
    recusadas: number;
    tem_analises: boolean;
  };
  SolicitacoesInstituicao?: Array<{
    id: number;
    instituicao_id: number;
    status_solicitacao_id: number;
    Instituicao: {
      id: number;
      nome: string;
    };
  }>;
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
  const [analisando, setAnalisando] = useState(false);
  const [jaAnalisou, setJaAnalisou] = useState(false);
  
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

  useEffect(() => {
    if (solicitacao && ehInstituicao() && usuario) {
      // Verificar se a instituição já analisou esta solicitação
      const analiseExistente = solicitacao.SolicitacoesInstituicao?.find(
        analise => analise.instituicao_id === usuario.id
      );
      setJaAnalisou(!!analiseExistente);
    }
  }, [solicitacao, ehInstituicao, usuario]);

  const analisarSolicitacao = async () => {
    if (!solicitacao || !ehInstituicao()) return;

    Alert.alert(
      'Analisar Solicitação',
      'Você deseja assumir a análise desta solicitação? Isso criará um registro para acompanhamento do status.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Analisar',
          onPress: async () => {
            try {
              setAnalisando(true);
              
              await solicitacoesInstituicaoServico.analisarSolicitacao(solicitacao.id);
              
              Alert.alert(
                'Sucesso', 
                'Solicitação adicionada às suas análises! Você pode acompanhar o progresso na tela "Minhas Análises".',
                [
                  {
                    text: 'Ver Análises',
                    onPress: () => navigation.navigate('MinhasAnalises')
                  },
                  { text: 'OK' }
                ]
              );
              
              // Recarregar dados da solicitação
              buscarSolicitacao();
            } catch (erro: any) {
              console.error('Erro ao analisar solicitação:', erro);
              
              let mensagem = 'Não foi possível analisar a solicitação.';
              if (erro.response?.status === 400) {
                mensagem = erro.response.data?.message || 'Esta solicitação já foi analisada por sua instituição.';
              }
              
              Alert.alert('Erro', mensagem);
            } finally {
              setAnalisando(false);
            }
          }
        }
      ]
    );
  };
  
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
      // Verificar se há análises em andamento (qualquer análise por instituição)
      const temAnalises = solicitacao?.SolicitacoesInstituicao && solicitacao.SolicitacoesInstituicao.length > 0;
      
      if (temAnalises) {
        // Se há análises, alterar status para "Cancelada pelo solicitante" (ID 6)
        await solicitacoesServico.atualizarStatusSolicitacao(id, 6, 'Solicitação cancelada pelo solicitante');
        Alert.alert('Sucesso', 'Solicitação cancelada com sucesso. As instituições foram notificadas.', [
          { text: 'OK', onPress: () => navigation.navigate('MinhasSolicitacoes') }
        ]);
      } else {
        // Se não há análises, deletar completamente como era antes
        await solicitacoesServico.excluirSolicitacao(id);
        Alert.alert('Sucesso', 'Solicitação cancelada com sucesso.', [
          { text: 'OK', onPress: () => navigation.navigate('MinhasSolicitacoes') }
        ]);
      }
    } catch (erro: any) {
      console.error('Erro ao cancelar solicitação:', erro);
      
      // Verificar se é um erro da API com mensagem específica
      const mensagemErro = erro.response?.data?.message || 'Não foi possível cancelar a solicitação.';
      Alert.alert('Erro', mensagemErro);
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
      case 6: // Cancelada pelo solicitante
        return { bg: tw.bgGray100, text: tw.textGray800 };
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
      case 6: return "Cancelada pelo solicitante";
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
  
  // Verificar se há análises aprovadas ou rejeitadas
  const temAnaliseAprovadaOuRejeitada = solicitacao.SolicitacoesInstituicao?.some(
    analise => analise.status_solicitacao_id === 3 || analise.status_solicitacao_id === 4
  ) || false;
  
  // Só pode cancelar se:
  // 1. Estiver pendente (1) ou em análise (2) 
  // 2. NÃO tiver análises aprovadas/rejeitadas
  // 3. NÃO estiver já cancelada pelo solicitante (6)
  const podeExcluir = solicitacao.status_solicitacao_id <= 2 && 
                     !temAnaliseAprovadaOuRejeitada && 
                     solicitacao.status_solicitacao_id !== 6;
  
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
      
      {renderModalTelaCheia()}
      
      <ScrollView
        contentContainerStyle={tw.p4}
        showsVerticalScrollIndicator={false}
      >
        <Card style={tw.mB4}>
          <Row style={tw.justifyBetween}>
            
            
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
        
        {ehInstituicao() && solicitacao.contadores && (
          <Card style={tw.mB4}>
            <Titulo style={tw.mB3}>Status das Análises</Titulo>
            
            {solicitacao.contadores.tem_analises ? (
              <View>
                <Row style={[tw.flexWrap, tw.mB3]}>
                  {solicitacao.contadores.pendentes > 0 && (
                    <View style={[tw.bgYellow100, tw.pX3, tw.pY2, tw.roundedFull, tw.mR2, tw.mB2]}>
                      <Text style={[tw.textSm, { color: '#d97706' }]}>
                        ⏳ {solicitacao.contadores.pendentes} pendente{solicitacao.contadores.pendentes > 1 ? 's' : ''}
                      </Text>
                    </View>
                  )}
                  {solicitacao.contadores.em_analise > 0 && (
                    <View style={[tw.bgBlue100, tw.pX3, tw.pY2, tw.roundedFull, tw.mR2, tw.mB2]}>
                      <Text style={[tw.textSm, { color: '#3b82f6' }]}>
                        🔍 {solicitacao.contadores.em_analise} em análise
                      </Text>
                    </View>
                  )}
                  {solicitacao.contadores.aprovadas > 0 && (
                    <View style={[tw.bgGreen100, tw.pX3, tw.pY2, tw.roundedFull, tw.mR2, tw.mB2]}>
                      <Text style={[tw.textSm, { color: '#10b981' }]}>
                        ✓ {solicitacao.contadores.aprovadas} aprovada{solicitacao.contadores.aprovadas > 1 ? 's' : ''}
                      </Text>
                    </View>
                  )}
                  {solicitacao.contadores.recusadas > 0 && (
                    <View style={[tw.bgRed100, tw.pX3, tw.pY2, tw.roundedFull, tw.mR2, tw.mB2]}>
                      <Text style={[tw.textSm, { color: '#ef4444' }]}>
                        ✗ {solicitacao.contadores.recusadas} recusada{solicitacao.contadores.recusadas > 1 ? 's' : ''}
                      </Text>
                    </View>
                  )}
                </Row>
                
                <Text style={[tw.textXs, tw.textGray500]}>
                  Total de {solicitacao.contadores.total_analises} instituição{solicitacao.contadores.total_analises > 1 ? 'ões' : ''} analisando esta solicitação
                </Text>
              </View>
            ) : (
              <Text style={[tw.textGray500, tw.textSm]}>
                Nenhuma instituição analisou esta solicitação ainda. Seja a primeira!
              </Text>
            )}
            
            {/* Botão para analisar solicitação */}
            {!jaAnalisou && (
              <View style={tw.mT4}>
                <Botao
                  titulo={analisando ? "Analisando..." : "Analisar Solicitação"}
                  onPress={analisarSolicitacao}
                  carregando={analisando}
                  larguraTotal
                  style={[themeStyles.bgSecondary]}
                />
              </View>
            )}
            
            {jaAnalisou && (
              <View style={[tw.mT4, tw.pY3, tw.pX4, tw.bgBlue100, tw.roundedLg]}>
                <Text style={[tw.textSm, { color: '#3b82f6' }, tw.textCenter]}>
                  ✓ Sua instituição já está analisando esta solicitação
                </Text>
                <TouchableOpacity
                  style={[tw.mT2, tw.itemsCenter]}
                  onPress={() => navigation.navigate('MinhasAnalises')}
                >
                  <Text style={[tw.textSm, { color: '#3b82f6' }, tw.underline]}>
                    Ver em Minhas Análises
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>
        )}
        
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
        
        {solicitacao.SolicitacoesInstituicao && solicitacao.SolicitacoesInstituicao.length > 0 && (
          <Card style={tw.mB6}>
            <Titulo style={tw.mB3}>Histórico de Análises</Titulo>
            <Text style={[tw.textSm, tw.textGray600, tw.mB3]}>
              Acompanhe o status das análises de cada instituição de forma transparente
            </Text>
            
            {solicitacao.SolicitacoesInstituicao.map((analise, index) => {
              const getEstiloStatusAnalise = (statusId: number) => {
                switch (statusId) {
                  case 1: // Pendente
                    return { bg: tw.bgYellow100, text: { color: '#d97706' } };
                  case 2: // Em análise
                    return { bg: tw.bgBlue100, text: { color: '#3b82f6' } };
                  case 3: // Aprovada
                    return { bg: tw.bgGreen100, text: { color: '#10b981' } };
                  case 4: // Recusada
                    return { bg: tw.bgRed100, text: { color: '#ef4444' } };
                  case 5: // Concluída
                    return { bg: tw.bgPurple100, text: { color: '#8b5cf6' } };
                  default:
                    return { bg: tw.bgGray100, text: tw.textGray600 };
                }
              };

              const getNomeStatusAnalise = (statusId: number): string => {
                switch (statusId) {
                  case 1:
                    return 'Pendente';
                  case 2:
                    return 'Em análise';
                  case 3:
                    return 'Aprovada';
                  case 4:
                    return 'Recusada';
                  case 5:
                    return 'Concluída';
                  default:
                    return `Status ${statusId}`;
                }
              };

              const estiloStatus = getEstiloStatusAnalise(analise.status_solicitacao_id);
              
              return (
                <View key={analise.id} style={[tw.bgGray500, tw.p3, tw.roundedLg, tw.mB2]}>
                  <Row style={[tw.justifyBetween, tw.itemsCenter]}>
                    <View style={tw.flex1}>
                      <Text style={[tw.fontMedium, themeStyles.textText]}>
                        {analise.Instituicao.nome}
                      </Text>
                      <Text style={[tw.textSm, tw.textGray600]}>
                        Instituição #{analise.Instituicao.id}
                      </Text>
                    </View>
                    
                    <View style={[tw.pX3, tw.pY1, tw.roundedFull, estiloStatus.bg]}>
                      <Text style={[tw.textSm, tw.fontMedium, estiloStatus.text]}>
                        {getNomeStatusAnalise(analise.status_solicitacao_id)}
                      </Text>
                    </View>
                  </Row>
                </View>
              );
            })}
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