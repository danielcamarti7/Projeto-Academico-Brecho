-- Execute este script no MySQL Workbench (File > Open SQL Script > raio)
CREATE DATABASE IF NOT EXISTS brecho_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE brecho_db;

CREATE TABLE IF NOT EXISTS usuarios (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  nome       VARCHAR(100) NOT NULL,
  email      VARCHAR(100) NOT NULL UNIQUE,
  senha_hash VARCHAR(200) NOT NULL,
  criado_em  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roupas (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  nome         VARCHAR(100) NOT NULL,
  categoria    VARCHAR(40)  NOT NULL,
  tamanho      VARCHAR(20)  NOT NULL,
  preco        DECIMAL(10,2) NOT NULL,
  conservacao  VARCHAR(40)  NOT NULL,
  descricao    VARCHAR(300),
  imagem_url   MEDIUMTEXT,
  usuario_id   INT NOT NULL,
  criado_em    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Dados de exemplo (opcional). Login de teste: demo@brecho.com / 123456
INSERT INTO usuarios (nome, email, senha_hash) VALUES
('Conta Demo', 'demo@brecho.com', 'ee1af9d9d50a4986cecce40b075f8264:fc411bdde6d2179ece0db3e1046ab79da15b8cf8a6bd08661dafde2afaf79cf6ef5fdbda90f0a16ba0393e0dbf019d12e7bed9c50fda4f56094c05ff4268eded');

INSERT INTO roupas (nome, categoria, tamanho, preco, conservacao, descricao, usuario_id) VALUES
('Jaqueta jeans oversized', 'Casacos',    'M',     89.90, 'Ótimo', 'Lavagem clara, sem rasgos.', 1),
('Vestido midi floral',     'Vestidos',   'P',     59.00, 'Bom',   'Tecido leve, ótimo para o verão.', 1),
('Camiseta de banda anos 90','Camisetas', 'G',     45.00, 'Com marcas de uso', 'Estampa desbotada, bem vintage.', 1),
('Calça de alfaiataria',    'Calças',     'M',     72.50, 'Novo com etiqueta', NULL, 1),
('Tênis de couro branco',   'Calçados',   'Único', 120.00,'Bom',   'Número 38.', 1),
('Bolsa de couro caramelo', 'Acessórios', 'Único', 95.00, 'Ótimo', 'Alça ajustável.', 1);
