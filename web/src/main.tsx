import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { initTelegram } from "./lib/tg";
import { unlockAudio } from "./lib/sound";

initTelegram();
unlockAudio();
createRoot(document.getElementById("root")!).render(<App />);
