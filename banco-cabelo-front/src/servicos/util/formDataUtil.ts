export const gerarFormData = (objeto: any): FormData => {
    const formData = new FormData();
    
    // Itera sobre as propriedades do objeto
    Object.keys(objeto).forEach(chave => {
      const valor = objeto[chave];
      
      // Ignora valores nulos ou undefined
      if (valor === null || valor === undefined) {
        return;
      }
      
      // Se for um arquivo (para upload), adiciona com o nome da chave
      if (
        valor &&
        typeof valor === 'object' &&
        (valor.uri || valor.type || valor.name)
      ) {
        formData.append(chave, valor);
      } else {
        // Para outros tipos de dados, converte para string
        formData.append(chave, String(valor));
      }
    });
    
    return formData;
  };