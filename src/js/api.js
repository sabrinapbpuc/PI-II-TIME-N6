const API_BASE_URL = "http://localhost:3000";

// Recupera o token do usuário autenticado.
function obterCabecalhos() {

    const token = localStorage.getItem("token");

    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}

// Lista as demandas.
async function listarDemandasApi() {

    const resposta = await fetch(`${API_BASE_URL}/demandas`, {
        headers: obterCabecalhos()
    });

    return await tratarRespostaApi(resposta);
}

// Busca uma demanda por ID.
async function buscarDemandaApi(id) {

    const resposta = await fetch(`${API_BASE_URL}/demandas/${id}`, {
        headers: obterCabecalhos()
    });

    return await tratarRespostaApi(resposta);
}

// Busca os dados do Dashboard.
async function buscarDashboardApi() {

    const resposta = await fetch(`${API_BASE_URL}/demandas/dashboard`, {
        headers: obterCabecalhos()
    });

    return await tratarRespostaApi(resposta);
}

// Cadastra uma nova demanda.
async function cadastrarDemandaApi(demanda) {

    const resposta = await fetch(`${API_BASE_URL}/demandas`, {
        method: "POST",
        headers: obterCabecalhos(),
        body: JSON.stringify(demanda)
    });

    return await tratarRespostaApi(resposta);
}

// Atualiza uma demanda.
async function atualizarDemandaApi(id, demanda) {

    const resposta = await fetch(`${API_BASE_URL}/demandas/${id}`, {
        method: "PUT",
        headers: obterCabecalhos(),
        body: JSON.stringify(demanda)
    });

    return await tratarRespostaApi(resposta);
}

// Cancela uma demanda.
async function cancelarDemandaApi(id) {

    const resposta = await fetch(`${API_BASE_URL}/demandas/${id}`, {
        method: "DELETE",
        headers: obterCabecalhos()
    });

    return await tratarRespostaApi(resposta);
}

// Trata erros da API.
async function tratarRespostaApi(resposta) {

    const dados = await resposta.json();

    if (!resposta.ok) {

        if (resposta.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("usuarioLogado");

            window.location.href = "../Login/index.html";
        }

        throw new Error(dados.mensagem || "Erro na requisição.");
    }

    return dados;
}