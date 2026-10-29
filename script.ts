interface Demanda {
    nome: string;
    status: string;
    tipo: string;
    responsavel: string;
    prioridade: string;
    projeto: string;
    prazo: string;
}

document.addEventListener("DOMContentLoaded", () => {
    const formCadastro = document.getElementById("formCadastro") as HTMLFormElement | null;
    const formEdicao = document.getElementById("formEdicao") as HTMLFormElement | null;

    if (formCadastro) {
        formCadastro.addEventListener("submit", (e: Event) => {
            e.preventDefault();

            const novaDemanda: Demanda = {
                nome: (document.getElementById("nome") as HTMLInputElement).value,
                status: (document.getElementById("status") as HTMLSelectElement).value,
                tipo: (document.getElementById("tipo") as HTMLSelectElement).value,
                responsavel: (document.getElementById("responsavel") as HTMLSelectElement).value,
                prioridade: (document.getElementById("prioridade") as HTMLSelectElement).value,
                projeto: (document.getElementById("projeto") as HTMLSelectElement).value,
                prazo: (document.getElementById("prazo") as HTMLInputElement).value
            };

            localStorage.setItem("demandaAtual", JSON.stringify(novaDemanda));

            alert("Demanda cadastrada com sucesso!");
            
            window.location.href = "edicao.html";
        });
    }

    if (formEdicao) {
        const demandaSalvaStr = localStorage.getItem("demandaAtual");
        const demandaSalva: Demanda | null = demandaSalvaStr ? JSON.parse(demandaSalvaStr) : null;

        if (demandaSalva) {
            (document.getElementById("edit-nome") as HTMLInputElement).value = demandaSalva.nome || "";
            (document.getElementById("edit-status") as HTMLSelectElement).value = demandaSalva.status || "";
            (document.getElementById("edit-tipo") as HTMLSelectElement).value = demandaSalva.tipo || "";
            (document.getElementById("edit-responsavel") as HTMLSelectElement).value = demandaSalva.responsavel || "";
            (document.getElementById("edit-prioridade") as HTMLSelectElement).value = demandaSalva.prioridade || "";
            (document.getElementById("edit-projeto") as HTMLSelectElement).value = demandaSalva.projeto || "";
            (document.getElementById("edit-prazo") as HTMLInputElement).value = demandaSalva.prazo || "";
        }

        formEdicao.addEventListener("submit", (e: Event) => {
            e.preventDefault();

            const demandaAtualizada: Demanda = {
                nome: (document.getElementById("edit-nome") as HTMLInputElement).value,
                status: (document.getElementById("edit-status") as HTMLSelectElement).value,
                tipo: (document.getElementById("edit-tipo") as HTMLSelectElement).value,
                responsavel: (document.getElementById("edit-responsavel") as HTMLSelectElement).value,
                prioridade: (document.getElementById("edit-prioridade") as HTMLSelectElement).value,
                projeto: (document.getElementById("edit-projeto") as HTMLSelectElement).value,
                prazo: (document.getElementById("edit-prazo") as HTMLInputElement).value
            };

            localStorage.setItem("demandaAtual", JSON.stringify(demandaAtualizada));

            alert("Alterações salvas com sucesso!");
        });
    }
});
