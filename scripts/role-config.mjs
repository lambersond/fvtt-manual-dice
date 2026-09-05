import { MANUAL_ROLLS_PERMISSION, MODULE_ID } from "./constants.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * The roles allowed to roll manually when nothing has been configured, derived from core's
 * declared default for the permission.
 * @returns {number[]}
 */
function defaultRoles() {
  const { defaultRole } = CONST.USER_PERMISSIONS[MANUAL_ROLLS_PERMISSION];
  return Array.fromRange(CONST.USER_ROLES.GAMEMASTER + 1).slice(defaultRole);
}

/**
 * A Gamemaster-only dialog for choosing which user roles may enter dice results manually.
 *
 * This writes through to core's MANUAL_ROLLS user permission rather than keeping a parallel
 * setting, so the choice made here is the same one shown in Configure Permissions and is the
 * one core itself enforces during roll evaluation.
 * @extends ApplicationV2
 * @mixes HandlebarsApplication
 */
export default class ManualDiceRoleConfig extends HandlebarsApplicationMixin(ApplicationV2) {

  /** @inheritDoc */
  static DEFAULT_OPTIONS = {
    id: "manual-dice-role-config",
    tag: "form",
    window: {
      contentClasses: ["standard-form"],
      icon: "fa-solid fa-dice-d20",
      title: "MANUALDICE.RoleConfig.Title"
    },
    position: { width: 480 },
    form: {
      closeOnSubmit: true,
      handler: ManualDiceRoleConfig.#onSubmit
    },
    actions: {
      reset: ManualDiceRoleConfig.#onReset
    }
  };

  /** @override */
  static PARTS = {
    roles: {
      template: `modules/${MODULE_ID}/templates/role-config.hbs`,
      root: true
    },
    footer: {
      template: "templates/generic/form-footer.hbs"
    }
  };

  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  /** @override */
  async _prepareContext(_options = {}) {
    const permissions = game.settings.get("core", "permissions") ?? {};
    const allowed = permissions[MANUAL_ROLLS_PERMISSION] ?? defaultRoles();
    const { requiredRoles } = CONST.USER_PERMISSIONS[MANUAL_ROLLS_PERMISSION];

    return {
      roles: Object.entries(CONST.USER_ROLES).flatMap(([name, role]) => {
        if ( role === CONST.USER_ROLES.NONE ) return [];
        return [{
          field: `role-${role}`,
          label: `USER.Role${name.titleCase()}`,
          value: allowed.includes(role),
          // Roles core refuses to revoke the permission from are shown as fixed.
          locked: requiredRoles.includes(role)
        }];
      }),
      buttons: [
        {
          type: "button",
          action: "reset",
          icon: "fa-solid fa-arrows-rotate",
          label: "MANUALDICE.RoleConfig.Reset"
        },
        {
          type: "submit",
          icon: "fa-solid fa-floppy-disk",
          label: "MANUALDICE.RoleConfig.Submit"
        }
      ]
    };
  }

  /* -------------------------------------------- */
  /*  Event Listeners and Handlers                */
  /* -------------------------------------------- */

  /**
   * Persist the selected roles into core's permission configuration.
   *
   * Only the MANUAL_ROLLS entry is touched; every other permission in the world is preserved.
   * @this {ManualDiceRoleConfig}
   * @param {SubmitEvent} _event          The originating form submission event.
   * @param {HTMLFormElement} _form       The submitted form element.
   * @param {FormDataExtended} formData   Processed data for the submitted form.
   * @returns {Promise<void>}
   */
  static async #onSubmit(_event, _form, formData) {
    const roles = Object.entries(formData.object)
      .filter(([field, checked]) => field.startsWith("role-") && (checked === true))
      .map(([field]) => Number(field.slice("role-".length)));

    const permissions = foundry.utils.deepClone(game.settings.get("core", "permissions") ?? {});
    permissions[MANUAL_ROLLS_PERMISSION] = roles;
    await game.settings.set("core", "permissions", permissions);
    ui.notifications.info("MANUALDICE.RoleConfig.Saved", { localize: true });
  }

  /* -------------------------------------------- */

  /**
   * Return the checkboxes to core's default selection without saving.
   * @this {ManualDiceRoleConfig}
   * @param {PointerEvent} event   The originating click event.
   */
  static #onReset(event) {
    event.preventDefault();
    const defaults = defaultRoles();
    for ( const input of this.element.querySelectorAll("input[type=checkbox]") ) {
      input.checked = defaults.includes(Number(input.name.slice("role-".length)));
    }
  }
}
