import { MANUAL_METHOD, MANUAL_ROLLS_PERMISSION, MODULE_ID, SETTINGS } from "./constants.mjs";

/**
 * Manual entry is driven entirely through core's dice fulfillment system. Turning the toggle on
 * points each of the user's die denominations at core's "manual" fulfillment method; core then
 * raises its RollResolver during Roll#_evaluate and writes the typed values into the roll's terms
 * before any chat message is produced. Because the results are already present on the terms,
 * 3D dice modules such as Dice So Nice animate the entered values rather than rolling their own.
 */

/* -------------------------------------------- */
/*  Dice configuration                          */
/* -------------------------------------------- */

/**
 * The key of the core client setting mapping die denominations to fulfillment methods.
 * @returns {string}
 */
function diceConfigKey() {
  return foundry.dice.Roll.DICE_CONFIGURATION_SETTING;
}

/**
 * The die denominations core is able to fulfil manually.
 *
 * Deliberately limited to the denominations core declares. Core's resolver derives each input's
 * range from the term's `faces`, which does not describe exotic terms correctly (a Fate die
 * reports 3 faces but produces -1, 0 or 1), so those keep rolling digitally.
 * @returns {string[]}
 */
export function denominations() {
  return Object.keys(CONFIG.Dice.fulfillment.dice);
}

/**
 * A mutable copy of this user's dice configuration.
 * @returns {Record<string, string>}
 */
function getDiceConfig() {
  return foundry.utils.deepClone(game.settings.get("core", diceConfigKey()) ?? {});
}

/* -------------------------------------------- */
/*  State                                       */
/* -------------------------------------------- */

/**
 * May this user enter dice manually at all? Both the world switch and the MANUAL_ROLLS
 * permission must allow it.
 * @returns {boolean}
 */
export function isAvailable() {
  if ( !game.settings.get(MODULE_ID, SETTINGS.ENABLED) ) return false;
  return game.user.hasPermission(MANUAL_ROLLS_PERMISSION);
}

/**
 * Is this user currently entering their own dice results? True only when every configurable
 * denomination resolves to manual entry, matching what the toggle sets.
 * @returns {boolean}
 */
export function isActive() {
  const config = getDiceConfig();
  const dice = denominations();
  if ( !dice.length ) return false;
  return dice.every(d => (config[d] || config.default) === MANUAL_METHOD);
}

/**
 * Turn manual entry on or off for this user by rewriting their core dice configuration.
 *
 * The configuration in place beforehand is stashed so that switching off restores whatever the
 * user had chosen in core's own Dice Configuration menu.
 * @param {boolean} active   Whether manual entry should be active.
 * @returns {Promise<void>}
 */
export async function setActive(active) {
  if ( active === isActive() ) return;

  if ( active ) {
    await game.settings.set(MODULE_ID, SETTINGS.SAVED_DICE_CONFIG, getDiceConfig());

    // Built from its own copy: mutating the stashed object would destroy the backup.
    const next = getDiceConfig();
    for ( const d of denominations() ) next[d] = MANUAL_METHOD;
    await game.settings.set("core", diceConfigKey(), next);
    return;
  }

  // Fall back to the live configuration when there is nothing stashed, so that a user who turned
  // manual entry on through core's own Dice Configuration menu keeps their other choices.
  const saved = game.settings.get(MODULE_ID, SETTINGS.SAVED_DICE_CONFIG) ?? {};
  const restored = foundry.utils.isEmpty(saved) ? getDiceConfig() : foundry.utils.deepClone(saved);

  // Switching off must mean off, even if the restored configuration itself selected manual entry.
  // Keys are removed rather than blanked so the configuration returns to its prior shape.
  for ( const d of denominations() ) {
    if ( restored[d] === MANUAL_METHOD ) delete restored[d];
  }
  if ( restored.default === MANUAL_METHOD ) delete restored.default;

  await game.settings.set("core", diceConfigKey(), restored);
  await game.settings.set(MODULE_ID, SETTINGS.SAVED_DICE_CONFIG, {});
}

/* -------------------------------------------- */
/*  Enforcement                                 */
/* -------------------------------------------- */

/**
 * Switch manual entry off for any user who is no longer permitted to use it, then refresh the
 * scene controls so the toggle reflects the current state.
 *
 * Called when the world switch changes and when role permissions change, so that disabling the
 * module does not leave users stranded on a manual dice configuration they can no longer see a
 * control for.
 * @returns {Promise<void>}
 */
export async function enforce() {
  if ( !isAvailable() && isActive() ) await setActive(false);

  // Rebuild rather than render fresh: the controls are built by the canvas, and this may run
  // before they exist. `reset` is how core refreshes them after a permission change.
  if ( ui.controls?.rendered ) ui.controls.render({ reset: true });
}
