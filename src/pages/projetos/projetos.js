const listaProjetos = document.querySelector("#lista-projetos");
const mensagem = document.querySelector("#mensagem");

async function carregarProjetos() {

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "../Login/index.html";
        return;
    }

    try {

        const resposta = await fetch("http://localhost:3000/projetos", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (resposta.status === 401) {
            localStorage.clear();
            window.location.href = "../Login/index.html";
            return;
        }

        if (!resposta.ok) {
            throw new Error("Não foi possível carregar os projetos.");
        }

        const projetos = await resposta.json();

        listaProjetos.innerHTML = "";

        if (projetos.length === 0) {
            mensagem.textContent = "Você não participa de nenhum projeto.";
            return;
        }

        mensagem.textContent = "";

        projetos.forEach(projeto => {

            const card = document.createElement("article");
            card.classList.add("card-projeto");

            const titulo = document.createElement("h2");
            titulo.textContent = projeto.nome;

            const descricao = document.createElement("p");
            descricao.textContent =
                projeto.descricao || "Sem descrição disponível.";

            const botao = document.createElement("button");
            botao.textContent = "Acessar projeto";

            botao.addEventListener("click", () => {
                selecionarProjeto(projeto);
            });

            card.appendChild(titulo);
            card.appendChild(descricao);
            card.appendChild(botao);

            listaProjetos.appendChild(card);
        });

    } catch (erro) {
        console.error(erro);

        mensagem.textContent =
            "Erro ao carregar os projetos. Verifique o servidor.";
    }
}

function selecionarProjeto(projeto) {

    localStorage.setItem("projetoSelecionado", projeto.id);
    localStorage.setItem("nomeProjeto", projeto.nome);

    window.location.href = "../Dashboard/index.html";
}

carregarProjetos();