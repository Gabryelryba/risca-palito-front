import { mount } from "svelte";
import "arcade-hub-ui/app.css";
import { registerMessages, t } from "arcade-hub-ui/i18n/index.svelte.js";
import GameApp from "arcade-hub-ui/GameApp.svelte";
import messages from "./i18n.js";
import StickSlash from "./stick-slash/StickSlash.svelte";

// The game's own texts first: the page reads them as soon as it mounts.
registerMessages(messages);
document.title = t("stickSlash.name");

const app = mount(GameApp, {
  target: document.getElementById("app"),
  props: { Game: StickSlash, gameId: "stick-slash" },
});

export default app;
