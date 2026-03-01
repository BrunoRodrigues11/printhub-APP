# 🖨️ PrintHub - Gestão de Parque de Impressão

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

O **PrintHub** é um sistema completo (Full-stack) desenvolvido para centralizar, monitorar e facilitar a gestão de ativos de impressão corporativos. Ele conecta um painel administrativo dinâmico a uma API robusta, permitindo o controle de equipamentos, localidades, usuários e geração de etiquetas de patrimônio.

---

## ✨ Funcionalidades Principais

### 🔒 Segurança e Controle de Acesso (RBAC)
- **Autenticação JWT:** Login seguro com tokens de sessão.
- **Níveis de Acesso:**
  - `Admin`: Acesso total a todas as filiais, controle de usuários e unidades.
  - `Analista`: Gerenciamento de impressoras (CRUD) na sua unidade.
  - `User`: Permissão apenas de visualização e atualização de status de equipamentos.
- **Isolamento por Unidade:** Usuários comuns enxergam apenas as impressoras da filial (Site) ao qual estão vinculados.

### 📊 Dashboard Dinâmico
- Visão geral com métricas em tempo real (Total, Online, Offline, Manutenção).
- Filtros avançados por busca de texto (Nome, Série, Local) e por Status.
- Agrupamento visual automático das impressoras por Localidade/Unidade.

### 🖨️ Gestão de Ativos (Impressoras)
- Cadastro detalhado distinguindo equipamentos do tipo **Papel** e **Térmica**.
- Regras de negócio inteligentes: Controle de suprimentos (Toners) exigido apenas para impressoras a papel.
- Validação no banco de dados para evitar IPs, Números de Série e IDs de Patrimônio (RI) duplicados.
- Histórico de última atualização de status (`lastUpdated`).

### 🏷️ Motor de Etiquetas e QR Codes em Lote
- Geração automática de QR Codes para cada equipamento.
- **Impressão em Lote:** Selecione múltiplas impressoras e gere um PDF A4 pronto para impressão.
- **Etiquetas Customizáveis:**
  - Escolha quais dados exibir (IP, Fila, Patrimônio, Série, etc).
  - Upload de Logo da empresa no cabeçalho da etiqueta.
  - Ajuste de escala (tamanho) da etiqueta para caber perfeitamente no papel.
  - Ação do QR Code configurável: Redirecionar para o Hub, exibir texto puro ou link customizado.

### 🏢 Gestão de Infraestrutura
- Cadastro de Unidades/Filiais (Sites).
- Cadastro de Usuários atrelados às unidades (com senhas criptografadas via Bcrypt).

---

## 🛠️ Tecnologias Utilizadas

**Frontend:**
- React (com Vite)
- TypeScript
- Tailwind CSS (Estilização)
- Lucide React (Ícones)
- React Router DOM (Navegação SPA)

**Backend:**
- Node.js com Express (v5)
- PostgreSQL (Driver `pg`)
- Autenticação com `jsonwebtoken` e `bcrypt`
- Padrão arquitetural MVC (Routes, Controllers, Services)

---

## 🚀 Como Executar o Projeto Localmente

### 1. Pré-requisitos
- Node.js (v18+)
- PostgreSQL rodando localmente ou em nuvem.
- Gerenciador de pacotes (`npm`, `yarn` ou `pnpm`).

### 2. Configurando o Backend (API)

    # Navegue até a pasta do backend
    cd printhub_API

    # Instale as dependências
    pnpm install

    # Configure as variáveis de ambiente (.env)
    # DATABASE_URL="postgresql://user:password@localhost:5432/printhub"
    # JWT_SECRET="sua_chave_secreta"
    # PORT=3001

    # Inicie o servidor
    pnpm dev

### 3. Configurando o Frontend (React)

    # Navegue até a pasta do frontend
    cd printhub_web

    # Instale as dependências
    pnpm install

    # Inicie o servidor de desenvolvimento
    pnpm run dev

### 4. Acesso ao Sistema
- A API estará rodando em: http://localhost:3001
- O Frontend estará rodando em: http://localhost:5173 (porta padrão do Vite)

> **Nota:** Para o primeiro acesso, certifique-se de criar um usuário com perfil `Admin` diretamente no banco de dados ou através de uma requisição POST isolada no Insomnia/Postman.

---

## 📱 Telas do Sistema

- **`/login`:** Autenticação de usuários.
- **`/` (Dashboard):** Visão geral e filtros do parque de impressão.
- **`/admin`:** Painel de administração para CRUD de Impressoras, Usuários e Sites, além da ferramenta de geração de etiquetas.
- **`/printer/:id`:** Hub de informações do equipamento (acessado via QR Code para atualização rápida de status em campo).

---
*Desenvolvido com foco na organização e escalabilidade da infraestrutura de TI.*