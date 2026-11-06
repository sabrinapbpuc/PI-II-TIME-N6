document.addEventListener("DOMContentLoaded", async function () {
    const form = document.querySelector("#form-cadastro");
    const requiredInputs = form.querySelectorAll("input, select");

    // Carrega os selects do banco primeiro
    await carregarProjetos();
    await carregarResponsaveis();
    await carregarCategorias();


    form.addEventListener("submit", async function (event) {
        event.preventDefault(); // Impede o envio padrão do formulário HTML
        let formIsValid = true;

        requiredInputs.forEach(input => {
            const existingError = input.closest(".form-group").querySelector(".error-message");
            if (existingError) {
                existingError.remove();
            }

            let isEmpty = false;
            if (input.tagName === "SELECT") {
                if (input.value === "" || input.value.includes("Selecione")) {
                    isEmpty = true;
                }
            } else if (input.value.trim() === "") {
                isEmpty = true;
            }

            if (isEmpty) {
                formIsValid = false;
                input.style.borderColor = "#ff4d4d";

                const errorSpan = document.createElement("span");
                errorSpan.className = "error-message";
                errorSpan.style.color = "#ff4d4d";
                errorSpan.style.fontSize = "12px";
                errorSpan.style.marginTop = "4px";
                errorSpan.style.display = "block";
                errorSpan.textContent = "Por favor, preencha este campo.";

                input.closest(".input-wrapper").after(errorSpan);
            } else {
                input.style.borderColor = "";
            }
        });

        // Se houver algum campo inválido, para por aqui
        if (!formIsValid) {
            return;
        }

        //Monta o objeto com os dados para enviar à API
        const dadosDemanda = {
            titulo: form.querySelector("[name='titulo']").value,
            descricao: document.getElementById("cad-descricao").value,
            status: form.querySelector("[name='status']").value,
            categoria_id: form.querySelector("[name='categoria_id']").value,
            responsavel_id: form.querySelector("[name='responsavel_id']").value || null,
            prioridade: form.querySelector("[name='prioridade']").value,
            projeto_id: form.querySelector("[name='projeto_id']").value,
            prazo_final: form.querySelector("[name='prazo_final']").value,
            criador_id: 1 // ID do usuário logado (pode vir do localStorage futuramente)
        };

        try {
            const resposta = await fetch("http://localhost:3000/demandas", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(dadosDemanda)
            });

            if (!resposta.ok) {
                throw new Error("Erro ao salvar demanda.");
            }

            alert("Demanda cadastrada com sucesso!");
            window.location.href = "../listagem/listagem.html";

        } catch (erro) {
            console.error("Erro:", erro);
            alert("Não foi possível salvar a demanda. Verifique o console.");
        }
    });

    // Remove o aviso vermelho ao digitar (input) ou selecionar (change)
    requiredInputs.forEach(input => {
        ["input", "change"].forEach(evento => {
            input.addEventListener(evento, function () {
                this.style.borderColor = "";
                const errorMsg = this.closest(".form-group").querySelector(".error-message");
                if (errorMsg) errorMsg.remove();
            });
        });
    });
});

// Função para buscar e preencher o select de Projetos
async function carregarProjetos() {
    try {
        const resposta = await fetch("http://localhost:3000/projetos");
        const projetos = await resposta.json();

        const selectProjeto = document.querySelector("[name='projeto_id']");
        selectProjeto.innerHTML = `<option value="" disabled selected>Selecione o projeto</option>`;

        projetos.forEach(projeto => {
            const option = document.createElement("option");
            option.value = projeto.id;
            option.textContent = projeto.nome;
            selectProjeto.appendChild(option);
        });
    } catch (erro) {
        console.error("Erro ao carregar projetos:", erro);
    }
}

async function carregarResponsaveis() {
    try {
        const resposta = await fetch("http://localhost:3000/usuarios");
        const usuarios = await resposta.json();
        
        console.log("DADOS QUE CHEGARAM DO USUARIO:", usuarios); // <-- OLHE ISSO NO CONSOLE DO NAVEGADOR

        const selectResponsavel = document.querySelector("[name='responsavel_id']");
        selectResponsavel.innerHTML = `<option value="" disabled selected>Selecione o responsável</option>`;

        usuarios.forEach(usuario => {
            const option = document.createElement("option");
            // ATENÇÃO AQUI: veja se no console aparece 'id' ou 'ID', 'nome' ou 'NOME'
            option.value = usuario.id_usuario; 
            option.textContent = usuario.nome || usuario.NOME;
            selectResponsavel.appendChild(option);
        });
    } catch (erro) {
        console.error("Erro ao carregar responsáveis:", erro);
    }

}

// Função para carregar Categorias (Tipos)
async function carregarCategorias() {
    try {
        const resposta = await fetch("http://localhost:3000/categorias");
        const categorias = await resposta.json();

        const selectCategoria = document.querySelector("[name='categoria_id']");
        selectCategoria.innerHTML = `<option value="" disabled selected>Selecione o tipo</option>`;

        categorias.forEach(cat => {
            const option = document.createElement("option");
            option.value = cat.id;
            option.textContent = cat.nome;
            selectCategoria.appendChild(option);
        });
    } catch (erro) {
        console.error("Erro ao carregar categorias:", erro);
    }
}
