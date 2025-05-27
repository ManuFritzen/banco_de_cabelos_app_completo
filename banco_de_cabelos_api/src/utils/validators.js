const BaseUtil = require('./BaseUtil');

class Validators extends BaseUtil {
  // Constantes para valida��o
  static CPF_LENGTH = 11;
  static CNPJ_LENGTH = 14;
  static MIN_PASSWORD_LENGTH = 6;
  static MAX_NAME_LENGTH = 100;
  static MIN_NAME_LENGTH = 3;

  static PATTERNS = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    CPF: /^\d{11}$/,
    CNPJ: /^\d{14}$/,
    PHONE: /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/,
    ONLY_NUMBERS: /^\d+$/,
    ONLY_LETTERS: /^[A-Za-z�-�\s]+$/,
    PASSWORD_STRONG: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    CEP: /^\d{8}$/
  };

  static USER_TYPES = ['F', 'J', 'A']; // F�sica, Jur�dica, Admin
  
  // Limites de tamanho para campos de endereço
  static ADDRESS_FIELD_LIMITS = {
    BAIRRO: 100,
    RUA: 150,
    NUMERO: 10,
    COMPLEMENTO: 100
  };
  
  // Constantes para peruca
  static PERUCA_TAMANHOS = ['P', 'M', 'G'];
  static PERUCA_COMPRIMENTO_MIN = 10; // cm
  static PERUCA_COMPRIMENTO_MAX = 100; // cm
  
  // Constantes para cabelo
  static CABELO_PESO_MIN = 0.1; // gramas
  static CABELO_PESO_MAX = 1000; // gramas
  static CABELO_COMPRIMENTO_MIN = 15; // cm
  static CABELO_COMPRIMENTO_MAX = 150; // cm
  static OBSERVACAO_MAX_LENGTH = 500;

  /**
   * Valida se um email tem formato v�lido
   * @param {string} email - Email a ser validado
   * @returns {boolean} True se v�lido
   */
  static isValidEmail(email) {
    if (Validators.isEmpty(email)) return false;
    return Validators.PATTERNS.EMAIL.test(email.trim());
  }

  /**
   * Valida CPF
   * @param {string} cpf - CPF a ser validado
   * @returns {boolean} True se v�lido
   */
  static isValidCPF(cpf) {
    if (Validators.isEmpty(cpf)) return false;
    
    const cleanCPF = cpf.replace(/\D/g, '');
    
    if (cleanCPF.length !== Validators.CPF_LENGTH) return false;
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false; // CPF com todos os d�gitos iguais
    
    return Validators.validateCPFDigits(cleanCPF);
  }

  /**
   * Valida os d�gitos verificadores do CPF
   * @param {string} cpf - CPF limpo (s� n�meros)
   * @returns {boolean} True se os d�gitos est�o corretos
   */
  static validateCPFDigits(cpf) {
    // Primeiro d�gito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let digit1 = 11 - (sum % 11);
    if (digit1 >= 10) digit1 = 0;

    // Segundo d�gito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    let digit2 = 11 - (sum % 11);
    if (digit2 >= 10) digit2 = 0;

    return parseInt(cpf.charAt(9)) === digit1 && parseInt(cpf.charAt(10)) === digit2;
  }

  /**
   * Valida CNPJ
   * @param {string} cnpj - CNPJ a ser validado
   * @returns {boolean} True se v�lido
   */
  static isValidCNPJ(cnpj) {
    if (Validators.isEmpty(cnpj)) return false;
    
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    
    if (cleanCNPJ.length !== Validators.CNPJ_LENGTH) return false;
    if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false; // CNPJ com todos os d�gitos iguais
    
    return Validators.validateCNPJDigits(cleanCNPJ);
  }

  /**
   * Valida os d�gitos verificadores do CNPJ
   * @param {string} cnpj - CNPJ limpo (s� n�meros)
   * @returns {boolean} True se os d�gitos est�o corretos
   */
  static validateCNPJDigits(cnpj) {
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    // Primeiro d�gito verificador
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cnpj.charAt(i)) * weights1[i];
    }
    let digit1 = sum % 11;
    digit1 = digit1 < 2 ? 0 : 11 - digit1;

    // Segundo d�gito verificador
    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cnpj.charAt(i)) * weights2[i];
    }
    let digit2 = sum % 11;
    digit2 = digit2 < 2 ? 0 : 11 - digit2;

    return parseInt(cnpj.charAt(12)) === digit1 && parseInt(cnpj.charAt(13)) === digit2;
  }

  /**
   * Valida senha
   * @param {string} password - Senha a ser validada
   * @param {Object} options - Op��es de valida��o
   * @returns {Object} Resultado da valida��o
   */
  static validatePassword(password, options = {}) {
    const result = {
      isValid: true,
      errors: []
    };

    if (Validators.isEmpty(password)) {
      result.isValid = false;
      result.errors.push('Senha � obrigat�ria');
      return result;
    }

    if (password.length < Validators.MIN_PASSWORD_LENGTH) {
      result.isValid = false;
      result.errors.push(`Senha deve ter pelo menos ${Validators.MIN_PASSWORD_LENGTH} caracteres`);
    }

    if (options.requireStrong && !Validators.PATTERNS.PASSWORD_STRONG.test(password)) {
      result.isValid = false;
      result.errors.push('Senha deve conter pelo menos: 1 letra min�scula, 1 mai�scula, 1 n�mero e 1 s�mbolo');
    }

    return result;
  }

  /**
   * Valida nome
   * @param {string} name - Nome a ser validado
   * @returns {Object} Resultado da valida��o
   */
  static validateName(name) {
    const result = {
      isValid: true,
      errors: []
    };

    if (Validators.isEmpty(name)) {
      result.isValid = false;
      result.errors.push('Nome � obrigat�rio');
      return result;
    }

    const trimmedName = name.trim();

    if (trimmedName.length < Validators.MIN_NAME_LENGTH) {
      result.isValid = false;
      result.errors.push(`Nome deve ter pelo menos ${Validators.MIN_NAME_LENGTH} caracteres`);
    }

    if (trimmedName.length > Validators.MAX_NAME_LENGTH) {
      result.isValid = false;
      result.errors.push(`Nome deve ter no m�ximo ${Validators.MAX_NAME_LENGTH} caracteres`);
    }

    return result;
  }

  /**
   * Valida telefone
   * @param {string} phone - Telefone a ser validado
   * @returns {boolean} True se v�lido
   */
  static isValidPhone(phone) {
    if (Validators.isEmpty(phone)) return false;
    return Validators.PATTERNS.PHONE.test(phone.trim());
  }

  /**
   * Valida tipo de usu�rio
   * @param {string} userType - Tipo de usu�rio
   * @returns {boolean} True se v�lido
   */
  static isValidUserType(userType) {
    return Validators.USER_TYPES.includes(userType);
  }

  /**
   * Limpa e formata CPF
   * @param {string} cpf - CPF a ser formatado
   * @returns {string} CPF formatado ou string vazia se inv�lido
   */
  static formatCPF(cpf) {
    if (!cpf) return '';
    
    const cleanCPF = cpf.replace(/\D/g, '');
    if (cleanCPF.length !== Validators.CPF_LENGTH) return cleanCPF;
    
    return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  /**
   * Limpa e formata CNPJ
   * @param {string} cnpj - CNPJ a ser formatado
   * @returns {string} CNPJ formatado ou string vazia se inv�lido
   */
  static formatCNPJ(cnpj) {
    if (!cnpj) return '';
    
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    if (cleanCNPJ.length !== Validators.CNPJ_LENGTH) return cleanCNPJ;
    
    return cleanCNPJ.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }

  /**
   * Limpa e formata telefone
   * @param {string} phone - Telefone a ser formatado
   * @returns {string} Telefone formatado
   */
  static formatPhone(phone) {
    if (!phone) return '';
    
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length === 10) {
      return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (cleanPhone.length === 11) {
      return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    
    return cleanPhone;
  }

  /**
   * Sanitiza entrada removendo caracteres especiais
   * @param {string} input - String a ser sanitizada
   * @param {Object} options - Op��es de sanitiza��o
   * @returns {string} String sanitizada
   */
  static sanitizeInput(input, options = {}) {
    if (!input || typeof input !== 'string') return '';
    
    let sanitized = input.trim();
    
    if (options.removeSpecialChars) {
      sanitized = sanitized.replace(/[^\w\s@.-]/g, '');
    }
    
    if (options.toLowerCase) {
      sanitized = sanitized.toLowerCase();
    }
    
    if (options.removeExtraSpaces) {
      sanitized = sanitized.replace(/\s+/g, ' ');
    }
    
    return sanitized;
  }

  /**
   * Valida objeto de usu�rio completo
   * @param {Object} userData - Dados do usu�rio
   * @returns {Object} Resultado da valida��o
   */
  static validateUserData(userData) {
    const result = {
      isValid: true,
      errors: {}
    };

    // Validar nome
    const nameValidation = Validators.validateName(userData.nome);
    if (!nameValidation.isValid) {
      result.isValid = false;
      result.errors.nome = nameValidation.errors;
    }

    // Validar email
    if (!Validators.isValidEmail(userData.email)) {
      result.isValid = false;
      result.errors.email = ['Email inv�lido'];
    }

    // Validar tipo de usu�rio
    if (!Validators.isValidUserType(userData.tipo)) {
      result.isValid = false;
      result.errors.tipo = ['Tipo de usu�rio inv�lido'];
    }

    // Validar CPF para pessoa f�sica
    if (userData.tipo === 'F' && userData.cpf) {
      if (!Validators.isValidCPF(userData.cpf)) {
        result.isValid = false;
        result.errors.cpf = ['CPF inv�lido'];
      }
    }

    // Validar CNPJ para pessoa jur�dica
    if (userData.tipo === 'J' && userData.cnpj) {
      if (!Validators.isValidCNPJ(userData.cnpj)) {
        result.isValid = false;
        result.errors.cnpj = ['CNPJ inv�lido'];
      }
    }

    // Validar telefone se fornecido
    if (userData.telefone && !Validators.isValidPhone(userData.telefone)) {
      result.isValid = false;
      result.errors.telefone = ['Telefone inv�lido'];
    }

    return result;
  }

  /**
   * Valida CEP brasileiro
   * @param {string} cep - CEP a ser validado
   * @returns {boolean} True se válido
   */
  static isValidCEP(cep) {
    if (Validators.isEmpty(cep)) return false;
    
    // Remove hífens e espaços
    const cleanCEP = cep.replace(/[\s-]/g, '');
    
    // Verifica se tem 8 dígitos
    return Validators.PATTERNS.CEP.test(cleanCEP);
  }

  /**
   * Formata CEP para o padrão 00000-000
   * @param {string} cep - CEP a ser formatado
   * @returns {string} CEP formatado ou string vazia se inválido
   */
  static formatCEP(cep) {
    if (!cep) return '';
    
    const cleanCEP = cep.replace(/\D/g, '');
    if (cleanCEP.length !== 8) return cleanCEP;
    
    return cleanCEP.replace(/(\d{5})(\d{3})/, '$1-$2');
  }

  /**
   * Valida dados de endereço
   * @param {Object} addressData - Dados do endereço
   * @returns {Object} Resultado da validação com dados sanitizados
   */
  static validateAddressData(addressData) {
    const result = {
      isValid: true,
      errors: {},
      sanitized: {}
    };

    const { bairro, rua, numero, nro, complemento, cep } = addressData;

    // Valida CEP se fornecido
    if (cep !== undefined) {
      if (!Validators.isValidCEP(cep)) {
        result.isValid = false;
        result.errors.cep = ['CEP inválido. Use o formato 00000-000 ou 00000000'];
      } else {
        result.sanitized.cep = cep.replace(/[\s-]/g, '');
      }
    }

    // Valida bairro
    if (bairro !== undefined) {
      if (bairro && bairro.length > Validators.ADDRESS_FIELD_LIMITS.BAIRRO) {
        result.isValid = false;
        result.errors.bairro = [`Bairro não pode ter mais de ${Validators.ADDRESS_FIELD_LIMITS.BAIRRO} caracteres`];
      } else {
        result.sanitized.bairro = bairro ? Validators.sanitizeInput(bairro, { removeExtraSpaces: true }) : bairro;
      }
    }

    // Valida rua
    if (rua !== undefined) {
      if (rua && rua.length > Validators.ADDRESS_FIELD_LIMITS.RUA) {
        result.isValid = false;
        result.errors.rua = [`Rua não pode ter mais de ${Validators.ADDRESS_FIELD_LIMITS.RUA} caracteres`];
      } else {
        result.sanitized.rua = rua ? Validators.sanitizeInput(rua, { removeExtraSpaces: true }) : rua;
      }
    }

    // Valida número (aceita tanto 'numero' quanto 'nro')
    const numeroField = numero !== undefined ? numero : nro;
    if (numeroField !== undefined) {
      if (numeroField && numeroField.length > Validators.ADDRESS_FIELD_LIMITS.NUMERO) {
        result.isValid = false;
        result.errors.numero = [`Número não pode ter mais de ${Validators.ADDRESS_FIELD_LIMITS.NUMERO} caracteres`];
      } else {
        result.sanitized.nro = numeroField ? Validators.sanitizeInput(numeroField, { removeExtraSpaces: true }) : numeroField;
      }
    }

    // Valida complemento
    if (complemento !== undefined) {
      if (complemento && complemento.length > Validators.ADDRESS_FIELD_LIMITS.COMPLEMENTO) {
        result.isValid = false;
        result.errors.complemento = [`Complemento não pode ter mais de ${Validators.ADDRESS_FIELD_LIMITS.COMPLEMENTO} caracteres`];
      } else {
        result.sanitized.complemento = complemento ? Validators.sanitizeInput(complemento, { removeExtraSpaces: true }) : complemento;
      }
    }

    return result;
  }

  /**
   * Valida dados de peruca
   * @param {Object} perucaData - Dados da peruca
   * @returns {Object} Resultado da validação
   */
  static validatePerucaData(perucaData) {
    const result = {
      isValid: true,
      errors: {},
      sanitized: {}
    };

    const { tipo_peruca_id, cor_id, comprimento, tamanho } = perucaData;

    // Valida tipo_peruca_id
    if (tipo_peruca_id !== undefined) {
      if (!tipo_peruca_id || !Validators.PATTERNS.ONLY_NUMBERS.test(tipo_peruca_id.toString())) {
        result.isValid = false;
        result.errors.tipo_peruca_id = ['ID do tipo de peruca inválido'];
      } else {
        result.sanitized.tipo_peruca_id = parseInt(tipo_peruca_id);
      }
    }

    // Valida cor_id
    if (cor_id !== undefined) {
      if (!cor_id || !Validators.PATTERNS.ONLY_NUMBERS.test(cor_id.toString())) {
        result.isValid = false;
        result.errors.cor_id = ['ID da cor inválido'];
      } else {
        result.sanitized.cor_id = parseInt(cor_id);
      }
    }

    // Valida comprimento
    if (comprimento !== undefined) {
      const comp = parseFloat(comprimento);
      if (isNaN(comp)) {
        result.isValid = false;
        result.errors.comprimento = ['Comprimento deve ser um número válido'];
      } else if (comp < Validators.PERUCA_COMPRIMENTO_MIN || comp > Validators.PERUCA_COMPRIMENTO_MAX) {
        result.isValid = false;
        result.errors.comprimento = [`Comprimento deve estar entre ${Validators.PERUCA_COMPRIMENTO_MIN} e ${Validators.PERUCA_COMPRIMENTO_MAX} cm`];
      } else {
        result.sanitized.comprimento = comp;
      }
    }

    // Valida tamanho
    if (tamanho !== undefined) {
      if (!Validators.PERUCA_TAMANHOS.includes(tamanho)) {
        result.isValid = false;
        result.errors.tamanho = [`Tamanho inválido. Use: ${Validators.PERUCA_TAMANHOS.join(', ')}`];
      } else {
        result.sanitized.tamanho = tamanho;
      }
    }

    return result;
  }

  /**
   * Valida filtros de busca de peruca
   * @param {Object} filters - Filtros de busca
   * @returns {Object} Filtros validados
   */
  static validatePerucaFilters(filters) {
    const validatedFilters = {};
    const { tipo_peruca_id, cor_id, tamanho, instituicao_id } = filters;

    if (tipo_peruca_id && Validators.PATTERNS.ONLY_NUMBERS.test(tipo_peruca_id.toString())) {
      validatedFilters.tipo_peruca_id = parseInt(tipo_peruca_id);
    }

    if (cor_id && Validators.PATTERNS.ONLY_NUMBERS.test(cor_id.toString())) {
      validatedFilters.cor_id = parseInt(cor_id);
    }

    if (tamanho && Validators.PERUCA_TAMANHOS.includes(tamanho)) {
      validatedFilters.tamanho = tamanho;
    }

    if (instituicao_id && Validators.PATTERNS.ONLY_NUMBERS.test(instituicao_id.toString())) {
      validatedFilters.instituicao_id = parseInt(instituicao_id);
    }

    return validatedFilters;
  }

  /**
   * Valida dados de doação de cabelo
   * @param {Object} cabeloData - Dados do cabelo
   * @returns {Object} Resultado da validação
   */
  static validateCabeloData(cabeloData) {
    const result = {
      isValid: true,
      errors: {},
      sanitized: {}
    };

    const { peso, comprimento, cor_id, instituicao_id, observacao } = cabeloData;

    // Valida peso
    if (peso !== undefined) {
      const pesoNum = parseFloat(peso);
      if (isNaN(pesoNum)) {
        result.isValid = false;
        result.errors.peso = ['Peso deve ser um número válido'];
      } else if (pesoNum < Validators.CABELO_PESO_MIN || pesoNum > Validators.CABELO_PESO_MAX) {
        result.isValid = false;
        result.errors.peso = [`Peso deve estar entre ${Validators.CABELO_PESO_MIN} e ${Validators.CABELO_PESO_MAX} gramas`];
      } else {
        result.sanitized.peso = pesoNum;
      }
    }

    // Valida comprimento
    if (comprimento !== undefined) {
      const comp = parseFloat(comprimento);
      if (isNaN(comp)) {
        result.isValid = false;
        result.errors.comprimento = ['Comprimento deve ser um número válido'];
      } else if (comp < Validators.CABELO_COMPRIMENTO_MIN || comp > Validators.CABELO_COMPRIMENTO_MAX) {
        result.isValid = false;
        result.errors.comprimento = [`Comprimento deve estar entre ${Validators.CABELO_COMPRIMENTO_MIN} e ${Validators.CABELO_COMPRIMENTO_MAX} cm`];
      } else {
        result.sanitized.comprimento = comp;
      }
    }

    // Valida cor_id
    if (cor_id !== undefined) {
      if (!cor_id || !Validators.PATTERNS.ONLY_NUMBERS.test(cor_id.toString())) {
        result.isValid = false;
        result.errors.cor_id = ['ID da cor inválido'];
      } else {
        result.sanitized.cor_id = parseInt(cor_id);
      }
    }

    // Valida instituicao_id
    if (instituicao_id !== undefined) {
      if (!instituicao_id || !Validators.PATTERNS.ONLY_NUMBERS.test(instituicao_id.toString())) {
        result.isValid = false;
        result.errors.instituicao_id = ['ID da instituição inválido'];
      } else {
        result.sanitized.instituicao_id = parseInt(instituicao_id);
      }
    }

    // Valida observação
    if (observacao !== undefined) {
      if (observacao && observacao.length > Validators.OBSERVACAO_MAX_LENGTH) {
        result.isValid = false;
        result.errors.observacao = [`Observação não pode ter mais de ${Validators.OBSERVACAO_MAX_LENGTH} caracteres`];
      } else {
        result.sanitized.observacao = observacao ? Validators.sanitizeInput(observacao, { removeExtraSpaces: true }) : observacao;
      }
    }

    return result;
  }

  /**
   * Valida dados de solicitação
   * @param {Object} solicitacaoData - Dados da solicitação
   * @returns {Object} Resultado da validação
   */
  static validateSolicitacaoData(solicitacaoData) {
    const result = {
      isValid: true,
      errors: {},
      sanitized: {}
    };

    const { observacao, status_solicitacao_id } = solicitacaoData;

    // Valida observação
    if (observacao !== undefined) {
      if (observacao && observacao.length > Validators.OBSERVACAO_MAX_LENGTH) {
        result.isValid = false;
        result.errors.observacao = [`Observação não pode ter mais de ${Validators.OBSERVACAO_MAX_LENGTH} caracteres`];
      } else {
        result.sanitized.observacao = observacao ? Validators.sanitizeInput(observacao, { removeExtraSpaces: true }) : observacao;
      }
    }

    // Valida status_solicitacao_id
    if (status_solicitacao_id !== undefined) {
      if (!status_solicitacao_id || !Validators.PATTERNS.ONLY_NUMBERS.test(status_solicitacao_id.toString())) {
        result.isValid = false;
        result.errors.status_solicitacao_id = ['ID do status de solicitação inválido'];
      } else {
        result.sanitized.status_solicitacao_id = parseInt(status_solicitacao_id);
      }
    }

    return result;
  }

  /**
   * Valida filtros de solicitação
   * @param {Object} filters - Filtros
   * @returns {Object} Filtros validados
   */
  static validateSolicitacaoFilters(filters) {
    const validatedFilters = {};
    const { status_solicitacao_id, usuario_id } = filters;

    if (status_solicitacao_id && Validators.PATTERNS.ONLY_NUMBERS.test(status_solicitacao_id.toString())) {
      validatedFilters.status_solicitacao_id = parseInt(status_solicitacao_id);
    }

    if (usuario_id && Validators.PATTERNS.ONLY_NUMBERS.test(usuario_id.toString())) {
      validatedFilters.usuario_id = parseInt(usuario_id);
    }

    return validatedFilters;
  }
}

module.exports = {
  Validators,
  // Exports para compatibilidade
  isValidEmail: Validators.isValidEmail,
  isValidCPF: Validators.isValidCPF,
  isValidCNPJ: Validators.isValidCNPJ,
  validatePassword: Validators.validatePassword,
  validateName: Validators.validateName,
  isValidPhone: Validators.isValidPhone,
  formatCPF: Validators.formatCPF,
  formatCNPJ: Validators.formatCNPJ,
  formatPhone: Validators.formatPhone,
  sanitizeInput: Validators.sanitizeInput,
  validateUserData: Validators.validateUserData,
  isValidCEP: Validators.isValidCEP,
  formatCEP: Validators.formatCEP,
  validateAddressData: Validators.validateAddressData,
  validatePerucaData: Validators.validatePerucaData,
  validatePerucaFilters: Validators.validatePerucaFilters,
  validateCabeloData: Validators.validateCabeloData,
  validateSolicitacaoData: Validators.validateSolicitacaoData,
  validateSolicitacaoFilters: Validators.validateSolicitacaoFilters,
  isValidUserType: Validators.isValidUserType
};