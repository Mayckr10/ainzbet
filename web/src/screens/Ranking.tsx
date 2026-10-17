import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { cls, fmt, fmtCompact } from "../lib/format";
import { useApp } from "../lib/store";
import { onBackButton } from "../lib/tg";
import { nav } from "../nav";
import { Avatar, Segmented, Spinner, StarIcon, TierBadge } from "../ui/kit";
import { BottomNav } from "./BottomNav";

export default function Ranking() {
  const inGroup = useApp((s) => s.context.inGroup);
  const me = useApp((s) => s.user)!;
  const [scope, setScope] = useState<"group" | "global" | "supporters">(inGroup ? "group" : "global");
  const [data, setData] = useState<{ rows: any[]; note?: string } | null>(null);
  useEffect(() => onBackButton(() => nav.push({ name: "lobby" })), []);
  useEffect(() => {
    setData(null);
    api.get(`/leaderboard?scope=${scope}`).then(setData).catch(() => setData({ rows: [] }));
  }, [scope]);

  const rows = data?.rows ?? [];
  const podium = rows.slice(0, 3);
  const valueLabel = scope === "group" ? "lucro" : scope === "supporters" ? "estrelas" : "fichas";

  return (
    <div className="fixed inset-0 nebula-bg overflow-y-auto no-scrollbar">
      <div className="stars-layer fixed" />
      <div className="relative px-4 pb-36" style={{ paddingTop: "calc(var(--safe-top) + 12px)" }}>
        <div className="font-display font-black text-xl gold-text">RANKING</div>
        <Segmented
          className="mt-3"
          value={scope}
          onChange={setScope}
          options={[
            { value: "group", label: "Grupo" },
            { value: "global", label: "Global" },
            { value: "supporters", label: "Apoiadores" },
          ]}
        />
        {!data ? (
          <div className="py-20 grid place-items-center"><Spinner /></div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center text-white/55 text-sm px-6">{data.note ?? "Ninguém por aqui ainda. Seja o primeiro!"}</div>
        ) : (
          <>
            <div className="mt-6 flex items-end justify-center gap-3">
              {[1, 0, 2].map((i) => {
                const r = podium[i];
                if (!r) return <div key={i} className="w-24" />;
                const h = i === 0 ? 120 : i === 1 ? 92 : 76;
                const color = i === 0 ? "from-gold-300 to-gold-600" : i === 1 ? "from-slate-200 to-slate-500" : "from-orange-300 to-orange-700";
                return (
                  <motion.div key={r.id} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.1 }} className="w-24 flex flex-col items-center">
                    {i === 0 && <div className="text-2xl -mb-1">👑</div>}
                    <Avatar name={r.name} photo={r.photo} size={i === 0 ? 60 : 50} ring={`ring-2 ${i === 0 ? "ring-gold-400" : "ring-white/40"}`} />
                    <div className={cls("text-xs font-extrabold mt-1 truncate max-w-full", r.vip && "gold-text")}>{r.name}</div>
                    <div className="text-[11px] font-black text-white/70 tabular">{scope === "supporters" ? `${fmt(r.value)}⭐` : fmtCompact(r.value)}</div>
                    <div className={cls("w-full mt-1 rounded-t-2xl bg-gradient-to-b grid place-items-start justify-center pt-2 font-display font-black text-2xl text-black/50", color)} style={{ height: h }}>
                      {i + 1}
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <div className="glass rounded-3xl p-2 mt-1">
              {rows.slice(3).map((r, k) => (
                <div key={r.id} className={cls("flex items-center gap-3 px-2 py-2 rounded-2xl", r.id === me.id && "bg-white/8")}>
                  <div className="w-6 text-center font-display font-black text-white/40">{k + 4}</div>
                  <Avatar name={r.name} photo={r.photo} size={32} />
                  <div className="flex-1 min-w-0">
                    <div className={cls("text-sm font-extrabold truncate", r.vip && "gold-text")}>{r.name}</div>
                    <TierBadge tier={r.tier} vip={r.vip} />
                  </div>
                  <div className={cls("font-black text-sm tabular flex items-center gap-1", scope === "group" && r.value < 0 ? "text-loss-400" : "")}>
                    {scope === "supporters" && <StarIcon size={14} />}
                    {scope === "group" && r.value > 0 ? "+" : ""}
                    {fmtCompact(r.value)}
                  </div>
                </div>
              ))}
              {rows.length <= 3 && <div className="text-center text-xs text-white/40 py-3">Ordenado por {valueLabel}</div>}
            </div>
          </>
        )}
        {scope === "group" && !inGroup && (
          <p className="text-center text-xs text-white/45 mt-4">Para o ranking do grupo, digite @ do bot no grupo e abra o cassino por lá.</p>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
