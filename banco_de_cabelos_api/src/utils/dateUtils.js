const BaseUtil = require('./BaseUtil');

/**
 * Utilitários para manipulação de datas com fuso horário correto
 * Garante que todas as datas sejam criadas no fuso horário de Brasília/Rio Grande (UTC-3)
 */
class DateUtils extends BaseUtil {

  /**
   * Cria uma nova data no fuso horário brasileiro (UTC-3)
   * @param {Date|string|number} [date] - Data opcional. Se não fornecido, usa a data atual
   * @returns {Date} Objeto Date no fuso horário correto
   */
  static getBrasilDate(date) {
    return DateUtils.createBrasilDate(date);
  }

  /**
   * Formata uma data para o formato brasileiro
   * @param {Date|string|number} date - Data a ser formatada
   * @param {boolean} [includeTime=true] - Se deve incluir o horário
   * @returns {string} Data formatada no padrão brasileiro
   */
  static formatBrasilDate(date, includeTime = true) {
    const options = includeTime 
      ? DateUtils.DEFAULT_DATETIME_FORMAT 
      : DateUtils.DEFAULT_DATE_FORMAT;
    
    return DateUtils.formatDate(date, options);
  }

  /**
   * Compara duas datas considerando apenas dia, mês e ano (ignorando hora)
   * @param {Date|string|number} date1 - Primeira data
   * @param {Date|string|number} date2 - Segunda data
   * @returns {number} -1 se date1 é menor, 0 se iguais, 1 se date1 é maior
   */
  static compareDates(date1, date2) {
    const d1 = DateUtils.normalizeDate(date1);
    const d2 = DateUtils.normalizeDate(date2);
    
    if (!d1 || !d2) {
      throw new Error('Datas inválidas para comparação');
    }
    
    const normalizedD1 = DateUtils.resetTimeToMidnight(d1);
    const normalizedD2 = DateUtils.resetTimeToMidnight(d2);
    
    if (normalizedD1 < normalizedD2) return -1;
    if (normalizedD1 > normalizedD2) return 1;
    return 0;
  }

  /**
   * Adiciona dias a uma data
   * @param {Date|string|number} date - Data base
   * @param {number} days - Número de dias a adicionar (pode ser negativo)
   * @returns {Date} Nova data
   */
  static addDays(date, days) {
    DateUtils.validateRequired(date, 'Data');
    DateUtils.validateType(days, 'number', 'Número de dias');
    
    const dateObj = DateUtils.normalizeDate(date);
    if (!dateObj) {
      throw new Error('Data inválida fornecida');
    }
    
    const result = new Date(dateObj);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Adiciona horas a uma data
   * @param {Date|string|number} date - Data base
   * @param {number} hours - Número de horas a adicionar (pode ser negativo)
   * @returns {Date} Nova data
   */
  static addHours(date, hours) {
    DateUtils.validateRequired(date, 'Data');
    DateUtils.validateType(hours, 'number', 'Número de horas');
    
    const dateObj = DateUtils.normalizeDate(date);
    if (!dateObj) {
      throw new Error('Data inválida fornecida');
    }
    
    const result = new Date(dateObj);
    result.setHours(result.getHours() + hours);
    return result;
  }

  /**
   * Calcula a diferença em dias entre duas datas
   * @param {Date|string|number} startDate - Data inicial
   * @param {Date|string|number} endDate - Data final
   * @returns {number} Diferença em dias
   */
  static daysDifference(startDate, endDate) {
    const start = DateUtils.normalizeDate(startDate);
    const end = DateUtils.normalizeDate(endDate);
    
    if (!start || !end) {
      throw new Error('Datas inválidas para cálculo de diferença');
    }
    
    const normalizedStart = DateUtils.resetTimeToMidnight(start);
    const normalizedEnd = DateUtils.resetTimeToMidnight(end);
    
    const diffTime = normalizedEnd - normalizedStart;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Verifica se uma data está dentro de um intervalo
   * @param {Date|string|number} date - Data a verificar
   * @param {Date|string|number} startDate - Data inicial do intervalo
   * @param {Date|string|number} endDate - Data final do intervalo
   * @returns {boolean} True se a data está no intervalo
   */
  static isDateInRange(date, startDate, endDate) {
    const checkDate = DateUtils.normalizeDate(date);
    const start = DateUtils.normalizeDate(startDate);
    const end = DateUtils.normalizeDate(endDate);
    
    if (!checkDate || !start || !end) {
      throw new Error('Datas inválidas para verificação de intervalo');
    }
    
    return checkDate >= start && checkDate <= end;
  }
}

// Mantém compatibilidade com exports antigos
const getBrasilDate = DateUtils.getBrasilDate;
const formatBrasilDate = DateUtils.formatBrasilDate;
const compareDates = DateUtils.compareDates;
const addDays = DateUtils.addDays;

module.exports = {
  DateUtils,
  getBrasilDate,
  formatBrasilDate,
  compareDates,
  addDays,
  addHours: DateUtils.addHours,
  daysDifference: DateUtils.daysDifference,
  isDateInRange: DateUtils.isDateInRange
};