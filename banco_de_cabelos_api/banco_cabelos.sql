-- DROP DATABASE IF EXISTS banco_cabelos;
-- CREATE DATABASE banco_cabelos;

\c banco_cabelos;


-- CREATE TABLE tipo_peruca
-- (
--     id SERIAL PRIMARY KEY,
--     nome TEXT NOT NULL,
--     sigla CHAR(2)
-- );

-- CREATE TABLE cor
-- (
--     id SERIAL PRIMARY KEY,
--     nome VARCHAR(100) NOT NULL
-- );

-- CREATE TABLE status_solicitacao
-- (
--     id SERIAL PRIMARY KEY,
--     nome VARCHAR(20) NOT NULL
-- );

-- CREATE OR REPLACE FUNCTION valida_cpf(character (11)) RETURNS boolean AS
-- $$
-- DECLARE
--     digito1 integer;
--     digito1_real integer;
--     digito2 integer;
--     digito2_real integer;
--     i integer;
--     qtde integer;
--     soma integer;
--     multiplicador integer;
--     resto integer;
-- BEGIN
--    if (length($1) < 11) THEN
--         RETURN FALSE;
--    END IF; 
    
--    i = 0; 
--    while (i <= 9) loop
--         if ((cast(i as text)||
--             cast(i as text)||
--             cast(i as text)||
--             cast(i as text)||
--             cast(i as text)||
--             cast(i as text)||
--             cast(i as text)||
--             cast(i as text)||
--             cast(i as text)||
--             cast(i as text)||
--             cast(i as text)) = $1) THEN
--         RETURN FALSE;
--         END IF;            
--         i := i + 1;
--    end loop;
    
    
--     i := 1;
--     soma := 0;
--     multiplicador := 10;    
--     while (i <= 9) LOOP
--         BEGIN
--             soma := soma + cast(substring($1 from i for 1) as integer)*multiplicador;
--         EXCEPTION 
--             WHEN OTHERS then RETURN FALSE;
--         END;
--             multiplicador := multiplicador - 1;
--         i := i + 1;
--     END LOOP;
--     RAISE NOTICE 'soma1: %', soma;
    
--     resto := soma % 11;
    
--     if (resto < 2) then
--         digito1 := 0;
--     else
--         digito1 := 11 - resto;
--     end if;
    
--     RAISE NOTICE '%', digito1;
    
--     i := 1;
--     soma := 0;
--     multiplicador := 11;    
--     while (i <= 10) LOOP
--         BEGIN
--             soma := soma + cast(substring($1 from i for 1) as integer)*multiplicador;
--         EXCEPTION 
--             WHEN OTHERS then RETURN FALSE;
--         END;
--         multiplicador := multiplicador - 1;
--         i := i + 1;
--     END LOOP;   
--     RAISE NOTICE 'soma2: %', soma;
    
--     resto := soma % 11; 
--       if (resto < 2) then
--         digito2 := 0;
--     else
--         digito2 := 11 - resto;
--     end if;
    
--     RAISE NOTICE '%', digito2;

--     digito1_real := cast(substring($1 from 10 for 1) as integer);
--     RAISE NOTICE '%', digito1_real;
--     digito2_real := cast(substring($1 from 11 for 1) as integer);
--     RAISE NOTICE '%', digito2_real;
    
--     if (digito1 = digito1_real AND digito2 = digito2_real) THEN
--         RETURN TRUE;
--     ELSE
--         RETURN FALSE;
--     END IF;    
-- END;
-- $$ LANGUAGE 'plpgsql';

-- CREATE OR REPLACE FUNCTION valida_cnpj(character (14)) RETURNS boolean AS
-- $$
-- DECLARE
--     digito1 integer;
--     digito1_real integer;
--     digito2 integer;
--     digito2_real integer;
--     i integer;
--     j integer;
--     qtde integer;
--     soma integer;
--     multiplicador integer;
--     resto integer;
--     peso_1 integer[] := ARRAY[5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
--     peso_2 integer[] := ARRAY[6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
-- BEGIN
--     if (length($1) < 14) THEN
--         RETURN FALSE;
--     END IF; 
    
--     i = 0; 
--     while (i <= 9) loop
--         if ((cast(i as text)||
--             cast(i as text)||
--             cast(i as text)||
--             cast(i as text)||
--             cast(i as text)||
--             cast(i as text)||
--             cast(i as text)||
--             cast(i as text)||
--             cast(i as text)||
--             cast(i as text)||
--             cast(i as text)||
--             cast(i as text)||
--             cast(i as text)||
--             cast(i as text)) = $1) THEN
--         RETURN FALSE;
--         END IF;            
--         i := i + 1;
--     end loop;
    
--     i := 1;
--     soma := 0;
    
--     for i in 1..12 LOOP
--         BEGIN
--             soma := soma + cast(substring($1 from i for 1) as integer) * peso_1[i];
--         EXCEPTION 
--             WHEN OTHERS then RETURN FALSE;
--         END;
--     END LOOP;
    
--     RAISE NOTICE 'soma1: %', soma;
    
--     resto := soma % 11;
    
--     if (resto < 2) then
--         digito1 := 0;
--     else
--         digito1 := 11 - resto;
--     end if;
    
--     RAISE NOTICE 'digito1: %', digito1;
    
--     soma := 0;
    
--     for i in 1..13 LOOP
--         if (i <= 12) then
--             BEGIN
--                 soma := soma + cast(substring($1 from i for 1) as integer) * peso_2[i];
--             EXCEPTION 
--                 WHEN OTHERS then RETURN FALSE;
--             END;
--         else
--             soma := soma + digito1 * peso_2[i];
--         end if;
--     END LOOP;
    
--     RAISE NOTICE 'soma2: %', soma;
    
--     resto := soma % 11; 
    
--     if (resto < 2) then
--         digito2 := 0;
--     else
--         digito2 := 11 - resto;
--     end if;
    
--     RAISE NOTICE 'digito2: %', digito2;

--     digito1_real := cast(substring($1 from 13 for 1) as integer);
--     RAISE NOTICE 'digito1_real: %', digito1_real;
--     digito2_real := cast(substring($1 from 14 for 1) as integer);
--     RAISE NOTICE 'digito2_real: %', digito2_real;
    
--     if (digito1 = digito1_real AND digito2 = digito2_real) THEN
--         RETURN TRUE;
--     ELSE
--         RETURN FALSE;
--     END IF;    
-- END;
-- $$ LANGUAGE 'plpgsql';

-- CREATE OR REPLACE FUNCTION validar_usuario_cpf_cnpj()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     IF NEW.tipo = 'F' THEN
--         IF NEW.cpf IS NULL THEN
--             RAISE EXCEPTION 'CPF é obrigatório para pessoa física';
--         END IF;
        
--         IF NOT valida_cpf(NEW.cpf) THEN
--             RAISE EXCEPTION 'CPF inválido';
--         END IF;
--     ELSIF NEW.tipo = 'J' THEN
--         IF NEW.cnpj IS NULL THEN
--             RAISE EXCEPTION 'CNPJ é obrigatório para pessoa jurídica';
--         END IF;
        
--         IF NOT valida_cnpj(NEW.cnpj) THEN
--             RAISE EXCEPTION 'CNPJ inválido';
--         END IF;
--     END IF;
    
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;


-- CREATE TABLE usuario
-- (
--     id SERIAL PRIMARY KEY,
--     nome VARCHAR(100) NOT NULL,
--     email VARCHAR(100) NOT NULL UNIQUE,
--     senha VARCHAR(100) NOT NULL,
--     tipo CHAR(1) NOT NULL DEFAULT 'F' CHECK (tipo IN ('F', 'J', 'A')),
--     ativo BOOLEAN DEFAULT TRUE NOT NULL,
--     cnpj CHAR(14) UNIQUE,
--     cpf CHAR(11) UNIQUE,
--     telefone VARCHAR(11) UNIQUE,
--     foto_perfil VARCHAR(255) DEFAULT NULL
-- );

-- COMMENT ON COLUMN usuario.foto_perfil IS 'Caminho da foto de perfil do usuário';
-- CREATE INDEX idx_usuario_foto_perfil ON usuario(foto_perfil);

-- CREATE TABLE endereco
-- (
--     id SERIAL PRIMARY KEY,
--     usuario_id INTEGER NOT NULL,
--     cidade VARCHAR(255) NOT NULL,
--     estado CHAR(2) NOT NULL,
--     ibge VARCHAR(10) NOT NULL,
--     bairro TEXT NOT NULL,
--     rua TEXT NOT NULL,
--     cep CHAR(8) NOT NULL,
--     nro VARCHAR(10),
--     complemento TEXT,
--     FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
-- );


-- CREATE TABLE peruca
-- (
--     id SERIAL PRIMARY KEY,
--     tipo_peruca_id INTEGER NOT NULL,
--     instituicao_id INTEGER NOT NULL,
--     cor_id INTEGER NOT NULL,
--     comprimento REAL CHECK (comprimento > 0),
--     tamanho CHAR(1) NOT NULL DEFAULT 'M' CHECK (tamanho IN ('P', 'M', 'G')),
--     foto BYTEA,
--     disponivel BOOLEAN DEFAULT TRUE NOT NULL,
--     FOREIGN KEY (tipo_peruca_id) REFERENCES tipo_peruca(id) ON DELETE CASCADE,
--     FOREIGN KEY (instituicao_id) REFERENCES usuario(id) ON DELETE CASCADE,
--     FOREIGN KEY (cor_id) REFERENCES cor(id) ON DELETE CASCADE
-- );

-- CREATE TABLE cabelo
-- (
--     id SERIAL PRIMARY KEY,
--     peso REAL,
--     comprimento REAL CHECK (comprimento > 0),
--     foto BYTEA,
--     cor_id INTEGER,
--     FOREIGN KEY (cor_id) REFERENCES cor(id) ON DELETE CASCADE
-- );


-- CREATE TABLE solicitacao
-- (
--     id SERIAL PRIMARY KEY,
--     status_solicitacao_id INTEGER NOT NULL,
--     pessoa_fisica_id INTEGER NOT NULL,
--     data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     foto_laudo_medico BYTEA NOT NULL,
--     observacao TEXT,
--     FOREIGN KEY (status_solicitacao_id) REFERENCES status_solicitacao(id) ON DELETE CASCADE,
--     FOREIGN KEY (pessoa_fisica_id) REFERENCES usuario(id) ON DELETE CASCADE
-- );

-- CREATE TABLE doacao
-- (
--     id SERIAL PRIMARY KEY,
--     peruca_id INTEGER NOT NULL,
--     solicitacao_id INTEGER NOT NULL,
--     instituicao_id INTEGER NOT NULL,
--     data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     observacao TEXT,
--     FOREIGN KEY (peruca_id) REFERENCES peruca(id) ON DELETE CASCADE,
--     FOREIGN KEY (solicitacao_id) REFERENCES solicitacao(id) ON DELETE CASCADE,
--     FOREIGN KEY (instituicao_id) REFERENCES usuario(id) ON DELETE CASCADE
-- );

-- CREATE TABLE recebimento
-- (
--     id SERIAL PRIMARY KEY,
--     cabelo_id INTEGER NOT NULL,
--     instituicao_id INTEGER NOT NULL,
--     pessoa_fisica_id INTEGER NOT NULL,
--     data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     observacao TEXT,
--     FOREIGN KEY (cabelo_id) REFERENCES cabelo(id) ON DELETE CASCADE,
--     FOREIGN KEY (instituicao_id) REFERENCES usuario(id) ON DELETE CASCADE,
--     FOREIGN KEY (pessoa_fisica_id) REFERENCES usuario(id) ON DELETE CASCADE
-- );


-- CREATE TABLE publicacao
-- (
--     id SERIAL PRIMARY KEY,
--     usuario_id INTEGER NOT NULL,
--     titulo VARCHAR(200) NOT NULL,
--     conteudo TEXT NOT NULL,
--     data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     qtd_curtidas INTEGER DEFAULT 0,
--     FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
-- );

-- CREATE TABLE comentario
-- (
--     id SERIAL PRIMARY KEY,
--     publicacao_id INTEGER NOT NULL,
--     usuario_id INTEGER NOT NULL,
--     conteudo VARCHAR(1000) NOT NULL,
--     data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     qtd_curtidas INTEGER DEFAULT 0,
--     FOREIGN KEY (publicacao_id) REFERENCES publicacao(id) ON DELETE CASCADE,
--     FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
-- );

-- CREATE TABLE anexo_publicacao
-- (
--     id SERIAL PRIMARY KEY,
--     publicacao_id INTEGER NOT NULL,
--     foto BYTEA NOT NULL,
--     FOREIGN KEY (publicacao_id) REFERENCES publicacao(id) ON DELETE CASCADE
-- );

-- CREATE TABLE curtida_publicacao
-- (
--     id SERIAL PRIMARY KEY,
--     publicacao_id INTEGER NOT NULL,
--     usuario_id INTEGER NOT NULL,
--     data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY (publicacao_id) REFERENCES publicacao(id) ON DELETE CASCADE,
--     FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
--     UNIQUE(publicacao_id, usuario_id)
-- );

-- CREATE INDEX idx_curtida_publicacao_publicacao_id ON curtida_publicacao(publicacao_id);
-- CREATE INDEX idx_curtida_publicacao_usuario_id ON curtida_publicacao(usuario_id);

-- CREATE TABLE curtida_comentario
-- (
--     id SERIAL PRIMARY KEY,
--     comentario_id INTEGER NOT NULL,
--     usuario_id INTEGER NOT NULL,
--     data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY (comentario_id) REFERENCES comentario(id) ON DELETE CASCADE,
--     FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
--     UNIQUE(comentario_id, usuario_id)
-- );

-- CREATE INDEX idx_curtida_comentario_comentario_id ON curtida_comentario(comentario_id);
-- CREATE INDEX idx_curtida_comentario_usuario_id ON curtida_comentario(usuario_id);

-- CREATE TABLE blacklisted_tokens
-- (
--     id SERIAL PRIMARY KEY,
--     token TEXT NOT NULL UNIQUE,
--     expiresAt TIMESTAMP NOT NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- CREATE INDEX idx_blacklisted_tokens_token ON blacklisted_tokens(token);
-- CREATE INDEX idx_blacklisted_tokens_expires_at ON blacklisted_tokens(expiresAt);

CREATE TABLE notificacao
(
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensagem TEXT NOT NULL,
    lida BOOLEAN DEFAULT FALSE NOT NULL,
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    publicacao_id INTEGER,
    comentario_id INTEGER,
    solicitacao_id INTEGER,
    recebimento_id INTEGER,
    usuario_origem_id INTEGER,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (publicacao_id) REFERENCES publicacao(id) ON DELETE CASCADE,
    FOREIGN KEY (comentario_id) REFERENCES comentario(id) ON DELETE CASCADE,
    FOREIGN KEY (solicitacao_id) REFERENCES solicitacao(id) ON DELETE CASCADE,
    FOREIGN KEY (recebimento_id) REFERENCES recebimento(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_origem_id) REFERENCES usuario(id) ON DELETE CASCADE
);

CREATE INDEX idx_notificacao_usuario_id ON notificacao(usuario_id);
CREATE INDEX idx_notificacao_lida ON notificacao(lida);
CREATE INDEX idx_notificacao_data_hora ON notificacao(data_hora DESC);

-- CREATE OR REPLACE FUNCTION atualizar_qtd_curtidas_publicacao()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     IF TG_OP = 'INSERT' THEN
--         UPDATE publicacao 
--         SET qtd_curtidas = qtd_curtidas + 1 
--         WHERE id = NEW.publicacao_id;
--     ELSIF TG_OP = 'DELETE' THEN
--         UPDATE publicacao 
--         SET qtd_curtidas = qtd_curtidas - 1 
--         WHERE id = OLD.publicacao_id;
--     END IF;
--     RETURN NULL;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER trigger_atualizar_qtd_curtidas_publicacao
-- AFTER INSERT OR DELETE ON curtida_publicacao
-- FOR EACH ROW
-- EXECUTE FUNCTION atualizar_qtd_curtidas_publicacao();

-- CREATE OR REPLACE FUNCTION atualizar_qtd_curtidas_comentario()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     IF TG_OP = 'INSERT' THEN
--         UPDATE comentario 
--         SET qtd_curtidas = qtd_curtidas + 1 
--         WHERE id = NEW.comentario_id;
--     ELSIF TG_OP = 'DELETE' THEN
--         UPDATE comentario 
--         SET qtd_curtidas = qtd_curtidas - 1 
--         WHERE id = OLD.comentario_id;
--     END IF;
--     RETURN NULL;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER trigger_atualizar_qtd_curtidas_comentario
-- AFTER INSERT OR DELETE ON curtida_comentario
-- FOR EACH ROW
-- EXECUTE FUNCTION atualizar_qtd_curtidas_comentario();

-- CREATE TRIGGER trigger_validar_usuario_cpf_cnpj
-- AFTER INSERT OR UPDATE ON usuario
-- FOR EACH ROW
-- EXECUTE FUNCTION validar_usuario_cpf_cnpj();

-- INSERT INTO status_solicitacao (id, nome) VALUES (1, 'Pendente');
-- INSERT INTO status_solicitacao (id, nome) VALUES (2, 'Em Análise');
-- INSERT INTO status_solicitacao (id, nome) VALUES (3, 'Aprovada');
-- INSERT INTO status_solicitacao (id, nome) VALUES (4, 'Recusada');
-- INSERT INTO status_solicitacao (id, nome) VALUES (5, 'Concluída');

-- INSERT INTO cor (nome) VALUES ('Preto');
-- INSERT INTO cor (nome) VALUES ('Castanho Escuro');
-- INSERT INTO cor (nome) VALUES ('Castanho Médio');
-- INSERT INTO cor (nome) VALUES ('Castanho Claro');
-- INSERT INTO cor (nome) VALUES ('Loiro Escuro');
-- INSERT INTO cor (nome) VALUES ('Loiro Médio');
-- INSERT INTO cor (nome) VALUES ('Loiro Claro');
-- INSERT INTO cor (nome) VALUES ('Loiro Platinado');
-- INSERT INTO cor (nome) VALUES ('Ruivo Escuro');
-- INSERT INTO cor (nome) VALUES ('Ruivo Médio');
-- INSERT INTO cor (nome) VALUES ('Ruivo Claro');
-- INSERT INTO cor (nome) VALUES ('Grisalho');
-- INSERT INTO cor (nome) VALUES ('Branco');
-- INSERT INTO cor (nome) VALUES ('Cinza');