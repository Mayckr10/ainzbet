import { cls } from "../lib/format";

/** Wordmark AinzBet (mesma composição do logo: "Ainz" em negrito + "Bet" regular, dourado). */
export function Brand({ className, size = 22 }: { className?: string; size?: number }) {
  return (
    <span className={cls("brand leading-none whitespace-nowrap", className)} style={{ fontSize: size }}>
      <b style={{ fontWeight: 700 }}>Ainz</b>
      <span style={{ fontWeight: 400 }}>Bet</span>
    </span>
  );
}

/** Logo quadrado (foto de perfil do bot). */
export function BrandLogo({ size = 40, className }: { size?: number; className?: string }) {
  return <img src="/logo.jpg" width={size} height={size} alt="AinzBet" className={cls("rounded-xl object-cover", className)} style={{ width: size, height: size }} />;
}
