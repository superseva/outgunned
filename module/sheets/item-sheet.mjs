/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class OutgunnedItemSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["outgunned", "sheet", "item"],
      width: 520,
      height: 480,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "attributes" }]
    });
  }

  /** @override */
  get template() {
    const path = "systems/outgunned/templates/item";
    // Return a single sheet for all item types.
    // return `${path}/item-sheet.html`;

    // Alternatively, you could use the following return statement to do a
    // unique item sheet by type, like `weapon-sheet.html`.
    return `${path}/item-${this.item.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  async getData(options) {
    // Retrieve base data structure.
    const context = await super.getData(options);
    // Use a safe clone of the item data for further operations.
    const item = context.item;
    const source = item.toObject();
    foundry.utils.mergeObject(context, {
      source: source.system,
      system: item.system,      
      isEmbedded: item.isEmbedded,
      type: item.type,      
      flags: item.flags     
    })

    // Retrieve the roll data for TinyMCE editors.
    // context.rollData = {};
    // let actor = this.object?.parent ?? null;
    // if (actor) {
    //   context.rollData = actor.getRollData();
    // }

    // Add the actor's data to context.data for easier access, as well as flags.
    context.descriptionHTML = await TextEditor.enrichHTML(item.system.description, {
      secrets: item.isOwner,
      async: true
    })

    return context;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Roll handlers, click handlers, etc. would go here.
  }
}
