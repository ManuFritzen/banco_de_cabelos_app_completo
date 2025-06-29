class BaseView {
  static success(data, message = null) {
    const response = {
      success: true,
      data
    };
    if (message) {
      response.message = message;
    }
    return response;
  }

  static error(message) {
    return {
      success: false,
      message
    };
  }

  static created(data, message = 'Criado com sucesso') {
    return {
      success: true,
      message,
      data
    };
  }

  static updated(data, message = 'Atualizado com sucesso') {
    return {
      success: true,
      message,
      data
    };
  }

  static deleted(message = 'Excluído com sucesso') {
    return {
      success: true,
      message
    };
  }

  static paginated(data, total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    return {
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  static sanitizeUser(usuario) {
    if (!usuario) return null;
    const { senha, ...usuarioSemSenha } = usuario.toJSON ? usuario.toJSON() : usuario;
    return usuarioSemSenha;
  }

  static sanitizeUsers(usuarios) {
    return usuarios.map(usuario => this.sanitizeUser(usuario));
  }
}

module.exports = BaseView;