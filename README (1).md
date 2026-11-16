# Brechó Reuso

Site de brechó online com catálogo de roupas, cadastro de usuários, login e CRUD de peças.

**Disciplina:** Desenvolvimento FrontEnd para Web (90h)
**Instituição:** UDF — Centro Universitário
**Turma:** 2267026-D4 3132 — ADS + C.C + ENG. SOFT (terça-feira, matutino, Laboratório 01)
**Professor:** Me. Regiano S. Alves

## Integrantes
- Lucas Emanuel
- Daniel Martins
- Gustavo Henrique

## Sobre o projeto
O Brechó Reuso permite que qualquer pessoa veja o catálogo de peças de segunda mão. Quem cria uma conta pode entrar no site e cadastrar, alterar e excluir as próprias peças, inclusive com foto.

### Telas
| Página          | O que faz                                                          |
|-----------------|--------------------------------------------------------------------|
| `index.html`    | Início com o catálogo público, busca por nome e filtro por categoria |
| `cadastro.html` | Criar conta de usuário                                             |
| `login.html`    | Entrar (para quem já tem conta)                                    |
| `painel.html`   | CRUD das peças do usuário logado, com envio de foto                |

### Funções do CRUD
- **Incluir:** cadastrar uma peça nova (nome, categoria, tamanho, preço, estado, descrição e foto).
- **Consultar:** ver o catálogo completo ou apenas as próprias peças.
- **Alterar:** editar os dados de uma peça.
- **Excluir:** remover uma peça.

Cada usuário só altera e exclui as peças que ele mesmo cadastrou.

## Tecnologias
- HTML5 e CSS3
- JavaScript (front-end e back-end)
- Node.js com Express, mysql2 e body-parser
- MySQL (Workbench)

## Estrutura de arquivos
```
brecho/
├── public/
│   ├── index.html      # catálogo
│   ├── login.html      # entrar
│   ├── cadastro.html   # criar conta
│   ├── painel.html     # CRUD das peças
│   ├── style.css       # estilos
│   ├── comum.js        # funções compartilhadas (login, menu, chamadas ao servidor)
│   ├── catalogo.js     # lógica do catálogo
│   └── painel.js       # lógica do CRUD e da foto
├── server.js           # servidor Express + conexão com o MySQL
├── database.sql        # script DDL das tabelas
├── package.json
└── README.md
```

## Pré-requisitos
- [Node.js](https://nodejs.org) (versão LTS)
- MySQL Server e MySQL Workbench

## Instalação e execução

### 1. Criar o banco de dados
1. Abra o MySQL Workbench e conecte no servidor.
2. Vá em **File > Open SQL Script** e escolha o arquivo `database.sql`.
3. Clique no raio (Execute) para rodar o script. Ele cria o banco `brecho_db`, as tabelas `usuarios` e `roupas` e alguns dados de exemplo.
4. Clique com o botão direito em **Schemas** e escolha **Refresh All** para conferir se o `brecho_db` apareceu.

### 2. Instalar as dependências
Abra o terminal dentro da pasta do projeto e rode:

```bash
npm install
```

Se o projeto fosse criado do zero, os comandos seriam:

```bash
npm init -y
npm i express mysql2 body-parser
```

O login usa apenas o módulo `crypto`, que já vem com o Node.js. Não há pacotes extras.

### 3. Configurar a conexão com o banco
Abra o `server.js` em um editor de texto (Bloco de Notas ou VS Code) e troque `sua_senha` pela senha do seu MySQL:

```js
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'sua_senha',
  database: 'brecho_db'
});
```

### 4. Executar a aplicação
```bash
node server.js
```

Quando aparecerem as mensagens `Servidor rodando em http://localhost:3000` e `Conectado ao MySQL!`, abra **http://localhost:3000** no navegador.

Para parar o servidor, aperte `Ctrl + C` no terminal.

### Conta de teste
- E-mail: `demo@brecho.com`
- Senha: `123456`

## Como o login funciona
- Ao criar a conta, a senha é transformada em um hash (scrypt) e só ele é salvo no banco.
- No login, o servidor devolve um token que o navegador guarda e envia a cada pedido.
- As rotas de incluir, alterar e excluir exigem o token.
- Os tokens ficam na memória do servidor. Ao reiniciar o `node server.js`, é preciso entrar de novo.

## Fotos das peças
No formulário de **Minhas peças**, o campo **Foto da peça** aceita imagens JPG, PNG ou WEBP. A foto é reduzida no navegador (máximo de 700 px) e salva no banco, na coluna `imagem_url`.

## Rotas da API
| Método | Rota                | Acesso  | Ação                                         |
|--------|---------------------|---------|----------------------------------------------|
| POST   | /api/cadastro       | público | Criar conta                                  |
| POST   | /api/login          | público | Entrar                                       |
| POST   | /api/logout         | logado  | Sair                                         |
| GET    | /api/roupas         | público | Catálogo (filtros `?categoria=` e `?busca=`) |
| GET    | /api/roupas/:id     | público | Consultar uma peça                           |
| GET    | /api/minhas-roupas  | logado  | Consultar as peças do usuário                |
| POST   | /api/roupas         | logado  | Incluir peça                                 |
| PUT    | /api/roupas/:id     | dono    | Alterar peça                                 |
| DELETE | /api/roupas/:id     | dono    | Excluir peça                                 |

## Problemas comuns
- **Access denied for user:** usuário ou senha errados em `server.js`.
- **Unknown database 'brecho_db':** o `database.sql` ainda não foi executado.
- **ECONNREFUSED:** o MySQL está desligado. Inicie o serviço `MySQL80` do Windows.
- **Erro ao salvar peça com foto:** se o banco foi criado antes da função de foto, rode no Workbench: `USE brecho_db; ALTER TABLE roupas MODIFY imagem_url MEDIUMTEXT;`
- **Porta 3000 em uso:** troque o valor de `PORT` no `server.js`.
- **Erro ao abrir o `server.js` com duplo clique:** abra com o botão direito, em *Abrir com > Bloco de Notas*, e rode o servidor pelo terminal com `node server.js`.
