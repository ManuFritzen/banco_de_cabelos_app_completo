import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, Dimensions, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import tw from '../../styles/tailwind';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { publicacoesServico } from '../../servicos/api/publicacoes';
import { useAutenticacao } from '../../contextos/AutenticacaoContexto';
import curtidasServico from '../../servicos/api/curtidas';
import { fotoPerfilServico } from '../../servicos/api/fotoPerfil';

interface Comentario {
  id: number;
  conteudo: string;
  data_hora: string;
  usuario: {
    id: number;
    nome: string;
  };
}

interface Anexo {
  id: number;
  publicacao_id: number;
  url?: string;
  carregando?: boolean;
}

interface Publicacao {
  id: number;
  titulo: string;
  conteudo: string;
  data_hora: string;
  qtd_curtidas: number;
  curtiu?: boolean; // Novo campo para indicar se o usuário curtiu
  usuario: {
    id: number;
    nome: string;
    tipo: string;
  };
  comentarios?: Comentario[];
  comentarios_count?: number; // Campo explícito para contagem de comentários
  comentariosCount?: number;  // Campo alternativo que pode vir do backend
  anexos?: Anexo[];
}

interface CardPublicacaoProps {
  publicacao: Publicacao;
  exibirCompleto?: boolean;
  onDelete?: (publicacaoId: number) => void;
  onCurtidaChange?: (publicacaoId: number, curtiu: boolean, qtdCurtidas: number) => void;
}

const CardPublicacao: React.FC<CardPublicacaoProps> = ({
  publicacao,
  exibirCompleto = false,
  onDelete,
  onCurtidaChange,
}) => {
  // Verifica se a publicação é válida
  if (!publicacao || !publicacao.usuario) {
    console.error('Publicação inválida ou usuário undefined:', publicacao);
    return null; // Não renderiza nada se a publicação for inválida
  }

  // Função auxiliar para obter a contagem de comentários de forma confiável
  const getComentariosCount = (pub: Publicacao): number => {
    // Verificar todas as possíveis propriedades onde a contagem pode estar
    // Prioridade: comentarios_count explícito > propriedades dinâmicas > length do array > 0

    // Importante: se comentarios_count estiver presente com número, usar esse valor
    if (typeof pub.comentarios_count === 'number') {
      return pub.comentarios_count;
    }

    // @ts-ignore - Verificar propriedade dinâmica que pode vir do backend
    if (typeof pub.comentariosCount === 'number') {
      // @ts-ignore
      return pub.comentariosCount;
    }

    // Se tiver array de comentários, usar o tamanho
    if (pub.comentarios && Array.isArray(pub.comentarios)) {
      return pub.comentarios.length;
    }

    return 0;
  }

  const navigation = useNavigation<any>();
  const { usuario } = useAutenticacao();
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [carregandoAnexos, setCarregandoAnexos] = useState(false);
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [jaCurtiu, setJaCurtiu] = useState(publicacao.curtiu || false);
  const [qtdCurtidas, setQtdCurtidas] = useState(publicacao.qtd_curtidas || 0);
  const [carregandoCurtida, setCarregandoCurtida] = useState(false);
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  const { width } = Dimensions.get('window');
  

  // Verifica se o usuário logado é o dono da publicação ou um administrador
  const { ehAdmin } = useAutenticacao();
  const ehDonoDaPublicacao = usuario?.id === publicacao.usuario?.id;
  const podeEditar = ehDonoDaPublicacao;
  const podeExcluir = ehDonoDaPublicacao || ehAdmin();
  
  // Função para mesclar estilos
  const mergeStyles = (...styles: any[]) => {
    return StyleSheet.flatten(styles.filter(Boolean));
  };
  
  const navegarParaComentarios = () => {
    navigation.navigate('DetalhesPublicacao', { publicacaoId: publicacao.id });
  };

  const navegarParaDetalhes = () => {
    navigation.navigate('DetalhesPublicacao', { publicacaoId: publicacao.id });
  };
  
  const editarPublicacao = () => {
    Alert.alert(
      'Editar Publicação',
      'Deseja editar esta publicação?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Editar', 
          onPress: () => {
            navigation.navigate('EditarPublicacao', { publicacaoId: publicacao.id });
          } 
        }
      ]
    );
  };
  
  const excluirPublicacao = () => {
    const ehAdminExcluindoPublicacaoDeOutro = ehAdmin() && !ehDonoDaPublicacao;
    const titulo = ehAdminExcluindoPublicacaoDeOutro 
      ? 'Excluir Publicação (Administrador)' 
      : 'Excluir Publicação';
    
    const mensagem = ehAdminExcluindoPublicacaoDeOutro
      ? `Você está prestes a excluir uma publicação como administrador. Esta publicação pertence a ${publicacao.usuario.nome}. Tem certeza que deseja continuar? Esta ação não pode ser desfeita.`
      : 'Tem certeza que deseja excluir esta publicação? Esta ação não pode ser desfeita.';
    
    Alert.alert(
      titulo,
      mensagem,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
              await publicacoesServico.excluirPublicacao(publicacao.id);
              
              const mensagemSucesso = ehAdminExcluindoPublicacaoDeOutro
                ? 'Publicação excluída com sucesso pelo administrador!'
                : 'Publicação excluída com sucesso!';
              
              Alert.alert(
                'Sucesso', 
                mensagemSucesso
              );
              
              if (onDelete) {
                onDelete(publicacao.id);
              }
            } catch (erro) {
              console.error('Erro ao excluir publicação:', erro);
              Alert.alert('Erro', 'Não foi possível excluir a publicação. Tente novamente.');
            }
          } 
        }
      ]
    );
  };
  
  useEffect(() => {
    setJaCurtiu(publicacao.curtiu || false);
    setQtdCurtidas(publicacao.qtd_curtidas || 0);
  }, [publicacao.id, publicacao.curtiu, publicacao.qtd_curtidas, usuario]);
  
  // Carregar foto de perfil do autor da publicação
  useEffect(() => {
    const carregarFotoPerfil = async () => {
      if (publicacao.usuario.id) {
        const urlFoto = await fotoPerfilServico.obterUrlFotoAsync(publicacao.usuario.id);
        setFotoPerfil(urlFoto);
      }
    };
    
    carregarFotoPerfil();
  }, [publicacao.usuario.id]);

  useEffect(() => {
    const buscarAnexos = async () => {
      if (publicacao.id) {
        try {
          setCarregandoAnexos(true);
          
          if (publicacao.anexos && publicacao.anexos.length > 0) {
            const anexosComURL = publicacao.anexos.map(anexo => ({
              id: anexo.id,
              publicacao_id: anexo.publicacao_id || publicacao.id,
              url: `${publicacoesServico.getBaseURL().replace('/api', '')}/api/anexos/${anexo.id}`,
              carregando: false
            }));
            
            setAnexos(anexosComURL);
          } else {
            try {
              const resposta = await publicacoesServico.listarAnexos(publicacao.id);
              
              if (resposta.data && resposta.data.data && resposta.data.data.length > 0) {
                setAnexos(resposta.data.data.map((anexo: any) => ({
                  id: anexo.id,
                  publicacao_id: anexo.publicacao_id,
                  carregando: true
                })));
                
                const anexosComURL = await Promise.all(
                  resposta.data.data.map(async (anexo: any) => {
                    try {
                      return {
                        id: anexo.id,
                        publicacao_id: anexo.publicacao_id,
                        url: `${publicacoesServico.getBaseURL().replace('/api', '')}/api/anexos/${anexo.id}`,
                        carregando: false
                      };
                    } catch (erro) {
                      return {
                        id: anexo.id,
                        publicacao_id: anexo.publicacao_id,
                        carregando: false
                      };
                    }
                  })
                )
                
                setAnexos(anexosComURL);
              } else {
                setAnexos([]);
              }
            } catch (erro) {
              console.log('Anexos não encontrados para a publicação:', publicacao.id);
              setAnexos([]);
            }
          }
        } catch (erro) {
          console.error('Erro ao processar anexos:', erro);
          setAnexos([]);
        } finally {
          setCarregandoAnexos(false);
        }
      }
    };
    
    buscarAnexos();
  }, [publicacao.id]);
  
  const alternarCurtida = async () => {
    if (!usuario) {
      Alert.alert('Atenção', 'Você precisa estar logado para curtir uma publicação!');
      return;
    }
    
    if (carregandoCurtida) return;
    
    try {
      setCarregandoCurtida(true);
      
      
      if (jaCurtiu) {
        await curtidasServico.descurtirPublicacao(publicacao.id);
        const novaCurtida = false;
        const novaQtd = Math.max(0, qtdCurtidas - 1);
        setJaCurtiu(novaCurtida);
        setQtdCurtidas(novaQtd);
        
        // Notificar mudança
        if (onCurtidaChange) {
          onCurtidaChange(publicacao.id, novaCurtida, novaQtd);
        }
      } else {
        await curtidasServico.curtirPublicacao(publicacao.id);
        const novaCurtida = true;
        const novaQtd = qtdCurtidas + 1;
        setJaCurtiu(novaCurtida);
        setQtdCurtidas(novaQtd);
        
        // Notificar mudança
        if (onCurtidaChange) {
          onCurtidaChange(publicacao.id, novaCurtida, novaQtd);
        }
      }
    } catch (erro: any) {
      console.error('Erro ao alternar curtida:', erro);
      
      // O interceptador global vai cuidar de erros 401
      if (erro.response?.data?.message) {
        Alert.alert('Erro', erro.response.data.message);
      } else {
        Alert.alert('Erro', 'Não foi possível processar sua curtida. Tente novamente.');
      }
    } finally {
      setCarregandoCurtida(false);
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
  
  const conteudoExibir = exibirCompleto 
    ? publicacao.conteudo 
    : publicacao.conteudo.length > 150 
      ? publicacao.conteudo.substring(0, 150) + '...' 
      : publicacao.conteudo;
  
  return (
    <View style={[tw.bgWhite, tw.roundedLg, tw.shadow, tw.p4, tw.mB4]}>
      <View style={[tw.flexRow, tw.itemsCenter, tw.mB2]}>
        {fotoPerfil ? (
          <Image
            source={{ uri: fotoPerfil }}
            style={[tw.w10, tw.h10, tw.roundedFull, tw.mR2]}
            defaultSource={require('../../../assets/icon.png')}
          />
        ) : (
          <View style={[tw.w10, tw.h10, tw.roundedFull, { backgroundColor: '#e5e7eb' }, tw.mR2, tw.itemsCenter, tw.justifyCenter]}>
            <Ionicons name="person" size={20} color="#666" />
          </View>
        )}
        
        <View style={tw.flex1}>
          <View style={[tw.flexRow, tw.justifyBetween, tw.itemsCenter]}>
            <Text style={[tw.fontBold, tw.textBase]}>
              {publicacao.usuario.nome}
            </Text>
            <Text style={[tw.textXs, { color: '#6b7280' }]}>
              {formatarData(publicacao.data_hora)}
            </Text>
          </View>
          <Text style={[tw.textXs, { color: '#6b7280' }]}>
            {publicacao.usuario.tipo === 'F' ? 'Pessoa Física' : 
             publicacao.usuario.tipo === 'J' ? 'Instituição' : 'Administrador'}
          </Text>
        </View>
      </View>

      <View style={[tw.flexRow, tw.justifyBetween, tw.itemsCenter, tw.mB2]}>
        <Text style={[tw.textLg, tw.fontBold, tw.flex1]}>
          {publicacao.titulo}
        </Text>

        {(podeEditar || podeExcluir) && (
          <View style={[tw.flexRow, tw.mL2]}>
            {podeEditar && (
              <TouchableOpacity 
                onPress={editarPublicacao}
                style={tw.mL2}
              >
                <Ionicons name="create-outline" size={20} color="#4EB296" />
              </TouchableOpacity>
            )}
          
            {podeExcluir && (
              <TouchableOpacity 
                onPress={excluirPublicacao}
                style={tw.mL2}
              >
                <Ionicons name="trash-outline" size={20} color="#F87171" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
      
      <Text style={[{ color: '#374151' }, tw.mB3]}>
        {conteudoExibir}
      </Text>
      
      {!exibirCompleto && publicacao.conteudo.length > 150 && (
        <TouchableOpacity onPress={() => navigation.navigate('DetalhesPublicacao', { publicacaoId: publicacao.id })}>
          <Text style={[{ color: '#2563EB' }, tw.fontMedium, tw.mB2]}>
            Ler mais...
          </Text>
        </TouchableOpacity>
      )}
      
      {carregandoAnexos ? (
        <View style={[tw.itemsCenter, tw.justifyCenter, { height: 192 }, { backgroundColor: '#f9fafb' }, tw.roundedLg, tw.mB3]}>
          <ActivityIndicator size="large" color="#4EB296" />
          <Text style={[{ color: '#6b7280' }, tw.mT2]}>Carregando imagens...</Text>
        </View>
      ) : anexos.length > 0 ? (
        <View style={tw.mB3}>
          <View style={[tw.wFull, { height: 192 }, tw.roundedLg, tw.overflowHidden, tw.relative]}>
            {anexos[indiceAtual]?.url ? (
              <Image
                source={{ uri: anexos[indiceAtual].url }}
                style={[tw.wFull, tw.hFull, tw.roundedLg]}
                resizeMode="cover"
              />
            ) : (
              <View style={[tw.wFull, tw.hFull, { backgroundColor: '#f9fafb' }, tw.roundedLg, tw.itemsCenter, tw.justifyCenter]}>
                <Ionicons name="image-outline" size={48} color="#CCCCCC" />
                <Text style={[{ color: '#9ca3af' }, tw.mT2]}>
                  Erro ao carregar imagem
                </Text>
              </View>
            )}
            
            {anexos.length > 1 && (
              <>
                {indiceAtual > 0 && (
                  <TouchableOpacity
                    style={[
                      tw.absolute, 
                      { left: 8 }, 
                      { top: '50%' }, 
                      { backgroundColor: 'rgba(255, 255, 255, 0.8)' }, 
                      tw.roundedFull, 
                      tw.p1, 
                      { zIndex: 10 },
                      { transform: [{ translateY: -15 }] }
                    ]}
                    onPress={() => setIndiceAtual(indiceAtual - 1)}
                  >
                    <Ionicons name="chevron-back" size={24} color="#333" />
                  </TouchableOpacity>
                )}
                
                {indiceAtual < anexos.length - 1 && (
                  <TouchableOpacity
                    style={[
                      tw.absolute, 
                      { right: 8 }, 
                      { top: '50%' }, 
                      { backgroundColor: 'rgba(255, 255, 255, 0.8)' }, 
                      tw.roundedFull, 
                      tw.p1, 
                      { zIndex: 10 },
                      { transform: [{ translateY: -15 }] }
                    ]}
                    onPress={() => setIndiceAtual(indiceAtual + 1)}
                  >
                    <Ionicons name="chevron-forward" size={24} color="#333" />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
          
          {anexos.length > 1 && (
            <View style={[tw.flexRow, tw.justifyCenter, tw.mT2]}>
              {anexos.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setIndiceAtual(index)}
                  activeOpacity={0.7}
                  style={[tw.pX1, tw.pY2]}
                >
                  <View
                    style={[
                      { height: 8 }, 
                      { width: 8 }, 
                      tw.roundedFull,
                      index === indiceAtual 
                        ? { backgroundColor: '#4EB296' } 
                        : { backgroundColor: '#d1d5db' }
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      ) : null}
      
      <View style={[tw.flexRow, tw.justifyBetween, tw.itemsCenter, tw.mT2, tw.pT2, { borderTopWidth: 1, borderTopColor: '#e5e7eb' }]}>
        <TouchableOpacity 
          style={[tw.flexRow, tw.itemsCenter]} 
          onPress={alternarCurtida}
          disabled={carregandoCurtida}
        >
          {carregandoCurtida ? (
            <ActivityIndicator size="small" color="#F87171" style={{ width: 16, height: 16 }} />
          ) : (
            <Ionicons 
              name={jaCurtiu ? "heart" : "heart-outline"} 
              size={16} 
              color="#F87171" 
            />
          )}
          <Text style={[tw.mL1, { color: '#4b5563' }, tw.textSm]}>
            {qtdCurtidas} curtidas
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[tw.flexRow, tw.itemsCenter]}
          onPress={() => navigation.navigate('DetalhesPublicacao', { publicacaoId: publicacao.id })}
        >
          <Ionicons name="chatbubble-outline" size={16} color="#6B7280" />
          <Text style={[tw.mL1, { color: '#4b5563' }, tw.textSm]}>
            {getComentariosCount(publicacao)} comentários
          </Text>
        </TouchableOpacity>
      </View>
      
      {exibirCompleto && publicacao.comentarios && publicacao.comentarios.length > 0 &&
        publicacao.comentarios[0]?.conteudo && (
        <View style={[tw.mT4, tw.pT2, { borderTopWidth: 1, borderTopColor: '#e5e7eb' }]}>
          <Text style={[tw.fontBold, tw.textSm, tw.mB2]}>
            Comentários
          </Text>

          {publicacao.comentarios.map((comentario) =>
            comentario && comentario.usuario ? (
              <View key={comentario.id} style={[tw.mB3, { backgroundColor: '#f9fafb' }, tw.p2, tw.rounded]}>
                <View style={[tw.flexRow, tw.justifyBetween]}>
                  <Text style={[tw.fontBold, tw.textSm]}>
                    {comentario.usuario.nome}
                  </Text>
                  <Text style={[tw.textXs, { color: '#6b7280' }]}>
                    {formatarData(comentario.data_hora)}
                  </Text>
                </View>
                <Text style={[{ color: '#374151' }, tw.textSm]}>
                  {comentario.conteudo}
                </Text>
              </View>
            ) : null
          )}
        </View>
      )}
    </View>
  );
};

export default CardPublicacao;