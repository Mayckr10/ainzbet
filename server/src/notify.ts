/**
 * Avisos para o administrador (ADMIN_ID) sem acoplar o serviço ao bot.
 * O bot registra o envio real em setNotifier(); sem bot configurado, os avisos são ignorados.
 */
type Notifier = (html: string) => Promise<unknown>;
let notifier: Notifier | null = null;

export function setNotifier(fn: Notifier) {
  notifier = fn;
}

export function notifyAdmin(html: string) {
  notifier?.(html).catch((e) => console.error("aviso ao admin falhou", e?.message ?? e));
}
