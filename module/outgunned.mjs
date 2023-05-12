// Import document classes.
import { OutgunnedActor } from "./documents/actor.mjs";
import { OutgunnedItem } from "./documents/item.mjs";
// Import sheet classes.
import { OutgunnedActorSheet } from "./sheets/actor-sheet.mjs";
import { OutgunnedItemSheet } from "./sheets/item-sheet.mjs";
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import { OUTGUNNED } from "./helpers/config.mjs";
// Roller
import { OutgunnedRoller } from "./roller/roller.js";
import {OutgunnedRollerDialog} from './roller/roller-dialog.js';
//Dice
import OutgunnedDie from './roller/outgunned-die.js';
// HANDLEBARS
import { registerHandlebarsHelpers } from "./helpers/handlebars.mjs"
registerHandlebarsHelpers();

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', async function() {

  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.outgunned = {
    OutgunnedActor,
    OutgunnedItem,
    rollItemMacro,
    OutgunnedRoller,
    OutgunnedRollerDialog
  };

  // Add custom constants for configuration.
  CONFIG.OUTGUNNED = OUTGUNNED;
  CONFIG.Dice.terms["o"] = OutgunnedDie;

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "1d20 + @abilities.dex.mod",
    decimals: 2
  };

  // Define custom Document classes
  CONFIG.Actor.documentClass = OutgunnedActor;
  CONFIG.Item.documentClass = OutgunnedItem;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("outgunned", OutgunnedActorSheet, { makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("outgunned", OutgunnedItemSheet, { makeDefault: true });

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// If you need to add Handlebars helpers, here are a few useful examples:
Handlebars.registerHelper('concat', function() {
  var outStr = '';
  for (var arg in arguments) {
    if (typeof arguments[arg] != 'object') {
      outStr += arguments[arg];
    }
  }
  return outStr;
});

Handlebars.registerHelper('toLowerCase', function(str) {
  return str.toLowerCase();
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", async function() {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createItemMacro(data, slot));
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(data, slot) {
  // First, determine if this is a valid owned item.
  if (data.type !== "Item") return;
  if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.')) {
    return ui.notifications.warn("You can only create macro buttons for owned Items");
  }
  // If it is, retrieve it based on the uuid.
  const item = await Item.fromDropData(data);

  // Create the macro command using the uuid.
  const command = `game.outgunned.rollItemMacro("${data.uuid}");`;
  let macro = game.macros.find(m => (m.name === item.name) && (m.command === command));
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: { "outgunned.itemMacro": true }
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemUuid
 */
function rollItemMacro(itemUuid) {
  // Reconstruct the drop data so that we can load the item.
  const dropData = {
    type: 'Item',
    uuid: itemUuid
  };
  // Load the item from the uuid.
  Item.fromDropData(dropData).then(item => {
    // Determine if the item loaded and if it's an owned item.
    if (!item || !item.parent) {
      const itemName = item?.name ?? itemUuid;
      return ui.notifications.warn(`Could not find item ${itemName}. You may need to delete and recreate this macro.`);
    }

    // Trigger the item roll
    item.roll();
  });
}

/* CHAT LISTENERS */
Hooks.on('renderChatMessage', (message, html, data) => {
  //! REROLL Button
  let rrlBtn = html.find('.reroll-button');
  if (rrlBtn.length > 0) {
    rrlBtn[0].setAttribute('data-messageId', message.id);
    rrlBtn.click((el) => {
      let outgunnedFlags = message.flags.outgunnedFlags;
      console.warn(outgunnedFlags);
      OutgunnedRoller.rollDice({rollName: outgunnedFlags.rollName,total:outgunnedFlags.toReroll, rollType: OutgunnedRoller.ROLL_TYPE_REROLL, carryOverDice: outgunnedFlags.carryOverDice})
    })
  }

  //! FREE reroll Button
  let frrlBtn = html.find('.free-reroll-button');
  if (frrlBtn.length > 0) {
    frrlBtn[0].setAttribute('data-messageId', message.id);
    frrlBtn.click((el) => {
      let outgunnedFlags = message.flags.outgunnedFlags;
      console.warn(outgunnedFlags);
      OutgunnedRoller.rollDice({rollName: outgunnedFlags.rollName, total:outgunnedFlags.toReroll, rollType: OutgunnedRoller.ROLL_TYPE_FREE, carryOverDice: outgunnedFlags.carryOverDice})
    })
  }

  //! ALL IN Button  
  let allBtn = html.find('.all-in-button');
  if (allBtn.length > 0) {
    allBtn[0].setAttribute('data-messageId', message.id);
    allBtn.click((el) => {
      let outgunnedFlags = message.flags.outgunnedFlags;
      console.warn(outgunnedFlags);
      OutgunnedRoller.rollDice({rollName: outgunnedFlags.rollName, total:outgunnedFlags.toReroll, rollType: OutgunnedRoller.ROLL_TYPE_ALL, carryOverDice: outgunnedFlags.carryOverDice})
    })
  }


  //! DISCARD Button
  let discardBtn = html.find('.discard-button');
  if (discardBtn.length > 0) {
    discardBtn[0].setAttribute('data-messageId', message.id);
    discardBtn.click((el) => {
      let outgunnedFlags = message.flags.outgunnedFlags;
      let selectedDiceForReroll = html.find('.dice-selected');
      let rerollIndex = [];
      for (let d of selectedDiceForReroll) {
          rerollIndex.push($(d).data('dice-type'));
      }
      if (!rerollIndex.length) {
          ui.notifications.notify('Select Dice you want to Reroll');
          return;
      }
      OutgunnedRoller.discard({rollName: outgunnedFlags.rollName, diceGroup: rerollIndex[0], total:outgunnedFlags.toReroll, rollType: OutgunnedRoller.ROLL_TYPE_DISCARD, carryOverDice: outgunnedFlags.carryOverDice, results: outgunnedFlags.results})
    })
  }

  // Select Dice group to discard
  html.find('.dice-group').click((el) => {
    if ($(el.currentTarget).hasClass('dice-selected')) {
        $(el.currentTarget).removeClass('dice-selected');
    } else {
        $(el.currentTarget).addClass('dice-selected')
    }
  });
}) 


/* DICE SO NICE */
Hooks.once("diceSoNiceReady", (dice3d) => {
  dice3d.addSystem({ id: "outgunned", name: "Outgunned" }, true);

  dice3d.addColorset(
      {
          name: "outgunned",
          description: "Outgunned Dice",
          category: "Colors",
          foreground: "#b1241a",
          background: "#b1241a",
          outline: "#b1241a",
          texture: "none",
      }
  );

  dice3d.addDicePreset({
      type: "do",
      labels: [
          "systems/outgunned/assets/dice/white-1.webp",
          "systems/outgunned/assets/dice/white-2.webp",
          "systems/outgunned/assets/dice/white-3.webp",
          "systems/outgunned/assets/dice/white-4.webp",
          "systems/outgunned/assets/dice/white-5.webp",
          "systems/outgunned/assets/dice/white-6.webp",
      ],
      system: "outgunned",
      colorset: "outgunned"
  });
});