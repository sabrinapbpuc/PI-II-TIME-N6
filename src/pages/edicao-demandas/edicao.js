document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) {
        alert("ID da demanda não fornecido para edição!");
        window.location.href = "../listagem/listagem.html";
        return;
    }

    // Função auxiliar segura para selecionar o valor no select
    function selecionarOpcao(idElemento, valorDesejado) {
        const select = document.getElementById(idElemento);
        if (!select) return;
        for (let option of select.options) {
            if (option.value == valorDesejado) {
                select.value = option.value;
                break;
            }
        }
    }

    try {
        // 1. PRIMEIRO: Carrega as opções dos selects do banco
        await carregarOpcoesSelects();

        // 2. SEGUNDO: Faz o fetch para buscar os dados da demanda atual
        const respostaDemanda = await fetch(`http://localhost:3000/demandas/${id}`);
        if (!respostaDemanda.ok) throw new Error("Erro ao buscar dados da demanda.");
        
        const demanda = await respostaDemanda.json();
        console.log("DADOS VINDO DO BANCO:", demanda);

        // 3. TERCEIRO: Preenche os inputs normais
        document.getElementById("edit-titulo").value = demanda.titulo || "";
        document.getElementById("edit-status").value = demanda.status || "Aberta";
        document.getElementById("edit-prioridade").value = demanda.prioridade || "Baixa";
        document.getElementById("edit-descricao").value = demanda.descricao || "";
        
        // 4. QUARTO: Seleciona os valores corretos nos selects
        selecionarOpcao("edit-categoria", demanda.categoria_id);
        selecionarOpcao("edit-responsavel", demanda.responsavel_id);
        selecionarOpcao("edit-projeto", demanda.projeto_id);
        
        // 5. QUINTO: Formata e preenche a data
        if (demanda.prazo_final) {
            const dataLimpa = demanda.prazo_final.includes("T") 
                ? demanda.prazo_final.split("T")[0] 
                : demanda.prazo_final.substring(0, 10);
            document.getElementById("edit-prazo").value = dataLimpa;
        }

    } catch (erro) {
        console.error("Erro:", erro);
        alert("Não foi possível carregar os dados para edição.");
    }

    // Evento de envio do formulário (Salvar / PUT)
    const formEdicao = document.getElementById("form-edicao");
    if (formEdicao) {
        formEdicao.addEventListener("submit", async (e) => {
            e.preventDefault();

            const dadosAtualizados = {
                titulo: document.getElementById("edit-titulo").value,
                descricao: document.getElementById("edit-descricao").value,
                status: document.getElementById("edit-status").value,
                prioridade: document.getElementById("edit-prioridade").value,
                categoria_id: document.getElementById("edit-categoria").value,
                responsavel_id: document.getElementById("edit-responsavel").value || null,
                projeto_id: document.getElementById("edit-projeto").value,
                prazo_final: document.getElementById("edit-prazo").value
                
            };

            try {
                const respostaPut = await fetch(`http://localhost:3000/demandas/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(dadosAtualizados)
                });

                if (!respostaPut.ok) throw new Error("Erro ao atualizar demanda.");

                alert("Alterações salvas com sucesso!");
               // Se a pasta se chamar apenas "detalhes":
window.location.href = `../detalhes/detalhes.html?id=${id}`;

// Ou se estiver em outra pasta, ajuste conforme a sua estrutura de diretórios no VS Code.

            } catch (erro) {
                console.error("Erro ao salvar:", erro);
                alert("Erro ao atualizar a demanda no banco de dados.");
            }
        });
    }
});

// Função que popula os selects
async function carregarOpcoesSelects() {
    try {
        // Projetos
        const resProj = await fetch("http://localhost:3000/projetos");
        const projetos = await resProj.json();
        const selectProj = document.getElementById("edit-projeto");
        if (selectProj) {
            selectProj.innerHTML = `<option value="" disabled selected>Selecione o projeto</option>`;
            projetos.forEach(p => {
                const opt = document.createElement("option");
                opt.value = p.id_projeto || p.id;
                opt.textContent = p.nome;
                selectProj.appendChild(opt);
            });
        }

        // Responsáveis (Usuários)
        const resUser = await fetch("http://localhost:3000/usuarios");
        const usuarios = await resUser.json();
        const selectUser = document.getElementById("edit-responsavel");
        if (selectUser) {
            selectUser.innerHTML = `<option value="" disabled selected>Selecione o responsável</option>`;
            usuarios.forEach(u => {
                const opt = document.createElement("option");
                opt.value = u.id_usuario || u.id;
                opt.textContent = u.nome;
                selectUser.appendChild(opt);
            });
        }

        // Categorias
        const resCat = await fetch("http://localhost:3000/categorias");
        const categorias = await resCat.json();
        const selectCat = document.getElementById("edit-categoria");
        if (selectCat) {
            selectCat.innerHTML = `<option value="" disabled selected>Selecione o tipo</option>`;
            categorias.forEach(c => {
                const opt = document.createElement("option");
                opt.value = c.id_categoria || c.id;
                opt.textContent = c.nome;
                selectCat.appendChild(opt);
            });
        }
    } catch (e) {
        console.error("Erro ao carregar opções dos selects:", e);
    }
}