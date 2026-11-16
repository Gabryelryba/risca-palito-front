// The game's own texts, registered as main.js does, so tests that read them
// through t() see the real strings.
import { registerMessages } from "arcade-hub-ui/i18n/index.svelte.js";
import messages from "./i18n.js";

registerMessages(messages);
