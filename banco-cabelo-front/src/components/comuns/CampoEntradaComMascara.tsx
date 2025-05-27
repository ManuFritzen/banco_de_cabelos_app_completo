import React, { useCallback, useState } from 'react';
import { useField } from 'formik';
import CampoEntrada from './CampoEntrada';
import { mascaraCPF, mascaraCNPJ, mascaraTelefone, apenasNumeros } from '../../servicos/util/mascaraUtil';
import { autenticacaoServico } from '../../servicos/api/autenticacao';

type TipoMascara = 'cpf' | 'cnpj' | 'telefone';

interface CampoEntradaComMascaraProps {
  name: string;
  label?: string;
  placeholder?: string;
  tipoMascara: TipoMascara;
  verificarUnico?: boolean; // Flag para indicar se deve verificar duplicidade
  style?: object;
  labelStyle?: object;
  inputStyle?: object;
  mensagemErroStyle?: object;
}


const CampoEntradaComMascara: React.FC<CampoEntradaComMascaraProps> = ({
  name,
  label,
  placeholder,
  tipoMascara,
  verificarUnico = false,
  style,
  labelStyle,
  inputStyle,
  mensagemErroStyle,
  ...props
}) => {
  const [field, meta, helpers] = useField(name);
  const [verificando, setVerificando] = useState(false);
  
  // Define o tipo de teclado com base no tipo da máscara
  const keyboardType = 'numeric';
  
  // Função que aplica a máscara adequada com base no tipo
  const aplicarMascara = useCallback((texto: string): string => {
    switch (tipoMascara) {
      case 'cpf':
        return mascaraCPF(texto);
      case 'cnpj':
        return mascaraCNPJ(texto);
      case 'telefone':
        return mascaraTelefone(texto);
      default:
        return texto;
    }
  }, [tipoMascara]);
  
  // Função que responde à mudança de texto, aplicando a máscara
  const handleChangeText = useCallback((texto: string) => {
    // Aplica a máscara
    const textoFormatado = aplicarMascara(texto);
    
    // Limpa erros de unicidade anteriores se o valor mudou
    if (meta.error && meta.error.includes('já está cadastrado') && field.value !== textoFormatado) {
      helpers.setError('');
    }
    
    // Atualiza o valor no Formik
    helpers.setValue(textoFormatado);
  }, [aplicarMascara, helpers, meta.error, field.value]);
  
  // Função para verificar se o valor já existe no sistema
  const verificarValorUnico = useCallback(async (valor: string) => {
    if (!valor || !verificarUnico) return;
    
    // Extrair apenas os números para verificação
    const apenasDigitos = apenasNumeros(valor);
    
    // Verificar se tem tamanho mínimo e mostrar mensagem de erro local
    if (tipoMascara === 'cpf') {
      if (apenasDigitos.length !== 11) {
        if (apenasDigitos.length > 0) {
          helpers.setError('CPF inválido. Deve conter 11 dígitos numéricos.');
        }
        return;
      }
      
      // Validação simples de CPF - dígitos não podem ser todos iguais
      const todosDigitosIguais = apenasDigitos.split('').every(d => d === apenasDigitos[0]);
      if (todosDigitosIguais) {
        helpers.setError('CPF inválido. Os dígitos não podem ser todos iguais.');
        return;
      }
    }
    
    if (tipoMascara === 'cnpj') {
      if (apenasDigitos.length !== 14) {
        if (apenasDigitos.length > 0) {
          helpers.setError('CNPJ inválido. Deve conter 14 dígitos numéricos.');
        }
        return;
      }
      
      // Validação simples de CNPJ - dígitos não podem ser todos iguais
      const todosDigitosIguais = apenasDigitos.split('').every(d => d === apenasDigitos[0]);
      if (todosDigitosIguais) {
        helpers.setError('CNPJ inválido. Os dígitos não podem ser todos iguais.');
        return;
      }
    }
    
    setVerificando(true);
    try {
      let jaExiste = false;
      
      // Verificar com base no tipo de máscara
      if (tipoMascara === 'cpf') {
        jaExiste = await autenticacaoServico.verificarCPFExistente(apenasDigitos);
        if (jaExiste) {
          helpers.setError('Este CPF já está cadastrado no sistema.');
        }
      } else if (tipoMascara === 'cnpj') {
        jaExiste = await autenticacaoServico.verificarCNPJExistente(apenasDigitos);
        if (jaExiste) {
          helpers.setError('Este CNPJ já está cadastrado no sistema.');
        }
      }
    } catch (erro: any) {
      console.error(`Erro ao verificar ${tipoMascara}:`, erro);
      
      // Tratar erros específicos da API
      if (erro.response?.data?.message) {
        helpers.setError(erro.response.data.message);
      }
    } finally {
      setVerificando(false);
    }
  }, [tipoMascara, verificarUnico, helpers]);
  
  // Esta função é chamada quando o campo perde o foco
  const handleBlur = useCallback(async () => {
    helpers.setTouched(true);
    
    // Se já houver um valor, formata ele ao perder o foco para garantir que está formatado
    if (field.value) {
      const valorFormatado = aplicarMascara(field.value);
      helpers.setValue(valorFormatado);
      
      // Verificar unicidade se necessário
      await verificarValorUnico(valorFormatado);
    }
  }, [aplicarMascara, field.value, helpers, verificarValorUnico]);
  
  // Esses placeholders são aplicados se não for fornecido um específico
  const getDefaultPlaceholder = (): string => {
    switch (tipoMascara) {
      case 'cpf':
        return '000.000.000-00';
      case 'cnpj':
        return '00.000.000/0000-00';
      case 'telefone':
        return '(00) 00000-0000';
      default:
        return '';
    }
  };
  
  // Preparar o estilo do input com base no estado de verificação
  const computedInputStyle = verificando
    ? { ...inputStyle, borderColor: '#FACC15' } // Amarelo para verificando (yellow-400)
    : inputStyle;

  return (
    <CampoEntrada
      valor={field.value}
      onChangeText={handleChangeText}
      onBlur={handleBlur}
      mensagemErro={meta.touched && meta.error ? meta.error : undefined}
      label={label}
      placeholder={placeholder || getDefaultPlaceholder()}
      keyboardType={keyboardType}
      style={style}
      labelStyle={labelStyle}
      inputStyle={computedInputStyle}
      mensagemErroStyle={mensagemErroStyle}
      {...props}
    />
  );
};

export default CampoEntradaComMascara;