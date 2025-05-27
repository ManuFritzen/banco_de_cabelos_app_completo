import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'react-native';
import { instituicoesServico } from '../../servicos/api/instituicoes';
import { useAutenticacao } from '../../contextos/AutenticacaoContexto';
import CardInstituicao from '../../components/comuns/CardInstituicao';
import {
  SafeContainer,
  Container,
  Titulo,
  Pilula,
  Row
} from '../../styles/componentes';
import tw from '../../styles/tailwind';
import themeStyles from '../../styles/theme';

interface Instituicao {
  id: number;
  nome: string;
  email: string;
  tipo: string;
  telefone?: string;
  enderecos?: {
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
  }[];
}

const BuscarInstituicoesTela: React.FC = () => {
  const [instituicoes, setInstituicoes] = useState<Instituicao[]>([]);
  const [instituicoesFiltradas, setInstituicoesFiltradas] = useState<Instituicao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');
  const [localBusca, setLocalBusca] = useState('');
  
  const termoBuscaRef = useRef('');
  const localBuscaRef = useRef('');
  
  const { ehPessoaFisica, ehAdmin } = useAutenticacao();
  
  useEffect(() => {
    const buscarInstituicoes = async () => {
      try {
        const resposta = await instituicoesServico.listarInstituicoes();
        console.log('Resposta da API:', resposta.data);
        
        const instituicoesData = resposta.data?.data || [];
        
        setInstituicoes(instituicoesData);
        setInstituicoesFiltradas(instituicoesData);
      } catch (erro) {
        console.error('Erro ao buscar instituições:', erro);
        setInstituicoes([]);
        setInstituicoesFiltradas([]);
      } finally {
        setCarregando(false);
      }
    };
    
    buscarInstituicoes();
  }, []);
  
  const aplicarFiltros = () => {
    if (!instituicoes || instituicoes.length === 0) {
      setInstituicoesFiltradas([]);
      return;
    }
    
    let resultado = [...instituicoes];
    
    if (termoBuscaRef.current) {
      resultado = resultado.filter(instituicao => 
        instituicao?.nome?.toLowerCase().includes(termoBuscaRef.current.toLowerCase())
      );
    }
    
    if (localBuscaRef.current) {
      resultado = resultado.filter(instituicao => 
        instituicao?.enderecos?.some(endereco => 
          endereco?.cidade?.toLowerCase().includes(localBuscaRef.current.toLowerCase()) ||
          endereco?.estado?.toLowerCase().includes(localBuscaRef.current.toLowerCase()) ||
          endereco?.bairro?.toLowerCase().includes(localBuscaRef.current.toLowerCase())
        )
      );
    }
    
    setInstituicoesFiltradas(resultado);
  };
  
  const formatarEndereco = (instituicao: Instituicao) => {
    if (!instituicao?.enderecos || instituicao.enderecos.length === 0) {
      return 'Nenhum endereço cadastrado';
    }
    
    const endereco = instituicao.enderecos[0];
    if (!endereco) {
      return 'Endereço não disponível';
    }
    
    const partes = [
      endereco.rua,
      endereco.numero ? `, ${endereco.numero}` : '',
      endereco.bairro ? ` - ${endereco.bairro}` : '',
      endereco.cidade ? `, ${endereco.cidade}` : '',
      endereco.estado ? ` - ${endereco.estado}` : ''
    ].filter(Boolean).join('');
    
    return partes || 'Endereço incompleto';
  };
  
  const renderItem = ({ item }: { item: Instituicao }) => (
    <CardInstituicao 
      instituicao={{
        id: item.id,
        nome: item.nome,
        atividade: 'Doação de Perucas, Recebe doação de cabelos...',
        endereco: formatarEndereco(item)
      }} 
      permitirDoacao={ehPessoaFisica()}
    />
  );
  
  const renderEmpty = () => {
    if (carregando) return null;

    return (
      <View style={[tw.flex1, tw.itemsCenter, tw.justifyCenter, tw.pY8]}>
        <Ionicons name="business-outline" size={48} color={themeStyles.color.primary} />
        <Text style={[tw.textGray600, tw.textCenter, tw.mT4]}>
          Nenhuma instituição encontrada.
        </Text>
        <Text style={[tw.textGray600, tw.textCenter]}>
          Tente outros termos de busca.
        </Text>
      </View>
    );
  };
  
  return (
    <SafeContainer style={themeStyles.bgBackground}>
      <StatusBar backgroundColor={themeStyles.color.primary} barStyle="light-content" />
      <View style={[themeStyles.bgPrimary, tw.pX4, tw.pY4]}>
        <Row>
          <Titulo style={[tw.textWhite, tw.m0]}>
            Pesquise por uma instituição
          </Titulo>

          {ehAdmin() && (
            <Pilula tipo="primario" style={[tw.bgYellow500, tw.mL2]}>
              <Text style={[tw.textWhite, tw.textXs, tw.fontBold]}>
                ADMIN
              </Text>
            </Pilula>
          )}
        </Row>
      </View>
      
      <View style={[tw.pX4, tw.pY3, tw.bgWhite, {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2
      }]}>
        <View style={[tw.bgGray100, tw.roundedLg, tw.flexRow, tw.itemsCenter, tw.pX3, tw.mB3]}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={[tw.flex1, tw.pY2, tw.pX2, { color: '#1F2937' }]}
            placeholder="Pesquise por nome, local..."
            value={termoBusca}
            onChangeText={(texto: string) => {
              setTermoBusca(texto);
              termoBuscaRef.current = texto;
            }}
            onSubmitEditing={aplicarFiltros}
            onBlur={aplicarFiltros}
            placeholderTextColor="#A0A0A0"
          />
          <TouchableOpacity
            onPress={() => {
              setTermoBusca('');
              termoBuscaRef.current = '';
              aplicarFiltros();
            }}
          >
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={[tw.bgGray100, tw.roundedLg, tw.flexRow, tw.itemsCenter, tw.pX3]}>
          <Ionicons name="location" size={20} color="#666" />
          <TextInput
            style={[tw.flex1, tw.pY2, tw.pX2, { color: '#1F2937' }]}
            placeholder="Buscar por cidade/estado"
            value={localBusca}
            onChangeText={(texto: string) => {
              setLocalBusca(texto);
              localBuscaRef.current = texto;
            }}
            onSubmitEditing={aplicarFiltros}
            onBlur={aplicarFiltros}
            placeholderTextColor="#A0A0A0"
          />
          <TouchableOpacity
            onPress={() => {
              setLocalBusca('');
              localBuscaRef.current = '';
              aplicarFiltros();
            }}
          >
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
      
      <Container style={tw.pT2}>
        {carregando ? (
          <View style={[tw.flex1, tw.itemsCenter, tw.justifyCenter]}>
            <ActivityIndicator size="large" color={themeStyles.color.primary} />
          </View>
        ) : (
          <FlatList
            data={instituicoesFiltradas}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={renderEmpty}
            ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          />
        )}
      </Container>
    </SafeContainer>
  );
};

export default BuscarInstituicoesTela;