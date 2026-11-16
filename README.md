# Brechó Reuso (CRUD + login)

Site de brechó online feito com HTML5, CSS3, JavaScript, Node.js (Express) e MySQL.
Disciplina: Desenvolvimento FrontEnd para Web — UDF.

**Equipe:** (nome dos 4 integrantes)

## Telas
| Página          | O que faz                                              |
|-----------------|--------------------------------------------------------|
| `index.html`    | Catálogo público com busca e filtro por categoria      |
| `cadastro.html` | Criar conta de usuário                                 |
| `login.html`    | Entrar (quem já tem conta)                             |
| `painel.html`   | CRUD das peças do usuário logado (incluir, consultar, alterar, excluir) |

## Pré-requisitos
- [Node.js](https://nodejs.org) (versão LTS)
- MySQL Server + MySQL Workbench

## 1. Criar o banco de dados
1. Abra o MySQL Workbench e conecte no servidor.
2. File > Open SQL Script e escolha `database.sql`.
3. Clique no raio (Execute). Isso cria o banco `brecho_db`, as tabelas `usuarios` e `roupas` e alguns dados de exemplo.

## 2. Instalar as dependências
Dentro da pasta do projeto:

```bash
npm install
```

Se fosse criar do zero, os comandos seriam:

```bash
npm init -y
npm i express mysql2 body-parser
```

O login usa apenas o módulo `crypto`, que já vem com o Node.js, então não há pacotes extras.

## 3. Configurar a conexão
Abra `server.js` e altere `user` e `password` para os do seu MySQL:

```js
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'sua_senha',
  database: 'brecho_db'
});
```

## 4. Executar
```bash
node server.js
```
Acesse **http://localhost:3000**.

Conta de teste: `demo@brecho.com` / senha `123456`.

## Como o login funciona
- Na criação da conta, a senha é transformada em um *hash* (scrypt) e só ele vai para o banco.
- No login, o servidor devolve um *token* que o navegador guarda e envia em cada pedido.
- As rotas de incluir, alterar e excluir exigem o token, e cada pessoa só altera as próprias peças.
- Os tokens ficam na memória do servidor: ao reiniciar o `node server.js`, é preciso entrar de novo.

## Rotas da API
| Método | Rota                | Acesso   | Ação                    |
|--------|---------------------|----------|-------------------------|
| POST   | /api/cadastro       | público  | Criar conta             |
| POST   | /api/login          | público  | Entrar                  |
| POST   | /api/logout         | logado   | Sair                    |
| GET    | /api/roupas         | público  | Catálogo (filtros `?categoria=` e `?busca=`) |
| GET    | /api/roupas/:id     | público  | Consultar uma peça      |
| GET    | /api/minhas-roupas  | logado   | Consultar as minhas peças |
| POST   | /api/roupas         | logado   | Incluir peça            |
| PUT    | /api/roupas/:id     | dono     | Alterar peça            |
| DELETE | /api/roupas/:id     | dono     | Excluir peça            |

## Problemas comuns
- **Access denied for user**: usuário ou senha errados em `server.js`.
- **Unknown database 'brecho_db'**: o `database.sql` ainda não foi executado.
- **ECONNREFUSED**: o MySQL está desligado. Inicie o serviço `MySQL80` do Windows.
- **Fotos não aparecem / erro ao salvar peça com foto**: se o banco foi criado antes desta versão, rode no Workbench: `USE brecho_db; ALTER TABLE roupas MODIFY imagem_url MEDIUMTEXT;`
- **Porta 3000 em uso**: troque `PORT` em `server.js`.
