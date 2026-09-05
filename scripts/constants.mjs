/**
 * Shared identifiers used across the module.
 */

/**
 * The module id. Must match both the manifest "id" and the folder name under Data/modules.
 * @type {string}
 */
export const MODULE_ID = "manual-dice";

/**
 * Keys for the settings and setting menus this module registers.
 * @type {Readonly<Record<string, string>>}
 */
export const SETTINGS = Object.freeze({
  /** World-scope master switch controlled by the Gamemaster. */
  ENABLED: "enabled",

  /** Setting menu key for the per-role configuration dialog. */
  ROLES: "roles",

  /** Client-scope stash of the user's dice configuration from before manual entry was enabled. */
  SAVED_DICE_CONFIG: "savedDiceConfiguration"
});

/**
 * The core user permission which gates manual roll fulfillment. Core checks this itself in
 * Roll.identifyFulfillableTerms, DiceTerm#_roll and the Dice Configuration menu, so a user
 * without it cannot enter dice manually even if their dice configuration says otherwise.
 * @type {string}
 */
export const MANUAL_ROLLS_PERMISSION = "MANUAL_ROLLS";

/**
 * The core fulfillment method which prompts for typed input. Registered by core in
 * CONFIG.Dice.fulfillment.methods.
 * @type {string}
 */
export const MANUAL_METHOD = "manual";

/**
 * The id of the scene control tool this module adds to the Token controls.
 * @type {string}
 */
export const TOOL_NAME = "manualDice";
