const listaProjetos = document.querySelector("#lista-projetos");
const mensagem = document.querySelector("#mensagem");

async function carregarProjetos() {
    try {
        const resposta = await fetch("http://localhost:3000/api/projetos");

        if (!resposta.ok) {
            throw new Error("Não foi possível carregar os projetos.");
        }

        const projetos = await resposta.json();

        listaProjetos.innerHTML = "";

        if (projetos.length === 0) {
            mensagem.textContent = "Nenhum projeto cadastrado.";
            return;
        }

        mensagem.textContent = "";

        projetos.forEach(projeto => {
            const card = document.createElement("article");
            card.classList.add("card-projeto");

            const titulo = document.createElement("h2");
            titulo.textContent = projeto.nome;

            const descricao = document.createElement("p");
            descricao.textContent = projeto.descricao || "Sem descrição disponível.";

            const botao = document.createElement("button");
            botao.textContent = "Acessar projeto";

            botao.addEventListener("click", () => {
                selecionarProjeto(projeto);
            });

            card.addEventListener("click", (evento) => {
                if (evento.target !== botao) {
                    selecionarProjeto(projeto);
                }
            });

            card.appendChild(titulo);
            card.appendChild(descricao);
            card.appendChild(botao);

            listaProjetos.appendChild(card);
        });

    } catch (erro) {
        console.error(erro);
        mensagem.textContent = "Erro ao carregar os projetos. Verifique se o servidor está funcionando.";
    }
}

function selecionarProjeto(projeto) {
    localStorage.setItem("projetoSelecionado", projeto.id_projeto);
    localStorage.setItem("nomeProjeto", projeto.nome);

    window.location.href = "../Dashboard/index.html";
}
carregarProjetos();
