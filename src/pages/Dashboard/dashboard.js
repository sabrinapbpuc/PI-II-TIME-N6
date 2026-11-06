/*
   Arquivo: dashboard.js
   Responsabilidade: Controlar o carregamento de dados reais no Dashboard.
*/

async function carregarDashboard() {
    try {
        //chama as funções da API que busca os dados do backend
        const dados = await buscarDashboardApi();
        const demandas = await listarDemandasApi();

        //números dos Cards do Topo
        document.getElementById("totalDemandas").innerText = dados.total || 0;
        document.getElementById("totalAbertas").innerText = dados.abertas || 0;
        document.getElementById("totalEmAndamento").innerText = dados.emAndamento || 0;
        document.getElementById("totalEmRevisao").innerText = dados.emRevisao || 0;
        document.getElementById("totalConcluidas").innerText = dados.concluidas || 0;
        document.getElementById("totalCanceladas").innerText = dados.canceladas || 0;

        //Atualiza tipo de demanda
        const totalTarefa = demandas.filter(d => d.tipoDemanda === "Tarefa").length;
        const totalDefeito = demandas.filter(d => d.tipoDemanda === "Defeito").length;
        const totalMelhoria = demandas.filter(d => d.tipoDemanda === "Melhoria").length;
        const totalDocumento = demandas.filter(d => d.tipoDemanda === "Documento").length;

        document.getElementById("countTarefa").innerText = totalTarefa;
        document.getElementById("countDefeito").innerText = totalDefeito;
        document.getElementById("countMelhoria").innerText = totalMelhoria;
        document.getElementById("countDocumento").innerText = totalDocumento;

        const totalGeral = demandas.length;

        if (totalGeral > 0) {
            const valorMaximoGrafico = 50;

            // Normaliza para minúsculo para evitar erros de acentuação ou maiúsculas
            const altaCount = demandas.filter(d => d.prioridade && d.prioridade.toLowerCase().includes("alta")).length;
            const mediaCount = demandas.filter(d => d.prioridade && (d.prioridade.toLowerCase() === "media" || d.prioridade.toLowerCase() === "média")).length;
            const baixaCount = demandas.filter(d => d.prioridade && d.prioridade.toLowerCase().includes("baixa")).length;
            const criticaCount = demandas.filter(d => d.prioridade && (d.prioridade.toLowerCase() === "critica" || d.prioridade.toLowerCase() === "crítica")).length;

            const porcentagemAlta = (altaCount / valorMaximoGrafico) * 100;
            const porcentagemMedia = (mediaCount / valorMaximoGrafico) * 100;
            const porcentagemBaixa = (baixaCount / valorMaximoGrafico) * 100;
            const porcentagemCritica = (criticaCount / valorMaximoGrafico) * 100;

            // Atualiza a largura da barra dinamicamente no CSS via JS:
            document.querySelector(".bar-fill.alta").style.width = `${porcentagemAlta}%`;
            document.querySelector(".bar-fill.media").style.width = `${porcentagemMedia}%`;
            document.querySelector(".bar-fill.baixa").style.width = `${porcentagemBaixa}%`;
            document.querySelector(".bar-fill.critica").style.width = `${porcentagemCritica}%`;
        }

        //lista de Críticas em Aberto
        const containerCriticas = document.getElementById("listaCriticas");
        containerCriticas.innerHTML = "";

        if (dados.criticas && dados.criticas.length > 0) {
            dados.criticas.forEach(demanda => {
                // Ajustado para redirecionar para os detalhes usando o ID real
                containerCriticas.innerHTML += `<a href="../detalhes-demanda/detalhes.html?id=${demanda.id}" class="critica-item">${demanda.titulo}</a>`;
            });
        } else {
            containerCriticas.innerHTML = `<span class="text-muted p-2">Nenhuma demanda crítica.</span>`;
        }

        //lista de Próximas ao Prazo
        const containerPrazos = document.getElementById("listaPrazos");
        containerPrazos.innerHTML = "";

        if (dados.prazosProximos && dados.prazosProximos.length > 0) {
            dados.prazosProximos.forEach(demanda => {
                // 'demanda.prazo_finalizacao' vem como "2026-06-08"
                const partes = demanda.prazo_finalizacao.split('-'); // [2026, 06, 08]
                const dataFormatada = `${partes[2]}/${partes[1]}`; // Fica "08/06"

                containerPrazos.innerHTML += `
            <div class="prazo-item">
                <span class="prazo-titulo">${demanda.titulo}</span>
                <span class="prazo-badge">${dataFormatada}</span>
            </div>
        `;
            });
        } else {
            containerPrazos.innerHTML = `<span class="text-muted p-2">Nenhum prazo próximo.</span>`;
        }

    } catch (erro) {
        console.error("Erro ao carregar dados do dashboard:", erro);
    }
}

//Executa ao carregar a página
window.addEventListener("DOMContentLoaded", carregarDashboard);