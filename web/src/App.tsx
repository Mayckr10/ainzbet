import { lazy, Suspense, useEffect, useState } from "react";
import { ArtDefs } from "./art/defs";
import { api } from "./lib/api";
import { appStore, applySettings, refreshUser, useApp } from "./lib/store";
import { startParam } from "./lib/tg";
import { nav, useRoute } from "./nav";
import { EffectsLayer } from "./ui/effects";
import { Spinner, Toasts } from "./ui/kit";
import { Brand, BrandLogo } from "./ui/Brand";
import Lobby from "./screens/Lobby";
import Store from "./screens/Store";
import Ranking from "./screens/Ranking";
import Profile from "./screens/Profile";

const GAME_COMPONENTS: Record<string, React.LazyExoticComponent<() => React.ReactElement>> = {
  cosmic: lazy(() => import("./games/Cosmic")),
  "slots-fruit": lazy(() => import("./games/Abyss")),
  "slots-classic": lazy(() => import("./games/Forge")),
  dice: lazy(() => import("./games/Dice")),
  coinflip: lazy(() => import("./games/Coinflip")),
  "roulette-eu": lazy(() => import("./games/RouletteEu")),
  "roulette-us": lazy(() => import("./games/RouletteUs")),
  keno: lazy(() => import("./games/Keno")),
  scratch: lazy(() => import("./games/Scratch")),
  bingo: lazy(() => import("./games/Bingo")),
  blackjack: lazy(() => import("./games/Blackjack")),
  baccarat: lazy(() => import("./games/Baccarat")),
  videopoker: lazy(() => import("./games/VideoPoker")),
  threecard: lazy(() => import("./games/ThreeCard")),
  caribbean: lazy(() => import("./games/Caribbean")),
  crash: lazy(() => import("./games/Crash")),
  plinko: lazy(() => import("./games/Plinko")),
  mines: lazy(() => import("./games/Mines")),
  tower: lazy(() => import("./games/Tower")),
  limbo: lazy(() => import("./games/Limbo")),
};

const VideoSlotLazy = lazy(() => import("./games/VideoSlot"));

export default function App() {
  const route = useRoute();
  const user = useApp((s) => s.user);
  const error = useApp((s) => s.error);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    applySettings(appStore.get().settings);
    Promise.all([refreshUser(), api.get("/config").then((c) => appStore.set({ config: c }))])
      .then(() => {
        // no navegador (dev), ?game=<id> ou ?screen=store abre direto
        const q = new URLSearchParams(location.search);
        const sp = startParam() ?? (q.get("game") ? `game_${q.get("game")}` : null);
        const screen = sp === "store" ? "store" : q.get("screen");
        if (screen === "store" || screen === "ranking" || screen === "profile" || screen === "settings" || screen === "fair") nav.push({ name: screen });
        if (sp?.startsWith("game_")) {
          const id = sp.slice(5);
          if (GAME_COMPONENTS[id] || id.startsWith("vs-")) nav.push({ name: "game", id });
        }
      })
      .catch((e) => appStore.set({ error: e?.message ?? "Falha ao conectar" }))
      .finally(() => setBooted(true));
  }, []);

  if (!booted || (!user && !error)) {
    return (
      <div className="fixed inset-0 nebula-bg grid place-items-center">
        <ArtDefs />
        <div className="flex flex-col items-center gap-4">
          <BrandLogo size={88} className="rounded-3xl shadow-[0_10px_40px_rgba(217,168,69,0.35)]" />
          <Brand size={30} />
          <Spinner />
        </div>
      </div>
    );
  }
  if (error && !user) {
    return (
      <div className="fixed inset-0 nebula-bg grid place-items-center px-8 text-center">
        <div>
          <div className="font-display font-black text-xl gold-text mb-2">Ops!</div>
          <div className="text-white/70 text-sm">{error}</div>
          <button className="mt-6 btn-gold press rounded-2xl h-12 px-6 font-extrabold" onClick={() => location.reload()}>Tentar de novo</button>
        </div>
      </div>
    );
  }

  let screen: React.ReactNode;
  switch (route.name) {
    case "game": {
      const G = GAME_COMPONENTS[route.id];
      screen = route.id.startsWith("vs-") ? <VideoSlotLazy key={route.id} id={route.id} /> : G ? <G key={route.id} /> : <Lobby />;
      break;
    }
    case "store":
      screen = <Store />;
      break;
    case "ranking":
      screen = <Ranking />;
      break;
    case "profile":
    case "settings":
    case "fair":
      screen = <Profile tab={route.name} />;
      break;
    default:
      screen = <Lobby openBonus={route.bonus} />;
  }

  return (
    <>
      <ArtDefs />
      <Suspense fallback={<div className="fixed inset-0 nebula-bg grid place-items-center"><Spinner /></div>}>{screen}</Suspense>
      <EffectsLayer />
      <Toasts />
    </>
  );
}
