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


type Projeto = "Projeto Farm+" | "Projeto CEP" | "Projeto Lojas Cem"
type Status = "Aberta" | "Em andamento" | "Em revisão" | "Concluida" | "Cancelada"
type TipoDemanda = "Tarefa" | "Defeito" | "Melhoria" | "Documentação"
type Prioridade = "Crítica" | "Alta" | "Média" | "Baixa"

interface Demanda {
    id: number;
    titulo: string;
    descricao: string;
    tipoDemanda: TipoDemanda;
    prioridade: Prioridade;
    status: Status;
    projetoAssociado: Projeto;
    responsavel: string;
    dataCriacao: Date;
    dataUltimaAtualizacao: Date;
    prazoFinalizacao: Date;
}

let demandas: Demanda[] = [
    // {
    //     id: 1,
    //     titulo: "Criar Login",
    //     descricao: "Teste",
    //     tipoDemanda: "Defeito",
    //     prioridade: "Baixa",
    //     status: "Aberta",
    //     projetoAssociado: "Projeto Farm+",
    //     responsavel: "Sabrina",
    //     dataCriacao: new Date("1995-12-17T03:24:00"),
    //     dataUltimaAtualizacao: new Date("1995-12-17T03:24:00"),
    //     prazoFinalizacao: new Date("1995-12-17T03:24:00")
    // }
]


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

//rota dashboard
app.get(`/demandas/dashboard`, async (req: Request, res: Response) => {
    let conn;
    try {
        conn = await getConn();

        //busca todas as demandas com o nome da categoria correspondente
        const sql = `
            SELECT 
                d.status, 
                d.prioridade, 
                c.nome AS tipo_demanda 
            FROM DEMANDA d
            JOIN CATEGORIA c ON d.categoria_id = c.id_categoria
        `;

        const resultado = await conn.execute(sql, [], {
            outFormat: oracledb.OUT_FORMAT_OBJECT // Forma correta e recomendada
        });

        // Se o seu driver retorna as linhas em .rows (mapeadas para objetos)
        const demandas = resultado.rows || [];

        //contagem do número total de demandas
        const totalDemanda = demandas.length;

        //filtra as demandas que possuem cada status
        const abertas = demandas.filter((item: any) => item.STATUS === "Aberta").length;
        const emAndamento = demandas.filter((item: any) => item.STATUS === "Em Andamento").length;
        const emRevisao = demandas.filter((item: any) => item.STATUS === "Em Revisão").length;
        const concluidas = demandas.filter((item: any) => item.STATUS === "Concluída").length;
        const canceladas = demandas.filter((item: any) => item.STATUS === "Cancelada").length;

        //agrupa e conta quantas demandas existem para cada prioridade
        const porPrioridade = demandas.reduce((resultadoObj: any, item: any) => {
            resultadoObj[item.PRIORIDADE] = (resultadoObj[item.PRIORIDADE] || 0) + 1;
            return resultadoObj;
        }, {});

        //agrupa e conta quantas demandas existem para cada tipo (categoria)
        const porTipo = demandas.reduce((resultadoObj: any, item: any) => {
            resultadoObj[item.TIPO_DEMANDA] = (resultadoObj[item.TIPO_DEMANDA] || 0) + 1;
            return resultadoObj;
        }, {});

        // resposta com os dados json vinculados a cada atributo
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

    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ mensagem: "Erro ao gerar dados do dashboard!" });
    } finally {
        if (conn) await conn.close();
    }
});

app.get(`/demandas/:id`, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const demanda = demandas.find((item => item.id === id))

    if (!demanda) {
        return res.status(404).json({ mensagem: "Demanda não encontrada!" })
    }

    return res.status(200).json(demanda)

})

app.post("/demandas", (req: Request, res: Response) => {
    const { id, titulo, descricao, tipoDemanda, prioridade, status, projetoAssociado, responsavel, prazoFinalizacao } = req.body;


    if (!id || !titulo || !descricao || !tipoDemanda || !prioridade || !status || !projetoAssociado || !prazoFinalizacao) {
        return res.status(404).json({ mensagem: "Todos campos devem ser preenchidos" })
    }

    const dataAtual = new Date();
    const novaDemanda: Demanda = {
        id: id || demandas.length + 1,
        titulo, descricao,
        tipoDemanda,
        prioridade,
        status: "Aberta",
        projetoAssociado,
        responsavel: responsavel || null,
        dataCriacao: dataAtual,
        dataUltimaAtualizacao: dataAtual,
        prazoFinalizacao
    }
    demandas.push(novaDemanda);
    return res.status(201).json(novaDemanda)
})
