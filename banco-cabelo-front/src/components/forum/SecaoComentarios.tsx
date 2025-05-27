import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { comentariosServico, Comentario, DadosComentario } from '../../servicos/api/comentarios';
import { useAutenticacao } from '../../contextos/AutenticacaoContexto';
import tw from '../../styles/tailwind';
import themeStyles from '../../styles/theme';
import curtidasServico from '../../servicos/api/curtidas';
import { useNavigation } from '@react-navigation/native';
import { fotoPerfilServico } from '../../servicos/api/fotoPerfil';
import { Image } from 'react-native';

interface SecaoComentariosProps {
  publicacaoId: number;
  atualizarContagem?: (quantidade: number) => void;
}

const esquemaValidacao = Yup.object().shape({
  conteudo: Yup.string()
    .required('O comentário não pode estar vazio')
    .min(1, 'O comentário está muito curto')
    .max(1000, 'O comentário está muito longo (máximo 1000 caracteres)')
});

const SecaoComentarios: React.FC<SecaoComentariosProps> = ({ publicacaoId, atualizarContagem }) => {
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [curtidasLoading, setCurtidasLoading] = useState<{ [key: number]: boolean }>({});
  const [fotosPerfil, setFotosPerfil] = useState<{ [key: number]: string }>({});
  const { usuario } = useAutenticacao();

  useEffect(() => {
    carregarComentarios();
  }, [publicacaoId, paginaAtual]);

  const carregarComentarios = async () => {
    setCarregando(true);
    try {
      const resposta = await comentariosServico.listarComentariosPorPublicacao(publicacaoId, paginaAtual);

      if (paginaAtual === 1) {
        setComentarios(resposta.data.data);
      } else {
        setComentarios(prev => [...prev, ...resposta.data.data]);
      }

      setTotalPaginas(resposta.data.totalPages);

      // Agendar a atualização da contagem para o próximo ciclo
      const totalComentarios = resposta.data.count || resposta.data.data.length;
      if (atualizarContagem) {
        console.log('Total de comentários da API:', totalComentarios);
        // Usar setTimeout para evitar atualização durante render
        setTimeout(() => {
          atualizarContagem(totalComentarios);
        }, 0);
      }
      
      // Carregar fotos de perfil dos comentários
      const comentariosNovos = resposta.data.data;
      for (const comentario of comentariosNovos) {
        if (comentario.usuario.id && !fotosPerfil[comentario.usuario.id]) {
          const urlFoto = await fotoPerfilServico.obterUrlFotoAsync(comentario.usuario.id);
          setFotosPerfil(prev => ({ ...prev, [comentario.usuario.id]: urlFoto }));
        }
      }
    } catch (erro) {
      console.error('Erro ao carregar comentários:', erro);
      Alert.alert('Erro', 'Não foi possível carregar os comentários. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  const handleEnviarComentario = async (values: DadosComentario, { resetForm }: any) => {
    if (!usuario) {
      Alert.alert('Atenção', 'Você precisa estar logado para comentar.');
      return;
    }

    setEnviandoComentario(true);

    try {
      const resposta = await comentariosServico.criarComentario(publicacaoId, values);

      // Adicionar o novo comentário ao início da lista
      const novoComentario = resposta.data.data;
      setComentarios(prev => {
        const novosComentarios = [novoComentario, ...prev];

        // Atualizar a contagem se o callback existir
        if (atualizarContagem) {
          console.log('Adicionando comentário, nova quantidade:', novosComentarios.length);
          atualizarContagem(novosComentarios.length);

          // Marcar que houve mudanças para atualizar a tela principal
          AsyncStorage.setItem('comment_changes', JSON.stringify({
            publicacaoId,
            count: novosComentarios.length,
            timestamp: new Date().toISOString()
          }));
        }

        return novosComentarios;
      });
      
      // Adicionar foto de perfil do novo comentário
      if (novoComentario.usuario.id && !fotosPerfil[novoComentario.usuario.id]) {
        const urlFoto = await fotoPerfilServico.obterUrlFotoAsync(novoComentario.usuario.id);
        setFotosPerfil(prev => ({ ...prev, [novoComentario.usuario.id]: urlFoto }));
      }

      // Limpar o formulário
      resetForm();
    } catch (erro: any) {
      console.error('Erro ao enviar comentário:', erro);

      const mensagemErro = erro.response?.data?.message || 'Não foi possível enviar o comentário. Tente novamente.';
      Alert.alert('Erro', mensagemErro);
    } finally {
      setEnviandoComentario(false);
    }
  };

  const handleExcluirComentario = async (comentarioId: number) => {
    Alert.alert(
      'Excluir Comentário',
      'Tem certeza que deseja excluir este comentário?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await comentariosServico.excluirComentario(comentarioId);

              // Remover o comentário excluído da lista
              setComentarios(prev => {
                const comentariosRestantes = prev.filter(c => c.id !== comentarioId);

                // Atualizar a contagem se o callback existir
                if (atualizarContagem) {
                  console.log('Removendo comentário, nova quantidade:', comentariosRestantes.length);
                  atualizarContagem(comentariosRestantes.length);

                  // Marcar que houve mudanças para atualizar a tela principal
                  AsyncStorage.setItem('comment_changes', JSON.stringify({
                    publicacaoId,
                    count: comentariosRestantes.length,
                    timestamp: new Date().toISOString()
                  }));
                }

                return comentariosRestantes;
              });

            } catch (erro: any) {
              console.error('Erro ao excluir comentário:', erro);
              const mensagemErro = erro.response?.data?.message || 'Não foi possível excluir o comentário. Tente novamente.';
              Alert.alert('Erro', mensagemErro);
            }
          }
        }
      ]
    );
  };

  const handleCurtirComentario = async (comentarioId: number) => {
    if (!usuario) {
      Alert.alert('Atenção', 'Você precisa estar logado para curtir um comentário.');
      return;
    }
    
    // Prevenir múltiplos cliques
    if (curtidasLoading[comentarioId]) return;
    
    try {
      setCurtidasLoading(prev => ({ ...prev, [comentarioId]: true }));
      
      // Encontrar o comentário atual
      const comentario = comentarios.find(c => c.id === comentarioId);
      if (!comentario) return;
      
      // Alternar curtida
      if (comentario.curtiu) {
        await curtidasServico.descurtirComentario(comentarioId);
        
        // Atualizar o estado local
        setComentarios(prev => 
          prev.map(c => 
            c.id === comentarioId 
              ? { ...c, curtiu: false, qtd_curtidas: Math.max(0, c.qtd_curtidas - 1) } 
              : c
          )
        );
      } else {
        await curtidasServico.curtirComentario(comentarioId);
        
        // Atualizar o estado local
        setComentarios(prev => 
          prev.map(c => 
            c.id === comentarioId 
              ? { ...c, curtiu: true, qtd_curtidas: c.qtd_curtidas + 1 } 
              : c
          )
        );
      }
    } catch (erro: any) {
      console.error('Erro ao curtir comentário:', erro);
      
      // O interceptador global vai cuidar de erros 401
      if (erro.response?.data?.message) {
        Alert.alert('Erro', erro.response.data.message);
      } else {
        Alert.alert('Erro', 'Não foi possível processar sua curtida. Tente novamente.');
      }
    } finally {
      setCurtidasLoading(prev => ({ ...prev, [comentarioId]: false }));
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

  const renderComentario = ({ item }: { item: Comentario }) => {
    if (!item) return null; // Proteção para itens vazios ou inválidos

    // Verifica se o usuário pode excluir o comentário (dono do comentário ou admin)
    const podeExcluir = usuario && (
      (item.usuario_id && usuario.id === item.usuario_id) ||
      usuario.tipo === 'A'
    );

    return (
      <View style={[tw.mB3, { backgroundColor: '#f9fafb' }, tw.p3, tw.rounded]}>
        <View style={[tw.flexRow, tw.itemsCenter, tw.mB1]}>
          <View style={tw.flexRow}>
            {fotosPerfil[item.usuario.id] ? (
              <Image
                source={{ uri: fotosPerfil[item.usuario.id] }}
                style={[tw.w8, tw.h8, tw.roundedFull, tw.mR2]}
                defaultSource={require('../../../assets/icon.png')}
              />
            ) : (
              <View style={[tw.w8, tw.h8, tw.roundedFull, { backgroundColor: '#e5e7eb' }, tw.mR2, tw.itemsCenter, tw.justifyCenter]}>
                <Ionicons name="person" size={16} color="#666" />
              </View>
            )}
            <View style={tw.flex1}>
              <View style={[tw.flexRow, tw.justifyBetween, tw.itemsCenter]}>
                <Text style={[tw.fontBold, tw.textSm]}>
                  {item.usuario?.nome || 'Usuário'}
                </Text>
                <Text style={[tw.textXs, { color: '#6b7280' }]}>
                  {formatarData(item.data_hora)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={[{ color: '#374151' }, tw.textSm, tw.mB2]}>
          {item.conteudo}
        </Text>

        <View style={[tw.flexRow, tw.justifyBetween, tw.itemsCenter]}>
          <TouchableOpacity
            style={[tw.flexRow, tw.itemsCenter]}
            onPress={() => handleCurtirComentario(item.id)}
            disabled={curtidasLoading[item.id]}
          >
            {curtidasLoading[item.id] ? (
              <ActivityIndicator size="small" color="#F87171" style={{ width: 14, height: 14 }} />
            ) : (
              <Ionicons 
                name={item.curtiu ? "heart" : "heart-outline"} 
                size={14} 
                color="#F87171" 
              />
            )}
            <Text style={[tw.mL1, { color: '#6b7280' }, tw.textXs]}>
              {item.qtd_curtidas} curtidas
            </Text>
          </TouchableOpacity>

          {podeExcluir && (
            <TouchableOpacity
              onPress={() => handleExcluirComentario(item.id)}
              style={[tw.flexRow, tw.itemsCenter]}
            >
              <Ionicons name="trash-outline" size={14} color="#F87171" />
              <Text style={[tw.mL1, { color: '#6b7280' }, tw.textXs]}>
                Excluir
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const carregarMaisComentarios = () => {
    if (paginaAtual < totalPaginas) {
      setPaginaAtual(prevPage => prevPage + 1);
    }
  };

  return (
    <View style={[tw.mT4]}>
      <Text style={[tw.fontBold, tw.textBase, tw.mB4]}>
        Comentários
      </Text>
      
      <Formik
        initialValues={{ conteudo: '' }}
        validationSchema={esquemaValidacao}
        onSubmit={handleEnviarComentario}
      >
        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
          <View style={[tw.mB4]}>
            <View style={[
              tw.flexRow, 
              tw.mB1, 
              tw.border, 
              tw.roundedLg, 
              tw.pX3, 
              tw.pY2,
              errors.conteudo && touched.conteudo ? { borderColor: '#F87171' } : { borderColor: '#d1d5db' }
            ]}>
              <TextInput
                style={[tw.flex1, { color: '#1F2937' }]}
                placeholder="Escreva um comentário..."
                multiline
                numberOfLines={2}
                value={values.conteudo}
                onChangeText={handleChange('conteudo')}
                onBlur={handleBlur('conteudo')}
                placeholderTextColor="#A0A0A0"
              />
              <TouchableOpacity
                onPress={() => handleSubmit()}
                disabled={enviandoComentario}
                style={[tw.selfEnd, tw.p2]}
              >
                {enviandoComentario ? (
                  <ActivityIndicator size="small" color={themeStyles.color.primary} />
                ) : (
                  <Ionicons name="send" size={20} color={themeStyles.color.primary} />
                )}
              </TouchableOpacity>
            </View>
            
            {errors.conteudo && touched.conteudo && (
              <Text style={[{ color: '#F87171' }, tw.textXs, tw.mL1]}>
                {errors.conteudo}
              </Text>
            )}
          </View>
        )}
      </Formik>
      
      {carregando && paginaAtual === 1 ? (
        <View style={[tw.itemsCenter, tw.justifyCenter, tw.pY4]}>
          <ActivityIndicator size="small" color={themeStyles.color.primary} />
        </View>
      ) : comentarios.length > 0 ? (
        <FlatList
          data={comentarios}
          renderItem={renderComentario}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false} // Desabilita o scroll interno, usa o scroll da tela pai
          ListFooterComponent={
            paginaAtual < totalPaginas ? (
              <TouchableOpacity
                style={[tw.pY3, tw.itemsCenter]}
                onPress={carregarMaisComentarios}
              >
                {carregando ? (
                  <ActivityIndicator size="small" color={themeStyles.color.primary} />
                ) : (
                  <Text style={[{ color: themeStyles.color.primary }, tw.fontMedium]}>
                    Carregar mais comentários
                  </Text>
                )}
              </TouchableOpacity>
            ) : null
          }
        />
      ) : (
        <View style={[tw.itemsCenter, tw.justifyCenter, tw.pY4, tw.bgGray100, tw.roundedLg]}>
          <Ionicons name="chatbubble-outline" size={24} color="#9CA3AF" />
          <Text style={[tw.textGray500, tw.mT2]}>
            Seja o primeiro a comentar
          </Text>
        </View>
      )}
    </View>
  );
};

export default SecaoComentarios;