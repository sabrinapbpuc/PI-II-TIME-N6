document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // 1. BUSCAR A DEMANDA DO PROJETO SELECIONADO
    // ==========================================

    const parametros = new URLSearchParams(window.location.search);
    const id = parametros.get("id");

    // Recupera o projeto selecionado anteriormente
    const projetoId = localStorage.getItem("projetoSelecionado");

    // Elementos que receberão os dados da demanda
    const titulo = document.querySelector("#titulo-demanda");
    const identificacao = document.querySelector("#id-demanda");
    const tipo = document.querySelector("#tipo-demanda");
    const prioridade = document.querySelector("#prioridade-demanda");
    const status = document.querySelector("#status-demanda");
    const descricao = document.querySelector("#descricao-demanda");
    const projeto = document.querySelector("#projeto-demanda");
    const responsavel = document.querySelector("#responsavel-demanda");
    const criacao = document.querySelector("#criacao-demanda");
    const prazo = document.querySelector("#prazo-demanda");
    const atualizacao = document.querySelector("#atualizacao-demanda");

    // Formata uma data para o padrão brasileiro
    function formatarData(data) {
        if (!data) return "Não informado";

        const dataFormatada = new Date(data);

        if (Number.isNaN(dataFormatada.getTime())) {
            return "Não informado";
        }

        return dataFormatada.toLocaleDateString("pt-BR");
    }

    // Preenche os elementos HTML com os dados recebidos
    function preencherDemanda(demanda) {

        titulo.textContent = demanda.titulo;

        identificacao.textContent =
            `#${String(demanda.id_demanda).padStart(5, "0")}`;

        tipo.textContent = demanda.categoria_nome;
        prioridade.textContent = demanda.prioridade;
        status.textContent = demanda.status;

        descricao.textContent = demanda.descricao;

        projeto.textContent =
            demanda.projeto_nome || "Não informado";

        responsavel.textContent =
            demanda.responsavel_nome || "Não atribuído";

        criacao.textContent =
            formatarData(demanda.data_criacao);

        prazo.textContent =
            formatarData(demanda.prazo_final);

        atualizacao.textContent =
            formatarData(demanda.data_atualizacao);
    }

    // Verifica se a URL possui um ID válido e se existe projeto selecionado
    if (
        !id ||
        !Number.isInteger(Number(id)) ||
        Number(id) <= 0 ||
        !projetoId ||
        !Number.isInteger(Number(projetoId)) ||
        Number(projetoId) <= 0
    ) {

        titulo.textContent = "Demanda não identificada";

        descricao.textContent =
            "Não foi possível identificar a demanda ou o projeto selecionado.";

    } else {
        // Busca a demanda pelo ID.
        const token = localStorage.getItem("token");

        fetch(`http://localhost:3000/demandas/${id}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
            .then(resposta => {

                if (!resposta.ok) {
                    throw new Error("Não foi possível buscar a demanda.");
                }

                return resposta.json();
            })
            .then(demanda => {

                preencherDemanda(demanda);

            })
            .catch(erro => {

                console.error("Erro ao buscar demanda:", erro);

                titulo.textContent = "Erro ao carregar demanda";

                descricao.textContent =
                    "Não foi possível carregar as informações da demanda.";
            });
    }

    async function carregarHistorico() {

        const token = localStorage.getItem("token");

        try {

            const resposta = await fetch(
                `http://localhost:3000/demandas/${id}/historico`,
                {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                }
            );

            if (!resposta.ok) {
                throw new Error("Não foi possível carregar o histórico.");
            }

            const historico = await resposta.json();

            const lista = document.querySelector("#lista-historico");

            lista.innerHTML = "";

            if (historico.length === 0) {
                lista.textContent = "Nenhuma alteração registrada.";
                return;
            }

            historico.forEach(item => {

                const bloco = document.createElement("section");
                bloco.className = "historico";

                const titulo = document.createElement("h2");

                titulo.textContent =
                    `${formatarData(item.data_alteracao)} - ${item.usuario}`;

                const descricao = document.createElement("p");

                descricao.textContent =
                    `${item.campo_alterado}: ${item.valor_anterior ?? "Vazio"} → ${item.valor_novo ?? "Vazio"}`;

                bloco.append(titulo, descricao);

                lista.appendChild(bloco);
            });

        } catch (erro) {

            console.error("Erro ao carregar histórico:", erro);

            document.querySelector("#lista-historico").textContent =
                "Não foi possível carregar o histórico.";
        }
    }

    carregarHistorico();


    // ==========================================
    // 2. VALIDAÇÃO DOS COMENTÁRIOS
    // ==========================================

    const campo = document.querySelector("#comentario_id");
    const botao = document.querySelector(".btn-comentar");
    const areaComentarios = document.querySelector(
        ".container-comentarios"
    );

    const erro = document.createElement("p");
    erro.id = "erro-comentario";
    erro.setAttribute("role", "alert");

    const contador = document.createElement("small");
    contador.textContent = "0/500 caracteres";

    campo.insertAdjacentElement("afterend", contador);
    contador.insertAdjacentElement("afterend", erro);

    // Limita o comentário a 500 caracteres
    campo.setAttribute("maxlength", "500");

    // Atualiza o contador enquanto o usuário digita
    campo.addEventListener("input", () => {

        contador.textContent =
            `${campo.value.length}/500 caracteres`;

        erro.textContent = "";
    });

    // Valida e adiciona o comentário na tela
    botao.addEventListener("click", async (evento) => {

        evento.preventDefault();

        const comentario = campo.value.trim();

        if (comentario === "") {
            erro.textContent = "Digite um comentário antes de enviar.";
            campo.focus();
            return;
        }

        if (comentario.length < 3 || comentario.length > 500) {
            erro.textContent = "O comentário deve ter entre 3 e 500 caracteres.";
            campo.focus();
            return;
        }

        const token = localStorage.getItem("token");

        try {

            const resposta = await fetch(
                `http://localhost:3000/demandas/${id}/comentarios`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        conteudo: comentario
                    })
                }
            );

            const dados = await resposta.json();

            if (!resposta.ok) {
                throw new Error(dados.mensagem || "Erro ao enviar comentário.");
            }

            const bloco = document.createElement("section");
            bloco.className = "comentario";

            const tituloComentario = document.createElement("h2");
            const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));

            tituloComentario.textContent = `${usuario.nome} - agora`;

            const texto = document.createElement("p");
            texto.textContent = comentario;

            bloco.append(tituloComentario, texto);

            areaComentarios.insertBefore(bloco, campo);

            campo.value = "";
            contador.textContent = "0/500 caracteres";
            erro.textContent = "Comentário salvo com sucesso!";

        } catch (erroEnvio) {

            console.error(erroEnvio);
            erro.textContent = erroEnvio.message;
        }
    });

});
