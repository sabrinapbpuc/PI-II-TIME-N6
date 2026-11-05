document.addEventListener("DOMContentLoaded", () => {
    const formEdicao = document.getElementById("formEdicao");

    if (formEdicao) {
        const demandaSalvaStr = localStorage.getItem("demandaAtual");
        const demandaSalva = demandaSalvaStr ? JSON.parse(demandaSalvaStr) : null;

        if (demandaSalva) {
            document.getElementById("edit-nome").value = demandaSalva.nome || "";
            document.getElementById("edit-status").value = demandaSalva.status || "";
            document.getElementById("edit-tipo").value = demandaSalva.tipo || "";
            document.getElementById("edit-responsavel").value = demandaSalva.responsavel || "";
            document.getElementById("edit-prioridade").value = demandaSalva.prioridade || "";
            document.getElementById("edit-projeto").value = demandaSalva.projeto || "";
            document.getElementById("edit-prazo").value = demandaSalva.prazo || "";
        }

        formEdicao.addEventListener("submit", (e) => {
            e.preventDefault();

            const demandaAtualizada = {
                nome: document.getElementById("edit-nome").value,
                status: document.getElementById("edit-status").value,
                tipo: document.getElementById("edit-tipo").value,
                responsavel: document.getElementById("edit-responsavel").value,
                prioridade: document.getElementById("edit-prioridade").value,
                projeto: document.getElementById("edit-projeto").value,
                prazo: document.getElementById("edit-prazo").value
            };

            localStorage.setItem("demandaAtual", JSON.stringify(demandaAtualizada));

            alert("Alterações salvas com sucesso!");
        });
    }
});