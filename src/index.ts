//importando o servidor
import express from "express";


//criando servidor
const servidor = express();
servidor.use(express.json());
let PORT = 3000;//node .\src\index.js para executar o servidor 

//QUANDO O SERVIDOR ACESSAR A PORTA, SERA MOSTRADO QUAL PORTA ESTA OUÇA A PORTA 3000 E RETORNE QUE ESTA OUVINDO A PORTA 3000
servidor.listen(PORT, () => {

    console.log(`Servidor em pé na porta ${PORT}`)
});