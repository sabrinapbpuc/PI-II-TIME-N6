//importando o servidor
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import oracledb from 'oracledb';
import { initPool, getConn, closePool } from "./db";
import "dotenv/config.js";
import { randomUUID } from "crypto";

//criando servidor
const app = express();
const PORT = Number(process.env.PORT ?? 3000);

app.use(express.json());
app.use(cors());

// Dados do usuário autenticado
type UsuarioSessao = {
    id_usuario: number;
    nome: string;
    cargo: string;
};

// Sessões temporárias dos usuários
const sessoes = new Map<string, UsuarioSessao>();

// Middleware para verificar quem está acessando a API
app.use((req: Request, res: Response, next) => {

    // Permite acessar o login sem estar autenticado
    if (req.path === "/login" && req.method === "POST") {
        return next();
    }

    const autorizacao = req.headers.authorization;

    if (!autorizacao) {
        return res.status(401).json({
            mensagem: "Você precisa fazer login."
        });
    }

    const token = autorizacao.replace("Bearer ", "");
    const usuario = sessoes.get(token);

    if (!usuario) {
        return res.status(401).json({
            mensagem: "Sessão inválida. Faça login novamente."
        });
    }

    (req as any).usuario = usuario;

    next();
});



async function iniciarServidor() {

    try {

        // Prepara o pool de conexões com o Oracle.

        await initPool();

        // Inicia o servidor HTTP.

        app.listen(PORT, () => {

            console.log(`Servidor ativo na porta ${PORT}`);

        });

        // Registra o encerramento ao pressionar Ctrl+C.

        process.on("SIGINT", encerrarServidor);

        // Registra o encerramento solicitado pelo ambiente.

        process.on("SIGTERM", encerrarServidor);

    } catch (erro) {

        console.error("Falha ao iniciar o servidor:", erro);

        process.exit(1);

    }

}

async function encerrarServidor() {

    try {

        await closePool();

        console.log("Pool de conexões encerrado.");

        process.exit(0);

    } catch (erro) {

        console.error("Falha ao encerrar o pool:", erro);

        process.exit(1);

    }

}

app.post("/login", async (req: Request, res: Response) => {

    const { email, senha } = req.body;

    let conn;

    try {
        conn = await getConn();

        const resultado = await conn.execute(
            `SELECT
                id_usuario AS "id_usuario",
                nome AS "nome",
                cargo AS "cargo"
             FROM USUARIO
             WHERE LOWER(email) = LOWER(:email)
             AND senha = :senha`,
            { email, senha },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (!resultado.rows || resultado.rows.length === 0) {
            return res.status(401).json({
                mensagem: "E-mail ou senha inválidos."
            });
        }

        const usuario = resultado.rows[0] as UsuarioSessao;

        const token = randomUUID();

        sessoes.set(token, usuario);

        return res.status(200).json({
            mensagem: "Login realizado com sucesso!",
            token,
            usuario
        });

    } catch (erro) {
        console.error("Erro no login:", erro);

        return res.status(500).json({
            mensagem: "Erro ao realizar login."
        });

    } finally {
        if (conn) await conn.close();
    }
});

app.get("/demandas", async (req: Request, res: Response) => {

    const usuario = (req as any).usuario;
    const ehMembro = usuario.cargo === "Membro da Equipe" ? 1 : 0;
    const status = String(req.query.status ?? "");

    let conn;

    try {
        conn = await getConn();

        let sql = `
            SELECT
                d.id_demanda AS "id",
                d.titulo AS "titulo",
                d.descricao AS "descricao",
                d.prioridade AS "prioridade",
                d.status AS "status",
                c.nome AS "tipoDemanda",
                u.nome AS "responsavel"
            FROM DEMANDA d
            JOIN CATEGORIA c
                ON d.categoria_id = c.id_categoria
            LEFT JOIN USUARIO u
                ON d.responsavel_id = u.id_usuario
        `;

        const condicoes: string[] = [];
        const binds: any = {};

        // Administradores visualizam todas as demandas.
        // Os demais usuários visualizam as demandas dos projetos em que participam.
        // Membros também visualizam demandas atribuídas diretamente a eles.
        if (usuario.cargo !== "Administrador") {

            binds.ehMembro = ehMembro;
            binds.usuarioId = usuario.id_usuario;

            condicoes.push(`
                (
                    EXISTS (
                        SELECT 1
                        FROM USUARIO_PROJETO up
                        WHERE up.projeto_id = d.projeto_id
                        AND up.usuario_id = :usuarioId
                    )
                    OR (
                        :ehMembro = 1
                        AND d.responsavel_id = :usuarioId
                    )
                )
            `);
        }

        // Aplica o filtro de status, caso tenha sido informado.
        if (status) {
            condicoes.push("d.status = :status");
            binds.status = status;
        }

        if (condicoes.length > 0) {
            sql += " WHERE " + condicoes.join(" AND ");
        }

        sql += " ORDER BY d.id_demanda";

        const resultado = await conn.execute(
            sql,
            binds,
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        return res.status(200).json(resultado.rows ?? []);

    } catch (erro) {
        console.error("Erro ao listar demandas:", erro);

        return res.status(500).json({
            mensagem: "Erro ao listar demandas."
        });

    } finally {
        if (conn) await conn.close();
    }
});

app.get('/demandas/dashboard', async (req: Request, res: Response) => {

    const usuario = (req as any).usuario;

    let conn;

    try {
        conn = await getConn();

        const binds = {
            ehAdmin: usuario.cargo === "Administrador" ? 1 : 0,
            ehMembro: usuario.cargo === "Membro da Equipe" ? 1 : 0,
            usuarioId: usuario.id_usuario
        };

        // Busca as demandas que o usuário pode visualizar.
        const sqlGeral = `
            SELECT
                d.status AS "status",
                d.prioridade AS "prioridade",
                c.nome AS "tipo_demanda"
            FROM DEMANDA d
            LEFT JOIN CATEGORIA c
                ON d.categoria_id = c.id_categoria
            WHERE (
                :ehAdmin = 1
                OR EXISTS (
                    SELECT 1
                    FROM USUARIO_PROJETO up
                    WHERE up.projeto_id = d.projeto_id
                    AND up.usuario_id = :usuarioId
                )
                OR (
                    :ehMembro = 1
                    AND d.responsavel_id = :usuarioId
                )
            )
        `;

        const resultadoGeral = await conn.execute(
            sqlGeral,
            binds,
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const demandas: any[] = resultadoGeral.rows || [];

        const total = demandas.length;
        const abertas = demandas.filter(d => d.status === "Aberta").length;
        const emAndamento = demandas.filter(d => d.status === "Em Andamento").length;
        const emRevisao = demandas.filter(d => d.status === "Em Revisão").length;
        const concluidas = demandas.filter(d => d.status === "Concluída").length;
        const canceladas = demandas.filter(d => d.status === "Cancelada").length;

        // Busca demandas críticas.
        const sqlCriticas = `
            SELECT
                d.id_demanda AS "id",
                d.titulo AS "titulo",
                d.status AS "status"
            FROM DEMANDA d
            WHERE UPPER(d.prioridade) = 'CRÍTICA'
              AND UPPER(d.status) NOT IN ('CONCLUÍDA', 'CANCELADA')
              AND (
                  :ehAdmin = 1
                  OR EXISTS (
                    SELECT 1
                    FROM USUARIO_PROJETO up
                    WHERE up.projeto_id = d.projeto_id
                    AND up.usuario_id = :usuarioId
                )
                OR (
                    :ehMembro = 1
                    AND d.responsavel_id = :usuarioId
                )
              )
        `;

        const resCriticas = await conn.execute(
            sqlCriticas,
            binds,
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const criticas = resCriticas.rows || [];

        // Busca demandas próximas do prazo.
        const sqlPrazos = `
            SELECT
                d.id_demanda AS "id",
                d.titulo AS "titulo",
                TO_CHAR(d.prazo_final, 'YYYY-MM-DD') AS "prazo_finalizacao"
            FROM DEMANDA d
            WHERE d.prazo_final >= TRUNC(SYSDATE)
              AND d.prazo_final <= TRUNC(SYSDATE) + 5
              AND UPPER(d.status) NOT IN ('CONCLUÍDA', 'CANCELADA')
              AND (
                  :ehAdmin = 1
                  OR EXISTS (
                    SELECT 1
                    FROM USUARIO_PROJETO up
                    WHERE up.projeto_id = d.projeto_id
                    AND up.usuario_id = :usuarioId
                )
                OR (
                    :ehMembro = 1
                    AND d.responsavel_id = :usuarioId
                )
              )
            ORDER BY d.prazo_final ASC
        `;

        const resPrazos = await conn.execute(
            sqlPrazos,
            binds,
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const prazosProximos = resPrazos.rows || [];

        return res.status(200).json({
            total,
            abertas,
            emAndamento,
            emRevisao,
            concluidas,
            canceladas,
            criticas,
            prazosProximos
        });

    } catch (erro) {
        console.error("ERRO NO DASHBOARD:", erro);

        return res.status(500).json({
            mensagem: "Erro ao gerar dados do dashboard!"
        });

    } finally {
        if (conn) await conn.close();
    }
});


app.get('/demandas/:id', async (req: Request, res: Response) => {

    const { id } = req.params;
    const usuario = (req as any).usuario;

    let conn;

    try {
        conn = await getConn();

        const acesso = await conn.execute(
            `SELECT 1
             FROM DEMANDA d
             WHERE d.id_demanda = :id
             AND (
                 :ehAdmin = 1
                 OR EXISTS (
                     SELECT 1
                     FROM USUARIO_PROJETO up
                     WHERE up.projeto_id = d.projeto_id
                     AND up.usuario_id = :usuarioId
                 )
                 OR (
                     :ehMembro = 1
                     AND d.responsavel_id = :usuarioId
                 )
             )`,
            {
                id: Number(id),
                usuarioId: usuario.id_usuario,
                ehAdmin: usuario.cargo === "Administrador" ? 1 : 0,
                ehMembro: usuario.cargo === "Membro da Equipe" ? 1 : 0
            }
        );

        if (!acesso.rows || acesso.rows.length === 0) {
            return res.status(404).json({
                mensagem: "Demanda não encontrada ou você não tem acesso."
            });
        }

        const resultado = await conn.execute(
            `SELECT
                d.id_demanda AS "id_demanda",
                d.titulo AS "titulo",
                d.descricao AS "descricao",
                d.status AS "status",
                d.prioridade AS "prioridade",
                TO_CHAR(d.prazo_final, 'YYYY-MM-DD') AS "prazo_final",
                TO_CHAR(d.data_criacao, 'YYYY-MM-DD') AS "data_criacao",
                TO_CHAR(d.data_atualizacao, 'YYYY-MM-DD') AS "data_atualizacao",
                d.projeto_id AS "projeto_id",
                d.responsavel_id AS "responsavel_id",
                d.categoria_id AS "categoria_id",
                p.nome AS "projeto_nome",
                u.nome AS "responsavel_nome",
                c.nome AS "categoria_nome"
             FROM DEMANDA d
             LEFT JOIN PROJETO p
                ON d.projeto_id = p.id_projeto
             LEFT JOIN USUARIO u
                ON d.responsavel_id = u.id_usuario
             LEFT JOIN CATEGORIA c
                ON d.categoria_id = c.id_categoria
             WHERE d.id_demanda = :id`,
            { id: Number(id) },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        return res.status(200).json(resultado.rows?.[0]);

    } catch (erro) {
        console.error("Erro ao buscar detalhes da demanda:", erro);

        return res.status(500).json({
            mensagem: "Erro ao buscar demanda."
        });

    } finally {
        if (conn) await conn.close();
    }
});

// Rota para buscar o histórico de uma demanda

app.get('/demandas/:id/historico', async (req: Request, res: Response) => {

    const { id } = req.params;
    const usuario = (req as any).usuario;

    let conn;

    try {
        conn = await getConn();

        const acesso = await conn.execute(
            `SELECT 1
             FROM DEMANDA d
             WHERE d.id_demanda = :id
             AND (
                 :ehAdmin = 1
                 OR EXISTS (
                     SELECT 1
                     FROM USUARIO_PROJETO up
                     WHERE up.projeto_id = d.projeto_id
                     AND up.usuario_id = :usuarioId
                 )
                 OR (
                     :ehMembro = 1
                     AND d.responsavel_id = :usuarioId
                 )
             )`,
            {
                id: Number(id),
                usuarioId: usuario.id_usuario,
                ehAdmin: usuario.cargo === "Administrador" ? 1 : 0,
                ehMembro: usuario.cargo === "Membro da Equipe" ? 1 : 0
            }
        );

        if (!acesso.rows || acesso.rows.length === 0) {
            return res.status(403).json({
                mensagem: "Você não tem acesso ao histórico desta demanda."
            });
        }

        const resultado = await conn.execute(
            `SELECT
                h.id_historico AS "id",
                h.campo_alterado AS "campo_alterado",
                h.valor_anterior AS "valor_anterior",
                h.valor_novo AS "valor_novo",
                h.data_alteracao AS "data_alteracao",
                u.nome AS "usuario"
             FROM HISTORICO h
             LEFT JOIN USUARIO u
                ON h.usuario_id = u.id_usuario
             WHERE h.demanda_id = :id
             ORDER BY h.data_alteracao DESC`,
            { id: Number(id) },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        return res.status(200).json(resultado.rows ?? []);

    } catch (erro) {
        console.error("Erro ao buscar histórico:", erro);

        return res.status(500).json({
            mensagem: "Erro ao buscar histórico."
        });

    } finally {
        if (conn) await conn.close();
    }
});





// Cadastra um comentário em uma demanda.
app.post('/demandas/:id/comentarios', async (req: Request, res: Response) => {

    const usuario = (req as any).usuario;
    const id = Number(req.params.id);
    const conteudo = String(req.body.conteudo ?? "").trim();

    let conn;

    try {

        if (!conteudo || conteudo.length < 3 || conteudo.length > 500) {
            return res.status(400).json({
                mensagem: "O comentário deve ter entre 3 e 500 caracteres."
            });
        }

        conn = await getConn();

        const acesso = await conn.execute(
            `SELECT 1
             FROM DEMANDA d
             WHERE d.id_demanda = :id
             AND (
                 :ehAdmin = 1
                 OR EXISTS (
                     SELECT 1
                     FROM USUARIO_PROJETO up
                     WHERE up.projeto_id = d.projeto_id
                     AND up.usuario_id = :usuarioId
                 )
                 OR (
                     :ehMembro = 1
                     AND d.responsavel_id = :usuarioId
                 )
             )`,
            {
                id,
                usuarioId: usuario.id_usuario,
                ehAdmin: usuario.cargo === "Administrador" ? 1 : 0,
                ehMembro: usuario.cargo === "Membro da Equipe" ? 1 : 0
            }
        );

        if (!acesso.rows || acesso.rows.length === 0) {
            return res.status(403).json({
                mensagem: "Você não tem acesso a esta demanda."
            });
        }

        await conn.execute(
            `INSERT INTO COMENTARIO (
                id_comentario,
                conteudo,
                usuario_id,
                demanda_id
            ) VALUES (
                (SELECT NVL(MAX(id_comentario), 0) + 1 FROM COMENTARIO),
                :conteudo,
                :usuarioId,
                :demandaId
            )`,
            {
                conteudo,
                usuarioId: usuario.id_usuario,
                demandaId: id
            },
            { autoCommit: true }
        );

        return res.status(201).json({
            mensagem: "Comentário cadastrado com sucesso!"
        });

    } catch (erro) {
        console.error("Erro ao cadastrar comentário:", erro);

        return res.status(500).json({
            mensagem: "Erro ao cadastrar comentário."
        });

    } finally {
        if (conn) await conn.close();
    }
});

// Verifica se o cargo possui determinada permissão
function exigirCargos(...cargosPermitidos: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const usuario = (req as any).usuario as UsuarioSessao;

        if (!cargosPermitidos.includes(usuario.cargo)) {
            res.status(403).json({
                mensagem: "Você não possui permissão para realizar esta ação."
            });
            return;
        }

        next();
    };
}

app.post(
    '/demandas',
    exigirCargos("Administrador", "Líder de Projeto"),
    async (req: Request, res: Response) => {

        const usuario = (req as any).usuario;

        const {
            titulo,
            descricao,
            status,
            prioridade,
            prazo_final,
            projeto_id,
            responsavel_id,
            categoria_id
        } = req.body;

        const criador_id = usuario.id_usuario;

        let conn;

        try {

            conn = await getConn();

            if (usuario.cargo === "Líder de Projeto") {

                const verificacao = await conn.execute(
                    `SELECT 1
                     FROM USUARIO_PROJETO
                     WHERE usuario_id = :usuarioId
                     AND projeto_id = :projetoId`,
                    {
                        usuarioId: usuario.id_usuario,
                        projetoId: Number(projeto_id)
                    }
                );

                if (!verificacao.rows || verificacao.rows.length === 0) {
                    return res.status(403).json({
                        mensagem: "Você não participa deste projeto."
                    });
                }
            }

            const sql = `
                INSERT INTO DEMANDA (
                    id_demanda,
                    titulo,
                    descricao,
                    status,
                    prioridade,
                    prazo_final,
                    projeto_id,
                    criador_id,
                    responsavel_id,
                    categoria_id
                ) VALUES (
                    (SELECT NVL(MAX(id_demanda), 0) + 1 FROM DEMANDA),
                    :titulo,
                    :descricao,
                    :status,
                    :prioridade,
                    TO_DATE(:prazo_final, 'YYYY-MM-DD'),
                    :projeto_id,
                    :criador_id,
                    :responsavel_id,
                    :categoria_id
                )
            `;

            await conn.execute(
                sql,
                {
                    titulo,
                    descricao,
                    status,
                    prioridade,
                    prazo_final,
                    projeto_id: Number(projeto_id),
                    criador_id,
                    responsavel_id: responsavel_id ? Number(responsavel_id) : null,
                    categoria_id: Number(categoria_id)
                },
                { autoCommit: true }
            );

            return res.status(201).json({
                mensagem: "Demanda criada com sucesso!"
            });

        } catch (erro) {
            console.error("ERRO DETALHADO NO ORACLE:", erro);

            return res.status(500).json({
                mensagem: "Erro ao cadastrar demanda no banco de dados."
            });

        } finally {
            if (conn) await conn.close();
        }
    }
);

app.put('/demandas/:id', async (req: Request, res: Response) => {

    const id = Number(req.params.id);
    const usuario = (req as any).usuario;

    let conn;

    try {

        conn = await getConn();

        // Busca os dados atuais da demanda.
        const resultadoAtual = await conn.execute(
            `SELECT
                titulo AS "titulo",
                descricao AS "descricao",
                status AS "status",
                prioridade AS "prioridade",
                TO_CHAR(prazo_final, 'YYYY-MM-DD') AS "prazo_final",
                projeto_id AS "projeto_id",
                responsavel_id AS "responsavel_id",
                categoria_id AS "categoria_id"
             FROM DEMANDA
             WHERE id_demanda = :id
             FOR UPDATE`,
            { id },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (!resultadoAtual.rows || resultadoAtual.rows.length === 0) {
            return res.status(404).json({
                mensagem: "Demanda não encontrada."
            });
        }

        const atual: any = resultadoAtual.rows[0];

        // Verifica se o usuário tem acesso à demanda.
        if (usuario.cargo !== "Administrador") {

            const acesso = await conn.execute(
                `SELECT 1
                 FROM DEMANDA d
                 WHERE d.id_demanda = :id
                 AND (
                     EXISTS (
                         SELECT 1
                         FROM USUARIO_PROJETO up
                         WHERE up.projeto_id = d.projeto_id
                         AND up.usuario_id = :usuarioId
                     )
                     OR (
                         :ehMembro = 1
                         AND d.responsavel_id = :usuarioId
                     )
                 )`,
                {
                    id,
                    usuarioId: usuario.id_usuario,
                    ehMembro: usuario.cargo === "Membro da Equipe" ? 1 : 0
                }
            );

            if (!acesso.rows || acesso.rows.length === 0) {
                await conn.rollback();

                return res.status(403).json({
                    mensagem: "Você não tem acesso a esta demanda."
                });
            }
        }

        // Recebe os dados enviados ou mantém os valores atuais.
        let {
            titulo,
            descricao,
            status,
            prioridade,
            prazo_final,
            projeto_id,
            responsavel_id,
            categoria_id
        } = req.body;

        titulo = titulo ?? atual.titulo;
        descricao = descricao ?? atual.descricao;
        status = status ?? atual.status;
        prioridade = prioridade ?? atual.prioridade;
        prazo_final = prazo_final ?? atual.prazo_final;
        projeto_id = projeto_id ?? atual.projeto_id;
        responsavel_id = responsavel_id === undefined
            ? atual.responsavel_id
            : responsavel_id;
        categoria_id = categoria_id ?? atual.categoria_id;

        // Regras específicas para o Membro da Equipe.
        if (usuario.cargo === "Membro da Equipe") {

            if (Number(atual.responsavel_id) !== usuario.id_usuario) {
                await conn.rollback();

                return res.status(403).json({
                    mensagem: "Você só pode atualizar demandas atribuídas a você."
                });
            }

            const transicaoPermitida =
                (atual.status === "Aberta" && status === "Em Andamento") ||
                (atual.status === "Em Andamento" && status === "Em Revisão");

            if (!transicaoPermitida) {
                await conn.rollback();

                return res.status(403).json({
                    mensagem: "Você não possui permissão para essa alteração de status."
                });
            }

            // O membro só pode alterar o status.
            titulo = atual.titulo;
            descricao = atual.descricao;
            prioridade = atual.prioridade;
            prazo_final = atual.prazo_final;
            projeto_id = atual.projeto_id;
            responsavel_id = atual.responsavel_id;
            categoria_id = atual.categoria_id;
        }

        // Líder precisa participar do projeto de destino.
        if (
            usuario.cargo === "Líder de Projeto" &&
            Number(projeto_id) !== Number(atual.projeto_id)
        ) {

            const projetoDestino = await conn.execute(
                `SELECT 1
                 FROM USUARIO_PROJETO
                 WHERE usuario_id = :usuarioId
                 AND projeto_id = :projetoId`,
                {
                    usuarioId: usuario.id_usuario,
                    projetoId: Number(projeto_id)
                }
            );

            if (!projetoDestino.rows || projetoDestino.rows.length === 0) {
                await conn.rollback();

                return res.status(403).json({
                    mensagem: "Você não participa do projeto de destino."
                });
            }
        }

        // Organiza os campos que serão comparados.
        const alteracoes = [
            { campo: "Título", anterior: atual.titulo, novo: titulo },
            { campo: "Descrição", anterior: atual.descricao, novo: descricao },
            { campo: "Status", anterior: atual.status, novo: status },
            { campo: "Prioridade", anterior: atual.prioridade, novo: prioridade },
            { campo: "Prazo final", anterior: atual.prazo_final, novo: prazo_final },
            { campo: "Projeto", anterior: atual.projeto_id, novo: projeto_id },
            { campo: "Responsável", anterior: atual.responsavel_id, novo: responsavel_id },
            { campo: "Categoria", anterior: atual.categoria_id, novo: categoria_id }
        ];

        function normalizar(valor: any) {
            if (valor === null || valor === undefined || valor === "") {
                return null;
            }

            return String(valor);
        }

        const camposAlterados = alteracoes.filter(item =>
            normalizar(item.anterior) !== normalizar(item.novo)
        );

        // Atualiza a demanda.
        await conn.execute(
            `UPDATE DEMANDA SET
                titulo = :titulo,
                descricao = :descricao,
                status = :status,
                prioridade = :prioridade,
                prazo_final = TO_DATE(:prazo_final, 'YYYY-MM-DD'),
                projeto_id = :projeto_id,
                responsavel_id = :responsavel_id,
                categoria_id = :categoria_id,
                data_atualizacao = SYSDATE
             WHERE id_demanda = :id`,
            {
                titulo,
                descricao,
                status,
                prioridade,
                prazo_final,
                projeto_id: Number(projeto_id),
                responsavel_id: responsavel_id ? Number(responsavel_id) : null,
                categoria_id: Number(categoria_id),
                id
            }
        );

        // Registra as alterações no histórico.
        for (const alteracao of camposAlterados) {

            await conn.execute(
                `INSERT INTO HISTORICO (
                    id_historico,
                    campo_alterado,
                    valor_anterior,
                    valor_novo,
                    data_alteracao,
                    usuario_id,
                    demanda_id
                ) VALUES (
                    (SELECT NVL(MAX(id_historico), 0) + 1 FROM HISTORICO),
                    :campo,
                    :anterior,
                    :novo,
                    SYSTIMESTAMP,
                    :usuarioId,
                    :id
                )`,
                {
                    campo: alteracao.campo,
                    anterior: normalizar(alteracao.anterior),
                    novo: normalizar(alteracao.novo),
                    usuarioId: usuario.id_usuario,
                    id
                }
            );
        }

        await conn.commit();

        return res.status(200).json({
            mensagem: "Demanda atualizada e histórico registrado com sucesso!",
            quantidadeAlteracoes: camposAlterados.length
        });

    } catch (erro) {

        if (conn) {
            await conn.rollback();
        }

        console.error("Erro ao atualizar demanda:", erro);

        return res.status(500).json({
            mensagem: "Erro ao atualizar demanda no banco de dados."
        });

    } finally {
        if (conn) await conn.close();
    }
});

// Cancela uma demanda sem excluir seu registro do banco.
app.delete(
    '/demandas/:id',
    exigirCargos("Administrador", "Líder de Projeto"),
    async (req: Request, res: Response) => {

        const usuario = (req as any).usuario;
        const id = Number(req.params.id);

        let conn;

        try {

            conn = await getConn();

            const resultado = await conn.execute(
                `SELECT
                    status AS "status",
                    projeto_id AS "projeto_id"
                 FROM DEMANDA
                 WHERE id_demanda = :id
                 FOR UPDATE`,
                { id },
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );

            if (!resultado.rows || resultado.rows.length === 0) {
                return res.status(404).json({
                    mensagem: "Demanda não encontrada."
                });
            }

            const demanda: any = resultado.rows[0];

            // O Líder só pode cancelar demandas dos projetos em que participa.
            if (usuario.cargo === "Líder de Projeto") {

                const acesso = await conn.execute(
                    `SELECT 1
                     FROM USUARIO_PROJETO
                     WHERE usuario_id = :usuarioId
                     AND projeto_id = :projetoId`,
                    {
                        usuarioId: usuario.id_usuario,
                        projetoId: Number(demanda.projeto_id)
                    }
                );

                if (!acesso.rows || acesso.rows.length === 0) {
                    await conn.rollback();

                    return res.status(403).json({
                        mensagem: "Você não tem permissão para cancelar esta demanda."
                    });
                }
            }

            if (demanda.status !== "Cancelada") {

                await conn.execute(
                    `UPDATE DEMANDA
                     SET status = 'Cancelada',
                         data_atualizacao = SYSDATE
                     WHERE id_demanda = :id`,
                    { id }
                );

                await conn.execute(
                    `INSERT INTO HISTORICO (
                        id_historico,
                        campo_alterado,
                        valor_anterior,
                        valor_novo,
                        data_alteracao,
                        usuario_id,
                        demanda_id
                    ) VALUES (
                        (SELECT NVL(MAX(id_historico), 0) + 1 FROM HISTORICO),
                        'Status',
                        :anterior,
                        'Cancelada',
                        SYSTIMESTAMP,
                        :usuarioId,
                        :id
                    )`,
                    {
                        anterior: demanda.status,
                        usuarioId: usuario.id_usuario,
                        id
                    }
                );
            }

            await conn.commit();

            return res.status(200).json({
                mensagem: "Demanda cancelada com sucesso!"
            });

        } catch (erro) {

            if (conn) await conn.rollback();

            console.error("Erro ao cancelar demanda:", erro);

            return res.status(500).json({
                mensagem: "Erro ao cancelar demanda."
            });

        } finally {
            if (conn) await conn.close();
        }
    }
);

//rota para listar os projetos
// Lista todos os projetos para o administrador
// Para os demais cargos, lista somente os projetos em que participa.
app.get('/projetos', async (req: Request, res: Response) => {

    const usuario = (req as any).usuario as UsuarioSessao;

    let conn;

    try {
        conn = await getConn();

        let sql = `
            SELECT
                p.id_projeto AS "id",
                p.nome AS "nome",
                p.descricao AS "descricao"
            FROM PROJETO p
        `;

        let binds: any = {};

        if (usuario.cargo !== "Administrador") {

            sql += `
                WHERE EXISTS (
                    SELECT 1
                    FROM USUARIO_PROJETO up
                    WHERE up.projeto_id = p.id_projeto
                    AND up.usuario_id = :usuarioId
                )
            `;

            binds.usuarioId = usuario.id_usuario;
        }

        sql += " ORDER BY p.nome";

        const resultado = await conn.execute(
            sql,
            binds,
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        return res.status(200).json(resultado.rows ?? []);

    } catch (erro) {
        console.error("Erro ao buscar projetos:", erro);

        return res.status(500).json({
            mensagem: "Erro ao buscar projetos."
        });

    } finally {
        if (conn) await conn.close();
    }
});

//rota para listar os usuários (pessoas)
app.get('/usuarios', async (req: Request, res: Response) => {

    const usuario = (req as any).usuario;

    let conn;

    try {
        conn = await getConn();

        let sql = `
            SELECT DISTINCT
                u.id_usuario AS "id_usuario",
                u.nome AS "nome"
            FROM USUARIO u
        `;

        const binds: any = {};

        if (usuario.cargo === "Líder de Projeto") {

            sql += `
                WHERE EXISTS (
                    SELECT 1
                    FROM USUARIO_PROJETO up
                    WHERE up.usuario_id = u.id_usuario
                    AND up.projeto_id IN (
                        SELECT projeto_id
                        FROM USUARIO_PROJETO
                        WHERE usuario_id = :usuarioId
                    )
                )
            `;

            binds.usuarioId = usuario.id_usuario;

        } else if (usuario.cargo !== "Administrador") {

            return res.status(403).json({
                mensagem: "Você não tem permissão para consultar usuários."
            });
        }

        sql += " ORDER BY u.nome";

        const resultado = await conn.execute(
            sql,
            binds,
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        return res.status(200).json(resultado.rows ?? []);

    } catch (erro) {

        console.error("Erro ao buscar usuários:", erro);

        return res.status(500).json({
            mensagem: "Erro ao buscar usuários!"
        });

    } finally {
        if (conn) await conn.close();
    }
});

app.get('/categorias', async (req: Request, res: Response) => {

    let conn;

    try {
        conn = await getConn();

        const resultado = await conn.execute(
            `SELECT
                id_categoria AS "id",
                nome AS "nome"
             FROM CATEGORIA`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        return res.status(200).json(resultado.rows ?? []);

    } catch (erro) {

        console.error("Erro ao buscar categorias:", erro);

        return res.status(500).json({
            mensagem: "Erro ao buscar categorias!"
        });

    } finally {
        if (conn) await conn.close();
    }
});

iniciarServidor();
