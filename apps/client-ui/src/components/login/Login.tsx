import React from "react";
import { GoogleLogin } from "@react-oauth/google";
import styles from "./login.module.scss";
import { useStore } from "../../store/store";
import { IStore } from "../../store";
import { authService } from "../../services/AuthService";
import { PixelCard, PixelIcon } from "../../ui";
import { PixelIconName } from "../../ui/PixelIcon/PixelIcon";

// A feature "stat" the way a JRPG pause menu shows party stats — an inventory
// slot with an icon, a punchy value, and a one-line caption.
type Stat = {
  icon: PixelIconName;
  value: string;
  label: string;
  caption: string;
  tone: "crimson" | "blue" | "gold" | "green";
};

const LEFT_STATS: Stat[] = [
  { icon: "users", value: "∞", label: "GUILDS", caption: "Raise your community", tone: "crimson" },
  { icon: "chat", value: "LIVE", label: "LORE", caption: "Real-time channels", tone: "blue" },
  { icon: "chart-bar", value: "ON", label: "POLLS", caption: "Rally the party", tone: "gold" },
];

const RIGHT_STATS: Stat[] = [
  { icon: "lock", value: "AES", label: "VAULT", caption: "Encrypted at rest", tone: "green" },
  { icon: "zap", value: "CUSTOM", label: "ROLES", caption: "Ranks & permissions", tone: "crimson" },
  { icon: "speaker", value: "GOLD", label: "DECREES", caption: "Announcements & mod", tone: "gold" },
];

const StatSlot: React.FC<{ stat: Stat }> = ({ stat }) => (
  <div className={`${styles.statSlot} ${styles[stat.tone]}`}>
    <div className={styles.statIcon} aria-hidden="true">
      <PixelIcon name={stat.icon} size={26} />
    </div>
    <div className={styles.statText}>
      <div className={styles.statValueRow}>
        <span className={styles.statValue}>{stat.value}</span>
        <span className={styles.statLabel}>{stat.label}</span>
      </div>
      <span className={styles.statCaption}>{stat.caption}</span>
    </div>
  </div>
);

const LoginPage: React.FC = () => {
  const setCurrentUser = useStore((state: IStore) => state.setCurrentUser);
  const setToken = useStore((state: IStore) => state.setToken);

  const handleLoginSuccess = async (response: any) => {
    try {
      // Server-verified login: the backend validates the Google credential
      // and returns a Flux session JWT + the canonical user.
      const { token, user } = await authService.googleAuth(response?.credential);
      setToken(token);
      setCurrentUser(user);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <div className={styles.screen}>
      {/* ── The hero banner: a raised wooden sign + a parchment subtitle ribbon ─ */}
      <header className={styles.banner}>
        <div className={styles.plaque}>
          <h1 className={styles.plaqueTitle}>
            <span className={styles.titleTop}>
              <span className={styles.star} aria-hidden="true">★</span>
              <span className={styles.brand}>FLUX</span>
              <span className={styles.star} aria-hidden="true">★</span>
            </span>
            <span className={styles.titleBottom}>
              <span className={styles.slash}>{"//"}</span>
              <span className={styles.sub}>COMMUNITIES</span>
            </span>
          </h1>
        </div>

        <p className={styles.tagline}>A cozy 16-bit hall for your guild</p>
      </header>

      {/* ── The menu stage: stats left & right, the save gate in the middle ── */}
      <main className={styles.stage}>
        <section className={styles.panel} aria-label="Features">
          {LEFT_STATS.map((s) => (
            <StatSlot key={s.label} stat={s} />
          ))}
        </section>

        {/* The "Select Save File" gate. */}
        <PixelCard title="SELECT SAVE FILE" variant="yellow" className={styles.gate}>
          <div className={styles.gateInner}>
            <div className={styles.crest} aria-hidden="true">
              <span className={styles.crestF}>F</span>
              <span className={styles.crestL}>L</span>
              <span className={styles.crestU}>U</span>
              <span className={styles.crestX}>X</span>
            </div>

            <p className={styles.gatePrompt}>
              No save file detected.
              <br />
              Sign in to <strong>enter the realm</strong>.
            </p>

            <div className={styles.saveSlot}>
              <span className={styles.saveSlotLabel}>NEW GAME</span>
              <GoogleLogin
                onSuccess={handleLoginSuccess}
                onError={() => console.error("Google Login Failed")}
              />
            </div>

            <p className={styles.gateHint}>
              <PixelIcon name="lock" size={14} /> Your scrolls are encrypted at rest.
            </p>
          </div>
        </PixelCard>

        <section className={styles.panel} aria-label="More features">
          {RIGHT_STATS.map((s) => (
            <StatSlot key={s.label} stat={s} />
          ))}
        </section>
      </main>

      <footer className={styles.footer}>
        <span>▲ MOVE</span>
        <span>● SELECT</span>
        <span className={styles.version}>FLUX v1.0 — PRESS START</span>
      </footer>
    </div>
  );
};

export default LoginPage;
