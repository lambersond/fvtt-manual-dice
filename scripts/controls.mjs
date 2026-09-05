import { TOOL_NAME } from "./constants.mjs";
import { isActive, isAvailable, setActive } from "./manual-dice.mjs";

/**
 * Add the manual dice toggle to the Token controls.
 *
 * The tool is omitted entirely when the Gamemaster has the module switched off or the user's role
 * is not permitted to roll manually, so an unpermitted user never sees the button.
 * @returns {void}
 */
export function registerControls() {
  Hooks.on("getSceneControlButtons", controls => {
    if ( !isAvailable() ) return;

    const tokens = controls.tokens;
    if ( !tokens?.tools ) return;

    tokens.tools[TOOL_NAME] = {
      name: TOOL_NAME,
      title: "MANUALDICE.Control.Title",
      icon: "fa-solid fa-dice-d20",
      order: Object.keys(tokens.tools).length,
      // A scene control tool may be a toggle or a button, never both.
      toggle: true,
      active: isActive(),
      visible: true,
      onChange: (event, active) => setActive(active)
    };
  });
}
