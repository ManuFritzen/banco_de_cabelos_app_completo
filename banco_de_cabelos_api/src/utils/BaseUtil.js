class BaseUtil {
  static logError(context, error, additionalInfo = {}) {
    console.error(`======= ERRO EM ${context.toUpperCase()} =======`);
    console.error('Nome do erro:', error.name);
    console.error('Mensagem:', error.message);
    
    if (additionalInfo && Object.keys(additionalInfo).length > 0) {
      console.error('Informações adicionais:', additionalInfo);
    }
    
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    
    console.error('======= FIM DO ERRO =======');
  }

  static isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }
}

module.exports = BaseUtil;