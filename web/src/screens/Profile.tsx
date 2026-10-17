import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { cls, fmt } from "../lib/format";
import { refreshUser, updateSettings, useApp } from "../lib/store";
import { onBackButton, confirm } from "../lib/tg";
import { nav } from "../nav";
import { errorMessage } from "../ui/GameShell";
import { Avatar, Btn, Segmented, Spinner, TierBadge, toast } from "../ui/kit";
import { BottomNav } from "./BottomNav";
import { Brand } from "../ui/Brand";

export default function Profile({ tab }: { tab: "profile" | "settings" | "fair" }) {
  useEffect(() => onBackButton(() => nav.push({ name: "lobby" })), []);
  return (
    <div className="fixed inset-0 nebula-bg overflow-y-auto no-scrollbar">
      <div className="stars-layer fixed" />
      <div className="relative px-4 pb-36" style={{ paddingTop: "calc(var(--safe-top) + 12px)" }}>
        <Segmented
          value={tab}
          onChange={(v) => nav.replace({ name: v })}
          options={[
            { value: "profile", label: "Perfil" },
            { value: "settings", label: "Ajustes" },
            { value: "fair", label: "Provably Fair" },
          ]}
        />
        <div className="mt-4">{tab === "profile" ? <ProfileTab /> : tab === "settings" ? <SettingsTab /> : <FairTab />}</div>
      </div>
      <BottomNav />
    </div>
  );
}

function ProfileTab() {
  const u = useApp((s) => s.user)!;
  const names = useApp((s) => s.config?.games ?? {});
  const [hist, setHist] = useState<any[] | null>(null);
  useEffect(() => {
    api.get("/history").then((r) => setHist(r.rounds)).catch(() => setHist([]));
  }, []);
  const profit = u.stats.won - u.stats.wagered;
  return (
    <>
      <div className="glass rounded-3xl p-4 flex items-center gap-3">
        <Avatar name={u.name} photo={u.photo} size={60} ring={u.vip ? "ring-2 ring-gold-400" : ""} />
        <div className="flex-1 min-w-0">
          <div className={cls("font-display font-bold text-lg truncate", u.vip && "gold-text")}>{u.name}</div>
          {u.username && <div className="text-xs text-white/50">@{u.username}</div>}
          <div className="mt-1"><TierBadge tier={u.supporter.tier} vip={!!u.vip} /></div>
          {u.vip && <div className="text-[11px] text-gold-300 font-bold mt-1">VIP até {new Date(u.vip.until).toLocaleDateString("pt-BR")}</div>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-3">
        {[
          ["Saldo", fmt(u.balance)],
          ["Rodadas", fmt(u.stats.rounds)],
          ["Total apostado", fmt(u.stats.wagered)],
          ["Maior prêmio", fmt(u.stats.biggestWin)],
          ["Resultado", `${profit >= 0 ? "+" : ""}${fmt(profit)}`],
          ["Apoio", `${fmt(u.supporter.stars)} ⭐`],
        ].map(([k, v]) => (
          <div key={k} className="glass rounded-2xl p-3">
            <div className="text-[10px] font-black tracking-widest text-white/40 uppercase">{k}</div>
            <div className={cls("font-display font-bold text-base mt-0.5 tabular", k === "Resultado" && (profit >= 0 ? "text-win-400" : "text-loss-400"))}>{v}</div>
          </div>
        ))}
      </div>
      <div className="font-display font-bold mt-6 mb-2">Últimas rodadas</div>
      {!hist ? (
        <div className="py-8 grid place-items-center"><Spinner /></div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {hist.length === 0 && <div className="text-sm text-white/50 text-center py-6">Nenhuma rodada ainda.</div>}
          {hist.map((r) => (
            <div key={r.id} className="glass rounded-xl px-3 py-2 flex items-center justify-between text-sm">
              <div>
                <div className="font-bold">{names[r.game] ?? r.game}</div>
                <div className="text-[11px] text-white/40">{new Date(r.created_at).toLocaleString("pt-BR")}</div>
              </div>
              <div className={cls("font-extrabold tabular", r.payout - r.bet > 0 ? "text-win-400" : "text-white/60")}>
                {r.payout - r.bet > 0 ? "+" : ""}{fmt(r.payout - r.bet)}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function Toggle({ on, onChange, label, desc }: { on: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) {
  return (
    <button onClick={() => onChange(!on)} className="press w-full glass rounded-2xl px-4 py-3 flex items-center justify-between text-left">
      <div>
        <div className="font-extrabold text-sm">{label}</div>
        {desc && <div className="text-[11px] text-white/50">{desc}</div>}
      </div>
      <div className={cls("w-12 h-7 rounded-full p-1 transition-colors", on ? "bg-win-500" : "bg-white/15")}>
        <div className={cls("w-5 h-5 rounded-full bg-white transition-transform", on && "translate-x-5")} />
      </div>
    </button>
  );
}

function SettingsTab() {
  const s = useApp((x) => x.settings);
  return (
    <div className="flex flex-col gap-2">
      <Toggle label="Som" desc="Efeitos sonoros dos jogos" on={s.sound} onChange={(v) => updateSettings({ sound: v })} />
      <Toggle label="Vibração" desc="Resposta tátil nos toques e vitórias" on={s.haptics} onChange={(v) => updateSettings({ haptics: v })} />
      <div className="glass rounded-2xl px-4 py-3">
        <div className="font-extrabold text-sm mb-2">Velocidade das animações</div>
        <Segmented value={s.speed} onChange={(v) => updateSettings({ speed: v })} options={[{ value: "normal", label: "Normal" }, { value: "fast", label: "Rápida" }, { value: "turbo", label: "Turbo" }]} />
      </div>
      <div className="glass rounded-2xl px-4 py-3">
        <div className="font-extrabold text-sm mb-2">Qualidade gráfica</div>
        <Segmented value={s.quality} onChange={(v) => updateSettings({ quality: v })} options={[{ value: "high", label: "Alta" }, { value: "low", label: "Econômica" }]} />
        <div className="text-[11px] text-white/45 mt-2">A econômica desliga desfoques, confetes e brilhos para celulares mais simples.</div>
      </div>
      <div className="text-center mt-6"><Brand size={22} /></div>
      <p className="text-center text-[11px] text-white/35 mt-2">Entretenimento para maiores de 18 anos. Fichas sem valor monetário.<br />Pausa: se precisar, simplesmente feche o app — nenhuma rodada fica pendente sem você.</p>
    </div>
  );
}

function FairTab() {
  const u = useApp((s) => s.user)!;
  const [seed, setSeed] = useState(u.fair.clientSeed);
  const [revealed, setRevealed] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const load = () => api.get("/fair/revealed").then((r) => setRevealed(r.seeds)).catch(() => {});
  useEffect(() => {
    load();
  }, []);
  async function rotate(withSeed: boolean) {
    if (!(await confirm("Trocar a seed revela o server seed atual e zera o nonce. Continuar?"))) return;
    setBusy(true);
    try {
      await api.post("/fair/rotate", withSeed ? { clientSeed: seed } : {});
      await refreshUser();
      load();
      toast("Seed trocada! O server seed anterior foi revelado.", "success");
    } catch (e) {
      toast(errorMessage(e), "error");
    }
    setBusy(false);
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="glass rounded-2xl p-4 text-[13px] text-white/75 leading-relaxed">
        Cada resultado vem de <code className="text-gold-300">HMAC_SHA256(server_seed, client_seed:nonce:cursor)</code>. O hash do server seed aparece abaixo <b>antes</b> de você jogar; ao trocar a seed, o valor original é revelado e qualquer rodada pode ser conferida.
      </div>
      <Field label="Hash do server seed (ativo)" value={u.fair.serverSeedHash} />
      <div className="glass rounded-2xl p-3">
        <div className="text-[10px] font-black tracking-widest text-white/40">CLIENT SEED</div>
        <input value={seed} onChange={(e) => setSeed(e.target.value.slice(0, 64))} className="bg-transparent outline-none w-full font-mono text-sm mt-1" />
      </div>
      <Field label="Nonce (rodadas com esta seed)" value={String(u.fair.nonce)} />
      <div className="grid grid-cols-2 gap-2">
        <Btn variant="violet" disabled={busy || seed === u.fair.clientSeed} onClick={() => rotate(true)}>Usar meu client seed</Btn>
        <Btn variant="glass" disabled={busy} onClick={() => rotate(false)}>Trocar seeds</Btn>
      </div>
      {revealed.length > 0 && (
        <>
          <div className="font-display font-bold mt-3">Seeds reveladas</div>
          {revealed.map((r) => (
            <div key={r.server_seed_hash} className="glass rounded-2xl p-3 text-[11px] font-mono break-all space-y-1">
              <div><span className="text-white/40">server:</span> {r.server_seed}</div>
              <div><span className="text-white/40">hash:</span> {r.server_seed_hash}</div>
              <div><span className="text-white/40">client:</span> {r.client_seed} · <span className="text-white/40">nonces:</span> 0–{Math.max(0, r.last_nonce - 1)}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <button onClick={() => navigator.clipboard?.writeText(value).then(() => toast("Copiado"))} className="glass rounded-2xl p-3 text-left">
      <div className="text-[10px] font-black tracking-widest text-white/40 uppercase">{label}</div>
      <div className="font-mono text-xs mt-1 break-all text-white/85">{value}</div>
    </button>
  );
}
