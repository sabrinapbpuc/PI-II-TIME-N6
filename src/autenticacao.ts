import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { getConn } from "./db";

export interface UsuarioSessao {
    id_usuario: number;
    nome: string;
    email: string;
    cargo: "Administrador" | "Líder de Projeto" | "Membro da Equipe";
}

// Ensina ao TypeScript qual informação adicional guardaremos na sessão.
declare module "express-session" {
    interface SessionData {
        usuario?: UsuarioSessao;
    }
}
// Usuário como vem do banco: tem tudo da sessão + o hash da senha.
interface UsuarioBanco extends UsuarioSessao {
    senhaHash: string;
}

export function exigirLogin(req: Request, res: Response, next: NextFunction) {
    if (!req.session.usuario) {
        //caso não esteja autenticado dá erro 
        return res.status(401).json({ mensagem: "Faça login para continuar." });
    }


    (req as any).usuario = req.session.usuario;
    return next(); // Libera
}

export function exigirAdmin(req: Request, res: Response, next: NextFunction) {
    if (req.session.usuario?.cargo !== "Administrador") {
        return res.status(403).json({ mensagem: "Seu cargo não permite esta ação." });
    }
    return next();
}

export async function autenticar(req: Request, res: Response, next: NextFunction) {
    const { email, senha } = req.body ?? {};
    if (typeof email !== "string" || typeof senha !== "string" ||
        !email.trim() || !senha || bcrypt.truncates(senha)) {
        return res.status(400).json({ mensagem: "Informe e-mail e senha válidos." });
    }

    let conn;
    let usuario: UsuarioBanco | undefined;
    try {
        conn = await getConn();
        const resultado = await conn.execute<UsuarioBanco>(
            `SELECT id_usuario AS "id_usuario", nome AS "nome", email AS "email",
                    senha_hash AS "senhaHash", cargo AS "cargo"
             FROM USUARIO WHERE LOWER(email) = :email`,
            { email: email.trim().toLowerCase() }
        );
        usuario = resultado.rows?.[0];
    } catch (erro) {
        return next(erro);
    } finally {
        if (conn) await conn.close();
    }

    // A senha recebida é comparada com o hash do banco 
    const senhaCorreta = usuario?.senhaHash && await bcrypt.compare(senha, usuario.senhaHash);
    if (!usuario || !senhaCorreta) {
        return res.status(401).json({ mensagem: "E-mail ou senha inválidos." });
    }

    // Cria outro identificador de sessão após o login.
    req.session.regenerate((erro) => {
        if (erro) return next(erro);
        req.session.usuario = {
            id_usuario: usuario.id_usuario,
            nome: usuario.nome,
            email: usuario.email,
            cargo: usuario.cargo
        };

        // Aguarda a gravação antes de o frontend abrir a página seguinte.
        req.session.save((erro) => {
            if (erro) return next(erro);
            return res.status(200).json(req.session.usuario);
        });
    });
}