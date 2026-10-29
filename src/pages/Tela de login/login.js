// destino onde o usuario vai 
const PAGINA_DESTINO = '../Dashboard/index.html';

const form = document.getElementById('form-login');
const inputEmail = document.getElementById('email');
const inputSenha = document.getElementById('senha');
const erroEmail = document.getElementById('erro-email');
const erroSenha = document.getElementById('erro-senha');

function mostrarErro(input, elementoErro, mensagem) {
  elementoErro.textContent = mensagem;
  input.classList.add('input-erro');
}

function limparErro(input, elementoErro) {
  elementoErro.textContent = '';
  input.classList.remove('input-erro');
}

function validarEmail() {
  const email = inputEmail.value.trim();

  if (!email) {
    mostrarErro(inputEmail, erroEmail, 'Informe o e-mail.');
    return false;
  }

  const formatoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!formatoValido) {
    mostrarErro(inputEmail, erroEmail, 'Digite um e-mail válido (ex.: nome@email.com).');
    return false;
  }

  limparErro(inputEmail, erroEmail);
  return true;
}

function validarSenha() {
  const senha = inputSenha.value;

  if (!senha) {
    mostrarErro(inputSenha, erroSenha, 'Informe a senha.');
    return false;
  }

  if (senha.length < 6) {
    mostrarErro(inputSenha, erroSenha, 'A senha deve ter pelo menos 6 caracteres.');
    return false;
  }

  limparErro(inputSenha, erroSenha);
  return true;
}

// se tudo estiver certo vai para a pagina destino
form.addEventListener('submit', (evento) => {
  evento.preventDefault();

  const emailOk = validarEmail();
  const senhaOk = validarSenha();

  if (emailOk && senhaOk) {
    window.location.href = '../Dashboard/index.html';
  }
});
