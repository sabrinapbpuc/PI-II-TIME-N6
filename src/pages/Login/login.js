const form = document.getElementById("form-login");

const inputEmail = document.getElementById("email");
const inputSenha = document.getElementById("senha");

const erroEmail = document.getElementById("erro-email");
const erroSenha = document.getElementById("erro-senha");

function mostrarErro(input, elementoErro, mensagem) {
    elementoErro.textContent = mensagem;
    input.classList.add("input-erro");
}

function limparErro(input, elementoErro) {
    elementoErro.textContent = "";
    input.classList.remove("input-erro");
}

form.addEventListener("submit", async (evento) => {

    evento.preventDefault();

    limparErro(inputEmail, erroEmail);
    limparErro(inputSenha, erroSenha);

    const email = inputEmail.value.trim();
    const senha = inputSenha.value;

    if (!email) {
        mostrarErro(inputEmail, erroEmail, "Informe o e-mail.");
        return;
    }

    if (!senha) {
        mostrarErro(inputSenha, erroSenha, "Informe a senha.");
        return;
    }

    try {
        const resposta = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, senha })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.mensagem || "E-mail ou senha inválidos.");
            return;
        }

        localStorage.setItem(
            "usuarioLogado",
            JSON.stringify(dados.usuario)
        );

        window.location.href = "../projetos/projetos.html";

    } catch (erro) {
        console.error("Erro no login:", erro);
        alert("Não foi possível conectar ao servidor.");
    }
});