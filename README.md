# PI-II-TIME-N6
# Sistema de Acompanhamento de Demandas de Desenvolvimento

Sistema desenvolvido como parte do Projeto Integrador II, da disciplina de Engenharia de Software, com o objetivo de organizar e acompanhar demandas relacionadas ao desenvolvimento de projetos.

## Sobre o projeto

O Sistema de Acompanhamento de Demandas de Desenvolvimento foi desenvolvido para facilitar o gerenciamento de tarefas, defeitos, melhorias e atividades de documentação dentro de projetos de software.

A aplicação permite que os usuários acompanhem o andamento das demandas, visualizem informações detalhadas, registrem comentários e consultem o histórico de alterações. Além disso, possui controle de acesso conforme os cargos dos usuários e sua participação nos projetos.

## Funcionalidades

- **Gerenciamento de projetos:** visualização e seleção dos projetos disponíveis.
- **Gerenciamento de demandas:** cadastro, consulta, edição e acompanhamento de demandas.
- **Classificação:** organização das demandas por categorias, como tarefa, defeito, melhoria e documentação.
- **Controle de status:** acompanhamento das etapas de desenvolvimento das demandas.
- **Filtros e pesquisa:** localização de demandas por título, status, prioridade, responsável e categoria.
- **Comentários:** registro de comentários relacionados às demandas.
- **Histórico de alterações:** consulta das modificações realizadas nas demandas.
- **Controle de acesso:** restrição de funcionalidades e informações conforme o cargo e a participação do usuário nos projetos.
- **Dashboard:** visualização de informações gerais sobre as demandas e seus respectivos estados.

## Tecnologias utilizadas

### Frontend
- HTML5
- CSS3
- JavaScript

### Backend
- Node.js
- TypeScript
- Express

### Banco de dados
- Oracle Database
- SQL

### Ferramentas de desenvolvimento
- Git e GitHub
- GitHub Projects
- Visual Studio Code
- Figma

## Organização do projeto

O projeto está organizado em diferentes partes, separando as interfaces, a lógica de aplicação e a comunicação com o banco de dados.

- **Frontend:** contém as páginas, estilos e scripts responsáveis pela interface e interação com o usuário.
- **Backend:** contém o servidor, as rotas da API e as regras de funcionamento do sistema.
- **Banco de dados:** responsável pelo armazenamento e relacionamento das informações de usuários, projetos, demandas, comentários e histórico.

## Integrantes

| Integrante |
|:---:|
| Higor Tricarico Fachini |
| Natã Ribeiro Carvalho |
| Sabrina Porfilia Barbosa |
| Gabriela Natsumi Kawaguchi |

## Informações acadêmicas

**Instituição:** Pontifícia Universidade Católica de Campinas (PUC-Campinas)  
**Curso/Disciplina:** Engenharia de Software  
**Projeto:** Projeto Integrador II  
**Período:** Segundo semestre de 2026  
**Professor:** Fernando Luiz de Almeida Silveira  

## Execução do projeto

Para executar o projeto localmente, é necessário ter o Node.js instalado, configurar as variáveis de ambiente utilizadas na conexão com o banco Oracle e instalar as dependências do projeto.

Após configurar o ambiente:

```bash
npm install
```

Para iniciar o servidor, utilize o script configurado no `package.json`:

```bash
npm start
```

**Observação:** a execução depende da configuração correta do banco de dados Oracle e das variáveis de ambiente necessárias.

## Repositório

[PI-II-TIME-N6 — GitHub](https://github.com/sabrinapbpuc/PI-II-TIME-N6)

---

*Projeto acadêmico desenvolvido no segundo semestre de 2026 para a disciplina de Engenharia de Software.*
