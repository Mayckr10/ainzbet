/**
 * Gradientes e filtros compartilhados por todos os símbolos (montado uma única vez na raiz).
 * Assim os símbolos podem ser repetidos centenas de vezes sem IDs duplicados.
 */
export function ArtDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
      <defs>
        {/* metais */}
        <linearGradient id="a-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff6d0" />
          <stop offset=".35" stopColor="#f7c955" />
          <stop offset=".7" stopColor="#c8860f" />
          <stop offset="1" stopColor="#ffdf7e" />
        </linearGradient>
        <linearGradient id="a-gold-d" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe9a8" />
          <stop offset=".5" stopColor="#b9770c" />
          <stop offset="1" stopColor="#6b3f02" />
        </linearGradient>
        <linearGradient id="a-silver" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".5" stopColor="#b9c4e6" />
          <stop offset="1" stopColor="#5d6a99" />
        </linearGradient>
        {/* cósmico */}
        <radialGradient id="a-portal" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".18" stopColor="#c4b5fd" />
          <stop offset=".45" stopColor="#7c3aed" />
          <stop offset=".75" stopColor="#1e1b4b" />
          <stop offset="1" stopColor="#22d3ee" />
        </radialGradient>
        <radialGradient id="a-nebula" cx="45%" cy="45%" r="60%">
          <stop offset="0" stopColor="#fff1f8" />
          <stop offset=".3" stopColor="#f472b6" />
          <stop offset=".65" stopColor="#7c3aed" />
          <stop offset="1" stopColor="#1e1b4b" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="a-orb" cx="35%" cy="30%" r="70%">
          <stop offset="0" stopColor="#fffbe6" />
          <stop offset=".3" stopColor="#fcd34d" />
          <stop offset=".7" stopColor="#d97706" />
          <stop offset="1" stopColor="#78350f" />
        </radialGradient>
        <radialGradient id="a-multorb" cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#ecfeff" />
          <stop offset=".35" stopColor="#22d3ee" />
          <stop offset=".75" stopColor="#0e7490" />
          <stop offset="1" stopColor="#083344" />
        </radialGradient>
        <radialGradient id="a-planet" cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#ccfbf1" />
          <stop offset=".4" stopColor="#2dd4bf" />
          <stop offset="1" stopColor="#134e4a" />
        </radialGradient>
        <linearGradient id="a-planet-ring" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fde68a" stopOpacity=".2" />
          <stop offset=".5" stopColor="#fde68a" />
          <stop offset="1" stopColor="#fde68a" stopOpacity=".2" />
        </linearGradient>
        <linearGradient id="a-prism" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".45" stopColor="#c7d2fe" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="a-rainbow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#f43f5e" />
          <stop offset=".25" stopColor="#f59e0b" />
          <stop offset=".5" stopColor="#84cc16" />
          <stop offset=".75" stopColor="#06b6d4" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
        <radialGradient id="a-fire" cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#ffe4e6" />
          <stop offset=".35" stopColor="#fb7185" />
          <stop offset=".8" stopColor="#be123c" />
          <stop offset="1" stopColor="#4c0519" />
        </radialGradient>
        <radialGradient id="a-water" cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#e0f2fe" />
          <stop offset=".35" stopColor="#38bdf8" />
          <stop offset=".8" stopColor="#1d4ed8" />
          <stop offset="1" stopColor="#172554" />
        </radialGradient>
        <radialGradient id="a-earth" cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#ecfccb" />
          <stop offset=".35" stopColor="#4ade80" />
          <stop offset=".8" stopColor="#15803d" />
          <stop offset="1" stopColor="#052e16" />
        </radialGradient>
        <radialGradient id="a-iris" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#0b0618" />
          <stop offset=".3" stopColor="#0b0618" />
          <stop offset=".32" stopColor="#a78bfa" />
          <stop offset=".7" stopColor="#6d28d9" />
          <stop offset="1" stopColor="#22d3ee" />
        </radialGradient>
        <radialGradient id="a-sun" cx="50%" cy="45%" r="55%">
          <stop offset="0" stopColor="#fffbeb" />
          <stop offset=".4" stopColor="#fde047" />
          <stop offset=".85" stopColor="#f97316" />
          <stop offset="1" stopColor="#c2410c" />
        </radialGradient>
        <radialGradient id="a-moon" cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".6" stopColor="#c7d2fe" />
          <stop offset="1" stopColor="#6366f1" />
        </radialGradient>
        <linearGradient id="a-comet-tail" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset=".6" stopColor="#67e8f9" stopOpacity=".6" />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
        <radialGradient id="a-corona" cx="50%" cy="50%" r="50%">
          <stop offset=".55" stopColor="#000" stopOpacity="0" />
          <stop offset=".62" stopColor="#fff7d6" />
          <stop offset=".72" stopColor="#f59e0b" stopOpacity=".8" />
          <stop offset="1" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
        {/* abissal */}
        <radialGradient id="b-kraken" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#000" />
          <stop offset=".22" stopColor="#000" />
          <stop offset=".25" stopColor="#fef08a" />
          <stop offset=".6" stopColor="#f97316" />
          <stop offset="1" stopColor="#7c2d12" />
        </radialGradient>
        <radialGradient id="b-pearl" cx="35%" cy="30%" r="70%">
          <stop offset="0" stopColor="#f5f3ff" />
          <stop offset=".25" stopColor="#a78bfa" />
          <stop offset=".6" stopColor="#1e1b4b" />
          <stop offset="1" stopColor="#020617" />
        </radialGradient>
        <radialGradient id="b-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ecfeff" />
          <stop offset=".3" stopColor="#67e8f9" />
          <stop offset="1" stopColor="#67e8f9" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="b-angler" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4c1d95" />
          <stop offset="1" stopColor="#1e1b4b" />
        </linearGradient>
        <radialGradient id="b-jelly" cx="50%" cy="30%" r="70%">
          <stop offset="0" stopColor="#fdf4ff" />
          <stop offset=".4" stopColor="#e879f9" stopOpacity=".9" />
          <stop offset="1" stopColor="#86198f" stopOpacity=".7" />
        </radialGradient>
        <linearGradient id="b-nautilus" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff7ed" />
          <stop offset=".5" stopColor="#fdba74" />
          <stop offset="1" stopColor="#9a3412" />
        </linearGradient>
        <linearGradient id="b-seahorse" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fef9c3" />
          <stop offset=".5" stopColor="#facc15" />
          <stop offset="1" stopColor="#a16207" />
        </linearGradient>
        <linearGradient id="b-star" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe4e6" />
          <stop offset=".5" stopColor="#fb7185" />
          <stop offset="1" stopColor="#9f1239" />
        </linearGradient>
        <linearGradient id="b-coral" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fdba74" />
          <stop offset="1" stopColor="#ea580c" />
        </linearGradient>
        <linearGradient id="b-clam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e0f2fe" />
          <stop offset="1" stopColor="#0284c7" />
        </linearGradient>
        {/* forja */}
        <radialGradient id="c-egg" cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#ecfccb" />
          <stop offset=".4" stopColor="#10b981" />
          <stop offset="1" stopColor="#064e3b" />
        </radialGradient>
        <radialGradient id="c-dragoneye" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fef9c3" />
          <stop offset=".5" stopColor="#f59e0b" />
          <stop offset="1" stopColor="#b91c1c" />
        </radialGradient>
        <linearGradient id="c-crystal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fdf2f8" />
          <stop offset=".4" stopColor="#f472b6" />
          <stop offset="1" stopColor="#831843" />
        </linearGradient>
        <linearGradient id="c-crystal2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ecfeff" />
          <stop offset=".4" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#155e75" />
        </linearGradient>
        <linearGradient id="c-crystal3" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f5f3ff" />
          <stop offset=".4" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#4c1d95" />
        </linearGradient>
        <linearGradient id="c-iron" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e2e8f0" />
          <stop offset=".5" stopColor="#64748b" />
          <stop offset="1" stopColor="#1e293b" />
        </linearGradient>
        <radialGradient id="c-ember" cx="50%" cy="60%" r="60%">
          <stop offset="0" stopColor="#fff7ed" />
          <stop offset=".35" stopColor="#fbbf24" />
          <stop offset=".7" stopColor="#ea580c" />
          <stop offset="1" stopColor="#7f1d1d" />
        </radialGradient>
        <filter id="a-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="a-soft" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#000" floodOpacity=".55" />
        </filter>
      </defs>
    </svg>
  );
}
