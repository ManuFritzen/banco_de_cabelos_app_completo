import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Image, ActivityIndicator, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAutenticacao } from '../../contextos/AutenticacaoContexto';
import { fotoPerfilServico } from '../../servicos/api/fotoPerfil';
import { fotoPerfilBase64Servico } from '../../servicos/api/fotoPerfilBase64';
import Botao from '../../components/comuns/Botao';
import {
  SafeContainer,
  Card,
  Titulo,
  Row,
  Column,
  ScrollContainer
} from '../../styles/componentes';
import tw from '../../styles/tailwind';
import themeStyles from '../../styles/theme';

const PerfilTela: React.FC = () => {
  const navigation = useNavigation<any>();
  const { usuario, logout, ehPessoaFisica, ehInstituicao, ehAdmin } = useAutenticacao();
  
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  const [carregandoFoto, setCarregandoFoto] = useState(false);
  const [modalFotoVisivel, setModalFotoVisivel] = useState(false);
  
  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sair', 
          onPress: async () => {
            try {
              await logout();
            } catch (erro) {
              console.error('Erro ao fazer logout:', erro);
            }
          },
          style: 'destructive'
        }
      ]
    );
  };
  
  const navegarParaSolicitacaoPeruca = () => {
    navigation.navigate('SolicitacaoPeruca');
  };
  
  const navegarParaMinhasSolicitacoes = () => {
    navigation.navigate('MinhasSolicitacoes');
  };
  
  const navegarParaMinhasDoacoesCabelo = () => {
    navigation.navigate('MinhasDoacoesCabelo');
  };
  
  const navegarParaRecebimentosCabelo = () => {
    navigation.navigate('RecebimentosCabelo');
  };
  
  const navegarParaCadastrarPeruca = () => {
    navigation.navigate('CadastrarPeruca');
  };
  
  const navegarParaMinhasPerucas = () => {
    navigation.navigate('ListaPerucas');
  };
  
  const navegarParaSolicitacoesPerucaInstituicao = () => {
    navigation.navigate('SolicitacoesPerucaInstituicao');
  };
  
  // Carregar foto de perfil ao montar o componente
  useEffect(() => {
    const carregarFoto = async () => {
      if (usuario) {
        try {
          // Tentar carregar a foto como base64
          const fotoBase64 = await fotoPerfilServico.buscarFotoBase64(usuario.id);
          if (fotoBase64) {
            setFotoPerfil(fotoBase64);
          }
        } catch (error) {
          console.log('Erro ao carregar foto de perfil:', error);
        }
      }
    };
    
    carregarFoto();
  }, [usuario]);
  
  const selecionarImagem = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets[0]) {
        await uploadFoto(result.assets[0]);
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem');
    }
  };
  
  const tirarFoto = async () => {
    try {
      const permissao = await ImagePicker.requestCameraPermissionsAsync();
      
      if (permissao.status !== 'granted') {
        Alert.alert('Permissão negada', 'É necessário permitir o acesso à câmera');
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets[0]) {
        await uploadFoto(result.assets[0]);
      }
    } catch (error) {
      console.error('Erro ao tirar foto:', error);
      Alert.alert('Erro', 'Não foi possível tirar a foto');
    }
  };
  
  const uploadFoto = async (imagem: any) => {
    if (!usuario) return;
    
    setCarregandoFoto(true);
    setModalFotoVisivel(false);
    
    try {
      // Usar upload base64 para evitar problemas de rede
      await fotoPerfilBase64Servico.uploadFotoBase64(usuario.id, imagem);
      
      // Aguardar um momento para o servidor processar
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Recarregar a foto como base64
      const fotoBase64 = await fotoPerfilServico.buscarFotoBase64(usuario.id);
      if (fotoBase64) {
        setFotoPerfil(fotoBase64);
      }
      
      Alert.alert('Sucesso', 'Foto de perfil atualizada!');
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
      Alert.alert('Erro', 'Não foi possível atualizar a foto de perfil');
    } finally {
      setCarregandoFoto(false);
    }
  };
  
  const removerFoto = async () => {
    if (!usuario) return;
    
    Alert.alert(
      'Remover Foto',
      'Tem certeza que deseja remover sua foto de perfil?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            setCarregandoFoto(true);
            setModalFotoVisivel(false);
            
            try {
              await fotoPerfilServico.removerFoto(usuario.id);
              setFotoPerfil(null);
              Alert.alert('Sucesso', 'Foto de perfil removida!');
            } catch (error) {
              console.error('Erro ao remover foto:', error);
              Alert.alert('Erro', 'Não foi possível remover a foto de perfil');
            } finally {
              setCarregandoFoto(false);
            }
          }
        }
      ]
    );
  };
  
  const abrirOpcoesFoto = () => {
    setModalFotoVisivel(true);
  };
  
  return (
    <SafeContainer style={themeStyles.bgBackground}>
      <View style={[themeStyles.bgPrimary, tw.pX4, tw.pY5]}>
        <Row>
          <Text style={[tw.textWhite, tw.textXl, tw.fontBold, tw.mB1]}>
            Meu Perfil
          </Text>

          {ehAdmin() && (
            <View style={[tw.bgYellow500, tw.roundedFull, tw.pX2, { paddingVertical: 2 }, tw.mL2, tw.mB1]}>
              <Text style={[tw.textWhite, tw.textXs, tw.fontBold]}>
                ADMIN
              </Text>
            </View>
          )}
        </Row>
      </View>
      
      <ScrollContainer style={tw.p4}>
        <Card style={tw.mB6}>
          <Row style={tw.mB4}>
            <TouchableOpacity 
              onPress={abrirOpcoesFoto}
              style={[tw.relative, tw.mR4]}
            >
              {carregandoFoto ? (
                <View style={[tw.w20, tw.h20, tw.roundedFull, tw.bgGray200, tw.itemsCenter, tw.justifyCenter]}>
                  <ActivityIndicator size="small" color={themeStyles.color.primary} />
                </View>
              ) : fotoPerfil ? (
                <Image
                  source={{ uri: fotoPerfil }}
                  style={[tw.w20, tw.h20, tw.roundedFull]}
                  defaultSource={require('../../../assets/icon.png')}
                  onError={(error) => {
                    console.log('Erro ao carregar imagem:', error.nativeEvent.error);
                  }}
                  resizeMode="cover"
                />
              ) : (
                <View style={[tw.w20, tw.h20, tw.roundedFull, tw.bgGray200, tw.itemsCenter, tw.justifyCenter]}>
                  <Ionicons name="person" size={36} color="#666" />
                </View>
              )}
              <View style={[tw.absolute, tw.bottom0, tw.right0, tw.bgWhite, tw.rounded, tw.p1, tw.shadow]}>
                <Ionicons name="camera" size={20} color={themeStyles.color.primary} />
              </View>
            </TouchableOpacity>

            <Column>
              <Text style={[themeStyles.textText, tw.textXl, tw.fontBold]}>
                {usuario?.nome}
              </Text>
              <Text style={tw.textGray600}>
                {ehPessoaFisica() ? 'Pessoa Física' :
                 ehInstituicao() ? 'Instituição' : 'Administrador'}
              </Text>
            </Column>

            <TouchableOpacity
              style={tw.p2}
              onPress={() => navigation.navigate('EmConstrucao', { titulo: 'Editar Perfil' })}
            >
              <Ionicons name="pencil" size={20} color="#4EB296" />
            </TouchableOpacity>
          </Row>

          <Row style={tw.mB2}>
            <Ionicons name="mail-outline" size={18} color="#666" />
            <Text style={[tw.textGray600, tw.mL2]}>
              {usuario?.email}
            </Text>
          </Row>
        </Card>
        
        {ehPessoaFisica() && (
          <Card style={tw.mB6}>
            <Titulo>
              Ações Disponíveis
            </Titulo>

            <TouchableOpacity
              style={[tw.flexRow, tw.itemsCenter, tw.pY3, tw.borderB, { borderBottomColor: '#f3f4f6' }]}
              onPress={navegarParaSolicitacaoPeruca}
            >
              <Ionicons name="person-add-outline" size={20} color="#4EB296" />
              <Text style={[themeStyles.textText, tw.mL3]}>
                Solicitar Peruca
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#666" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[tw.flexRow, tw.itemsCenter, tw.pY3, tw.borderB, { borderBottomColor: '#f3f4f6' }]}
              onPress={navegarParaMinhasSolicitacoes}
            >
              <Ionicons name="list-outline" size={20} color="#4EB296" />
              <Text style={[themeStyles.textText, tw.mL3]}>
                Minhas Solicitações
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#666" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[tw.flexRow, tw.itemsCenter, tw.pY3]}
              onPress={navegarParaMinhasDoacoesCabelo}
            >
              <Ionicons name="heart-outline" size={20} color="#4EB296" />
              <Text style={[themeStyles.textText, tw.mL3]}>
                Minhas Doações de Cabelo
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#666" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          </Card>
        )}
        
        {ehInstituicao() && (
          <Card style={tw.mB6}>
            <Titulo>
              Ações Disponíveis
            </Titulo>

            <TouchableOpacity
              style={[tw.flexRow, tw.itemsCenter, tw.pY3, tw.borderB, { borderBottomColor: '#f3f4f6' }]}
              onPress={navegarParaMinhasPerucas}
            >
              <Ionicons name="cut-outline" size={20} color="#4EB296" />
              <Text style={[themeStyles.textText, tw.mL3]}>
                Minhas Perucas
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#666" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[tw.flexRow, tw.itemsCenter, tw.pY3, tw.borderB, { borderBottomColor: '#f3f4f6' }]}
              onPress={navegarParaCadastrarPeruca}
            >
              <Ionicons name="add-circle-outline" size={20} color="#4EB296" />
              <Text style={[themeStyles.textText, tw.mL3]}>
                Cadastrar Nova Peruca
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#666" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[tw.flexRow, tw.itemsCenter, tw.pY3, tw.borderB, { borderBottomColor: '#f3f4f6' }]}
              onPress={navegarParaRecebimentosCabelo}
            >
              <Ionicons name="heart-outline" size={20} color="#4EB296" />
              <Text style={[themeStyles.textText, tw.mL3]}>
                Recebimentos de Cabelo
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#666" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[tw.flexRow, tw.itemsCenter, tw.pY3]}
              onPress={navegarParaSolicitacoesPerucaInstituicao}
            >
              <Ionicons name="clipboard-outline" size={20} color="#4EB296" />
              <Text style={[themeStyles.textText, tw.mL3]}>
                Solicitações de Perucas
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#666" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          </Card>
        )}
        
        <Card style={tw.mB6}>
          <Titulo>
            Configurações
          </Titulo>

          <TouchableOpacity
            style={[tw.flexRow, tw.itemsCenter, tw.pY3, tw.borderB, { borderBottomColor: '#f3f4f6' }]}
            onPress={() => navigation.navigate('EmConstrucao', { titulo: 'Dados Pessoais' })}
          >
            <Ionicons name="person-outline" size={20} color="#4EB296" />
            <Text style={[themeStyles.textText, tw.mL3]}>
              Dados Pessoais
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#666" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[tw.flexRow, tw.itemsCenter, tw.pY3, tw.borderB, { borderBottomColor: '#f3f4f6' }]}
            onPress={() => navigation.navigate('EmConstrucao', { titulo: 'Endereços' })}
          >
            <Ionicons name="location-outline" size={20} color="#4EB296" />
            <Text style={[themeStyles.textText, tw.mL3]}>
              Endereços
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#666" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[tw.flexRow, tw.itemsCenter, tw.pY3, tw.borderB, { borderBottomColor: '#f3f4f6' }]}
            onPress={() => navigation.navigate('EmConstrucao', { titulo: 'Alterar Senha' })}
          >
            <Ionicons name="lock-closed-outline" size={20} color="#4EB296" />
            <Text style={[themeStyles.textText, tw.mL3]}>
              Alterar Senha
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#666" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[tw.flexRow, tw.itemsCenter, tw.pY3, tw.borderB, { borderBottomColor: '#f3f4f6' }]}
            onPress={() => navigation.navigate('EmConstrucao', { titulo: 'Ajuda e Suporte' })}
          >
            <Ionicons name="help-circle-outline" size={20} color="#4EB296" />
            <Text style={[themeStyles.textText, tw.mL3]}>
              Ajuda e Suporte
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#666" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[tw.flexRow, tw.itemsCenter, tw.pY3, tw.borderB, { borderBottomColor: '#f3f4f6' }]}
            onPress={() => navigation.navigate('EmConstrucao', { titulo: 'Política de Privacidade' })}
          >
            <Ionicons name="shield-outline" size={20} color="#4EB296" />
            <Text style={[themeStyles.textText, tw.mL3]}>
              Política de Privacidade
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#666" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          
          {ehAdmin() && (
            <>
              <TouchableOpacity
                style={[tw.flexRow, tw.itemsCenter, tw.pY3, tw.borderT, tw.borderB, { borderTopColor: '#f3f4f6', borderBottomColor: '#f3f4f6' }, tw.mT2]}
                onPress={() => navigation.navigate('EmConstrucao', { titulo: 'Listar Usuários' })}
              >
                <Ionicons name="people" size={20} color="#FF9500" />
                <Text style={[themeStyles.textText, tw.mL3, tw.fontMedium]}>
                  Listar Todos os Usuários
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#666" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[tw.flexRow, tw.itemsCenter, tw.pY3, tw.borderB, { borderBottomColor: '#f3f4f6' }]}
                onPress={() => navigation.navigate('EmConstrucao', { titulo: 'Gerenciar Solicitações' })}
              >
                <Ionicons name="clipboard" size={20} color="#FF9500" />
                <Text style={[themeStyles.textText, tw.mL3, tw.fontMedium]}>
                  Gerenciar Solicitações
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#666" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[tw.flexRow, tw.itemsCenter, tw.pY3]}
                onPress={() => navigation.navigate('EmConstrucao', { titulo: 'Logs do Sistema' })}
              >
                <Ionicons name="server" size={20} color="#FF9500" />
                <Text style={[themeStyles.textText, tw.mL3, tw.fontMedium]}>
                  Logs do Sistema
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#666" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            </>
          )}
        </Card>

        <Botao
          titulo="Sair"
          onPress={handleLogout}
          variante="danger"
          larguraTotal
          style={tw.mB8}
        />

        <View style={tw.h10} />
      </ScrollContainer>
      
      <Modal
        visible={modalFotoVisivel}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalFotoVisivel(false)}
      >
        <TouchableOpacity 
          style={[tw.flex1, tw.bgBlack, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
          activeOpacity={1}
          onPress={() => setModalFotoVisivel(false)}
        >
          <View style={[tw.absolute, tw.bottom0, tw.left0, tw.right0, tw.bgWhite, tw.roundedTLg, tw.roundedTr]}>
            <View style={[tw.p6]}>
              <Text style={[tw.textCenter, tw.textLg, tw.fontBold, tw.mB4]}>
                Foto de Perfil
              </Text>
              
              <TouchableOpacity
                style={[tw.flexRow, tw.itemsCenter, tw.pY3]}
                onPress={() => {
                  setModalFotoVisivel(false);
                  tirarFoto();
                }}
              >
                <Ionicons name="camera" size={24} color={themeStyles.color.primary} />
                <Text style={[tw.mL3, tw.textBase]}>Tirar Foto</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[tw.flexRow, tw.itemsCenter, tw.pY3]}
                onPress={() => {
                  setModalFotoVisivel(false);
                  selecionarImagem();
                }}
              >
                <Ionicons name="images" size={24} color={themeStyles.color.primary} />
                <Text style={[tw.mL3, tw.textBase]}>Escolher da Galeria</Text>
              </TouchableOpacity>
              
              {fotoPerfil && (
                <TouchableOpacity
                  style={[tw.flexRow, tw.itemsCenter, tw.pY3]}
                  onPress={removerFoto}
                >
                  <Ionicons name="trash" size={24} color="#ef4444" />
                  <Text style={[tw.mL3, tw.textBase, { color: '#ef4444' }]}>Remover Foto</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[tw.mT4, tw.pY3]}
                onPress={() => setModalFotoVisivel(false)}
              >
                <Text style={[tw.textCenter, tw.textBase, tw.textGray500]}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeContainer>
  );
};

export default PerfilTela;