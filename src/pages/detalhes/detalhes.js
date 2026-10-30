
document.addEventListener("DOMContentLoaded", () => {
    const campo = document.querySelector("#comentario_id");
    const botao = document.querySelector(".btn-comentar");
    const areaComentarios = document.querySelector(
        ".container-comentarios"
    );

    // Cria mensagens e contador pelo próprio JavaScript.
    const erro = document.createElement("p");
    erro.id = "erro-comentario";
    erro.setAttribute("role", "alert");

    const contador = document.createElement("small");
    contador.textContent = "0/500 caracteres";

    campo.insertAdjacentElement("afterend", contador);
    contador.insertAdjacentElement("afterend", erro);

    campo.setAttribute("maxlength", "500");

    campo.addEventListener("input", () => {
        contador.textContent =
            `${campo.value.length}/500 caracteres`;

        erro.textContent = "";
    });

    botao.addEventListener("click", (evento) => {
        evento.preventDefault();

        const comentario = campo.value.trim();

        if (comentario === "") {
            erro.textContent =
                "Digite um comentário antes de enviar.";
            campo.focus();
            return;
        }

        if (comentario.length < 3) {
            erro.textContent =
                "O comentário deve ter pelo menos 3 caracteres.";
            campo.focus();
            return;
        }

        if (comentario.length > 500) {
            erro.textContent =
                "O comentário deve ter no máximo 500 caracteres.";
            campo.focus();
            return;
        }

        const bloco = document.createElement("section");
        bloco.className = "comentario";

        const titulo = document.createElement("h2");
        titulo.textContent = "Você - agora";

        const texto = document.createElement("p");
        texto.textContent = comentario;

        bloco.append(titulo, texto);

        areaComentarios.insertBefore(
            bloco,
            campo.parentElement === areaComentarios
                ? campo
                : botao
        );

        campo.value = "";
        contador.textContent = "0/500 caracteres";
        erro.textContent =
            "Comentário adicionado somente nesta visualização.";
    });
});