
-- =========================================
-- 1. USUARIO
-- =========================================

CREATE TABLE USUARIO (
    id_usuario NUMBER(10) PRIMARY KEY
        CHECK (id_usuario > 0),

    nome VARCHAR2(255) NOT NULL,
    email VARCHAR2(255) NOT NULL UNIQUE,
    senha VARCHAR2(255) NOT NULL,

    cargo VARCHAR2(30) DEFAULT 'Membro da Equipe' NOT NULL
        CHECK (cargo IN (
            'Administrador',
            'Líder de Projeto',
            'Membro da Equipe'
        ))
);


-- =========================================
-- 2. PROJETO
-- =========================================

CREATE TABLE PROJETO (
    id_projeto NUMBER(10) PRIMARY KEY
        CHECK (id_projeto > 0),

    nome VARCHAR2(255) NOT NULL,
    descricao VARCHAR2(500),
    data_criacao DATE DEFAULT SYSDATE NOT NULL
);


-- =========================================
-- 3. USUARIO_PROJETO
-- =========================================

CREATE TABLE USUARIO_PROJETO (
    projeto_id NUMBER(10) NOT NULL,
    usuario_id NUMBER(10) NOT NULL,
    data_entrada DATE DEFAULT SYSDATE,

    CONSTRAINT pk_usuario_projeto
        PRIMARY KEY (projeto_id, usuario_id),

    CONSTRAINT fk_up_projeto
        FOREIGN KEY (projeto_id)
        REFERENCES PROJETO(id_projeto),

    CONSTRAINT fk_up_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES USUARIO(id_usuario)
);


-- =========================================
-- 4. CATEGORIA
-- =========================================

CREATE TABLE CATEGORIA (
    id_categoria NUMBER(10) PRIMARY KEY
        CHECK (id_categoria > 0),

    nome VARCHAR2(30) NOT NULL UNIQUE
        CHECK (nome IN (
            'Tarefa',
            'Defeito',
            'Melhoria',
            'Documentação'
        ))
);


-- =========================================
-- 5. DEMANDA
-- =========================================

CREATE TABLE DEMANDA (
    id_demanda NUMBER(10) PRIMARY KEY
        CHECK (id_demanda > 0),

    titulo VARCHAR2(255) NOT NULL,
    descricao VARCHAR2(500),

    status VARCHAR2(20) DEFAULT 'Aberta' NOT NULL
        CHECK (status IN (
            'Aberta',
            'Em Andamento',
            'Em Revisão',
            'Concluída',
            'Cancelada'
        )),

    prioridade VARCHAR2(20) DEFAULT 'Baixa' NOT NULL
        CHECK (prioridade IN (
            'Baixa',
            'Média',
            'Alta',
            'Crítica'
        )),

    data_criacao DATE DEFAULT SYSDATE NOT NULL,
    prazo_final DATE NOT NULL,
    data_atualizacao DATE DEFAULT SYSDATE NOT NULL,

    projeto_id NUMBER(10) NOT NULL,
    criador_id NUMBER(10) NOT NULL,
    responsavel_id NUMBER(10),
    categoria_id NUMBER(10) NOT NULL,

    CONSTRAINT fk_demanda_projeto
        FOREIGN KEY (projeto_id)
        REFERENCES PROJETO(id_projeto),

    CONSTRAINT fk_demanda_criador
        FOREIGN KEY (criador_id)
        REFERENCES USUARIO(id_usuario),

    CONSTRAINT fk_demanda_responsavel
        FOREIGN KEY (responsavel_id)
        REFERENCES USUARIO(id_usuario),

    CONSTRAINT fk_demanda_categoria
        FOREIGN KEY (categoria_id)
        REFERENCES CATEGORIA(id_categoria)
);


-- =========================================
-- 6. COMENTARIO
-- =========================================

CREATE TABLE COMENTARIO (
    id_comentario NUMBER(10) PRIMARY KEY
        CHECK (id_comentario > 0),

    conteudo VARCHAR2(500) NOT NULL,
    data_comentario TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,

    usuario_id NUMBER(10) NOT NULL,
    demanda_id NUMBER(10) NOT NULL,

    CONSTRAINT fk_comentario_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES USUARIO(id_usuario),

    CONSTRAINT fk_comentario_demanda
        FOREIGN KEY (demanda_id)
        REFERENCES DEMANDA(id_demanda)
);


-- =========================================
-- 7. HISTORICO
-- =========================================

CREATE TABLE HISTORICO (
    id_historico NUMBER(10) PRIMARY KEY
        CHECK (id_historico > 0),

    campo_alterado VARCHAR2(255) NOT NULL,
    valor_anterior VARCHAR2(255),
    valor_novo VARCHAR2(255),

    data_alteracao TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,

    usuario_id NUMBER(10) NOT NULL,
    demanda_id NUMBER(10) NOT NULL,

    CONSTRAINT fk_historico_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES USUARIO(id_usuario),

    CONSTRAINT fk_historico_demanda
        FOREIGN KEY (demanda_id)
        REFERENCES DEMANDA(id_demanda)
);


-- =========================================
-- INSERT DE USUÁRIO
-- =========================================
INSERT INTO USUARIO (id_usuario, nome, email, senha, cargo) 
VALUES (1, 'Ana Silva', 'ana.silva@email.com', 'senha123', 'Administrador');

INSERT INTO USUARIO (id_usuario, nome, email, senha, cargo)
VALUES (2, 'HIGOR', 'higor@gmail.com', 'senha123', 'Membro da equipe');

-- =========================================
-- INSERT DE PROJETO
-- =========================================

INSERT INTO PROJETO (id_projeto, nome, descricao) 
VALUES (1, 'Sistema de Gestão', 'Projeto para controle interno de demandas.');


-- =========================================
-- INSERT VINCULANDO USUARIO AO PROJETO
-- =========================================
INSERT INTO USUARIO_PROJETO (projeto_id, usuario_id) 
VALUES (1, 1);


-- =========================================
-- INSERT CATEGORIA
-- =========================================
INSERT INTO CATEGORIA (id_categoria, nome) 
VALUES (1, 'Tarefa');


-- =========================================
-- INSERT DE DEMANDA
-- =========================================
INSERT INTO DEMANDA (
    id_demanda, titulo, descricao, status, prioridade, 
    prazo_final, projeto_id, criador_id, responsavel_id, categoria_id
) VALUES (
    1, 
    'Criar tela de login', 
    'Desenvolver a interface de autenticação de usuários.', 
    'Aberta', 
    'Alta', 
    TO_DATE('2026-12-31', 'YYYY-MM-DD'), 
    1, -- projeto_id
    1, -- criador_id
    1, -- responsavel_id
    1  -- categoria_id
);

-- =========================================
-- INSERT DE COMENTARIO
-- =========================================

INSERT INTO COMENTARIO (id_comentario, conteudo, usuario_id, demanda_id) 
VALUES (1, 'Iniciando o planejamento da interface de login.', 1, 1);


-- =========================================
-- INSERT DE HISTÓRICO DE ALTERAÇÕES
-- =========================================
INSERT INTO HISTORICO (id_historico, campo_alterado, valor_anterior, valor_novo, usuario_id, demanda_id) 
VALUES (1, 'status', 'Aberta', 'Em Andamento', 1, 1);