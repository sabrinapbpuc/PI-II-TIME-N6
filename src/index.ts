//importando o servidor
import express, { Request, Response } from "express";
import cors from "cors";
import oracledb from 'oracledb';
import { initPool, getConn, closePool } from "./db";
import "dotenv/config.js";

//criando servidor
const app = express();
const PORT = Number(process.env.PORT ?? 3000);

app.use(express.json());
app.use(cors());
iniciarServidor();

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


app.get(`/demandas`, async (req: Request, res: Response) => {
    const status = String(req.query.status ?? "");

    let conn;

    try {
        conn = await getConn();

        let sql = `SELECT 
                d.id_demanda AS "id",
                d.titulo AS "titulo",
                d.descricao AS "descricao",
                d.prioridade AS "prioridade",
                d.status AS "status",
                c.nome AS "tipoDemanda",
                u.nome AS "responsavel"
            FROM DEMANDA d
            JOIN CATEGORIA c ON d.categoria_id = c.id_categoria
            LEFT JOIN USUARIO u ON d.responsavel_id = u.id_usuario`;

        if (status) {
            sql += " WHERE status = :status"
        }
        //ele ordena por ID
        sql += ` ORDER BY id_demanda`


        const resultado = await conn.execute(sql, status ? { status } : {});

        return res.status(200).json(resultado.rows ?? []);
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ mensagem: "Erro ao listar demandas!" })
    } finally {
        if (conn) await conn.close();
    }
});

app.get('/demandas/dashboard', async (req: Request, res: Response) => {
    let conn;
    try {
        conn = await getConn();

        const sqlGeral = `
            SELECT 
                d.status AS "status", 
                d.prioridade AS "prioridade", 
                c.nome AS "tipo_demanda" 
            FROM DEMANDA d
            LEFT JOIN CATEGORIA c ON d.categoria_id = c.id_categoria
        `;
        const resultadoGeral = await conn.execute(sqlGeral, [], {
            outFormat: oracledb.OUT_FORMAT_OBJECT
        });
        const demandas = resultadoGeral.rows || [];

        const total = demandas.length;
        const abertas = demandas.filter((i: any) => i.status === "Aberta").length;
        const emAndamento = demandas.filter((i: any) => i.status === "Em Andamento").length;
        const emRevisao = demandas.filter((i: any) => i.status === "Em Revisão").length;
        const concluidas = demandas.filter((i: any) => i.status === "Concluída").length;
        const canceladas = demandas.filter((i: any) => i.status === "Cancelada").length;

        // Busca Críticas em Aberto (Nomeada como 'criticas' para o seu JS)
        const sqlCriticas = `
            SELECT id_demanda AS "id", titulo AS "titulo", status AS "status"
            FROM DEMANDA
            WHERE UPPER(prioridade) = 'CRÍTICA' 
              AND UPPER(status) NOT IN ('CONCLUÍDA', 'CANCELADA')
        `;
        const resCriticas = await conn.execute(sqlCriticas, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        const criticas = resCriticas.rows || [];

       
        // Busca Próximas ao Prazo (Apenas as que vencem de hoje até daqui a 5 dias, e que não estão concluídas/canceladas)
        const sqlPrazos = `
            SELECT id_demanda AS "id", titulo AS "titulo", TO_CHAR(prazo_final, 'YYYY-MM-DD') AS "prazo_finalizacao"
            FROM DEMANDA
            WHERE prazo_final IS NOT NULL 
              AND UPPER(status) NOT IN ('CONCLUÍDA', 'CANCELADA')
              AND prazo_final >= TRUNC(SYSDATE) 
              AND prazo_final <= TRUNC(SYSDATE) + 5
            ORDER BY prazo_final ASC
        `;
        const resPrazos = await conn.execute(sqlPrazos, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
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
        return res.status(500).json({ mensagem: "Erro ao gerar dados do dashboard!" });
    } finally {
        if (conn) await conn.close();
    }
});

app.get('/demandas/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    let conn;
    try {
        conn = await getConn();
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
             LEFT JOIN PROJETO p ON d.projeto_id = p.id_projeto
             LEFT JOIN USUARIO u ON d.responsavel_id = u.id_usuario
             LEFT JOIN CATEGORIA c ON d.categoria_id = c.id_categoria
             WHERE d.id_demanda = :id`,
            [id],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (!resultado.rows || resultado.rows.length === 0) {
            return res.status(404).json({ mensagem: "Demanda não encontrada." });
        }

        return res.status(200).json(resultado.rows[0]);
    } catch (erro) {
        console.error("Erro ao buscar detalhes da demanda:", erro);
        return res.status(500).json({ mensagem: "Erro ao buscar demanda." });
    } finally {
        if (conn) await conn.close();
    }
});

// Rota para buscar o histórico de uma demanda
app.get('/demandas/:id/historico', async (req: Request, res: Response) => {
    const { id } = req.params;

    let conn;

    try {
        conn = await getConn();

        const sql = `
            SELECT
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
            ORDER BY h.data_alteracao DESC
        `;

        const resultado = await conn.execute(
            sql,
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

app.post(`/demandas`, async (req: Request, res: Response) => {
    try {
        const { titulo, descricao, status, prioridade, prazo_final, projeto_id, criador_id, responsavel_id, categoria_id } = req.body;

        const conn = await getConn();

        const sql = `
            INSERT INTO DEMANDA (
                id_demanda, titulo, descricao, status, prioridade, prazo_final, 
                projeto_id, criador_id, responsavel_id, categoria_id
            ) VALUES (
                (SELECT NVL(MAX(id_demanda), 0) + 1 FROM DEMANDA),
                :titulo, :descricao, :status, :prioridade, TO_DATE(:prazo_final, 'YYYY-MM-DD'), 
                :projeto_id, :criador_id, :responsavel_id, :categoria_id
            )
        `;

        await conn.execute(sql, {
            titulo,
            descricao,
            status,
            prioridade,
            prazo_final,
            projeto_id: (projeto_id),
            criador_id: (criador_id),
            responsavel_id: (responsavel_id),
            categoria_id: (categoria_id)
        }, { autoCommit: true });

        await conn.close();
        return res.status(201).json({ mensagem: "Demanda criada com sucesso!" });

    } catch (erro) {
        console.error("ERRO DETALHADO NO ORACLE:", erro); // <--- Olhe o que aparece aqui no terminal
        return res.status(500).json({ mensagem: "Erro ao cadastrar demanda no banco de dados." });
    }
});


app.put('/demandas/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id);

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

    let conn;

    try {
        conn = await getConn();

        // 1. Busca os dados atuais da demanda.
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

        // 2. Organiza os campos que serão comparados.
        const alteracoes = [
            {
                campo: "Título",
                anterior: atual.titulo,
                novo: titulo
            },
            {
                campo: "Descrição",
                anterior: atual.descricao,
                novo: descricao
            },
            {
                campo: "Status",
                anterior: atual.status,
                novo: status
            },
            {
                campo: "Prioridade",
                anterior: atual.prioridade,
                novo: prioridade
            },
            {
                campo: "Prazo final",
                anterior: atual.prazo_final,
                novo: prazo_final
            },
            {
                campo: "Projeto",
                anterior: atual.projeto_id,
                novo: projeto_id
            },
            {
                campo: "Responsável",
                anterior: atual.responsavel_id,
                novo: responsavel_id
            },
            {
                campo: "Categoria",
                anterior: atual.categoria_id,
                novo: categoria_id
            }
        ];

        // 3. Identifica somente os campos que mudaram.
        function normalizar(valor: any) {
            if (valor === null || valor === undefined || valor === "") {
                return null;
            }

            return String(valor);
        }

        const camposAlterados = alteracoes.filter(item =>
            normalizar(item.anterior) !== normalizar(item.novo)
        );

        // 4. Atualiza a demanda.
        const sqlAtualizar = `
            UPDATE DEMANDA SET
                titulo = :titulo,
                descricao = :descricao,
                status = :status,
                prioridade = :prioridade,
                prazo_final = TO_DATE(:prazo_final, 'YYYY-MM-DD'),
                projeto_id = :projeto_id,
                responsavel_id = :responsavel_id,
                categoria_id = :categoria_id,
                data_atualizacao = SYSDATE
            WHERE id_demanda = :id
        `;

        await conn.execute(sqlAtualizar, {
            titulo,
            descricao,
            status,
            prioridade,
            prazo_final: prazo_final || null,
            projeto_id: projeto_id ? Number(projeto_id) : null,
            responsavel_id: responsavel_id ? Number(responsavel_id) : null,
            categoria_id: categoria_id ? Number(categoria_id) : null,
            id
        });

        // 5. Registra cada alteração na tabela HISTORICO.
        for (const alteracao of camposAlterados) {
            const sqlHistorico = `
                INSERT INTO HISTORICO (
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
                    SYSDATE,
                    NULL,
                    :id
                )
            `;

            await conn.execute(sqlHistorico, {
                campo: alteracao.campo,
                anterior: normalizar(alteracao.anterior),
                novo: normalizar(alteracao.novo),
                id
            });
        }

        // 6. Confirma as alterações no banco.
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

//rota para listar os projetos
app.get('/projetos', async (req: Request, res: Response) => {
    let conn;
    try {
        conn = await getConn();
        const resultado = await conn.execute(
            `SELECT id_projeto AS "id", nome AS "nome" FROM PROJETO`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return res.status(200).json(resultado.rows ?? []);
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ mensagem: "Erro ao buscar projetos!" });
    } finally {
        if (conn) await conn.close();
    }
});

//rota para listar os usuários (pessoas)
app.get('/usuarios', async (req: Request, res: Response) => {
    let conn;
    try {
        conn = await getConn();
        const resultado = await conn.execute(
            `SELECT id_usuario AS "id_usuario", nome AS "nome" FROM USUARIO`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return res.status(200).json(resultado.rows ?? []);
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ mensagem: "Erro ao buscar usuários!" });
    } finally {
        if (conn) await conn.close();
    }
});

app.get('/categorias', async (req: Request, res: Response) => {
    let conn;
    try {
        conn = await getConn();
        const resultado = await conn.execute(
            `SELECT id_categoria AS "id", nome AS "nome" FROM CATEGORIA`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return res.status(200).json(resultado.rows ?? []);
    } catch (erro) {
        console.error("Erro ao buscar categorias:", erro);
        return res.status(500).json({ mensagem: "Erro ao buscar categorias!" });
    } finally {
        if (conn) await conn.close();
    }
});
