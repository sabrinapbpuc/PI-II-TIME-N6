document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // 1. BUSCAR A DEMANDA PELO ID DA URL
    // ==========================================

    const parametros = new URLSearchParams(window.location.search);
    const id = parametros.get("id");

    // Elementos que receberão os dados da demanda.
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

    // Formata uma data para o padrão brasileiro.
    function formatarData(data) {
        if (!data) return "Não informado";

        const dataFormatada = new Date(data);

        if (Number.isNaN(dataFormatada.getTime())) {
            return "Não informado";
        }

        return dataFormatada.toLocaleDateString("pt-BR");
    }

    // Preenche os elementos HTML com os dados recebidos.
    function preencherDemanda(demanda) {
        titulo.textContent = demanda.titulo;
        identificacao.textContent =
            `#${String(demanda.id).padStart(5, "0")}`;

        tipo.textContent = demanda.tipoDemanda;
        prioridade.textContent = demanda.prioridade;
        status.textContent = demanda.status;

        descricao.textContent = demanda.descricao;
        projeto.textContent = demanda.projetoAssociado;
        responsavel.textContent =
            demanda.responsavel || "Não atribuído";

        criacao.textContent = formatarData(demanda.dataCriacao);
        prazo.textContent = formatarData(demanda.prazoFinalizacao);
        atualizacao.textContent =
            formatarData(demanda.dataUltimaAtualizacao);
    }

    // Verifica se a URL possui um ID.
    if (!id || !Number.isInteger(Number(id)) || Number(id) <= 0) {
        titulo.textContent = "Demanda não identificada";
        descricao.textContent = "Não foi informado um ID válido.";
    } else {

        // Solicita ao backend a demanda correspondente.
        fetch(`http://localhost:3000/demandas/${id}`)
            .then(resposta => {
                if (!resposta.ok) {
                    throw new Error("Demanda não encontrada.");
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

    campo.setAttribute("maxlength", "500");

    campo.addEventListener("input", () => {
        contador.textContent =
            `${campo.value.length}/500 caracteres`;

        erro.textContent = "";
    });

    botao.addEventListener("click", (evento) => {
        evento.preventDefault();

        const comentario = campo.value.trim();

        if (comentario === "") {
            erro.textContent =
                "Digite um comentário antes de enviar.";
            campo.focus();
            return;
        }

        if (comentario.length < 3) {
            erro.textContent =
                "O comentário deve ter pelo menos 3 caracteres.";
            campo.focus();
            return;
        }

        if (comentario.length > 500) {
            erro.textContent =
                "O comentário deve ter no máximo 500 caracteres.";
            campo.focus();
            return;
        }

        const bloco = document.createElement("section");
        bloco.className = "comentario";

        const tituloComentario = document.createElement("h2");
        tituloComentario.textContent = "Você - agora";

        const texto = document.createElement("p");
        texto.textContent = comentario;

        bloco.append(tituloComentario, texto);

        areaComentarios.insertBefore(bloco, campo);

        campo.value = "";
        contador.textContent = "0/500 caracteres";
        erro.textContent =
            "Comentário adicionado somente nesta visualização.";
    });

});
