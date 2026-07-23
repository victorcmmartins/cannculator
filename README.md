# Calculadora Clínica de Extração de Cannabis

Ferramenta estática (HTML/CSS/JS puro, sem build) para estimar receitas de
extração de óleo full spectrum — massa de flor, diluição em óleo carreador e
guia de dosagem — a partir do perfil botânico (THC/CBD/CBG) de uma genética,
seja escolhida de um banco de dados embutido ou informada manualmente.

⚠️ **Uso educacional.** Não substitui laudo laboratorial, orientação médica ou
farmacêutica. Veja o aviso completo no rodapé da página.

## Estrutura do projeto

```
.
├── index.html              # Marcação da página (sem lógica de negócio)
├── css/styles.css          # Identidade visual
├── js/
│   ├── calculator.js        # Lógica pura de cálculo (sem DOM) — testável
│   └── app.js                # Camada de interface: lê o form, chama calculator.js, escreve o DOM
├── data/strains_db.json     # Banco de genéticas (perfil médio de THC/CBD/CBG)
├── tests/
│   ├── calculator.test.js    # Testes unitários da lógica de cálculo
│   └── strains-db.test.js    # Validação de integridade do JSON de genéticas
├── .github/workflows/deploy.yml  # CI/CD: lint + testes + deploy no GitHub Pages
├── eslint.config.js
└── .htmlvalidate.json
```

A separação entre `calculator.js` (puro) e `app.js` (DOM) existe para permitir
testar toda a matemática da receita no Node, sem precisar de um navegador ou
de mocks de DOM.

## Rodando localmente

Qualquer servidor estático funciona, por exemplo:

```bash
npx serve .
# ou
python3 -m http.server 8080
```

Depois abra `http://localhost:8080` (ou a porta indicada).

## Desenvolvimento e qualidade

```bash
npm install       # instala eslint e html-validate
npm run lint:js   # lint do JavaScript
npm run lint:html # valida o HTML (acessibilidade, estrutura)
npm test          # testes unitários (node --test)
npm run validate  # roda os três acima em sequência
```

## CI/CD (GitHub Actions → GitHub Pages)

O workflow em `.github/workflows/deploy.yml` roda em todo push/PR para `main`:

1. **`quality`** — instala dependências, roda ESLint, `html-validate` e a
   suíte de testes (`node --test`).
2. **`deploy`** — só executa se `quality` passar **e** o evento for um push em
   `main`. Publica `index.html`, `css/`, `js/` e `data/` no GitHub Pages via
   `actions/upload-pages-artifact` + `actions/deploy-pages`.

### Habilitando o GitHub Pages no repositório

Em **Settings → Pages → Build and deployment → Source**, selecione
**GitHub Actions** (não "Deploy from a branch"). Isso é obrigatório para que o
job `deploy` funcione.

## Banco de genéticas (`data/strains_db.json`)

Array de objetos com o formato:

```json
{
  "id": "acdc",
  "name": "ACDC",
  "type": "Sativa-dominant",
  "thc_avg": 1.0,
  "cbd_avg": 18.0,
  "cbg_avg": 1.0,
  "focus": "Pain, Anxiety"
}
```

`tests/strains-db.test.js` garante que todo registro tenha os campos
obrigatórios, valores numéricos não-negativos, e que não existam `id`/`name`
duplicados — isso roda no CI antes de qualquer deploy, então um JSON quebrado
nunca chega ao ar.

## Sugestões para evolução (não implementadas ainda)

- **Precisão do modelo**: os 80% de eficiência e as 20 gotas/mL são médias
  genéricas; se houver dados por método de extração (álcool, CO₂, a frio),
  vale parametrizar por método.
- **Fonte dos dados de genéticas**: hoje `strains_db.json` é estático; citar a
  fonte de cada `thc_avg`/`cbd_avg` (laudo, breeder, literatura) aumentaria a
  credibilidade da ferramenta.
- **Internacionalização**: todo o texto está hard-coded em `index.html`; se
  fizer sentido atender outros públicos, extrair as strings para um dicionário
  simples facilitaria.
- **PWA**: como é 100% estático, transformar em Progressive Web App
  (manifest + service worker) permitiria uso offline em campo/laboratório.
- **Testes de integração de UI**: os testes atuais cobrem só a lógica pura;
  Playwright ou Cypress cobririam o fluxo real de preenchimento do formulário.
- **Versionamento do banco de genéticas**: um changelog ou data de última
  atualização em `strains_db.json` ajudaria quem consome os dados a saber a
  idade da informação.
