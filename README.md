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
├── CNAME                    # Domínio customizado do GitHub Pages (doseflora.online)
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

## Domínio próprio: doseflora.online (Hostinger + Cloudflare + GitHub Pages)

Arquitetura: domínio **registrado na Hostinger**, **DNS gerenciado pela
Cloudflare** (proxy/CDN), servido pelo **GitHub Pages**. O arquivo `CNAME` na
raiz do repo já está configurado com `doseflora.online` e é copiado para
`_site/` a cada deploy pelo workflow — sem isso, o GitHub reseta o domínio
customizado a cada novo deploy.

### 1. Mover o DNS da Hostinger para a Cloudflare

1. Crie uma conta na Cloudflare (free) e clique em **Add a site** → digite
   `doseflora.online`.
2. A Cloudflare vai escanear os registros DNS atuais e te dar **2 nameservers**
   (algo como `ana.ns.cloudflare.com` / `bob.ns.cloudflare.com`).
3. No painel da **Hostinger** → **Domínios → doseflora.online → Nameservers**,
   troque os nameservers da Hostinger pelos da Cloudflare.
4. Propagação leva de alguns minutos a ~24h. A Cloudflare avisa por e-mail
   quando o domínio for ativado.

> A partir daqui, toda a gestão de DNS (registros A/CNAME, SSL, cache) é feita
> na Cloudflare, não mais na Hostinger.

### 2. Configurar os registros DNS na Cloudflare

No painel Cloudflare → **DNS → Records**, adicione:

| Tipo | Nome | Conteúdo | Proxy |
|------|------|----------|-------|
| A | `@` | `185.199.108.153` | ✅ Proxied |
| A | `@` | `185.199.109.153` | ✅ Proxied |
| A | `@` | `185.199.110.153` | ✅ Proxied |
| A | `@` | `185.199.111.153` | ✅ Proxied |
| CNAME | `www` | `<seu-usuario>.github.io` | ✅ Proxied |

Os 4 IPs são os endereços fixos do GitHub Pages (apex domain). Substitua
`<seu-usuario>` pelo dono do repositório no GitHub.

> **Dica:** durante a configuração inicial, se o GitHub reclamar que não
> consegue verificar o domínio, mude o proxy para **DNS only** (nuvem cinza)
> temporariamente, espere o GitHub confirmar o domínio em Settings → Pages, e
> depois volte para **Proxied** (nuvem laranja) para ganhar CDN/DDoS da
> Cloudflare.

### 3. Configurar o SSL/TLS na Cloudflare

Em **SSL/TLS → Overview**, selecione o modo **Full** (não "Flexible") — o
GitHub Pages já serve HTTPS, então "Full" garante criptografia ponta a ponta
sem loop de redirecionamento. Em **SSL/TLS → Edge Certificates**, ative
**Always Use HTTPS**.

### 4. Configurar o domínio no GitHub

Em **Settings → Pages → Custom domain**, digite `doseflora.online` e salve.
Espere o check verde de verificação DNS aparecer e então marque
**Enforce HTTPS**. O GitHub reescreve automaticamente o arquivo `CNAME` do
repo se ele não existir — mas como já commitamos um, isso só confirma o valor.

### Checklist rápido

- [ ] Nameservers da Hostinger apontando para a Cloudflare
- [ ] 4 registros `A` (apex) + 1 `CNAME` (`www`) na Cloudflare
- [ ] SSL/TLS em modo **Full** + **Always Use HTTPS** na Cloudflare
- [ ] `doseflora.online` configurado em Settings → Pages, com **Enforce HTTPS**
- [ ] `CNAME` commitado na raiz do repo (já feito neste projeto)


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

## Segurança

Risco geral: **baixo** — site 100% estático, sem backend, sem banco de dados,
sem autenticação e sem dados de usuário armazenados. Ainda assim, foi feito
hardening defensivo:

**Já aplicado no código:**
- **CSP** (`<meta http-equiv="Content-Security-Policy">` em `index.html`):
  `default-src 'self'` sem `unsafe-inline`, nenhuma origem externa permitida.
- **Sem terceiros**: removida a dependência de `fonts.googleapis.com`
  (evitava vazar IP/user-agent do visitante para o Google a cada carregamento
  — relevante para LGPD num site com conteúdo de saúde). Fontes agora são só
  a stack nativa do sistema operacional.
- **Sem `innerHTML`/`insertAdjacentHTML`** em `js/app.js`: toda escrita no DOM
  usa `textContent`/`createElement`. Uma regra de ESLint (`eslint.config.js`)
  bane esses dois padrões no repo inteiro, para não reintroduzir por engano.
- **Sem `style=""` inline**: toda visibilidade é controlada por
  `classList.toggle('hidden', ...)`, o que também é o que viabiliza a CSP
  acima sem precisar de `'unsafe-inline'` em `style-src`.
- **Links externos** (`target="_blank"`) já usam `rel="noopener noreferrer"`,
  prevenindo reverse tabnabbing.
- **GitHub Actions pinadas por commit SHA** (não por tag `@v4`) em
  `.github/workflows/deploy.yml`, seguindo a recomendação da OpenSSF/
  StepSecurity contra ataques de supply chain em que uma tag é remarcada
  para apontar para código malicioso.
- **`npm audit --audit-level=high`** no pipeline: o deploy não acontece se
  alguma dependência de desenvolvimento tiver vulnerabilidade alta/crítica
  conhecida.
- **Permissões mínimas por job** no workflow: o job `quality` só tem
  `contents: read`; `pages: write` e `id-token: write` existem só no job
  `deploy`, e só quando `quality` passou.

**Ações manuais recomendadas (fora do código, na Cloudflare):**
GitHub Pages não permite configurar headers HTTP customizados na origem, então
alguns headers precisam ser adicionados via **Cloudflare → Rules → Transform
Rules (Modify Response Header)** depois que o domínio estiver ativo:
- `X-Frame-Options: DENY` (ou `Content-Security-Policy: frame-ancestors 'none'`)
  — a diretiva `frame-ancestors` da CSP só funciona via header HTTP, não via
  `<meta>`, então hoje o site ainda pode ser embutido em um `<iframe>` de
  terceiros até esse header ser adicionado na Cloudflare.
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Content-Type-Options: nosniff`
- Em **SSL/TLS → Overview**, usar o modo **Full (strict)** em vez de "Full"
  — o GitHub Pages já serve um certificado publicamente confiável (Let's
  Encrypt), então "strict" é seguro e mais rígido.
- Ativar **DNSSEC** (Cloudflare → DNS → Settings) para reduzir risco de
  spoofing/cache poisoning no DNS do domínio.
- Considerar ativar **HSTS** (SSL/TLS → Edge Certificates) depois que HTTPS
  estiver 100% estável — reduz janela de ataques de downgrade para HTTP.

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
