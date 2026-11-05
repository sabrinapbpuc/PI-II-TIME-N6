// Importando as bibliotecas
import express, { Request, Response } from "express";
import cors from "cors";
import oracledb from "oracledb";
import { initPool, getConn, closePool } from "./db";
import "dotenv/config.js";

// Criando o servidor
const app = express();
app.use(express.json());
app.use(cors());

const PORT = Number(process.env.PORT ?? 3000);

// Tipos
type Projeto = "Projeto Farm+" | "Projeto CEP" | "Projeto Lojas Cem";
type Status = "Aberta" | "Em andamento" | "Em revisão" | "Concluída" | "Cancelada";
type TipoDemanda = "Tarefa" | "Defeito" | "Melhoria" | "Documentação";
type Prioridade = "Crítica" | "Alta" | "Média" | "Baixa";

// Interface da demanda
interface Demanda {
    id: number;
    titulo: string;
    descricao: string;
    tipoDemanda: TipoDemanda;
    prioridade: Prioridade;
    status: Status;
    projetoAssociado: Projeto;
    responsavel: string | null;
    dataCriacao: Date;
    dataUltimaAtualizacao: Date;
    prazoFinalizacao: Date;
}

// Demandas temporárias em memória
let demandas: Demanda[] = [
    {
        id: 1,
        titulo: "Criar Login",
        descricao: "Teste",
        tipoDemanda: "Defeito",
        prioridade: "Baixa",
        status: "Aberta",
        projetoAssociado: "Projeto Farm+",
        responsavel: "Sabrina",
        dataCriacao: new Date("1995-12-17T03:24:00"),
        dataUltimaAtualizacao: new Date("1995-12-17T03:24:00"),
        prazoFinalizacao: new Date("1995-12-17T03:24:00")
    }
];

// --------------------------------------------------
// LISTAR TODOS OS PROJETOS DO BANCO
// --------------------------------------------------

app.get("/api/projetos", async (req: Request, res: Response) => {
    let conn;

    try {
        conn = await getConn();

        const sql = `
            SELECT
                id_projeto AS "id_projeto",
                nome AS "nome",
                descricao AS "descricao"
            FROM PROJETO
            ORDER BY id_projeto
        `;

        const resultado = await conn.execute(
            sql,
            [],
            {
                outFormat: oracledb.OUT_FORMAT_OBJECT
            }
        );

        return res.status(200).json(resultado.rows ?? []);

    } catch (erro) {
        console.error("Erro ao listar projetos:", erro);

        return res.status(500).json({
            mensagem: "Erro ao listar projetos!"
        });

    } finally {
        if (conn) await conn.close();
    }
});

// --------------------------------------------------
// LISTAR DEMANDAS DE UM PROJETO ESPECÍFICO
// --------------------------------------------------


app.get(
    "/api/projetos/:projetoId/demandas",
    async (req: Request, res: Response) => {

        const projetoId = Number(req.params.projetoId);

        // Verifica se o ID do projeto é válido
        if (!Number.isInteger(projetoId) || projetoId <= 0) {
            return res.status(400).json({
                mensagem: "ID do projeto inválido!"
            });
        }

        let conn;

        try {
            conn = await getConn();

            const sql = `
                SELECT
                    d.id_demanda AS "id",
                    d.titulo AS "titulo",
                    d.descricao AS "descricao",
                    d.prioridade AS "prioridade",
                    d.status AS "status",
                    c.nome AS "tipoDemanda",
                    u.nome AS "responsavel",
                    p.nome AS "projetoAssociado",
                    d.data_criacao AS "dataCriacao",
                    d.prazo_final AS "prazoFinalizacao",
                    d.data_atualizacao AS "dataUltimaAtualizacao"
                FROM DEMANDA d
                JOIN CATEGORIA c
                    ON d.categoria_id = c.id_categoria
                JOIN PROJETO p
                    ON d.projeto_id = p.id_projeto
                LEFT JOIN USUARIO u
                    ON d.responsavel_id = u.id_usuario
                WHERE d.projeto_id = :projetoId
                ORDER BY d.id_demanda
            `;

            const resultado = await conn.execute(
                sql,
                { projetoId },
                {
                    outFormat: oracledb.OUT_FORMAT_OBJECT
                }
            );

            return res.status(200).json(resultado.rows ?? []);

        } catch (erro) {
            console.error("Erro ao listar demandas do projeto:", erro);

            return res.status(500).json({
                mensagem: "Erro ao listar demandas do projeto!"
            });

        } finally {
            if (conn) await conn.close();
        }
    }
);


// --------------------------------------------------
// ROTA INICIAL DE TESTE
// --------------------------------------------------

app.get("/", (req: Request, res: Response) => {
    res.send("Teste resposta do servidor");
});

// --------------------------------------------------
// ROTAS ANTIGAS DE DEMANDAS (DADOS EM MEMÓRIA)
// --------------------------------------------------

app.get("/demandas", (req: Request, res: Response) => {
    return res.status(200).json(demandas);
});

// Rota antiga do Dashboard
app.get("/demandas/dashboard", (req: Request, res: Response) => {

    const totalDemanda = demandas.length;

    const abertas = demandas.filter(
        item => item.status === "Aberta"
    ).length;

    const emAndamento = demandas.filter(
        item => item.status === "Em andamento"
    ).length;

    const emRevisao = demandas.filter(
        item => item.status === "Em revisão"
    ).length;

    const concluidas = demandas.filter(
        item => item.status === "Concluída"
    ).length;

    const canceladas = demandas.filter(
        item => item.status === "Cancelada"
    ).length;

    const porPrioridade = demandas.reduce((resultado: any, item) => {
        resultado[item.prioridade] =
            (resultado[item.prioridade] || 0) + 1;

        return resultado;
    }, {});

    const porTipo = demandas.reduce((resultado: any, item) => {
        resultado[item.tipoDemanda] =
            (resultado[item.tipoDemanda] || 0) + 1;

        return resultado;
    }, {});

    return res.status(200).json({
        totalDemanda,
        abertas,
        emAndamento,
        emRevisao,
        concluidas,
        canceladas,
        porPrioridade,
        porTipo
    });
});

// Buscar uma demanda pelo ID (rota antiga)
app.get("/demandas/:id", (req: Request, res: Response) => {

    const id = Number(req.params.id);

    const demanda = demandas.find(item => item.id === id);

    if (!demanda) {
        return res.status(404).json({
            mensagem: "Demanda não encontrada!"
        });
    }

    return res.status(200).json(demanda);
});

// Cadastrar uma demanda (rota antiga, em memória)
app.post("/demandas", (req: Request, res: Response) => {

    const {
        id,
        titulo,
        descricao,
        tipoDemanda,
        prioridade,
        projetoAssociado,
        responsavel,
        prazoFinalizacao
    } = req.body;

    if (
        !titulo ||
        !descricao ||
        !tipoDemanda ||
        !prioridade ||
        !projetoAssociado ||
        !prazoFinalizacao
    ) {
        return res.status(400).json({
            mensagem: "Todos os campos obrigatórios devem ser preenchidos."
        });
    }

    const dataAtual = new Date();

    const novaDemanda: Demanda = {
        id: id || (demandas.length + 1),
        titulo,
        descricao,
        tipoDemanda,
        prioridade,
        status: "Aberta",
        projetoAssociado,
        responsavel: responsavel || null,
        dataCriacao: dataAtual,
        dataUltimaAtualizacao: dataAtual,
        prazoFinalizacao: new Date(prazoFinalizacao)
    };

    demandas.push(novaDemanda);

    return res.status(201).json(novaDemanda);
});

// --------------------------------------------------
// INICIALIZAÇÃO E ENCERRAMENTO DO SERVIDOR
// --------------------------------------------------

async function iniciarServidor() {
    try {
        // Inicializa o pool de conexões com o Oracle
        await initPool();

        // Inicia o servidor após a conexão estar pronta
        app.listen(PORT, () => {
            console.log(`Servidor aberto na porta ${PORT}`);
        });

        process.on("SIGINT", encerrarServidor);
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

// Inicia o servidor
iniciarServidor();
