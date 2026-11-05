document.addEventListener("DOMContentLoaded", () => {
    const busca = document.querySelector("#busca_id");
    const status = document.querySelector("#status_id");
    const prioridade = document.querySelector("#prioridade_id");
    const responsavel = document.querySelector("#responsavel_id");
    const tipo = document.querySelector("#tipo_id");
    const mensagem = document.querySelector("#mensagem-listagem");
    const tbody = document.querySelector("tbody");

    // Armazena as demandas recebidas do servidor.
    let demandas = [];

    function normalizar(texto) {
        return String(texto ?? "")
            .trim()
            .toLocaleLowerCase("pt-BR")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }

    // Converte os valores dos filtros para os valores da API.
    const statusAPI = {
        aberta: "Aberta",
        em_andamento: "Em andamento",
        em_revisao: "Em revisão",
        concluida: "Concluida"
    };

    const tipoAPI = {
        tarefa: "Tarefa",
        defeito: "Defeito",
        melhoria: "Melhoria",
        documento: "Documentação"
    };

    const prioridadeAPI = {
        baixa: "Baixa",
        media: "Média",
        alta: "Alta",
        critica: "Crítica"
    };

    // Adiciona os responsáveis recebidos do servidor.
    function preencherResponsaveis() {
        const usuarios = [
            ...new Set(
                demandas
                    .map(demanda => demanda.responsavel)
                    .filter(Boolean)
            )
        ];

        usuarios.forEach(usuario => {
            const opcao = document.createElement("option");
            opcao.value = usuario;
            opcao.textContent = usuario;
            responsavel.appendChild(opcao);
        });
    }

    // Monta a tabela usando os dados da API.
    function montarTabela() {
        tbody.innerHTML = "";

        demandas.forEach(demanda => {
            const linha = document.createElement("tr");

            linha.dataset.descricao = demanda.descricao || "";
            linha.dataset.titulo = demanda.titulo || "";
            linha.dataset.tipo = demanda.tipoDemanda || "";
            linha.dataset.prioridade = demanda.prioridade || "";
            linha.dataset.status = demanda.status || "";
            linha.dataset.responsavel = demanda.responsavel || "";

            // Abre os detalhes da demanda selecionada.
            linha.addEventListener("click", () => {
                window.location.href =
                    `../detalhes/detalhes.html?id=${demanda.id}`;
            });

            const colunaTitulo = document.createElement("td");
            colunaTitulo.textContent = demanda.titulo;

            const colunaTipo = document.createElement("td");
            colunaTipo.className = "txt-mutado";
            colunaTipo.textContent = demanda.tipoDemanda;

            const colunaPrioridade = document.createElement("td");
            const badge = document.createElement("span");
            badge.className =
                `badge ${normalizar(demanda.prioridade).replace(" ", "-")}`;
            badge.textContent = demanda.prioridade;
            colunaPrioridade.appendChild(badge);

            const colunaStatus = document.createElement("td");
            colunaStatus.className = "txt-mutado";
            colunaStatus.textContent = demanda.status;

            const colunaResponsavel = document.createElement("td");
            colunaResponsavel.className = "txt-mutado";
            colunaResponsavel.textContent =
                demanda.responsavel || "Não Atribuído";

            linha.append(
                colunaTitulo,
                colunaTipo,
                colunaPrioridade,
                colunaStatus,
                colunaResponsavel
            );

            tbody.appendChild(linha);
        });
    }

    // Aplica os filtros nas linhas montadas.
    function filtrarDemandas() {
        const termo = normalizar(busca.value);
        const linhas = tbody.querySelectorAll("tr");
        let quantidade = 0;

        linhas.forEach(linha => {
            const texto = normalizar(
                linha.dataset.titulo + " " + linha.dataset.descricao
            );

            const correspondeBusca = texto.includes(termo);

            const correspondeStatus =
                !status.value ||
                normalizar(linha.dataset.status) ===
                normalizar(statusAPI[status.value]);

            const correspondePrioridade =
                !prioridade.value ||
                normalizar(linha.dataset.prioridade) ===
                normalizar(prioridadeAPI[prioridade.value]);

            const correspondeTipo =
                !tipo.value ||
                normalizar(linha.dataset.tipo) ===
                normalizar(tipoAPI[tipo.value]);

            const correspondeResponsavel =
                !responsavel.value ||
                (responsavel.value === "sem_responsavel"
                    ? !linha.dataset.responsavel
                    : normalizar(linha.dataset.responsavel) ===
                      normalizar(responsavel.value));

            const mostrar =
                correspondeBusca &&
                correspondeStatus &&
                correspondePrioridade &&
                correspondeTipo &&
                correspondeResponsavel;

            linha.hidden = !mostrar;

            if (mostrar) {
                quantidade++;
            }
        });

        mensagem.textContent = quantidade > 0
            ? `${quantidade} demanda(s) encontrada(s).`
            : "Nenhuma demanda encontrada. Tente outros filtros.";
    }

    // Busca as demandas no servidor.
    fetch("http://localhost:3000/demandas")
        .then(resposta => {
            if (!resposta.ok) {
                throw new Error("Não foi possível carregar as demandas.");
            }

            return resposta.json();
        })
        .then(dados => {
            demandas = dados;

            preencherResponsaveis();
            montarTabela();
            filtrarDemandas();
        })
        .catch(erro => {
            console.error("Erro:", erro);
            mensagem.textContent =
                "Não foi possível carregar as demandas. Verifique se o servidor está funcionando.";
        });

    busca.addEventListener("input", filtrarDemandas);

    [status, prioridade, responsavel, tipo].forEach(filtro => {
        filtro.addEventListener("change", filtrarDemandas);
    });
});
