const BaseView = require('./BaseView');

class UsuarioView extends BaseView {
  static login(authData) {
    return {
      success: true,
      message: 'Login realizado com sucesso',
      token: authData.token,
      usuario: this.sanitizeUser(authData.usuario)
    };
  }

  static profile(usuario) {
    const usuarioSanitizado = this.sanitizeUser(usuario);
    return {
      success: true,
      ...usuarioSanitizado
    };
  }

  static list(usuarios) {
    return {
      success: true,
      data: this.sanitizeUsers(usuarios)
    };
  }

  static created(usuario) {
    const usuarioSanitizado = this.sanitizeUser(usuario);
    return {
      success: true,
      message: 'Usuário criado com sucesso',
      ...usuarioSanitizado
    };
  }

  static updated(usuario) {
    return super.updated(this.sanitizeUser(usuario), 'Usuário atualizado com sucesso');
  }

  static photoUpdated(filename) {
    return super.updated({ foto: filename }, 'Foto de perfil atualizada com sucesso');
  }

  static photoRemoved() {
    return super.deleted('Foto de perfil removida com sucesso');
  }

  static available(field) {
    return this.success(null, `${field} disponível`);
  }

  static unavailable(field) {
    return this.error(`${field} já está cadastrado`);
  }

  static logout() {
    return this.success(null, 'Logout realizado com sucesso');
  }
}

module.exports = UsuarioView;