import { registerControls } from "./controls.mjs";
import { enforce } from "./manual-dice.mjs";
import { registerSettings } from "./settings.mjs";

Hooks.once("init", () => {
  registerSettings();
  registerControls();
});

Hooks.once("ready", () => enforce());

Hooks.on("updateSetting", setting => {
  if ( setting.key !== "core.permissions" ) return;

  // Setting#_onUpdate fires this hook from super._onUpdate before invoking the setting's own
  // onChange, which is what refreshes game.permissions. Defer so that the permission check in
  // enforce() reads the new roles rather than the ones being replaced.
  window.setTimeout(() => enforce(), 0);
});
