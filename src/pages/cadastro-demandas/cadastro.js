document.addEventListener("DOMContentLoaded", function () {
    const form = document.querySelector("form");
    const requiredInputs = form.querySelectorAll("input[type='text'], select");

    form.addEventListener("submit", function (event) {
        let formIsValid = true;

        requiredInputs.forEach(input => {
            // Remove mensagens de erro antigas para não duplicar
            const existingError = input.parentElement.parentElement.querySelector(".error-message");
            if (existingError) {
                existingError.remove();
            }

            let isEmpty = false;

            // Verifica se está vazio
            if (input.tagName === "SELECT") {
                if (input.value === "" || input.value.includes("Selecione")) {
                    isEmpty = true;
                }
            } else if (input.value.trim() === "") {
                isEmpty = true;
            }

            if (isEmpty) {
                formIsValid = false;
                input.style.borderColor = "#ff4d4d"; // Borda vermelha no campo

                // Cria a mensagem de erro em vermelho
                const errorSpan = document.createElement("span");
                errorSpan.className = "error-message";
                errorSpan.style.color = "#ff4d4d";
                errorSpan.style.fontSize = "12px";
                errorSpan.style.marginTop = "4px";
                errorSpan.style.display = "block";
                errorSpan.textContent = "Por favor, preencha este campo.";

                // Insere a mensagem logo abaixo do input-wrapper
                input.closest(".input-wrapper").after(errorSpan);
            } else {
                input.style.borderColor = ""; // Reseta a borda se estiver preenchido
            }
        });

        // Se houver algum campo inválido, impede o envio do formulário
        if (!formIsValid) {
            event.preventDefault();
        }
    });

    // Remove o aviso vermelho assim que o usuário começa a preencher o campo
    requiredInputs.forEach(input => {
        input.addEventListener("input", function () {
            this.style.borderColor = "";
            const errorMsg = this.closest(".form-group").querySelector(".error-message");
            if (errorMsg) {
                errorMsg.remove();
            }
        });
        input.addEventListener("change", function () {
            this.style.borderColor = "";
            const errorMsg = this.closest(".form-group").querySelector(".error-message");
            if (errorMsg) {
                errorMsg.remove();
            }
        });
    });
});

