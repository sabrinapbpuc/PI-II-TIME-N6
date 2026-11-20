document.addEventListener("DOMContentLoaded", async () => {
    const form = document.querySelector("#form-cadastro");

    if (!form) {
        console.error("Formulário #form-cadastro não encontrado.");
        return;
    }

    const campoPrazo = form.querySelector("[name='prazo_final']");
    const avisoFeriado = document.getElementById("aviso-feriado");

    if (!campoPrazo || !avisoFeriado) {
        console.error("Confira se existem o campo prazo_final e #aviso-feriado no HTML.");
        return;
    }

    const requiredInputs = form.querySelectorAll(
        "input[name='titulo'], select[name='status'], select[name='categoria_id'], select[name='prioridade'], select[name='projeto_id']"
    );

    await carregarProjetos();
    await carregarResponsaveis();
    await carregarCategorias();

    // Consulta o backend. O campo date fornece YYYY-MM-DD;
    // a rota do backend espera DD-MM-YYYY.
    async function verificarFeriado(dataISO) {
        const [ano, mes, dia] = dataISO.split("-");
        const dataBrasileira = `${dia}-${mes}-${ano}`;

        const resposta = await fetch(
            `http://localhost:3000/feriados/${dataBrasileira}`
        );
        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                resultado.mensagem || "Não foi possível verificar a data."
            );
        }

        avisoFeriado.hidden = !resultado.feriado;
        avisoFeriado.textContent = resultado.feriado
            ? `Atenção: ${resultado.nome} é feriado nacional. Escolha outra data.`
            : "";

        return Boolean(resultado.feriado);
    }

    campoPrazo.addEventListener("change", async () => {
        avisoFeriado.hidden = true;
        avisoFeriado.textContent = "";

        if (!campoPrazo.value) return;

        try {
            await verificarFeriado(campoPrazo.value);
        } catch (erro) {
            console.error("Erro ao consultar feriado:", erro);
            avisoFeriado.textContent =
                "Não foi possível consultar os feriados. Tente novamente.";
            avisoFeriado.hidden = false;
        }
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        let formIsValid = true;

        requiredInputs.forEach((input) => {
            const formGroup = input.closest(".form-group");
            const existingError = formGroup?.querySelector(".error-message");

            if (existingError) existingError.remove();

            const isEmpty = input.tagName === "SELECT"
                ? input.value === ""
                : input.value.trim() === "";

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

                input.closest(".input-wrapper")?.after(errorSpan);
            } else {
                input.style.borderColor = "";
            }
        });

        if (!formIsValid) return;

        const prazoSelecionado = campoPrazo.value;

        // Verifica novamente antes de salvar.
        if (prazoSelecionado) {
            try {
                const ehFeriado = await verificarFeriado(prazoSelecionado);

                if (ehFeriado) {
                    alert("Escolha uma data que não seja feriado nacional.");
                    return;
                }
            } catch (erro) {
                console.error("Erro ao consultar feriado:", erro);
                alert("Não foi possível verificar o feriado. Tente novamente.");
                return;
            }
        }

        const dadosDemanda = {
            titulo: form.querySelector("[name='titulo']").value,
            descricao: document.getElementById("cad-descricao").value,
            status: form.querySelector("[name='status']").value,
            categoria_id: form.querySelector("[name='categoria_id']").value,
            responsavel_id:
                form.querySelector("[name='responsavel_id']").value || null,
            prioridade: form.querySelector("[name='prioridade']").value,
            projeto_id: form.querySelector("[name='projeto_id']").value,
            prazo_final: prazoSelecionado
                ? prazoSelecionado.split("-").reverse().join("-")
                : null,
            criador_id: 1
        };

        try {
            const resposta = await fetch("http://localhost:3000/demandas", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(dadosDemanda)
            });

            const resultado = await resposta.json().catch(() => ({}));

            if (!resposta.ok) {
                throw new Error(resultado.mensagem || "Erro ao salvar demanda.");
            }

            alert("Demanda cadastrada com sucesso!");
            window.location.href = "../listagem/listagem.html";
        } catch (erro) {
            console.error("Erro ao salvar demanda:", erro);
            alert(erro.message || "Não foi possível salvar a demanda.");
        }
    });

    // Remove a indicação de campo vazio quando o usuário o corrige.
    requiredInputs.forEach((input) => {
        ["input", "change"].forEach((evento) => {
            input.addEventListener(evento, function () {
                this.style.borderColor = "";

                const erro = this.closest(".form-group")
                    ?.querySelector(".error-message");

                if (erro) erro.remove();
            });
        });
    });
});

async function carregarProjetos() {
    try {
        const resposta = await fetch("http://localhost:3000/projetos");
        if (!resposta.ok) throw new Error("Erro ao buscar projetos.");

        const projetos = await resposta.json();
        const select = document.querySelector("[name='projeto_id']");

        if (!select) return;

        select.innerHTML =
            `<option value="" disabled selected>Selecione o projeto</option>`;

        projetos.forEach((projeto) => {
            const option = document.createElement("option");
            option.value = projeto.id ?? projeto.id_projeto;
            option.textContent = projeto.nome;
            select.appendChild(option);
        });
    } catch (erro) {
        console.error("Erro ao carregar projetos:", erro);
    }
}

async function carregarResponsaveis() {
    try {
        const resposta = await fetch("http://localhost:3000/usuarios");
        if (!resposta.ok) throw new Error("Erro ao buscar usuários.");

        const usuarios = await resposta.json();
        const select = document.querySelector("[name='responsavel_id']");

        if (!select) return;

        select.innerHTML =
            `<option value="" disabled selected>Selecione o responsável</option>`;

        usuarios.forEach((usuario) => {
            const option = document.createElement("option");
            option.value = usuario.id_usuario ?? usuario.id;
            option.textContent = usuario.nome ?? usuario.NOME;
            select.appendChild(option);
        });
    } catch (erro) {
        console.error("Erro ao carregar responsáveis:", erro);
    }
}

async function carregarCategorias() {
    try {
        const resposta = await fetch("http://localhost:3000/categorias");
        if (!resposta.ok) throw new Error("Erro ao buscar categorias.");

        const categorias = await resposta.json();
        const select = document.querySelector("[name='categoria_id']");

        if (!select) return;

        select.innerHTML =
            `<option value="" disabled selected>Selecione o tipo</option>`;

        categorias.forEach((categoria) => {
            const option = document.createElement("option");
            option.value = categoria.id ?? categoria.id_categoria;
            option.textContent = categoria.nome;
            select.appendChild(option);
        });
    } catch (erro) {
        console.error("Erro ao carregar categorias:", erro);
    }
}
