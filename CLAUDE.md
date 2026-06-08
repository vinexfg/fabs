# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**DenteFácil** — sistema de gestão para consultório odontológico do Dr. Fabricio Almeida. Interface em português (pt-BR). Monorepo com backend Node/Express e frontend React/Vite.

## Commands

```bash
# Instalar todas as dependências (raiz + back + front)
npm run install:all

# Desenvolvimento local (backend :3001 + frontend :5173 em paralelo)
npm run dev

# Build de produção (instala deps e compila o frontend)
npm run build

# Iniciar servidor de produção
npm start
```

### Individuais

```bash
# Backend apenas
npm run dev --prefix back    # nodemon
npm start   --prefix back    # node

# Frontend apenas
npm run dev   --prefix front  # vite dev server
npm run build --prefix front  # vite build para dist/
```

> **Não há testes automatizados.** Não existe script de lint configurado.

## Ambiente

Crie `back/.env` a partir de `back/.env.example`. Variáveis obrigatórias:

| Variável | Descrição |
|---|---|
| `JWT_SECRET` | String longa e aleatória — **obrigatória** (o servidor não sobe sem ela) |
| `PORT` | Porta do backend (padrão `3001`) |
| `DB_PATH` | Caminho do SQLite (padrão: `back/data.db`) |
| `NODE_ENV` | `development` localmente; Railway injeta `production` |
| `CORS_ORIGIN` | Origem permitida pelo CORS (padrão `http://localhost:5173`) |

O proxy `/api` → `http://localhost:3001` está configurado no Vite, então o frontend usa caminhos relativos `/api/...` em desenvolvimento e em produção (onde o backend serve o `dist/`).

## Arquitetura

### Monorepo

```
/               ← scripts npm (build/start/dev) + railway.toml + nixpacks.toml
back/           ← Node 22 + Express, CommonJS
front/          ← React 18 + Vite + Tailwind, ESM
```

### Backend (`back/`)

Segue **Clean Architecture** em duas camadas:

```
back/src/
  infrastructure/
    auth/          ← JwtService.js  (sign/verify, expiresIn: '8h')
    database/
      connection.js  ← DatabaseSync de node:sqlite (Node 22 nativo, sem driver externo)
      schema.js      ← createTables(), runMigrations(), seeds de settings/templates
    repositories/  ← acesso direto ao db (SQL com prepared statements)
  interfaces/
    controllers/   ← recebem req/res, chamam repository
    middleware/
      AuthMiddleware.js  ← Bearer token em todas as rotas /api/* exceto /api/auth
      wrap.js            ← wrapper try/catch para handlers sync e async
    routes/        ← Express Router, cada arquivo monta um recurso
back/index.js      ← entry point: monta app, registra rotas, serve dist/ em produção
```

**Fluxo de uma requisição:** `routes/*.js` → `wrap()` → `controllers/*.js` → `repositories/*.js` → SQLite

**Autenticação:** senha única armazenada na tabela `settings` (key `password`), hashada com bcrypt. Login retorna JWT; todas as rotas `/api/*` (exceto `/api/auth/login`) passam pelo `authenticate` middleware. Rate limit de 10 tentativas / 15 min no login.

**Banco:** SQLite via `node:sqlite` (API experimental nativa do Node 22 — sem `better-sqlite3` nem `sqlite3`). O banco é criado/migrado automaticamente ao iniciar o servidor via `initializeSchema()`.

**Nota sobre migrações:** novas colunas são adicionadas em `runMigrations()` com `ALTER TABLE ... ADD COLUMN` envolvido em try/catch (falha silenciosa se já existe).

### Frontend (`front/`)

```
front/src/
  context/           ← AuthContext, ThemeContext, ToastContext, ConfirmContext, GlobalSearchContext
  infrastructure/
    http/            ← HttpClient.js + um *Repository.js por recurso (espelha o backend)
  components/
    patient/         ← abas do PatientDetail (FichaTab, TratamentoTab, FinanceiroTab, EvolusaoTab, OdontogramaTab, OrcamentoTab)
    patient/print/   ← componentes de impressão via react-to-print (ReceitaPrint, AtestadoPrint, etc.)
    print/           ← RelatoriosPrint.jsx (relatório financeiro)
  pages/             ← Dashboard, Agenda, Pacientes, PatientDetail, Relatorios, Settings, Login
  utils/             ← exportCsv.js, openWhatsAppSequential.js
```

**Estilo:** Tailwind CSS com `darkMode: 'class'`. A classe `dark` é aplicada no `<html>` por um script inline bloqueante em `index.html` (lê `localStorage.getItem('df_token')` antes do primeiro render para evitar FOUC). Classes globais reutilizáveis (`.btn-primary`, `.btn-secondary`, `.btn-danger`, `.input`, `.label`, `.card`, `.tab-btn`) estão definidas em `index.css`. Cada página/componente tem seu próprio `*.module.css` com Tailwind via `@apply`.

**HttpClient:** `front/src/infrastructure/http/HttpClient.js` trata 401 fazendo redirect para `/login` automaticamente. Todos os `*Repository.js` do frontend delegam para ele.

**Contextos principais:**
- `AuthContext` — token JWT no localStorage (`df_token`), dois timers: aviso 5 min antes do expirar e logout automático ao expirar
- `ToastContext` — suporta `action: { label, onClick }` para botão inline no toast
- `ConfirmContext` — `useConfirm()` retorna uma Promise que resolve para boolean (modal de confirmação)
- `GlobalSearchContext` — controla abertura da busca global (Ctrl+K / botão na topbar mobile)

**Impressão:** usa `react-to-print` v3 com `useReactToPrint({ contentRef })`. Os componentes de impressão ficam em divs ocultos (`display: none`) no DOM e recebem `ref` via `React.forwardRef`.

### Deploy (Railway)

- Build: `npm run build` (root) — compila o frontend para `front/dist/`
- Start: `node back/index.js` — em `NODE_ENV=production`, o backend serve `front/dist/` como static + SPA fallback
- Node 22 obrigatório (via `nixpacks.toml` e `"engines": {"node": ">=22"}` no `back/package.json`)
- Banco persistido via Railway Volume montado em `/data/dentefacil.db` (variável `DB_PATH`)

## Padrão para novos recursos

### Novo endpoint

1. `back/src/infrastructure/repositories/NomeRepository.js` — SQL puro com prepared statements
2. `back/src/interfaces/controllers/NomeController.js` — chama o repository, trata req/res
3. `back/src/interfaces/routes/nome.js` — `router.get/post/...` com `wrap()`
4. Registrar em `back/index.js`: `app.use('/api/nome', require('./src/interfaces/routes/nome'))`
5. `front/src/infrastructure/http/NomeRepository.js` — métodos que chamam `http.get/post/...`
6. Exportar em `front/src/infrastructure/http/index.js`

### Nova tabela

Adicionar `CREATE TABLE IF NOT EXISTS` em `createTables()` dentro de `back/src/infrastructure/database/schema.js`. Migrações de colunas vão em `runMigrations()`.
