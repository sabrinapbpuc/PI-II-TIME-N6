import bcrypt from "bcryptjs";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

async function gerarHash() {
    const leitor = createInterface({ input: stdin, output: stdout });
    try {
        const senha = await leitor.question("Senha de exemplo: ");
        if (!senha || bcrypt.truncates(senha)) {
            throw new Error("Informe uma senha valida");
        }
        const hash = await bcrypt.hash(senha, 12);
        console.log("Hash para a coluna senha_hash:");
        console.log(hash);
    } finally {
        leitor.close();
    }
}

gerarHash().catch((erro) => {
    console.error(erro.message);
    process.exitCode = 1;
});



//node ../lib/gerar-hash.js     para fazer o hash