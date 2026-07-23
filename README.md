# ScoreComps · CubingSP

**ScoreComps** — ferramenta de **agrupamento, staff e súmulas oficiais da WCA**.
Aplicação web **client-side** (React + TypeScript + Vite), com login oficial
da WCA via **OAuth 2.0 (implicit grant)**. Restrito a **Delegados** e
**Organizadores**, opera apenas nas competições que o usuário gerencia — lendo
(e escrevendo) direto no WCIF oficial.

> Feito para o projeto CubingSP. Pode rodar sozinho (Netlify / Cloudflare
> Pages / GitHub Pages) ou ser incorporado ao site como módulo
> `delegate-tools`. Veja `ARQUITETURA.md`.

---

## Recursos

- 🔐 Login oficial da WCA (OAuth implicit grant — sem senha, sem secret).
- 🛡️ Acesso só para **Delegado/Organizador**; geração limitada às suas competições.
- 🧩 Lê rodadas, grupos e competidores do **WCIF** automaticamente.
- 👥 **Agrupamento automático (estilo Groupifier)**: cria os grupos por rodada,
  semeando por ranking (usa `personalBests` do WCIF; média→single, invertido p/
  BLD), com divisão **por nível** ou **equilibrada**, e números de estação.
- 🧑‍⚖️ **Atribuição de staff**: embaralhadores, runners e juízes por grupo,
  tirados de competidores de outros grupos e com carga balanceada.
- ☁️ **Salvar na WCA**: grava os grupos e atribuições no WCIF oficial
  (`PATCH .../wcif`), como o Groupifier faz.
- 🪪 **Cartões de competidor**: um cartão por pessoa com o grupo de cada evento
  e as tarefas de staff.
- 🏷️ Nomes de eventos no **padrão oficial da WCA** (via `@wca/helpers`).
- 🧠 Lógica dinâmica de súmula conforme as regras da WCA:
  - `DNF se > {limite}` (limite simples) ou `Tempo cumulativo de {limite}` (3BLD/Multi);
  - `Exemplo de Penalidade: 14.67 + 2 = 16.67`;
  - blocos e `Tempo de corte se > {corte}` / `Não possui tempo de corte`;
  - eventos de 3 solves (6x6, 7x7, 4BLD, 5BLD) com corte após 1 tentativa;
  - extras **E1/E2** com assinatura do **Delegado (D)** em marca-d'água.
- 🖨️ **Vários tamanhos de folha** (A4/Carta com 4 por página, A5, A6, A7); as
  súmulas **ocupam a folha inteira** e **linhas de corte tracejadas** separam
  uma da outra — estilo Groupifier.
- 📐 Nº de solves e blocos vêm do **formato da rodada no WCIF** — já reflete
  regras atuais (ex.: **3x3x3 Blindfolded virou Bo5/Ao5 em 2026**).
- 🈶 Suporta **nomes longos e com caracteres CJK** (ex.:
  `Pedro Henrique Maciel Ceccopieri Belo (陈昊然)`) — a fonte encolhe/quebra
  para caber sem estourar o layout.
- 🔤 Tipografia **Inter** (embarcada, funciona offline), bordas suavemente
  arredondadas e linhas nítidas.
- 🌙 Interface responsiva em português, tema escuro (identidade CubingSP), com
  **prévia ao vivo** da súmula.
- 👀 Botão **"Baixar PDF de exemplo"** para conferir o resultado sem login.

---

## Layout da súmula

```
┌──────┬────────────────────────┬───────┐
│  ID  │  Nome da Competição    │ Grupo │   ← ID e Grupo em negrito
│  12  │  Evento · Rodada       │   1   │
├──────┴────────────────────────┴───────┤
│           Nome do Competidor           │   ← negrito, largura fixa
│              2019XXXX01                 │   ← WCA ID
├──┬───┬──────────────────────────┬──┬──┤
│# │ S │ DNF se > 10:00.00        │J │C │
│  │   │ Exemplo de Penalidade... │  │  │
├──┼───┼──────────────────────────┼──┼──┤
│1 │   │                          │  │  │   ← Bloco 1
│2 │   │                          │  │  │
├──┴───┴──────────────────────────┴──┴──┤
│        Tempo de corte se > ...          │   ← intermediário
├──┬───┬──────────────────────────┬──┬──┤
│3 │   │                          │  │  │   ← Bloco 2
│4 │   │                          │  │  │
│5 │   │                          │  │  │
├──────────────────────────────────────┤
│               Extra(s)                 │
├──┬───┬────────────────────┬──┬──┬──┐
│E1│   │                    │D │J │C │   ← extras têm coluna D
│E2│   │                    │D │J │C │
└──┴───┴────────────────────┴──┴──┴──┘
```

Colunas: **#** (nº do solve) · **S** (Embaralhador) · tempo · **J** (Juiz) ·
**C** (Competidor). Extras acrescentam **D** (Delegado).

### Tamanhos de folha

As súmulas ocupam a folha inteira; **linhas de corte tracejadas** ("serrilhadas")
passam entre elas para recorte:

| Folha | Súmulas por página |
|---|---|
| A4 | 4 |
| Carta (Letter) | 4 |
| A5 | 1 (grande) |
| A6 | 1 |
| A7 | 1 (pequena) |

O nome do competidor tem largura fixa e **encolhe/quebra automaticamente**
para nomes longos ou com caracteres não latinos (CJK), sem quebrar o layout.
Como a rasterização usa as fontes do navegador, os glifos CJK aparecem quando
há uma fonte com esses caracteres no sistema (padrão em Windows/macOS); a
pilha de fontes já inclui os fallbacks comuns.

---

## 1. Registrar o app OAuth na WCA (obrigatório)

1. Acesse **https://www.worldcubeassociation.org/oauth/applications/new**
   (logado com uma conta WCA).
2. Preencha:
   - **Name**: `Súmulas CubingSP` (ou o que preferir).
   - **Redirect URI**: a **raiz** do app (com barra no final). Uma por linha
     para cada ambiente:
     ```
     http://localhost:5173/
     https://sumulas.cubingsp.com.br/
     ```
   - **Confidential?**: **DESMARCADO** ✅ (cliente público, sem secret).
   - **Scopes**: marque **`public`** e **`manage_competitions`**.
3. Salve e copie o **Application UID** (esse é o `Client ID`).

> Usa **implicit grant** (`response_type=token`) — o mesmo fluxo do Groupifier
> e do AGE, comprovadamente aceito pela WCA. O token volta no fragmento `#` da
> URL raiz; só o **Client ID** é usado, nenhum secret é armazenado. Por isso a
> Redirect URI é a raiz do app, não `/callback`.

---

## 2. Configurar variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```bash
cp .env.example .env
```

```dotenv
VITE_WCA_CLIENT_ID=seu-application-uid
VITE_WCA_ORIGIN=https://www.worldcubeassociation.org
# VITE_BASE=/sumulas-wca/   # só p/ GitHub Pages em subdiretório
```

Para testar sem tocar na WCA de produção, use o ambiente de staging:
`VITE_WCA_ORIGIN=https://staging.worldcubeassociation.org` (registre o app no
staging também).

---

## 3. Rodar localmente

```bash
npm install
npm run dev       # http://localhost:5173
```

Outros scripts:

```bash
npm run build     # gera dist/ (produção)
npm run preview   # serve o dist/ localmente
npm run lint      # checagem de tipos (tsc)
```

Testar o motor de agrupamento com um WCIF fictício (sem navegador):

```bash
npx tsx scripts/test-grouping.ts   # gera grupos + staff + súmulas + cartões e imprime o resultado
```

> No app, o PDF de exemplo é gerado pelo próprio botão **"Baixar PDF de
> exemplo"** na tela de login.

---

## 4. Deploy

O resultado do `npm run build` é uma pasta estática (`dist/`). É uma SPA; o
host deve fazer **fallback de rotas para `index.html`** (já incluímos
`public/_redirects` para Netlify/Cloudflare). O login volta para a **raiz** do
app (o token chega no fragmento `#`), então não há rota especial de callback.

### Netlify / Cloudflare Pages (recomendado)

- **Build command**: `npm run build`
- **Publish directory**: `dist`
- Defina as variáveis `VITE_WCA_CLIENT_ID` e `VITE_WCA_ORIGIN` no painel.
- O `_redirects` já cuida do fallback SPA.
- Cadastre a **raiz** da URL final (com barra) como Redirect URI no app WCA.

### Vercel

- Framework preset: **Vite**. Adicione um rewrite `/(.*) → /index.html`
  (`vercel.json`) para o fallback SPA, e as variáveis de ambiente no projeto.

### GitHub Pages (subdiretório)

1. Build com o base path do repositório:
   ```bash
   VITE_BASE="/NOME-DO-REPO/" npm run build
   ```
2. Publique `dist/` no branch `gh-pages` (ex.: action `peaceiris/actions-gh-pages`).
3. Para o fallback SPA, copie `index.html` para `404.html` dentro de `dist/`
   antes de publicar (`cp dist/index.html dist/404.html`).
4. Redirect URI no app WCA: `https://<user>.github.io/NOME-DO-REPO/` (a raiz, com barra).

---

## 5. Como o acesso é restringido

- A UI só libera se a API disser que você é **Delegado**
  (`GET /me → delegate_status`) **ou** se você gerencia **≥1 competição**.
- A lista de competições vem de
  `GET /competitions?managed_by_me=true` — a própria WCA devolve apenas as
  competições em que você é **Delegado ou Organizador**. Logo, não há como
  gerar súmulas de uma competição que não é sua.

---

## Fluxo de agrupamento (aba "Agrupamento & staff")

1. Defina o nº de **estações** (base das sugestões, como no Groupifier).
2. Escolha as rodadas e ajuste, por rodada: nº de **grupos**, **divisão**
   (por nível = grupos separados por velocidade; equilibrada = níveis
   misturados via *snake seeding*), **embaralhadores**, **runners**, **juízes**
   e **números de estação**.
3. **Gerar grupos** — cria as atividades de grupo no WCIF, semeia por ranking
   (`personalBests`), distribui competidores e atribui staff (de competidores de
   outros grupos, com carga balanceada).
4. A partir do resultado: **Baixar súmulas**, **Baixar cartões de competidor**
   e **Salvar na WCA** (grava no WCIF oficial — requer que a rodada tenha
   horário no cronograma da WCA).

> As regras de ranking, contagem de grupos/staff e a persistência via
> `PATCH .../wcif` seguem o comportamento do Groupifier
> (`jonatanklosko/groupifier`). Eventos com tentativas pré-agendadas (FMC e
> Multi-BLD) não são divididos em grupos, igual ao Groupifier.

## 6. Estrutura do projeto

```
src/
├── auth/            OAuth (implicit grant) + contexto React
│   ├── wcaAuth.ts
│   └── AuthContext.tsx
├── wca/             API e WCIF
│   ├── api.ts       fetch/patch (inclui PATCH do WCIF)
│   ├── types.ts
│   ├── wcif.ts      extração de rodadas/grupos/competidores
│   └── grouping.ts  motor de agrupamento + staff (lógica do Groupifier)
├── scorecards/      regras + layout + PDF
│   ├── format.ts    tempos e nomes de evento (padrão WCA)
│   ├── logic.ts     blocos, cutoff, cumulativo, extras
│   ├── build.ts     WCIF + seleção → modelos de súmula
│   ├── template.ts  HTML/CSS da súmula (fonte, bordas, D, etc.)
│   ├── paper.ts     tamanhos de folha + disposição na página
│   ├── export.ts    html2canvas + jsPDF → PDF com linhas de corte
│   ├── competitorCards.ts  cartões de competidor (grupos + tarefas)
│   └── demo.ts      dados fictícios (todos os casos + nome CJK)
├── components/      UI (Header, Login, listas, prévia, agrupamento)
│   └── GroupingPanel.tsx    config de grupos/staff + salvar/exportar
├── config.ts        leitura das envs
└── App.tsx
scripts/test-grouping.ts    teste do motor de agrupamento (dev)
```

---

## 7. Integração ao site CubingSP (opcional)

`ARQUITETURA.md` (roadmap Fase 3) prevê `src/modules/delegate-tools`. Como
`src/scorecards/*` e `src/wca/*` **não dependem de React**, dá para importá-los
direto num route handler/página Next.js. O único ponto a adaptar é o fluxo
OAuth: no site, a WCA já é registrada com callback
`/api/auth/wca/callback` (ver `claude/autenticacao.md`), então reaproveite o
token dessa integração em vez do fluxo implicit standalone.

---

## Licença / aviso

Ferramenta **não oficial**, feita pela comunidade. Usa a API pública da WCA.
"WCA" e "World Cube Association" pertencem à World Cube Association.
