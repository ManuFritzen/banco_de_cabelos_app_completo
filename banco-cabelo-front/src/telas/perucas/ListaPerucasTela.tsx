import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  RefreshControl, 
  TouchableOpacity, 
  ActivityIndicator,
  TextInput,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { useAutenticacao } from '../../contextos/AutenticacaoContexto';
import { perucasServico } from '../../servicos/api/perucas';
import {
  SafeContainer,
  Row
} from '../../styles/componentes';
import tw from '../../styles/tailwind';
import themeStyles from '../../styles/theme';

interface Peruca {
  id: number;
  instituicao_id: number;
  tipo_peruca_id: number;
  cor_id: number;
  comprimento: number;
  tamanho: 'P' | 'M' | 'G';
  disponivel: boolean;
  tipo_peruca?: {
    id: number;
    nome: string;
    sigla: string;
  };
  cor?: {
    id: number;
    nome: string;
  };
  instituicao?: {
    id: number;
    nome: string;
    email: string;
  };
}

interface RouteParams {
  instituicaoId?: number;
}

const ListaPerucasTela: React.FC = () => {
  const [perucas, setPerucas] = useState<Peruca[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [termoBusca, setTermoBusca] = useState('');
  
  const { usuario } = useAutenticacao();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { instituicaoId } = route.params as RouteParams || {};
  
  // Ref para controlar se já carregamos dados iniciais
  const dadosCarregados = useRef(false);
  
  // Mapeamento de cores para exibição visual
  const obterCorHex = (nomeCor: string): string => {
    const cores: { [key: string]: string } = {
      'preto': '#000000',
      'castanho escuro': '#3B2414',
      'castanho': '#8B4513',
      'castanho claro': '#A0522D',
      'loiro escuro': '#B8860B',
      'loiro': '#DAA520',
      'loiro claro': '#F0E68C',
      'ruivo': '#B22222',
      'grisalho': '#808080',
      'branco': '#F5F5F5',
      'mescla': '#C0C0C0',
      'mel': '#FFB347',
      'acobreado': '#B87333',
      'cinza': '#A9A9A9',
      'platinado': '#E5E4E2'
    };
    
    const corLower = nomeCor?.toLowerCase();
    return cores[corLower] || '#ddd';
  };
  
  const carregarPerucas = async (pagina: number = 1, tamanhoLote: number = 10) => {
    console.log('carregarPerucas chamada - pagina:', pagina, 'usuario:', usuario?.tipo);
    
    if (!usuario) {
      setCarregando(false);
      return;
    }
    
    try {
      if (pagina === 1) {
        setCarregando(true);
      }
      
      let resposta;
      
      if (instituicaoId) {
        // Se foi especificado um ID de instituição, mostra perucas dessa instituição
        resposta = await perucasServico.listarPerucasPorInstituicao(instituicaoId, pagina, tamanhoLote);
      } else if (usuario.tipo === 'J') {
        // Se o usuário logado é uma instituição, mostra suas próprias perucas
        resposta = await perucasServico.listarPerucasPorInstituicao(usuario.id, pagina, tamanhoLote);
      } else {
        // Caso contrário, mostra todas as perucas
        resposta = await perucasServico.listarPerucas({}, pagina, tamanhoLote);
      }
      
      if (resposta.data && resposta.data.data) {
        if (pagina === 1) {
          // Se for a primeira página, substitui a lista
          setPerucas(resposta.data.data);
        } else {
          // Senão, adiciona ao fim da lista
          setPerucas(perucasAnteriores => [...perucasAnteriores, ...resposta.data.data]);
        }
        
        // Atualiza informações de paginação
        setPaginaAtual(resposta.data.currentPage || pagina);
        setTotalPaginas(resposta.data.totalPages || 1);
      }
    } catch (erro) {
      console.error('Erro ao carregar perucas:', erro);
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  };
  
  // Carregar dados apenas quando o componente montar
  useEffect(() => {
    console.log('useEffect executando. dadosCarregados:', dadosCarregados.current);
    
    if (!dadosCarregados.current) {
      dadosCarregados.current = true;
      carregarPerucas(1);
    }
  }, []); // Sem dependências - executa apenas uma vez
  
  const handleAtualizar = () => {
    setAtualizando(true);
    carregarPerucas(1);
  };
  
  const carregarMaisItens = () => {
    if (carregando || paginaAtual >= totalPaginas) return;
    carregarPerucas(paginaAtual + 1);
  };
  
  const navegarParaDetalhes = (perucaId: number) => {
    navigation.navigate('DetalhesPeruca', { id: perucaId });
  };
  
  const navegarParaNovaCadastro = () => {
    navigation.navigate('CadastrarPeruca');
  };
  
  const voltar = () => {
    navigation.goBack();
  };
  
  // Renderizar cada item da lista (cartão de peruca)
  const renderizarItemPeruca = ({ item }: { item: Peruca }) => {
    const termoBuscaLower = termoBusca.toLowerCase();
    if (termoBusca && 
        !item.tipo_peruca?.nome.toLowerCase().includes(termoBuscaLower) &&
        !item.cor?.nome.toLowerCase().includes(termoBuscaLower) &&
        !item.instituicao?.nome.toLowerCase().includes(termoBuscaLower)) {
      return null;
    }
    
    const urlImagem = perucasServico.obterUrlImagemPeruca(item.id);
    
    return (
      <TouchableOpacity
        style={[tw.bgWhite, tw.rounded, tw.p4, tw.mB3, tw.shadow]}
        onPress={() => navegarParaDetalhes(item.id)}
      >
        <View style={[tw.flexRow, tw.itemsStart]}>
          <View style={[tw.mR3, tw.relative]}>
            <Image
              source={{ uri: urlImagem }}
              style={[tw.w20, tw.h20, tw.rounded]}
              defaultSource={require('../../../assets/icon.png')}
            />
            <View style={[
              tw.absolute, tw.bottom0, tw.right0,
              tw.bgWhite, tw.rounded, tw.p1, tw.shadow
            ]}>
              <Ionicons name="cut-outline" size={16} color="#666" />
            </View>
          </View>
          
          <View style={tw.flex1}>
            <View style={[tw.flexRow, tw.itemsCenter, tw.justifyBetween, tw.mB1]}>
              <Text style={[tw.fontBold, tw.textLg]}>
                {item.tipo_peruca?.nome || 'Peruca'}
              </Text>
              <View style={[
                tw.pX2,
                tw.roundedFull,
                tw.pY1,
                item.disponivel ? tw.bgGreen100 : tw.bgRed100
              ]}>
                <Text style={[
                  tw.textXs,
                  item.disponivel ? { color: '#10b981' } : { color: '#ef4444' }
                ]}>
                  {item.disponivel ? 'Disponível' : 'Indisponível'}
                </Text>
              </View>
            </View>
            
            {item.cor && (
              <View style={[tw.flexRow, tw.itemsCenter, tw.mB1]}>
                <View style={[
                  tw.w4, tw.h4, tw.rounded, tw.mR2, tw.border, tw.borderGray300,
                  { backgroundColor: obterCorHex(item.cor.nome || '') }
                ]} />
                <Text style={[tw.textGray700, tw.fontMedium]}>
                  {item.cor.nome}
                </Text>
              </View>
            )}
            
            <View style={[tw.flexRow, tw.itemsCenter, tw.mB1]}>
              <Ionicons name="resize" size={14} color="#666" />
              <Text style={[tw.textGray600, tw.textSm, tw.mL1]}>
                {item.comprimento} cm
              </Text>
              
              <Text style={[tw.textGray600, tw.textSm, tw.mL3]}>
                Tamanho {item.tamanho}
              </Text>
            </View>
            
            {item.instituicao && (
              <Text style={[tw.textGray500, tw.textXs, tw.mT1]}>
                {item.instituicao.nome}
              </Text>
            )}
          </View>
          
          <Ionicons name="chevron-forward" size={20} color="#aaa" style={tw.mL2} />
        </View>
      </TouchableOpacity>
    );
  };
  
  const renderizarFooter = () => {
    if (carregando && paginaAtual > 1) {
      return (
        <View style={[tw.pY4, tw.itemsCenter]}>
          <ActivityIndicator size="small" color={themeStyles.color.primary} />
        </View>
      );
    }
    
    if (paginaAtual >= totalPaginas && perucas.length > 0) {
      return (
        <View style={[tw.pY4, tw.itemsCenter]}>
          <Text style={tw.textGray500}>Não há mais perucas para mostrar</Text>
        </View>
      );
    }
    
    return null;
  };
  
  const renderizarListaVazia = () => {
    if (carregando) return null;
    
    return (
      <View style={[tw.flex1, tw.justifyCenter, tw.itemsCenter, tw.p8]}>
        <Ionicons name="cut-outline" size={64} color="#d1d5db" />
        <Text style={[tw.textGray500, tw.textCenter, tw.mT4]}>
          {termoBusca 
            ? 'Nenhuma peruca encontrada com estes critérios.' 
            : 'Nenhuma peruca cadastrada ainda.'
          }
        </Text>
        
        {usuario?.tipo === 'J' && !termoBusca && (
          <>
            <Text style={[tw.textGray500, tw.textCenter, tw.mT2]}>
              Comece cadastrando sua primeira peruca!
            </Text>
            <TouchableOpacity
              style={[themeStyles.bgPrimary, tw.pX6, tw.pY3, tw.roundedFull, tw.mT4]}
              onPress={navegarParaNovaCadastro}
            >
              <Text style={[tw.textWhite, tw.fontBold]}>
                Cadastrar Peruca
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };
  
  return (
    <SafeContainer style={themeStyles.bgBackground}>
      <Row style={[themeStyles.bgPrimary, tw.pX4, tw.pY3]}>
        <TouchableOpacity onPress={voltar}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[tw.textWhite, tw.textLg, tw.fontBold, tw.mL3]}>
          {instituicaoId ? 'Perucas da Instituição' : 'Minhas Perucas'}
        </Text>
        
        {usuario?.tipo === 'J' && (
          <TouchableOpacity 
            style={[tw.mL2, tw.bgWhite, tw.roundedFull, tw.p1]}
            onPress={navegarParaNovaCadastro}
          >
            <Ionicons name="add" size={22} color={themeStyles.color.primary} />
          </TouchableOpacity>
        )}
      </Row>
      
      <View style={[tw.bgWhite, tw.p4]}>
        <View style={[tw.flexRow, tw.border, tw.borderGray300, tw.rounded, tw.p2, tw.itemsCenter]}>
          <Ionicons name="search" size={20} color="#aaa" style={tw.mR2} />
          <TextInput
            style={[tw.flex1, tw.textGray700]}
            placeholder="Buscar por tipo ou cor..."
            value={termoBusca}
            onChangeText={setTermoBusca}
          />
          {termoBusca.length > 0 && (
            <TouchableOpacity onPress={() => setTermoBusca('')}>
              <Ionicons name="close-circle" size={20} color="#aaa" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {carregando && perucas.length === 0 ? (
        <View style={[tw.flex1, tw.justifyCenter, tw.itemsCenter]}>
          <ActivityIndicator size="large" color={themeStyles.color.primary} />
          <Text style={[tw.mT4, tw.textGray600]}>Carregando perucas...</Text>
        </View>
      ) : (
        <FlatList
          data={perucas}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderizarItemPeruca}
          ListEmptyComponent={renderizarListaVazia}
          ListFooterComponent={renderizarFooter}
          refreshControl={
            <RefreshControl
              refreshing={atualizando}
              onRefresh={handleAtualizar}
              colors={[themeStyles.color.primary]}
            />
          }
          onEndReached={carregarMaisItens}
          onEndReachedThreshold={0.5}
          contentContainerStyle={tw.p4}
        />
      )}
    </SafeContainer>
  );
};

export default ListaPerucasTela;