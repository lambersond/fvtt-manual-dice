import { MODULE_ID, SETTINGS } from "./constants.mjs";
import { enforce } from "./manual-dice.mjs";
import ManualDiceRoleConfig from "./role-config.mjs";

/**
 * Register this module's settings and setting menus.
 * @returns {void}
 */
export function registerSettings() {

  // The Gamemaster's master switch. World scope, so the change reaches every connected client.
  game.settings.register(MODULE_ID, SETTINGS.ENABLED, {
    name: "MANUALDICE.Settings.Enabled.Name",
    hint: "MANUALDICE.Settings.Enabled.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    onChange: () => enforce()
  });

  // Per-role configuration, written through to core's MANUAL_ROLLS permission.
  game.settings.registerMenu(MODULE_ID, SETTINGS.ROLES, {
    name: "MANUALDICE.Settings.Roles.Name",
    label: "MANUALDICE.Settings.Roles.Label",
    hint: "MANUALDICE.Settings.Roles.Hint",
    icon: "fa-solid fa-shield-keyhole",
    type: ManualDiceRoleConfig,
    restricted: true
  });

  // Remembers the dice configuration a user had before switching manual entry on.
  game.settings.register(MODULE_ID, SETTINGS.SAVED_DICE_CONFIG, {
    scope: "client",
    config: false,
    type: Object,
    default: {}
  });
}
