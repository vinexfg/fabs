# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**DenteFácil** — sistema de gestão para consultório odontológico do Dr. Fabricio Almeida. Interface em português (pt-BR). Monorepo com backend Node/Express e frontend React/Vite, ambos em TypeScript.

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
npm run dev       --prefix back  # tsx watch (hot reload)
npm start         --prefix back  # tsx index.ts
npm run typecheck --prefix back  # tsc --noEmit
npm run lint      --prefix back  # eslint .

# Frontend apenas
npm run dev       --prefix front  # vite dev server
npm run build     --prefix front  # tsc -b && vite build
npm run typecheck --prefix front  # tsc -b --noEmit
npm run lint      --prefix front  # eslint .
```

Também dá para rodar `npm run typecheck` / `npm run lint` na raiz, que executa nos dois lados em sequência.

> **Não há testes automatizados.**

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
back/           ← Node 22 + Express + TypeScript, roda via tsx (sem etapa de build/dist)
front/          ← React 18 + Vite + Tailwind + TypeScript, ESM
```

### Backend (`back/`)

Segue **Clean Architecture** em duas camadas:

```
back/src/
  types/
    entities.ts      ← interfaces das entidades (Patient, Treatment, Payment, ...), espelha o schema SQLite
    express.d.ts      ← augmentation de Express.Request (req.user)
  infrastructure/
    auth/          ← JwtService.ts  (sign/verify, expiresIn: '8h')
    database/
      connection.ts  ← DatabaseSync de node:sqlite (Node 22 nativo, sem driver externo)
      schema.ts      ← createTables(), runMigrations(), seeds de settings/templates
    repositories/  ← acesso direto ao db (SQL com prepared statements), export default de um objeto com os métodos
  interfaces/
    controllers/   ← recebem req/res, chamam repository
    middleware/
      AuthMiddleware.ts  ← Bearer token em todas as rotas /api/* exceto /api/auth
      wrap.ts            ← wrapper try/catch para handlers sync e async
    routes/        ← Express Router, cada arquivo monta um recurso
back/index.ts      ← entry point: monta app, registra rotas, serve dist/ em produção
```

**TypeScript no back:** roda direto via `tsx` (dev e produção), sem etapa de compilação para `dist/`. `tsc --noEmit` (`npm run typecheck`) é só para checagem de tipos. `@types/node` já inclui os tipos de `node:sqlite`; `StatementSync.get()/.all()` retornam `Record<string, SQLOutputValue>`, então os repositories fazem `as unknown as Entidade` no retorno — é a borda entre SQL e os tipos da app, cast intencional.

**Fluxo de uma requisição:** `routes/*.ts` → `wrap()` → `controllers/*.ts` → `repositories/*.ts` → SQLite

**Autenticação:** senha única armazenada na tabela `settings` (key `password`), hashada com bcrypt. Login retorna JWT; todas as rotas `/api/*` (exceto `/api/auth/login`) passam pelo `authenticate` middleware. Rate limit de 10 tentativas / 15 min no login.

**Banco:** SQLite via `node:sqlite` (API experimental nativa do Node 22 — sem `better-sqlite3` nem `sqlite3`). O banco é criado/migrado automaticamente ao iniciar o servidor via `initializeSchema()`.

**Nota sobre migrações:** novas colunas são adicionadas em `runMigrations()` com `ALTER TABLE ... ADD COLUMN` envolvido em try/catch (falha silenciosa se já existe).

### Frontend (`front/`)

```
front/src/
  types/
    entities.ts      ← interfaces das entidades (Patient, Treatment, Payment, ...) — duplicado do back, não compartilhado (sem workspace npm)
  context/           ← AuthContext, ThemeContext, ToastContext, ConfirmContext, GlobalSearchContext (todos .tsx)
  infrastructure/
    http/            ← HttpClient.ts genérico (http.get<T>/post<T>/...) + um *Repository.ts por recurso (espelha o backend)
  components/
    patient/         ← abas do PatientDetail (FichaTab, TratamentoTab, FinanceiroTab, EvolusaoTab, OdontogramaTab, OrcamentoTab)
    patient/print/   ← componentes de impressão via react-to-print (ReceitaPrint, AtestadoPrint, etc.)
    print/           ← RelatoriosPrint.tsx (relatório financeiro)
  pages/             ← Dashboard, Agenda, Pacientes, PatientDetail, Relatorios, Settings, Login
  utils/             ← exportCsv.ts, openWhatsAppSequential.ts
  vite-env.d.ts      ← /// <reference types="vite/client" /> (tipos de import.meta.env e *.module.css)
```

**Estilo:** Tailwind CSS com `darkMode: 'class'`. A classe `dark` é aplicada no `<html>` por um script inline bloqueante em `index.html` (lê `localStorage.getItem('df_token')` antes do primeiro render para evitar FOUC). Classes globais reutilizáveis (`.btn-primary`, `.btn-secondary`, `.btn-danger`, `.input`, `.label`, `.card`, `.tab-btn`) estão definidas em `index.css`. Cada página/componente tem seu próprio `*.module.css` com Tailwind via `@apply`.

**HttpClient:** `front/src/infrastructure/http/HttpClient.ts` trata 401 fazendo redirect para `/login` automaticamente. Todos os `*Repository.ts` do frontend delegam para ele, tipando o retorno via `http.get<Entidade>(...)`.

**Contextos principais:**
- `AuthContext` — token JWT no localStorage (`df_token`), dois timers: aviso 5 min antes do expirar e logout automático ao expirar
- `ToastContext` — suporta `action: { label, onClick }` para botão inline no toast
- `ConfirmContext` — `useConfirm()` retorna uma Promise que resolve para boolean (modal de confirmação)
- `GlobalSearchContext` — controla abertura da busca global (Ctrl+K / botão na topbar mobile)

**Impressão:** usa `react-to-print` v3 com `useReactToPrint({ contentRef })`. Os componentes de impressão ficam em divs ocultos (`display: none`) no DOM e recebem `ref` via `forwardRef<HTMLDivElement, Props>`.

### Deploy (Railway)

- Build: `npm run build` (root) — compila o frontend (`tsc -b && vite build`) para `front/dist/`
- Start: `npm start` (root) → `npm start --prefix back` → `tsx index.ts`; em `NODE_ENV=production`, o backend serve `front/dist/` como static + SPA fallback
- Node 22 obrigatório (via `nixpacks.toml` e `"engines": {"node": ">=22"}` no `back/package.json`)
- Banco persistido via Railway Volume montado em `/data/dentefacil.db` (variável `DB_PATH`)

## Padrão para novos recursos

### Novo endpoint

1. Se for uma entidade nova, adicionar a interface em `back/src/types/entities.ts` (e espelhar em `front/src/types/entities.ts`)
2. `back/src/infrastructure/repositories/NomeRepository.ts` — SQL puro com prepared statements, casts `as unknown as Entidade` no retorno do `db.prepare(...).get/all()`, `export default { ... }`
3. `back/src/interfaces/controllers/NomeController.ts` — `(req: Request, res: Response)`, chama o repository
4. `back/src/interfaces/routes/nome.ts` — `router.get/post/...` com `wrap()`, `export default router`
5. Registrar em `back/index.ts`: `import nomeRoutes from './src/interfaces/routes/nome'` + `app.use('/api/nome', nomeRoutes)`
6. `front/src/infrastructure/http/NomeRepository.ts` — métodos tipados que chamam `http.get<Entidade>(...)` etc.
7. Exportar em `front/src/infrastructure/http/index.ts`

### Nova tabela

Adicionar `CREATE TABLE IF NOT EXISTS` em `createTables()` dentro de `back/src/infrastructure/database/schema.ts`. Migrações de colunas vão em `runMigrations()`.
