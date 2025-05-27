const cron = require('node-cron');
const { BlacklistedToken } = require('../models');
const { Op } = require('sequelize');
const BaseUtil = require('./BaseUtil');

class CronManager extends BaseUtil {
  // Constantes
  static SCHEDULES = {
    MIDNIGHT: '0 0 * * *',        // Todo dia à meia-noite
    HOURLY: '0 * * * *',          // A cada hora
    WEEKLY: '0 0 * * 0',          // Todo domingo à meia-noite
    MONTHLY: '0 0 1 * *'          // Todo dia 1 do mês à meia-noite
  };

  static TASK_NAMES = {
    CLEANUP_TOKENS: 'cleanup-expired-tokens',
    CLEANUP_UPLOADS: 'cleanup-old-uploads'
  };

  static activeTasks = new Map();

  /**
   * Limpa tokens expirados da blacklist
   */
  static async cleanupExpiredTokens() {
    const taskName = CronManager.TASK_NAMES.CLEANUP_TOKENS;
    
    try {
      console.log(`Iniciando tarefa: ${taskName}`);
      
      const deletedCount = await BlacklistedToken.destroy({
        where: {
          expiresAt: {
            [Op.lt]: new Date()
          }
        }
      });
      
      console.log(`Tarefa ${taskName} concluída. Tokens removidos: ${deletedCount}`);
      return deletedCount;
    } catch (error) {
      CronManager.logError(taskName, error);
      throw error;
    }
  }

  /**
   * Registra uma nova tarefa cron
   * @param {string} schedule - Expressão cron
   * @param {Function} task - Função a ser executada
   * @param {string} taskName - Nome da tarefa
   * @param {Object} options - Opções adicionais
   */
  static registerTask(schedule, task, taskName, options = {}) {
    if (CronManager.activeTasks.has(taskName)) {
      console.warn(`Tarefa '${taskName}' já está registrada`);
      return;
    }

    const wrappedTask = async () => {
      try {
        await task();
      } catch (error) {
        CronManager.logError(`tarefa-cron-${taskName}`, error);
        
        if (options.onError) {
          options.onError(error);
        }
      }
    };

    const cronTask = cron.schedule(schedule, wrappedTask, {
      scheduled: options.scheduled !== false,
      timezone: options.timezone || 'America/Sao_Paulo'
    });

    CronManager.activeTasks.set(taskName, {
      task: cronTask,
      schedule,
      name: taskName,
      createdAt: new Date()
    });

    console.log(`Tarefa cron '${taskName}' registrada com schedule: ${schedule}`);
    return cronTask;
  }

  /**
   * Remove uma tarefa cron
   * @param {string} taskName - Nome da tarefa
   */
  static unregisterTask(taskName) {
    const taskInfo = CronManager.activeTasks.get(taskName);
    
    if (taskInfo) {
      taskInfo.task.stop();
      CronManager.activeTasks.delete(taskName);
      console.log(`Tarefa cron '${taskName}' removida`);
      return true;
    }
    
    console.warn(`Tarefa '${taskName}' não encontrada`);
    return false;
  }

  /**
   * Lista todas as tarefas ativas
   */
  static listActiveTasks() {
    const tasks = [];
    
    CronManager.activeTasks.forEach((taskInfo, taskName) => {
      tasks.push({
        name: taskName,
        schedule: taskInfo.schedule,
        createdAt: taskInfo.createdAt,
        isRunning: taskInfo.task.running
      });
    });
    
    return tasks;
  }

  /**
   * Inicializa todas as tarefas padrão
   */
  static initializeDefaultTasks() {
    // Limpar tokens expirados todos os dias à meia-noite
    CronManager.registerTask(
      CronManager.SCHEDULES.MIDNIGHT,
      CronManager.cleanupExpiredTokens,
      CronManager.TASK_NAMES.CLEANUP_TOKENS,
      {
        onError: (error) => {
          console.error('Erro crítico na limpeza de tokens:', error);
        }
      }
    );
    
    console.log('Tarefas cron padrão inicializadas');
  }

  /**
   * Para todas as tarefas ativas
   */
  static stopAllTasks() {
    CronManager.activeTasks.forEach((taskInfo, taskName) => {
      taskInfo.task.stop();
      console.log(`Tarefa '${taskName}' parada`);
    });
    
    CronManager.activeTasks.clear();
    console.log('Todas as tarefas cron foram paradas');
  }
}

// Inicializar tarefas padrão
CronManager.initializeDefaultTasks();

module.exports = {
  CronManager,
  // Mantém compatibilidade com uso direto
  cleanupExpiredTokens: CronManager.cleanupExpiredTokens
};