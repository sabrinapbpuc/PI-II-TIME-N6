
document.addEventListener("DOMContentLoaded", () => {
    const busca = document.querySelector("#busca_id");
    const status = document.querySelector("#status_id");
    const prioridade = document.querySelector("#prioridade_id");
    const responsavel = document.querySelector("#responsavel_id");
    const tipo = document.querySelector("#tipo_id");
    const mensagem = document.querySelector("#mensagem-listagem");

    const linhas = document.querySelectorAll(
        "tbody tr"
    );

    // Responsáveis demonstrativos.
    // Futuramente, poderão vir da API e do banco.
    const usuarios = ["João", "Maria"];

    usuarios.forEach((usuario) => {
        const opcao = document.createElement("option");
        opcao.value = usuario;
        opcao.textContent = usuario;
        responsavel.appendChild(opcao);
    });

    function normalizar(texto) {
        return texto
            .trim()
            .toLocaleLowerCase("pt-BR")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }

    function filtrarDemandas() {
        const termo = normalizar(busca.value);
        let quantidade = 0;

        linhas.forEach((linha) => {
            const colunas = linha.querySelectorAll("td");

            const titulo = colunas[0]?.textContent || "";
            const descricao = linha.dataset.descricao || "";
            const tipoLinha = normalizar(colunas[1]?.textContent || "");
            const prioridadeLinha = normalizar(colunas[2]?.textContent || "");
            const statusLinha = normalizar(colunas[3]?.textContent || "");
            const responsavelLinha = normalizar(colunas[4]?.textContent || "");

            const correspondeBusca =
                normalizar(titulo + " " + descricao).includes(termo);

            const correspondeStatus =
                !status.value ||
                normalizar(status.value.replaceAll("_", " ")) === statusLinha;

            const correspondePrioridade =
                !prioridade.value ||
                normalizar(prioridade.value) === prioridadeLinha;

            const correspondeTipo =
                !tipo.value ||
                normalizar(tipo.value) === tipoLinha;

            const correspondeResponsavel =
                !responsavel.value ||
                (responsavel.value === "sem_responsavel"
                    ? !responsavelLinha || responsavelLinha === "nao atribuido"
                    : normalizar(responsavel.value) === responsavelLinha);

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

    busca.addEventListener("input", filtrarDemandas);

    [status, prioridade, responsavel, tipo].forEach((filtro) => {
        filtro.addEventListener("change", filtrarDemandas);
    });

    filtrarDemandas();
});