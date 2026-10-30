//importando o servidor
import express, { Request, Response } from "express";
import cors from "cors";

//criando servidor
const app = express();

app.use(express.json());
app.use(cors());
let PORT = 3000;

//QUANDO O SERVIDOR ACESSAR A PORTA, SERA MOSTRADO QUAL PORTA ESTA: PORTA 3000
app.listen(PORT, () => {
    console.log(`Servidor aberto na porta ${PORT}`)
});

type Projeto = "Projeto Farm+" | "Projeto CEP" | "Projeto Lojas Cem"
type Status = "Aberta" | "Em andamento" | "Em revisão" | "Concluida" | "Cancelada"
type TipoDemanda = "Tarefa" | "Defeito" | "Melhoria" | "Documentação"
type Prioridade = "Crítica" | " Alta " | "Média" | "Baixa"
type PerfilUsuario = "Administrador" | "Líder de Projeto" | "Membro da Equipe";

interface Usuario {
    id: number;
    nome: string;
    perfil: PerfilUsuario;
}

interface ProjetoModel {
    id: number;
    nome: string;
}

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
]


let projetos: ProjetoModel[] = [
    { id: 1, nome: "Projeto Farm+" },
    { id: 2, nome: "Projeto CEP" },
    { id: 3, nome: "Projeto Lojas Cem" }
];

let usuarios: Usuario[] = [
    { id: 1, nome: "Carlos", perfil: "Administrador" },
    { id: 2, nome: "Mariana", perfil: "Líder de Projeto" },
    { id: 3, nome: "Sabrina", perfil: "Membro da Equipe" }
];

//rota dashboard
app.get(`/demandas/dashboard`, (req: Request, res: Response) => {
    //conta o número total de demandas
    const totalDemanda = demandas.length;

    //filtra as demandas que possuem cada status e quantas são
    const abertas = demandas.filter(item => item.status === "Aberta").length;
    const emAndamento = demandas.filter(item => item.status === "Em andamento").length;
    const emRevisao = demandas.filter(item => item.status === "Em revisão").length;
    const concluidas = demandas.filter(item => item.status === "Concluida").length;
    const canceladas = demandas.filter(item => item.status === "Cancelada").length;

    //o reduce agrupa e conta quantas demandas existem para cada prioridade
    const porPrioridade = demandas.reduce((resultado: any, item) => {
        //se ja existem um item no resultado, ele soma +1, se não começa com 0 e soma 1
        resultado[item.prioridade] = (resultado[item.prioridade] || 0) + 1;

        //retorna o objeto atualizado
        return resultado;
    }, {}); //inicia com um item vazio

    //o reduce agrupa e conta quantas demandas existem para cada tipo de demanda
    const porTipo = demandas.reduce((resultado: any, item) => {
        resultado[item.tipoDemanda] = (resultado[item.tipoDemanda] || 0) + 1;
        return resultado;
    }, {});

    //retorna a resposta com status 200, contendo um JSON com todas as valores calculados
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

app.get(`/demandas`, (req: Request, res: Response) => {
    res.status(200).json(demandas)
})

app.get(`/demandas/:id`, (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const demanda = demandas.find((item => item.id === id))

    if (!demanda) {
        return res.status(404).json({ mensagem: "Demanda não encontrada!" })
    }

    return res.status(200).json(demanda)

})


app.post("/demandas", (req: Request, res: Response) => {
    const { id, titulo, descricao, tipoDemanda, prioridade, projetoAssociado, responsavel, prazoFinalizacao } = req.body;


    if (!titulo || !descricao || !tipoDemanda || !prioridade || !projetoAssociado || !prazoFinalizacao) {
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

app.put(`/demandas/:id`, (req: Request, res: Response) => {
    const id = Number(req.params.id)
    const { titulo, descricao, tipoDemanda, prioridade, status, projetoAssociado, responsavel, prazoFinalizacao, perfilUsuario } = req.body;
    const indice = demandas.findIndex(demanda => demanda.id === id)

    if (indice === -1) {
        return res.status(404).json({ mensagem: "Demanda não encontrada!" })
    }
    else if (!titulo || !descricao || !tipoDemanda || !prioridade || !projetoAssociado || !prazoFinalizacao) {
        return res.status(400).json({ mensagem: "Título, descrição, tipo de demanda, prioridade, projeto associado e prazo de finalização são obrigatórios" })
    }

     const demandaAtual = demandas[indice];
   
    if (perfilUsuario === "Membro da Equipe") {

        if (prioridade && prioridade !== demandaAtual.prioridade) {
            return res.status(403).json({ mensagem: "Acesso negado: Membros da equipe não podem alterar a prioridade!" });
        }
        if (responsavel && responsavel !== demandaAtual.responsavel) {
            return res.status(403).json({ mensagem: "Acesso negado: Membros da equipe não podem alterar o responsável!" });
        }
    }

    const dataAtual = new Date();
    demandas[indice] = {
        id: id,
        titulo: titulo ?? demandas[indice].titulo,
        descricao: descricao ?? demandas[indice].descricao,
        tipoDemanda: tipoDemanda ?? demandas[indice].tipoDemanda,
        prioridade: prioridade ?? demandas[indice].prioridade,
        status: status ?? demandas[indice].status,
        projetoAssociado: projetoAssociado ?? demandas[indice].projetoAssociado,
        responsavel: responsavel !== undefined ? responsavel : demandas[indice].responsavel,
        dataCriacao: demandas[indice].dataCriacao,
        dataUltimaAtualizacao: dataAtual,
        prazoFinalizacao: prazoFinalizacao ? new Date(prazoFinalizacao) : demandas[indice].prazoFinalizacao
    };

    return res.status(200).json(demandas[indice]);
});

app.delete("/demandas/:id", (req: Request, res: Response) => {
    const id = Number(req.params.id);
    let demanda = demandas.find(demanda => demanda.id === id);

    if (!demanda) {
        return res.status(404).json({ mensagem: "Demanda não encontrada" });
    }

    demanda.status = "Cancelada";
    demanda.dataUltimaAtualizacao = new Date();

    return res.status(200).json({
        mensagem: "Demanda cancelada com sucesso!",
        demanda
    });
});

app.get("/projetos", (req: Request, res: Response) => {
    return res.status(200).json(projetos);
});

app.get("/usuarios", (req: Request, res: Response) => {
    return res.status(200).json(usuarios);
});

app.post("/login", (req: Request, res: Response) => {
    const { nome } = req.body;

    const usuario = usuarios.find(usuario => usuario.nome.toLowerCase() === nome.toLowerCase());

    if (!usuario) {
        return res.status(404).json({ mensagem: "Usuário não encontrado!" });
    }

    return res.status(200).json({
        mensagem: `Login efetuado com sucesso como ${usuario.perfil}!`,
        usuario
    });
});