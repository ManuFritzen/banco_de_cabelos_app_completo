const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../config/database');

class SolicitacaoInstituicao extends Model {
  static async buscarPorSolicitacao(solicitacaoId, options = {}) {
    return await this.findAll({
      where: { solicitacao_id: solicitacaoId },
      ...options
    });
  }

  static async buscarPorInstituicao(instituicaoId, options = {}) {
    return await this.findAll({
      where: { instituicao_id: instituicaoId },
      order: [['data_analise', 'DESC']],
      ...options
    });
  }

  static async buscarPorStatus(statusId, options = {}) {
    return await this.findAll({
      where: { status_solicitacao_id: statusId },
      ...options
    });
  }

  static async contarPorSolicitacao(solicitacaoId) {
    return await this.count({
      where: { solicitacao_id: solicitacaoId }
    });
  }

  static async jaAnalisadaPorInstituicao(solicitacaoId, instituicaoId) {
    const analise = await this.findOne({
      where: { 
        solicitacao_id: solicitacaoId,
        instituicao_id: instituicaoId 
      }
    });
    return !!analise;
  }

  async pertenceAInstituicao(instituicaoId) {
    return this.instituicao_id === parseInt(instituicaoId);
  }

  isPendente() {
    return this.status_solicitacao_id === 1;
  }

  isEmAnalise() {
    return this.status_solicitacao_id === 2;
  }

  isAprovada() {
    return this.status_solicitacao_id === 3;
  }

  isRecusada() {
    return this.status_solicitacao_id === 4;
  }

  isFinalizada() {
    return this.isAprovada() || this.isRecusada();
  }

  async atualizarStatus(novoStatus, observacoes = null) {
    return await this.update({
      status_solicitacao_id: novoStatus,
      observacoes,
      data_atualizacao: new Date()
    });
  }

  getTempoAnalise() {
    if (!this.data_atualizacao) {
      return null;
    }
    
    const inicio = new Date(this.data_analise);
    const fim = new Date(this.data_atualizacao);
    const diffMs = fim - inicio;
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHoras < 24) {
      return `${diffHoras}h`;
    } else {
      const diffDias = Math.floor(diffHoras / 24);
      return `${diffDias}d`;
    }
  }
}

SolicitacaoInstituicao.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  solicitacao_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'solicitacao',
      key: 'id'
    }
  },
  instituicao_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuario',
      key: 'id'
    }
  },
  status_solicitacao_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1, // Pendente
    references: {
      model: 'status_solicitacao',
      key: 'id'
    }
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  data_analise: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  data_atualizacao: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'SolicitacaoInstituicao',
  tableName: 'solicitacao_instituicao',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['solicitacao_id', 'instituicao_id']
    },
    {
      fields: ['status_solicitacao_id']
    },
    {
      fields: ['data_analise']
    }
  ]
});

module.exports = SolicitacaoInstituicao;