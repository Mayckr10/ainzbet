# AinzBet · Mini App de cassino para Telegram (modo inline)

Cassino de **fichas virtuais** que abre dentro do Telegram a partir de qualquer grupo, sem o bot precisar estar no grupo:
alguém digita `@seubot` na caixa de mensagem, escolhe o card e a mensagem com o botão **Jogar agora** aparece no grupo.

> Fichas não têm valor monetário e não podem ser sacadas. Compras com Telegram Stars entregam fichas, VIP ou registram doações.

## O que vem pronto

**20 jogos**, todos com resultado gerado no servidor (provably fair) e animações próprias:

| Jogo | Tipo | RTP | Máximo |
|---|---|---|---|
| Oráculo Cósmico | Slot 5x3, 20 linhas, arcanos (Sol, Lua, Cometa, Eclipse), giros grátis x2, minigame "Escolha a Estrela" | ≈ 96% | 50.000x |
| Jardim Abissal | Slot 5x3, Kraken multiplicador (até 500x) nos giros grátis, compra de bônus | ≈ 95,6% | 50.000x |
| Forja do Dragão | Slot clássico 3x3 com Roda da Sorte em 3 níveis | ≈ 95,4% | 50.000x |
| Crash | Multiplicador ao vivo, saque manual ou automático (no servidor) | 99% | 50.000x |
| Mines | Grade 5x5, de 1 a 24 bombas | 99% | — |
| Plinko | 8 a 16 linhas, 3 riscos | ≈ 99% | 1.000x |
| Limbo | Multiplicador-alvo | 99% | 50.000x |
| Torre | 5 dificuldades, 9 andares | 99% | — |
| Dados · Cara ou Coroa | Instantâneos | 97–98% | 5,82x |
| Roleta Europeia / Americana | Roda animada + mesa com fichas | 97,3% / 94,7% | 36x |
| Blackjack | Dobrar, dividir, 3:2, S17 | ≈ 99,5% | — |
| Bacará | Jogador, Banca, Empate, Pares | ≈ 98,9% | — |
| Video Pôquer | Jacks or Better 9/6 | ≈ 99,5% | 800x |
| Pôquer 3 Cartas · Caribbean Stud | Ante/Play/Call, Pair Plus | padrão | — |
| Keno · Raspadinha · Bingo | Sorteios | 94–97% | até 10.000x |

**Além dos jogos:** carteira única, bônus diário (5x para VIP), resgate quando o saldo zera, ranking do grupo
(usa o `chat_instance` do Telegram, sem o bot no grupo), ranking global e de apoiadores, feed de vitórias ao vivo,
botão de compartilhar resultado no grupo (`shareMessage`), histórico, página provably fair com troca de seeds,
ajustes de som, vibração, velocidade (normal/rápida/turbo) e qualidade gráfica.

**Loja de Estrelas:** 6 pacotes (15⭐ a 5.000⭐) com bônus crescente, primeira compra em dobro, oferta do dia
(+50%, troca à meia-noite de Brasília), Passe Estelar VIP de 30 dias, doações livres com selos Bronze/Prata/Ouro/Diamante
e mural de apoiadores. O administrador (`ADMIN_ID`) recebe aviso de cada pagamento.

Confira o RTP de cada jogo a qualquer momento com `npm run rtp` (cálculo exato ou simulação).

## Estrutura

```
server/src/
  index.ts          Fastify + webhook do bot + arquivos do Mini App
  bot.ts            modo inline, pagamentos em Stars, /admin, /reembolso
  routes.ts         API (/api/*)
  service.ts        carteira, rodadas, ranking, loja (transações com lock por usuário)
  auth.ts           validação do initData do Telegram (HMAC)
  fair.ts           RNG provably fair (HMAC-SHA256)
  store.ts          pacotes, VIP, oferta do dia, doações
  games/            motores de todos os jogos
web/src/
  games/            uma tela por jogo
  art/              símbolos dos slots desenhados em SVG (arte própria)
  ui/               rolos, cartas, efeitos (BIG/MEGA/EPIC WIN, moedas, confete), componentes
  screens/          lobby, loja, ranking, perfil/ajustes/provably fair
scripts/            rtp.ts (RTP), smoke.ts (teste da API), localdb.ts (Postgres local)
```

## Rodar localmente

```bash
npm install
cp .env.example .env            # preencha BOT_TOKEN e ADMIN_ID
npm run localdb                 # Postgres embutido na porta 5433 (deixe rodando)
DEV_AUTH=1 npm run dev          # API em :3000 e Mini App em :5173
```

Abra `http://localhost:5173/?dev=1` no navegador (o `?dev=` simula um usuário; troque o número para outro jogador).
`?game=cosmic` ou `?screen=store` abrem direto numa tela. Sem `PUBLIC_URL`, o bot roda em long polling.

Teste da API inteira (todos os jogos, saldo, validações, provably fair): `npx tsx scripts/smoke.ts`.

## Publicar no Railway

1. Suba esta pasta para um repositório no GitHub (o `.gitignore` já deixa `.env` de fora).
2. No Railway: **New Project → Deploy from GitHub repo**, escolha o repositório.
3. No mesmo projeto: **+ New → Database → PostgreSQL**.
4. No serviço do app, em **Variables**:
   - `BOT_TOKEN` = token do bot
   - `ADMIN_ID` = seu Telegram ID
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
   - `WEBHOOK_SECRET` = qualquer texto aleatório longo
   - `NODE_ENV` = `production`
5. Em **Settings → Networking → Generate Domain**. Copie a URL e crie a variável `PUBLIC_URL` com ela
   (ex.: `https://ainzbet-production.up.railway.app`). O app redeploya e registra o webhook sozinho.
6. Verifique `https://SEU-DOMINIO/health` → `{"ok":true}`.

O `railway.json` já define build (`npm run build`), start (`npm start`) e healthcheck. As tabelas são criadas no primeiro start.

## Configurar o bot no @BotFather

1. **Modo inline:** `/setinline` → escolha o bot → texto de exemplo, ex.: `Abrir o AinzBet…`. Sem isso, `@seubot` não aparece nos grupos.
2. **Mini App:** `/mybots` → bot → **Bot Settings → Configure Mini App → Enable Mini App** → cole a `PUBLIC_URL`.
   O botão do card usará `https://t.me/seubot?startapp`. (Opcional: `/newapp` cria um app com nome curto; nesse caso preencha `APP_SHORT_NAME`.)
3. **Foto e nome:** `/setuserpic` com o logo AinzBet, `/setname`, `/setdescription`.
4. **Pagamentos em Stars** não precisam de provedor nem configuração extra.

Para jogar num grupo: digite `@seubot` no campo de mensagem, escolha **AinzBet** (ou busque um jogo, ex.: `@seubot crash`) e envie.

## Stars e administração

- As Stars ficam no saldo do bot. Só a **conta dona do bot** saca, pelo @BotFather → bot → **Balance** (via Fragment).
  Para receber na conta do `ADMIN_ID`, o bot precisa ter sido criado por ela ou transferido para ela no BotFather.
- `/admin`: jogadores, rodadas e Stars de hoje e do total (só para o `ADMIN_ID`).
- `/reembolso <user_id> <charge_id>`: devolve as Stars e retira as fichas entregues. O `charge_id` vem no aviso de cada compra.
- `/termos` e `/paysupport` existem porque o Telegram exige isso de bots que recebem pagamentos.

## Segurança

- O `initData` do Telegram é validado com HMAC em cada requisição; o saldo nunca é confiado ao cliente.
- Toda aposta e todo prêmio rodam em transação com lock da linha do usuário (sem saldo duplicado ou negativo).
- Limite de 12 jogadas por segundo por usuário.
- Se o token do bot vazar, gere outro com `/revoke` no BotFather e atualize a variável no Railway.
