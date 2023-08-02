import { onManageActiveEffect, prepareActiveEffectCategories } from "../helpers/effects.mjs";
import gsap from "../helpers/gsap/esm/all.js";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class OutgunnedActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["outgunned", "sheet", "actor"],
      template: "systems/outgunned/templates/actor/actor-sheet.html",
      width: 900,
      height: 650,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "features" }]
    });
  }

  /** @override */
  get template() {
    return `systems/outgunned/templates/actor/actor-${this.actor.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    const context = super.getData();
    // Use a safe clone of the actor data for further operations.
    const actorData = this.actor.toObject(false);
    context.system = actorData.system;
    context.flags = actorData.flags;

    // Prepare character data and items.
    if (actorData.type == 'character') {
      await this._prepareItems(context);
      this._prepareCharacterData(context);
    }

    // Prepare NPC data and items.
    if (actorData.type == 'npc') {
      this._prepareItems(context);
    }

    //Prepare Items Enriched Descriptions
    const itemTypes = ['feat', 'weapon', 'gear']
    let itemsEnrichedDescriptions = {};
    for await (let itm of this.actor.items) {
      if (itemTypes.includes(itm.type)) {
        const descriptionRich = await TextEditor.enrichHTML(itm.system.description, { async: true })
        itemsEnrichedDescriptions[itm._id] = descriptionRich;
      }
    }
    context.itemsEnrichedDescriptions = itemsEnrichedDescriptions;

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(this.actor.effects);

    return context;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterData(context) {
    // Grit bar   
    const badGrits = context.system.grit.badSpots.split(",").map(function (item) {
      return item.trim();
    });
    const hotGrits = context.system.grit.hotSpots.split(",").map(function (item) {
      return item.trim();
    });
    let gritBar = [];
    for (let i = 0; i < context.system.grit.max; i++) {
      let grit = {
        index: i,
        value: parseInt(i) + 1,
        img: this._getGritImage(parseInt(i) + 1, hotGrits, badGrits, context.system.grit.value)
      }
      gritBar.push(grit)
    }
    context.gritBar = gritBar;

    // Spotlight bar
    let spotlightBar = []
    for (let i = 0; i < context.system.spotlight.max; i++) {
      spotlightBar.push({
        index: i,
        value: parseInt(i) + 1,
        img: this._getSpotImage(parseInt(i) + 1, context.system.spotlight.value)
      })
    }
    context.spotlightBar = spotlightBar;

    //Adrenaline Bar
    let adrenalineBar = []
    for (let i = 0; i < context.system.adrenaline.max; i++) {
      adrenalineBar.push({
        index: i,
        value: parseInt(i) + 1,
        img: this._getSpotImage(parseInt(i) + 1, context.system.adrenaline.value)
      })
    }
    context.adrenalineBar = adrenalineBar;

    // Roulette bar
    let rouletteBar  = []
    for (let i = 0; i < context.system.roulette.max; i++) {
      const _value = parseInt(i) + 1;
      rouletteBar.push({
        index: i,
        value: _value,
        selected: _value <= context.system.roulette.value
        //img: this._getSpotImage(parseInt(i) + 1, context.system.adrenaline.value)
      })
    }
    context.rouletteBar = rouletteBar;
  }

  _getGritImage(value, hots, bads, currentGrit) {
    let numberMarker = value <= currentGrit ? 1 : 0
    let img = `systems/outgunned/assets/ui/grit-basic-${numberMarker}.webp`;
    if (hots.includes(value.toString())) {
      img = `systems/outgunned/assets/ui/grit-hot-${numberMarker}.webp`;
    }
    if (bads.includes(value.toString())) {
      img = `systems/outgunned/assets/ui/grit-bad-${numberMarker}.webp`;
    }
    return img;
  }

  _getSpotImage(value, currentValue) {
    //console.warn(value, currentSpotlight)
    let toggle = value <= currentValue ? 'on' : 'off'
    let img = `systems/outgunned/assets/ui/selector-circle-${toggle}.webp`;
    return img;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  async _prepareItems(context) {
    // Initialize containers.
    const weapons = []
    const gear = [];
    const feats = [];

    // Iterate through items, allocating to containers
    for await (let i of context.items) {
      i.img = i.img || DEFAULT_TOKEN;
      if (i.type === 'weapon') {
        weapons.push(i);
      }
      if (i.type === 'gear') {
        gear.push(i);
      }
      else if (i.type === 'feat') {
        i.system.descHTML = await TextEditor.enrichHTML(i.system.description, {
          secrets: i.isOwner,
          async: true
        })
        feats.push(i);
      }
    }

    // Assign and return
    context.weapons = weapons;
    context.gear = gear;
    context.feats = feats;
    //console.warn(context.feats)

  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Render the item sheet for viewing/editing prior to the editable check.
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Attribute Click
    html.find('.attribute').click(this._onAttributeClick.bind(this))

    // Skill Click
    html.find('.skill').click(this._onSkillClick.bind(this))

    // Roll Button Click
    html.find('.roll-button').click(this._onRollButtonClick.bind(this))

    // Zero Crit
    html.find('.zero-grit').click(this._zeroGrit.bind(this))

    // GRTI, SPOTLIGHT, ADRENALINE Bars
    html.find('.bar-selector').mousedown(this._onBarSelectorClick.bind(this))

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Condition toggle
    html.find(".condition-checkbox").change(this._onConditionClick.bind(this));

    // Roulette Clicks   
    html.find(".roulette-roll-button").mousedown(this._onRouletteRoll.bind(this));

    // Ammo toggle
    html.find(".item-value").change(this._onItemChange.bind(this));


    // Active Effect management
    html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.actor));


    // Rollable abilities.
    html.find('.rollable').click(this._onRoll.bind(this));

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = ev => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }
  }

  async _onAttributeClick(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    const _key = dataset.key

    if (!event.shiftKey && !event.altKey) {
      $(element).toggleClass('selected')
      $(element).siblings().removeClass('selected');
      return;
    }

    let newValue = 0
    let _update = {}
    // Increase by 1
    if (event.shiftKey) {
      newValue = Math.min(parseInt(dataset.value) + 1, 3)
      _update[_key] = newValue;
    }
    // Decrease by 1
    if (event.altKey) {
      newValue = Math.max(parseInt(dataset.value) - 1, 1)
      _update[_key] = newValue;
    }
    await this.actor.update(_update)
  }

  async _onSkillClick(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    const _key = dataset.key;

    if (!event.shiftKey && !event.altKey) {
      $('.skill').removeClass('selected')
      $(element).toggleClass('selected')
      return;
    }

    let newValue = 0
    let _update = {}
    // Increase by 1
    if (event.shiftKey) {
      newValue = Math.min(parseInt(dataset.value) + 1, 3)
      _update[_key] = newValue;
    }
    // Decrease by 1
    if (event.altKey) {
      newValue = Math.max(parseInt(dataset.value) - 1, 1)
      _update[_key] = newValue;
    }
    await this.actor.update(_update)
  }

  async _onRollButtonClick(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const _attrs = $(element).parent().parent().find('.attributes')
    const elAttr = $(_attrs).find('.attribute.selected')
    const attrValue = $(elAttr).data('value')
    const attrKey = $(elAttr).data('attribute')

    const _skls = $(element).parent().parent().find('.skills')
    const elSkill = $(_skls).find('.skill.selected')
    const skillValue = $(elSkill).data('value')
    const skillKey = $(elAttr).data('skill')

    const rollName = $(elAttr).data('attribute') + " / " + $(elSkill).data('skill')
    let _total = parseInt(attrValue) + parseInt(skillValue);

    const modifierEl = $(element).parent().siblings().find('.modifier')
    let _modifier = $(modifierEl).val() == "" ? 0 : $(modifierEl).val()
    _modifier = parseInt(_modifier);

    const gambleEl = $(element).parent().siblings().find('.gamble-checkbox');
    const isGamble = $(gambleEl).is(':checked');
    if (isGamble) {
      _total += 1;
      $(gambleEl).prop("checked", false)
    }

    // Conditions
    console.warn(this.actor.system.conditions)
    let conditionPenalty = 0;
    if (attrKey != "" && skillKey != "") {
      //let conditions = this.actor.system.conditions.map(c=>{c.active==true && c.attribute==attrKey})
      //console.warn(conditions)
      console.warn(`HAS CONDITION FOR ATTR: ${attrKey}`)
      for (const c of Object.keys(this.actor.system.conditions)) {
        console.warn(c, attrKey)
        console.warn(this.actor.system.conditions[c].active)
        if (this.actor.system.conditions[c].active && this.actor.system.conditions[c].attribute == attrKey) {
          _total -= 1;
        }
      }
    }
    console.warn(`CONDITION PENALTY: ${conditionPenalty}`)

    // reset INPUT FIELD modifier
    $(modifierEl).val(0)

    game.outgunned.OutgunnedRoller.rollDice({ rollName: rollName, total: _total, modifier: _modifier, rollType: game.outgunned.OutgunnedRoller.ROLL_TYPE_INITIAL, isGamble: isGamble });

  }

  async _onConditionClick(event) {
    // this is moved to preUpdate on Actor Document
    event.preventDefault();
    const element = event.currentTarget;
  }

  async _onRouletteRoll(event) {
    event.preventDefault();
    // escape if it is already spinning
    if(gsap.isTweening(".roulette-roll-pointer", 'rotation'))
      return false;
    const _roll = await new Roll('1d6').evaluate({async: true});
    const result = _roll.terms[0].results[0].result;
    console.warn(result);
    const _deg = ((360 / 6)*result) + 720;    
    await gsap.to(".roulette-roll-pointer", 2, {rotation:_deg, ease:"power3.inOut"}).then(() => this._onRuletteUpdate(result));
  }

  async _onRuletteUpdate(result){
    let _messageContent = ""
    if(parseInt(result) <= parseInt(this.actor.system.roulette.value)){      
      gsap.to(".roulette-death", 0.7, {opacity:1,scale:2, rotation: 700, ease:"power4.out"});
      gsap.to(".roulette-death", 0.5, {delay:2.5, opacity:0, ease:"power0.in"});
      _messageContent = `<p>YOU DIE</p><p>Bullet No#${result} kills you</p>`;
      ChatMessage.create({content:_messageContent})
      return;
    }else{
      // DO THE INCREASE AND EXIT
      if(parseInt(this.actor.system.roulette.value)< parseInt(this.actor.system.roulette.max)){  
        const _newValue = parseInt(this.actor.system.roulette.value)+1;
        await this.actor.update({"system.roulette.value":_newValue});
        _messageContent = `<p>YOU DODGED THE BULLET!</p><p>... This Time !</p><p>${_newValue} bullet(s) in the cylinder!</p>`;
      }else{
        // if roulette is already MAX you are ALREADY DEAD ??
        _messageContent = "Aren't you allready DEAD ?!?";
      }
      ChatMessage.create({content:_messageContent})
    }
    
  }

  async _onItemChange(event) {
    event.preventDefault();
    const itemId = $(event.currentTarget).data("item-id");
    let _item = this.actor.items.find((element) => element.id == itemId);
    let valueToChange = $(event.currentTarget).data("key").toString();
    let newValue = $(event.currentTarget).val();
    // if (_item) {
    //   await _item.update({ [valueToChange]: newValue });
    // }
    let _update = {}
    _update["_id"] = itemId;
    _update[valueToChange] = newValue
    if (_item) {
        await this.actor.updateEmbeddedDocuments("Item",[_update])
    }
  }

  async _zeroGrit(event) {
    event.preventDefault();
    await this.actor.update({ "system.grit.value": 0 })
  }

  async _onBarSelectorClick(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    const updatePath = dataset.path;
    let currentValue = parseInt(dataset.selectValue);
    // handle right click
    if (event.which === 3) {
      currentValue = currentValue - 1
    }
    let update = {}
    update[updatePath] = currentValue;
    await this.actor.update(update)
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      system: data
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.system["type"];

    // Finally, create the item!
    return await Item.create(itemData, { parent: this.actor });
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Handle item rolls.
    if (dataset.rollType) {
      if (dataset.rollType == 'item') {
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
      }
    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `[ability] ${dataset.label}` : '';
      let roll = new Roll(dataset.roll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }
  }

}
