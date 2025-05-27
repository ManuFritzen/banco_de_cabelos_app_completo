/**
 * Aplica máscara de CPF ao valor informado (formato: 000.000.000-00)
 * @param texto O texto a ser formatado
 * @returns O texto formatado com a máscara de CPF
 */
export const mascaraCPF = (texto: string): string => {
  // Remove caracteres não numéricos
  const apenasDigitos = texto.replace(/\D/g, '');
  
  // Limita a 11 dígitos
  const cpfLimitado = apenasDigitos.slice(0, 11);
  
  // Aplica a máscara
  return cpfLimitado
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

/**
 * Aplica máscara de CNPJ ao valor informado (formato: 00.000.000/0000-00)
 * @param texto O texto a ser formatado
 * @returns O texto formatado com a máscara de CNPJ
 */
export const mascaraCNPJ = (texto: string): string => {
  // Remove caracteres não numéricos
  const apenasDigitos = texto.replace(/\D/g, '');
  
  // Limita a 14 dígitos
  const cnpjLimitado = apenasDigitos.slice(0, 14);
  
  // Aplica a máscara
  return cnpjLimitado
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};

/**
 * Aplica máscara de telefone ao valor informado (formato: (00) 00000-0000 ou (00) 0000-0000)
 * @param texto O texto a ser formatado
 * @returns O texto formatado com a máscara de telefone
 */
export const mascaraTelefone = (texto: string): string => {
  // Remove caracteres não numéricos
  const apenasDigitos = texto.replace(/\D/g, '');
  
  // Limita a 11 dígitos
  const telefoneLimitado = apenasDigitos.slice(0, 11);
  
  // Verifica se é celular (11 dígitos) ou telefone fixo (10 dígitos)
  if (telefoneLimitado.length <= 10) {
    // Telefone fixo: (00) 0000-0000
    return telefoneLimitado
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  } else {
    // Celular: (00) 00000-0000
    return telefoneLimitado
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  }
};

/**
 * Remove todos os caracteres não numéricos de uma string
 * @param texto O texto a ser limpo
 * @returns O texto contendo apenas números
 */
export const apenasNumeros = (texto: string): string => {
  return texto.replace(/\D/g, '');
};