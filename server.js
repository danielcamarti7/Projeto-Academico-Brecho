const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const path = require('path');

const app = express();
app.use(bodyParser.json({ limit: '5mb' })); // fotos chegam dentro do JSON
app.use(express.static(path.join(__dirname, 'public')));

// ---- Configuração e conexão com o MySQL (ajuste usuário e senha) ----
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'sua_senha',
  database: 'brecho_db',
  waitForConnections: true,
  connectionLimit: 10
}).promise();

db.query('SELECT 1')
  .then(() => console.log('Conectado ao MySQL!'))
  .catch(err => console.error('Erro ao conectar no MySQL:', err.message));

// ---- Senhas: nunca guardamos a senha, só um "hash" embaralhado ----
function gerarHash(senha) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(senha, salt, 64).toString('hex');
  return salt + ':' + hash;
}
function conferirSenha(senha, salvo) {
  const [salt, hash] = salvo.split(':');
  const teste = crypto.scryptSync(senha, salt, 64);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), teste);
}

// ---- Sessões: token -> usuário (ficam na memória; reiniciar o servidor desloga todos) ----
const sessoes = new Map();

function criarSessao(usuario) {
  const token = crypto.randomBytes(24).toString('hex');
  sessoes.set(token, { id: usuario.id, nome: usuario.nome });
  return token;
}

// Middleware: bloqueia a rota se a pessoa não estiver logada
function autenticar(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const usuario = sessoes.get(token);
  if (!usuario) return res.status(401).json({ erro: 'Faça login para continuar.' });
  req.usuario = usuario;
  req.token = token;
  next();
}

// Evita repetir try/catch em todas as rotas
function tratar(fn) {
  return (req, res) => fn(req, res).catch(err => {
    console.error(err);
    res.status(500).json({ erro: 'Erro no servidor: ' + err.message });
  });
}

// =====================  LOGIN / CADASTRO DE USUÁRIO  =====================

app.post('/api/cadastro', tratar(async (req, res) => {
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha) return res.status(400).json({ erro: 'Preencha nome, e-mail e senha.' });
  if (senha.length < 6) return res.status(400).json({ erro: 'A senha precisa ter pelo menos 6 caracteres.' });

  try {
    const [r] = await db.query(
      'INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)',
      [nome.trim(), email.trim().toLowerCase(), gerarHash(senha)]
    );
    const usuario = { id: r.insertId, nome: nome.trim() };
    res.status(201).json({ token: criarSessao(usuario), nome: usuario.nome });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ erro: 'Este e-mail já está cadastrado.' });
    throw err;
  }
}));

app.post('/api/login', tratar(async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ erro: 'Informe e-mail e senha.' });

  const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email.trim().toLowerCase()]);
  const usuario = rows[0];
  if (!usuario || !conferirSenha(senha, usuario.senha_hash)) {
    return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
  }
  res.json({ token: criarSessao(usuario), nome: usuario.nome });
}));

app.post('/api/logout', autenticar, (req, res) => {
  sessoes.delete(req.token);
  res.json({ mensagem: 'Você saiu.' });
});

// =====================  CRUD DE ROUPAS  =====================

function validarRoupa(r) {
  if (!r.nome || !r.categoria || !r.tamanho || !r.conservacao) return 'Preencha nome, categoria, tamanho e estado.';
  const preco = Number(r.preco);
  if (!(preco > 0)) return 'Informe um preço maior que zero.';
  if (r.imagem_url && !/^(data:image\/(jpeg|png|webp);base64,|https?:\/\/)/.test(r.imagem_url)) {
    return 'Foto inválida. Use uma imagem JPG, PNG ou WEBP.';
  }
  return null;
}

// CONSULTAR (público): catálogo com filtros opcionais
app.get('/api/roupas', tratar(async (req, res) => {
  const { categoria, busca } = req.query;
  let sql = `SELECT r.*, u.nome AS vendedor
             FROM roupas r JOIN usuarios u ON u.id = r.usuario_id WHERE 1=1`;
  const params = [];
  if (categoria) { sql += ' AND r.categoria = ?'; params.push(categoria); }
  if (busca)     { sql += ' AND r.nome LIKE ?';   params.push('%' + busca + '%'); }
  sql += ' ORDER BY r.id DESC';
  const [rows] = await db.query(sql, params);
  res.json(rows);
}));

// CONSULTAR (logado): só as peças da pessoa
app.get('/api/minhas-roupas', autenticar, tratar(async (req, res) => {
  const [rows] = await db.query('SELECT * FROM roupas WHERE usuario_id = ? ORDER BY id DESC', [req.usuario.id]);
  res.json(rows);
}));

// CONSULTAR uma peça
app.get('/api/roupas/:id', tratar(async (req, res) => {
  const [rows] = await db.query('SELECT * FROM roupas WHERE id = ?', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ erro: 'Peça não encontrada.' });
  res.json(rows[0]);
}));

// INCLUIR (precisa estar logado)
app.post('/api/roupas', autenticar, tratar(async (req, res) => {
  const erro = validarRoupa(req.body);
  if (erro) return res.status(400).json({ erro });
  const { nome, categoria, tamanho, preco, conservacao, descricao, imagem_url } = req.body;
  const [r] = await db.query(
    `INSERT INTO roupas (nome, categoria, tamanho, preco, conservacao, descricao, imagem_url, usuario_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [nome, categoria, tamanho, preco, conservacao, descricao || null, imagem_url || null, req.usuario.id]
  );
  res.status(201).json({ id: r.insertId });
}));

// ALTERAR (só o dono da peça)
app.put('/api/roupas/:id', autenticar, tratar(async (req, res) => {
  const erro = validarRoupa(req.body);
  if (erro) return res.status(400).json({ erro });
  const { nome, categoria, tamanho, preco, conservacao, descricao, imagem_url } = req.body;
  const [r] = await db.query(
    `UPDATE roupas SET nome=?, categoria=?, tamanho=?, preco=?, conservacao=?, descricao=?, imagem_url=?
     WHERE id=? AND usuario_id=?`,
    [nome, categoria, tamanho, preco, conservacao, descricao || null, imagem_url || null, req.params.id, req.usuario.id]
  );
  if (r.affectedRows === 0) return res.status(404).json({ erro: 'Peça não encontrada ou não é sua.' });
  res.json({ mensagem: 'Peça atualizada.' });
}));

// EXCLUIR (só o dono da peça)
app.delete('/api/roupas/:id', autenticar, tratar(async (req, res) => {
  const [r] = await db.query('DELETE FROM roupas WHERE id = ? AND usuario_id = ?', [req.params.id, req.usuario.id]);
  if (r.affectedRows === 0) return res.status(404).json({ erro: 'Peça não encontrada ou não é sua.' });
  res.json({ mensagem: 'Peça excluída.' });
}));

const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
