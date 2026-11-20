document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) {
        alert("ID da demanda não fornecido para edição!");
        window.location.href = "../listagem/listagem.html";
        return;
    }

    const campoPrazo = document.getElementById("edit-prazo");
    const avisoFeriado = document.getElementById("aviso-feriado");
    const formEdicao = document.getElementById("form-edicao");

    function selecionarOpcao(idElemento, valorDesejado) {
        const select = document.getElementById(idElemento);
        if (!select) return;

        for (const option of select.options) {
            if (option.value == valorDesejado) {
                select.value = option.value;
                break;
            }
        }
    }

    // Verifica a data e apresenta o aviso no formulário.
    async function verificarFeriado(dataISO) {
        const [ano, mes, dia] = dataISO.split("-");
        const dataBrasileira = `${dia}-${mes}-${ano}`;

        const resposta = await fetch(
            `http://localhost:3000/feriados/${dataBrasileira}`
        );
        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(resultado.mensagem || "Não foi possível verificar a data.");
        }

        if (resultado.feriado) {
            avisoFeriado.textContent =
                `Atenção: ${resultado.nome} é feriado nacional. Escolha outra data.`;
            avisoFeriado.hidden = false;
            return true;
        }

        avisoFeriado.textContent = "";
        avisoFeriado.hidden = true;
        return false;
    }

    // Mostra o aviso quando a pessoa altera o prazo.
    if (campoPrazo && avisoFeriado) {
        campoPrazo.addEventListener("change", async () => {
            avisoFeriado.hidden = true;
            avisoFeriado.textContent = "";

            if (!campoPrazo.value) return;

            try {
                await verificarFeriado(campoPrazo.value);
            } catch (erro) {
                console.error("Erro ao verificar feriado:", erro);
                avisoFeriado.textContent =
                    "Não foi possível consultar os feriados. Tente novamente.";
                avisoFeriado.hidden = false;
            }
        });
    }

    try {
        await carregarOpcoesSelects();

        const respostaDemanda = await fetch(
            `http://localhost:3000/demandas/${id}`
        );

        if (!respostaDemanda.ok) {
            throw new Error("Erro ao buscar dados da demanda.");
        }

        const demanda = await respostaDemanda.json();

        document.getElementById("edit-titulo").value = demanda.titulo || "";
        document.getElementById("edit-status").value = demanda.status || "Aberta";
        document.getElementById("edit-prioridade").value = demanda.prioridade || "Baixa";
        document.getElementById("edit-descricao").value = demanda.descricao || "";

        selecionarOpcao("edit-categoria", demanda.categoria_id);
        selecionarOpcao("edit-responsavel", demanda.responsavel_id);
        selecionarOpcao("edit-projeto", demanda.projeto_id);

        if (demanda.prazo_final && campoPrazo) {
            const dataLimpa = demanda.prazo_final.includes("T")
                ? demanda.prazo_final.split("T")[0]
                : demanda.prazo_final.substring(0, 10);

            campoPrazo.value = dataLimpa;
        }
    } catch (erro) {
        console.error("Erro ao carregar a demanda:", erro);
        alert("Não foi possível carregar os dados para edição.");
    }

    if (!formEdicao) return;

    formEdicao.addEventListener("submit", async (e) => {
        e.preventDefault();

        try {
            const prazoSelecionado = campoPrazo.value;

            // Confere novamente antes de salvar.
            if (prazoSelecionado) {
                const ehFeriado = await verificarFeriado(prazoSelecionado);

                if (ehFeriado) {
                    alert("Escolha uma data que não seja feriado nacional.");
                    return;
                }
            }

            const prazoParaEnviar = prazoSelecionado
                ? prazoSelecionado.split("-").reverse().join("-")
                : null;

            const dadosAtualizados = {
                titulo: document.getElementById("edit-titulo").value,
                descricao: document.getElementById("edit-descricao").value,
                status: document.getElementById("edit-status").value,
                prioridade: document.getElementById("edit-prioridade").value,
                categoria_id: document.getElementById("edit-categoria").value,
                responsavel_id:
                    document.getElementById("edit-responsavel").value || null,
                projeto_id: document.getElementById("edit-projeto").value,
                prazo_final: prazoParaEnviar
            };

            const respostaPut = await fetch(
                `http://localhost:3000/demandas/${id}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(dadosAtualizados)
                }
            );

            if (!respostaPut.ok) {
                const resultado = await respostaPut.json().catch(() => ({}));
                throw new Error(resultado.mensagem || "Erro ao atualizar demanda.");
            }

            alert("Alterações salvas com sucesso!");
            window.location.href = `../detalhes/detalhes.html?id=${id}`;
        } catch (erro) {
            console.error("Erro ao salvar:", erro);
            alert(
                erro.message ||
                "Não foi possível verificar o feriado ou atualizar a demanda."
            );
        }
    });
});

// Popula os selects com os dados do backend.
async function carregarOpcoesSelects() {
    const resProj = await fetch("http://localhost:3000/projetos");
    if (!resProj.ok) throw new Error("Erro ao carregar projetos.");
    const projetos = await resProj.json();

    const selectProj = document.getElementById("edit-projeto");
    if (selectProj) {
        selectProj.innerHTML =
            `<option value="" disabled>Selecione o projeto</option>`;

        projetos.forEach((p) => {
            const opt = document.createElement("option");
            opt.value = p.id_projeto || p.id;
            opt.textContent = p.nome;
            selectProj.appendChild(opt);
        });
    }

    const resUser = await fetch("http://localhost:3000/usuarios");
    if (!resUser.ok) throw new Error("Erro ao carregar usuários.");
    const usuarios = await resUser.json();

    const selectUser = document.getElementById("edit-responsavel");
    if (selectUser) {
        selectUser.innerHTML =
            `<option value="" disabled>Selecione o responsável</option>`;

        usuarios.forEach((u) => {
            const opt = document.createElement("option");
            opt.value = u.id_usuario || u.id;
            opt.textContent = u.nome;
            selectUser.appendChild(opt);
        });
    }

    const resCat = await fetch("http://localhost:3000/categorias");
    if (!resCat.ok) throw new Error("Erro ao carregar categorias.");
    const categorias = await resCat.json();

    const selectCat = document.getElementById("edit-categoria");
    if (selectCat) {
        selectCat.innerHTML =
            `<option value="" disabled>Selecione o tipo</option>`;

        categorias.forEach((c) => {
            const opt = document.createElement("option");
            opt.value = c.id_categoria || c.id;
            opt.textContent = c.nome;
            selectCat.appendChild(opt);
        });
    }
}
