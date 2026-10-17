import { Bot, InlineKeyboard } from "grammy";
import type { InlineQueryResultArticle } from "grammy/types";
import { config, miniAppLink } from "./config.js";
import { applyPayment, adminStats, markRefunded } from "./service.js";
import { pool } from "./db.js";
import { setNotifier } from "./notify.js";
import { findProduct } from "./store.js";
import { GAME_NAMES } from "./games/registry.js";

export const bot = new Bot(config.botToken || "0:dev");
export let botUsername = process.env.BOT_USERNAME ?? "";

const fmt = (n: number) => Math.floor(n).toLocaleString("pt-BR");
const escapeHtml = (s: string) => s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!);

/** Card que aparece quando alguém digita @seubot em qualquer chat. */
function lobbyCard(id: string, title: string, description: string, start?: string): InlineQueryResultArticle {
  return {
    type: "article",
    id,
    title,
    description,
    thumbnail_url: config.publicUrl ? `${config.publicUrl}/inline-thumb.png` : undefined,
    input_message_content: {
      message_text:
        `🎰 <b>AinzBet</b>\n\n` +
        `19 jogos com fichas virtuais: slots com prêmios de até <b>50.000x</b>, roleta, blackjack, crash, mines e muito mais.\n\n` +
        `🎁 Entre e ganhe <b>${fmt(config.startingBalance)} fichas</b> grátis.\n` +
        `<i>Entretenimento. Fichas sem valor monetário.</i>`,
      parse_mode: "HTML",
    },
    reply_markup: new InlineKeyboard().url("🎰 Jogar agora", miniAppLink(start, botUsername)),
  };
}

export function setupBot() {
  bot.inlineQuery(/.*/, async (ctx) => {
    const q = ctx.inlineQuery.query.trim().toLowerCase();
    const results: InlineQueryResultArticle[] = [lobbyCard("lobby", "🎰 AinzBet", "Abrir o cassino neste chat (19 jogos)")];
    for (const [id, name] of Object.entries(GAME_NAMES)) {
      if (q && name.toLowerCase().includes(q)) {
        results.push(lobbyCard(`g-${id}`, `🎮 ${name}`, `Abrir direto em ${name}`, `game_${id}`));
      }
    }
    await ctx.answerInlineQuery(results.slice(0, 20), { cache_time: 30, is_personal: false });
  });

  /** Teclado principal: abrir aqui, mandar o cassino para um grupo (modo inline) ou escolher um jogo. */
  const mainKeyboard = () =>
    new InlineKeyboard()
      .url("🎰 Jogar agora", miniAppLink(undefined, botUsername))
      .row()
      .switchInlineChosen("👥 Enviar para um grupo", { query: "", allow_group_chats: true, allow_user_chats: true, allow_channel_chats: false, allow_bot_chats: false })
      .row()
      .switchInlineCurrent("🎮 Escolher um jogo", "")
      .text("🏆 Ranking", "menu:ranking")
      .row()
      .url("⭐ Loja de Estrelas", miniAppLink("store", botUsername));

  const welcome = () =>
    `🎰 <b>AinzBet</b>\n\n` +
    `20 jogos com fichas virtuais: slots até <b>50.000x</b>, roleta, blackjack, crash, mines e mais.\n\n` +
    `👥 <b>Para jogar no grupo:</b> toque em <i>Enviar para um grupo</i>, escolha o grupo e envie o card. ` +
    `Ou digite <code>@${botUsername}</code> na caixa de mensagem de qualquer chat.\n\n` +
    `🎁 Novos jogadores ganham <b>${fmt(config.startingBalance)} fichas</b>.`;

  bot.command(["start", "menu", "cassino", "jogar"], async (ctx) => {
    await ctx.reply(welcome(), { parse_mode: "HTML", reply_markup: mainKeyboard() });
  });

  // /grupo: atalho direto para escolher o grupo e postar o cassino via inline
  bot.command(["grupo", "inline", "compartilhar"], async (ctx) => {
    await ctx.reply("👥 Escolha o grupo onde o cassino vai abrir:", {
      reply_markup: new InlineKeyboard()
        .switchInlineChosen("👥 Escolher grupo", { query: "", allow_group_chats: true, allow_user_chats: true, allow_channel_chats: false, allow_bot_chats: false })
        .row()
        .switchInlineChosen("🚀 Enviar o Crash", { query: "crash", allow_group_chats: true, allow_user_chats: true })
        .switchInlineChosen("🔮 Enviar o Oráculo", { query: "oráculo", allow_group_chats: true, allow_user_chats: true }),
    });
  });

  bot.command("ajuda", async (ctx) => {
    await ctx.reply(
      "ℹ️ <b>Comandos</b>\n\n" +
        "/start · menu principal\n" +
        "/jogar · abrir o cassino\n" +
        "/grupo · enviar o cassino para um grupo\n" +
        "/ranking · melhores jogadores\n" +
        "/termos · termos de uso\n" +
        "/paysupport · suporte a pagamentos\n\n" +
        `No grupo, digite <code>@${botUsername}</code> + nome do jogo (ex.: <code>@${botUsername} roleta</code>).`,
      { parse_mode: "HTML" },
    );
  });

  const rankingText = async () => {
    const r = await pool.query("SELECT first_name, balance FROM users ORDER BY balance DESC LIMIT 10");
    const medals = ["🥇", "🥈", "🥉"];
    return (
      "🏆 <b>Ranking global</b>\n\n" +
      (r.rows.length
        ? r.rows.map((u: any, i: number) => `${medals[i] ?? `${i + 1}.`} ${escapeHtml(u.first_name)} · ${fmt(u.balance)} fichas`).join("\n")
        : "Ninguém jogou ainda. Seja o primeiro!") +
      "\n\n<i>O ranking de cada grupo aparece dentro do cassino.</i>"
    );
  };
  bot.command("ranking", async (ctx) => {
    await ctx.reply(await rankingText(), { parse_mode: "HTML", reply_markup: new InlineKeyboard().url("🎰 Abrir cassino", miniAppLink(undefined, botUsername)) });
  });
  bot.callbackQuery("menu:ranking", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(await rankingText(), { parse_mode: "HTML" });
  });

  bot.command(["termos", "terms"], async (ctx) => {
    await ctx.reply(
      "📜 <b>Termos</b>\n\n" +
        "• As fichas são moeda virtual de entretenimento, sem valor monetário, e não podem ser sacadas, trocadas ou transferidas.\n" +
        "• Compras com Telegram Stars entregam fichas, VIP ou registram doações; não existe prêmio em dinheiro.\n" +
        "• Proibido para menores de 18 anos.\n" +
        "• Problemas com pagamento: /paysupport",
      { parse_mode: "HTML" },
    );
  });

  bot.command("paysupport", async (ctx) => {
    await ctx.reply(
      "💬 <b>Suporte a pagamentos</b>\n\nDescreva o problema respondendo esta mensagem, com a data da compra. " +
        "Pagamentos em Stars podem ser reembolsados pelo administrador quando a entrega falhar.",
      { parse_mode: "HTML" },
    );
  });

  // Telegram exige responder em até 10 s antes de cobrar
  bot.on("pre_checkout_query", async (ctx) => {
    const q = ctx.preCheckoutQuery;
    const p = findProduct(q.invoice_payload);
    const ok = !!p && q.currency === "XTR" && q.total_amount === p.stars;
    await ctx.answerPreCheckoutQuery(ok, ok ? undefined : { error_message: "Produto indisponível. Tente novamente." });
  });

  bot.on("message:successful_payment", async (ctx) => {
    const pay = ctx.message.successful_payment;
    try {
      const res = await applyPayment(ctx.from, pay.invoice_payload, pay.total_amount, pay.telegram_payment_charge_id);
      if (!res) return;
      const thanks =
        res.product.kind === "donation"
          ? `💖 Obrigado pela doação de ${pay.total_amount} ⭐! Você recebeu ${fmt(res.chips)} fichas de presente.`
          : res.product.kind === "vip"
            ? `👑 Passe Estelar VIP ativado! +${fmt(res.chips)} fichas e bônus diário 5x por 30 dias.`
            : `✨ ${fmt(res.chips)} fichas creditadas. Boa sorte!`;
      await ctx.reply(thanks);
      if (config.adminId && config.adminId !== ctx.from.id) {
        const who = ctx.from.username ? `@${ctx.from.username}` : ctx.from.first_name;
        await bot.api
          .sendMessage(
            config.adminId,
            `⭐ <b>${pay.total_amount} Stars</b> de ${who} (id ${ctx.from.id})\nProduto: ${res.product.title}\nCharge: <code>${pay.telegram_payment_charge_id}</code>`,
            { parse_mode: "HTML" },
          )
          .catch(() => {});
      }
    } catch (e) {
      console.error("payment apply failed", e);
      await ctx.reply("⚠️ Recebemos seu pagamento, mas houve um erro ao creditar. Use /paysupport.");
    }
  });

  // ---- comandos do administrador (ADMIN_ID)
  bot.command("admin", async (ctx) => {
    if (!config.adminId || ctx.from?.id !== config.adminId) return;
    const s = await adminStats();
    await ctx.reply(
      `📊 <b>AinzBet</b>\n\nJogadores: ${fmt(s.users)} (24h: ${fmt(s.active24h)})\nRodadas 24h: ${fmt(s.rounds24h)}\n\n` +
        `⭐ Stars hoje: <b>${fmt(s.starsToday)}</b>\n⭐ Stars total: <b>${fmt(s.starsTotal)}</b>\nCompras: ${fmt(s.payments)} · Doações: ${fmt(s.donations)}\n\n` +
        `Para sacar as Stars: @BotFather → seu bot → Balance (o saque vai para a conta dona do bot).`,
      { parse_mode: "HTML" },
    );
  });

  bot.command("reembolso", async (ctx) => {
    if (!config.adminId || ctx.from?.id !== config.adminId) return;
    const [userId, chargeId] = (ctx.match ?? "").trim().split(/\s+/);
    if (!userId || !chargeId) return ctx.reply("Uso: /reembolso <user_id> <charge_id>");
    try {
      await bot.api.refundStarPayment(Number(userId), chargeId);
      await markRefunded(chargeId);
      await ctx.reply("✅ Reembolso feito.");
    } catch (e: any) {
      await ctx.reply(`❌ Falhou: ${e?.description ?? e?.message}`);
    }
  });

  bot.catch((err) => console.error("bot error", err.error));
}

export async function initBot() {
  if (!config.botToken) return;
  await bot.init();
  if (config.adminId) {
    setNotifier((html) => bot.api.sendMessage(config.adminId, html, { parse_mode: "HTML", link_preview_options: { is_disabled: true } }));
  }
  botUsername = bot.botInfo.username;
  await bot.api.setMyCommands([
    { command: "start", description: "Menu principal" },
    { command: "jogar", description: "Abrir o cassino" },
    { command: "grupo", description: "Enviar o cassino para um grupo" },
    { command: "ranking", description: "Melhores jogadores" },
    { command: "ajuda", description: "Comandos e como jogar" },
    { command: "termos", description: "Termos de uso" },
    { command: "paysupport", description: "Suporte a pagamentos" },
  ]);
}

export async function createInvoice(productId: string, chips: number) {
  const p = findProduct(productId);
  if (!p) throw new Error("unknown_product");
  const description =
    p.kind === "donation"
      ? `Apoie o AinzBet. Bônus de agradecimento: ${fmt(chips)} fichas virtuais.`
      : p.kind === "vip"
        ? `30 dias de bônus diário 5x, nome dourado e selo VIP. Inclui ${fmt(chips)} fichas virtuais.`
        : `${fmt(chips)} fichas virtuais (sem valor monetário).`;
  return bot.api.createInvoiceLink(p.title, description, p.id, "", "XTR", [{ label: p.title, amount: p.stars }]);
}

/** Mensagem pronta para o jogador compartilhar no grupo via WebApp.shareMessage. */
export async function prepareShare(userId: number, text: string) {
  const res = await bot.api.savePreparedInlineMessage(
    userId,
    {
      type: "article",
      id: `share-${Date.now()}`,
      title: "Compartilhar resultado",
      input_message_content: { message_text: text, parse_mode: "HTML" },
      reply_markup: new InlineKeyboard().url("🎰 Jogar também", miniAppLink(undefined, botUsername)),
    },
    { allow_user_chats: true, allow_group_chats: true, allow_channel_chats: false, allow_bot_chats: false },
  );
  return res.id;
}
