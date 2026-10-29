//importando o servidor
import express, {Request, Response} from "express";

//criando servidor
const app = express();
app.use(express.json());
let PORT = 3000;

//QUANDO O SERVIDOR ACESSAR A PORTA, SERA MOSTRADO QUAL PORTA ESTA: PORTA 3000
app.listen(PORT, () => {
    console.log(`Servidor aberto na porta ${PORT}`)
});

app.get("/", (req:Request, res:Response) =>{
    res.send("Teste resposta do servidor");
})