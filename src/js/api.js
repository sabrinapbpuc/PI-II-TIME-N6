const API_BASE_URL = "http://localhost:3000";

//listando todas demandas
async function listarDemandasApi() {
    const resposta = await fetch(`${API_BASE_URL}/demandas`);
    return await tratarRespostaApi(resposta);
}

//busca demanda por id
async function buscarDemandaApi(id) {
    const resposta = await fetch(`${API_BASE_URL}/demandas/${id}`);
    return await tratarRespostaApi(resposta);
}

//busca os dados para dashboard
async function buscarDashboardApi() {
    const resposta = await fetch(`${API_BASE_URL}/demandas/dashboard`);
    return await tratarRespostaApi(resposta);
}

//cadastra uma nova demanda
async function cadastrarDemandaApi(demanda) {
    const resposta = await fetch(`${API_BASE_URL}/demandas`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(demanda)
    });

    return await tratarRespostaApi(resposta);
}

//atualiza uma demanda
async function atualizarDemandaApi(id, demanda) {
    const resposta = await fetch(`${API_BASE_URL}/demandas/${id}`, {
        method: 'PUT',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(demanda)
    });

    return await tratarRespostaApi(resposta);
}

//cancela uma demanda
async function cancelarDemandaApi(id) {
    const resposta = await fetch(`${API_BASE_URL}/demandas/${id}`, {
        method: 'DELETE'
    });

    return await tratarRespostaApi(resposta);
}

//função para tratar erros da API de forma padronizada
async function tratarRespostaApi(resposta) {
    const dados = await resposta.json();

    if (!resposta.ok) {
        // pwga a mensagem do backend para mostrar ao usuario, se não tiver mostra erro padrão "Erro na requisição"
        const mensagem = dados.mensagem || "Erro na requisição";
        throw new Error(mensagem);
    }

    return dados;
}