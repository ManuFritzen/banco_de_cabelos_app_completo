import React, { useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAutenticacao } from '../contextos/AutenticacaoContexto';
import { setNavigationRef } from '../servicos/api/cliente';

// Telas de Autenticação
import BoasVindasTela from '../telas/autenticacao/BoasVindasTela';
import LoginTela from '../telas/autenticacao/LoginTela';
import CadastroTela from '../telas/autenticacao/CadastroTela';
import CadastroPessoaFisicaTela from '../telas/autenticacao/CadastroPessoaFisicaTela';
import CadastroDeInstituicaoTela from '../telas/autenticacao/CadastroDeInstituicaoTela';

// Telas Principais
import HomeTela from '../telas/forum/HomeTela';
import BuscarInstituicoesTela from '../telas/cabelo/BuscarInstituicoesTela';
import PerfilTela from '../telas/perfil/PerfilTela';
import EmConstrucaoTela from '../telas/comuns/EmConstrucaoTela';

// Telas de Cabelo
import DoacaoCabeloTela from '../telas/cabelo/DoacaoCabeloTela';
import MinhasDoacoesCabeloTela from '../telas/cabelo/MinhasDoacoesCabeloTela';
import RecebimentosCabeloTela from '../telas/cabelo/RecebimentosCabeloTela';

// Telas de Perucas
import ListaPerucasTela from '../telas/perucas/ListaPerucasTela';
// import DetalhesPerucaTela from '../telas/perucas/DetalhesPerucaTela';
import CadastrarPerucaTela from '../telas/perucas/CadastrarPerucaTela';
// import EditarPerucaTela from '../telas/perucas/EditarPerucaTela';

// Telas de Solicitações
import SolicitacaoPerucaTela from '../telas/solicitacoes/SolicitacaoPerucaTela';
import MinhasSolicitacoesTela from '../telas/solicitacoes/MinhasSolicitacoesTela';
import DetalhesSolicitacaoTela from '../telas/solicitacoes/DetalhesSolicitacaoTela';
import SolicitacoesPerucaInstituicaoTela from '../telas/solicitacoes/SolicitacoesPerucaInstituicaoTela';
import MinhasAnalisesTela from '../telas/solicitacoes/MinhasAnalisesTela';

// Telas do Fórum
import NovaPublicacaoTela from '../telas/forum/NovaPublicacaoTela';
import EditarPublicacaoTela from '../telas/forum/EditarPublicacaoTela';
import DetalhesPublicacaoTela from '../telas/forum/DetalhesPublicacaoTela';

// Tela de Notificações
import NotificacoesTela from '../telas/NotificacoesTela';

// Tipos para as navegações
type NavegacaoAutenticacaoParamList = {
  BoasVindas: undefined;
  Login: undefined;
  Cadastro: undefined;
  CadastroPessoaFisica: undefined;
  CadastroInstituicao: undefined;
};

type NavegacaoTabParamList = {
  Home: undefined;
  BuscarInstituicoes: undefined;
  Perfil: undefined;
};

type NavegacaoPrincipalParamList = {
  TabNavegacao: undefined;
  NovaPublicacao: undefined;
  EditarPublicacao: { publicacaoId: number };
  DetalhesPublicacao: { publicacaoId: number };
  DoacaoCabelo: { instituicaoId: number };
  MinhasDoacoesCabelo: undefined;
  RecebimentosCabelo: { openModal?: boolean; recebimentoId?: number };
  ListaPerucas: { instituicaoId?: number };
  DetalhesPeruca: { id: number };
  CadastrarPeruca: undefined;
  EditarPeruca: { id: number };
  SolicitacaoPeruca: undefined;
  MinhasSolicitacoes: undefined;
  SolicitacoesPerucaInstituicao: undefined;
  MinhasAnalises: undefined;
  DetalhesSolicitacao: { id: number };
  Notificacoes: undefined;
  EmConstrucao: { titulo?: string };
};

const AutenticacaoStack = createNativeStackNavigator<NavegacaoAutenticacaoParamList>();
const Tab = createBottomTabNavigator<NavegacaoTabParamList>();
const PrincipalStack = createNativeStackNavigator<NavegacaoPrincipalParamList>();

// Navegação de abas (após login)
const TabNavegacao = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'BuscarInstituicoes') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Perfil') {
            iconName = focused ? 'person' : 'person-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4EB296',  
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeTela} 
        options={{ 
          title: 'Comunidade',
          headerShown: false
        }} 
      />
      <Tab.Screen 
        name="BuscarInstituicoes" 
        component={BuscarInstituicoesTela} 
        options={{ 
          title: 'Buscar',
          headerShown: false
        }} 
      />
      <Tab.Screen 
        name="Perfil" 
        component={PerfilTela} 
        options={{ 
          title: 'Perfil',
          headerShown: false
        }} 
      />
    </Tab.Navigator>
  );
};

// Navegação principal do app (inclui as abas e telas acessíveis após o login)
const NavegacaoPrincipal = () => {
  return (
    <PrincipalStack.Navigator>
      <PrincipalStack.Screen 
        name="TabNavegacao" 
        component={TabNavegacao} 
        options={{ headerShown: false }} 
      />
      <PrincipalStack.Screen 
        name="NovaPublicacao" 
        component={NovaPublicacaoTela} 
        options={{ title: 'Nova Publicação' }} 
      />
      <PrincipalStack.Screen
        name="EditarPublicacao"
        component={EditarPublicacaoTela}
        options={{ headerShown: false }}
      />
      <PrincipalStack.Screen
        name="DetalhesPublicacao"
        component={DetalhesPublicacaoTela}
        options={{ title: 'Publicação' }}
      />
      <PrincipalStack.Screen
        name="DoacaoCabelo"
        component={DoacaoCabeloTela}
        options={{ title: 'Doar Cabelo' }}
      />
      <PrincipalStack.Screen 
        name="MinhasDoacoesCabelo" 
        component={MinhasDoacoesCabeloTela} 
        options={{ title: 'Minhas doações'}} 
      />
      <PrincipalStack.Screen 
        name="RecebimentosCabelo" 
        component={RecebimentosCabeloTela} 
        options={{ title: 'Recebimentos de Cabelo' }} 
      />
      <PrincipalStack.Screen 
        name="ListaPerucas" 
        component={ListaPerucasTela} 
        options={{ title: 'Perucas' }}
      />
      {/* <PrincipalStack.Screen 
        name="DetalhesPeruca" 
        component={DetalhesPerucaTela} 
        options={{ headerShown: false }} 
      /> */}
      <PrincipalStack.Screen 
        name="CadastrarPeruca" 
        component={CadastrarPerucaTela} 
        options={{ title: 'Cadastrar Peruca' }} 
      />
      {/* <PrincipalStack.Screen 
        name="EditarPeruca" 
        component={EditarPerucaTela} 
        options={{ title: 'Editar Peruca' }} 
      /> */}
      <PrincipalStack.Screen 
        name="SolicitacaoPeruca" 
        component={SolicitacaoPerucaTela} 
        options={{ title: 'Solicitar Peruca' }} 
      />
      <PrincipalStack.Screen 
        name="MinhasSolicitacoes" 
        component={MinhasSolicitacoesTela} 
        options={{ title: 'Minhas Solicitações' }} 
      />
      <PrincipalStack.Screen 
        name="DetalhesSolicitacao" 
        component={DetalhesSolicitacaoTela} 
        options={{ title: 'Detalhes da Solicitação' }} 
      />
      <PrincipalStack.Screen 
        name="SolicitacoesPerucaInstituicao" 
        component={SolicitacoesPerucaInstituicaoTela} 
        options={{ title: 'Solicitações de Perucas' }} 
      />
      <PrincipalStack.Screen 
        name="MinhasAnalises" 
        component={MinhasAnalisesTela} 
        options={{ title: 'Minhas Análises' }} 
      />
      <PrincipalStack.Screen 
        name="Notificacoes" 
        component={NotificacoesTela} 
        options={{ title: 'Notificações' }} 
      />
      <PrincipalStack.Screen 
        name="EmConstrucao" 
        component={EmConstrucaoTela} 
        options={({ route }) => ({ 
          title: route.params?.titulo || 'Página em Construção' 
        })}
      />
    </PrincipalStack.Navigator>
  );
};

// Navegação de autenticação (antes do login)
const NavegacaoAutenticacao = () => {
  return (
    <AutenticacaoStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="Login"
    >
      <AutenticacaoStack.Screen name="BoasVindas" component={BoasVindasTela} />
      <AutenticacaoStack.Screen name="Login" component={LoginTela} />
      <AutenticacaoStack.Screen name="Cadastro" component={CadastroTela} />
      <AutenticacaoStack.Screen name="CadastroPessoaFisica" component={CadastroPessoaFisicaTela} />
      <AutenticacaoStack.Screen name="CadastroInstituicao" component={CadastroDeInstituicaoTela} />
    </AutenticacaoStack.Navigator>
  );
};

// Componente principal de navegação
const AppNavegacao = () => {
  const { usuario, carregando } = useAutenticacao();
  const navigationRef = useRef<any>(null);
  
  if (carregando) {
    return null;
  }
  
  return (
    <NavigationContainer 
      ref={navigationRef}
      onReady={() => setNavigationRef(navigationRef.current)}
    >
      {usuario ? <NavegacaoPrincipal /> : <NavegacaoAutenticacao />}
    </NavigationContainer>
  );
};

export default AppNavegacao;