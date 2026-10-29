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
            
        });
    }
});
