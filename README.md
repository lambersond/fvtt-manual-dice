# Manual Dice

A Foundry VTT **v14** module that lets players roll physical dice and type the results into Foundry,
per user, without affecting anyone else at the table.

## How it works

Foundry has had a dice *fulfillment* system since v12: a roll can be resolved by something other
than the digital PRNG, and core ships a `manual` method that prompts the user to type each die
result. This module does not reimplement any of that. It supplies the three things core does not
have — a world-level switch, a role gate wired to core's own permission, and a per-user toggle in
the Token controls — and drives core's fulfillment for everything else.

Turning the toggle on points each of the user's die denominations at core's `manual` method.
On the next roll, core raises its `RollResolver` during `Roll#_evaluate`, and the values typed in
are written into the roll's terms *before* any chat message is created.

**3D dice are deterministic as a consequence.** Dice So Nice and similar modules animate the
results already present on `roll.dice[].results`, so they show the faces that were entered rather
than rolling their own. Nothing module-specific is needed for this.

## Setup

1. **Gamemaster:** *Settings → Configure Settings → Manual Dice* → tick **Enable Manual Dice**.
2. **Gamemaster:** in the same place, open **Configure Roles** and choose which roles may use it.
   Foundry's default is Trusted Player and above.
3. **Each permitted user:** click the d20 toggle in the **Token controls** to switch manual entry
   on or off for themselves. It persists across sessions.

While the module is disabled, the toggle is hidden for everyone, including the Gamemaster.

## Behavior notes

- **Unentered dice roll normally.** Submitting the dialog with blank inputs fills them via
  `term.randomFace()`. This is core's behavior ([`roll-resolver.mjs`][resolver]), kept deliberately
  so a dismissed dialog can never wedge a system's roll workflow.
- **Rerolls and exploding dice are handled.** Core's resolver prompts for additional results as
  modifiers like `r`, `x` and `kh` demand them, so `4d6kh3` and `1d6x` work.
- **Standard denominations only.** d4, d6, d8, d10, d12, d20 and d100 — the set core declares in
  `CONFIG.Dice.fulfillment.dice`. Exotic terms (Fate dice, coins, d3) keep rolling digitally,
  because core's resolver derives each input's range from the term's `faces`, which does not
  describe them correctly: a Fate die reports 3 faces but produces -1, 0 or 1.
- **Blind rolls are not prompted.** Core evaluates them with `allowInteractive: false`.
- **Synchronous rolls are not prompted.** `Roll#evaluateSync` cannot await a dialog.
- **Nothing is patched.** The module registers settings and one hook; it overrides no core class.

## Roles and the MANUAL_ROLLS permission

The **Configure Roles** dialog writes through to Foundry's built-in `MANUAL_ROLLS` user
permission rather than keeping a parallel setting. It is the same value shown in
*Configure Permissions → Make Manual Rolls*, and editing it in either place is equivalent.

This matters because core enforces that permission itself, in three places:

| Where | Effect |
| --- | --- |
| [`Roll.identifyFulfillableTerms`][ident] | Refuses manual fulfillment during evaluation |
| [`DiceTerm#_roll`][diceterm] | Same, for reroll and explode results |
| [`DiceConfig#_prepareContext`][diceconfig] | Removes "Manual Input" from the Dice Configuration menu |

So a user whose role is not permitted cannot enter dice manually even by editing their own
Dice Configuration directly. The gate is not merely a hidden button.

## Interaction with core's Dice Configuration

The toggle rewrites the user's client-scoped `core.diceConfiguration` setting. Whatever was
configured beforehand is stashed and restored when the toggle is switched off, with one deliberate
exception: any manual selection in the stashed configuration is cleared on restore, so switching
off always means off.

If a user's role permission is revoked while they have the toggle on, the module switches it off
for them and refreshes their controls.

## Installation

In Foundry (or on The Forge), install by manifest URL:

```
https://github.com/lambersond/fvtt-manual-dice/releases/latest/download/module.json
```

This is a **release asset** URL. Two other forms come up:

- `github.com/.../blob/main/module.json` — **cannot** be installed from. It serves an HTML page
  rather than JSON.
- `raw.githubusercontent.com/.../main/module.json` — works, as any stable URL does, provided the
  manifest it serves carries a `download` pointing at a real archive. Prefer the release asset
  anyway: the committed `version` is only accurate at the moment of a release, and some
  remotely-hosted instances cannot reach that host
  ([foundryvtt#9795](https://github.com/foundryvtt/foundryvtt/issues/9795)).

### Local development

Clone or symlink the repository into your Foundry data directory as `manual-dice` — the folder
name must match the manifest `id`:

```sh
ln -s "$PWD" "$HOME/Library/Application Support/FoundryVTT/Data/modules/manual-dice"
```

### Cutting a release

Pushing a `v*` tag builds the archive and publishes the release via
[`.github/workflows/release.yml`](.github/workflows/release.yml):

```sh
git tag v1.0.0 && git push origin v1.0.0
```

The tag is the source of truth for the version: the workflow stamps `version`, `manifest` and
`download` into the released `module.json`, so those fields do not need to be edited by hand.
They are therefore stale in the committed copy between releases — check the published manifest,
not this file, to see what actually shipped.

## Layout

| Path | Purpose |
| --- | --- |
| `scripts/module.mjs` | Entry point and hook registration |
| `scripts/constants.mjs` | Shared identifiers |
| `scripts/manual-dice.mjs` | Toggle state, dice configuration rewriting, enforcement |
| `scripts/settings.mjs` | Settings and setting menu registration |
| `scripts/role-config.mjs` | Per-role dialog, writes core's `MANUAL_ROLLS` permission |
| `scripts/controls.mjs` | Token controls toggle |
| `templates/role-config.hbs` | Role dialog template |

[resolver]: https://foundryvtt.com/api/classes/foundry.applications.dice.RollResolver.html
[ident]: https://foundryvtt.com/api/classes/foundry.dice.Roll.html
[diceterm]: https://foundryvtt.com/api/classes/foundry.dice.terms.DiceTerm.html
[diceconfig]: https://foundryvtt.com/api/classes/foundry.applications.settings.menus.DiceConfig.html
