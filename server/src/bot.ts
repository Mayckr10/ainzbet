import { Bot, InlineKeyboard } from "grammy";
import type { InlineQueryResultArticle } from "grammy/types";
import { config, miniAppLink } from "./config.js";
import { applyPayment, adminStats, markRefunded } from "./service.js";
import { findProduct } from "./store.js";
import { GAME_NAMES } from "./games/registry.js";

export const bot = new Bot(config.botToken || "0:dev");
export let botUsername = process.env.BOT_USERNAME ?? "";

const fmt = (n: number) => Math.floor(n).toLocaleString("pt-BR");

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

  bot.command("start", async (ctx) => {
    await ctx.reply(
      `🎰 <b>AinzBet</b>\n\nPara jogar em um grupo, digite <code>@${botUsername}</code> na caixa de mensagem e escolha o cassino. Ou jogue aqui mesmo:`,
      { parse_mode: "HTML", reply_markup: new InlineKeyboard().url("🎰 Abrir cassino", miniAppLink(undefined, botUsername)) },
    );
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
  botUsername = bot.botInfo.username;
  await bot.api.setMyCommands([
    { command: "start", description: "Abrir o cassino" },
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
