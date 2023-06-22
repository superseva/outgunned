import {onManageActiveEffect, prepareActiveEffectCategories} from "../helpers/effects.mjs";

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
      width: 1050,
      height: 750,
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
    const itemTypes = ['feat', 'weapon']
    let itemsEnrichedDescriptions = {};
    for await(let itm of this.actor.items){
        if(itemTypes.includes(itm.type)){
            const descriptionRich = await TextEditor.enrichHTML(itm.system.description, {async:true})
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
    const badGrits = context.system.grit.badSpots.split(",").map(function(item) {
      return item.trim();
    });
    const hotGrits = context.system.grit.hotSpots.split(",").map(function(item) {
      return item.trim();
    });
    let gritBar = [];
    for(let i=0; i<context.system.grit.max; i++){
      let grit = {
        index: i,
        value: parseInt(i)+1,
        img:this._getGritImage(parseInt(i)+1, hotGrits, badGrits, context.system.grit.value)
      }
      gritBar.push(grit)
    }
    context.gritBar = gritBar;

    // Spotlight bar
    let spotlightBar = []
    for(let i=0; i<context.system.spotlight.max; i++){
      spotlightBar.push({
        index: i,
        value: parseInt(i)+1,
        img: this._getSpotImage(parseInt(i)+1, context.system.spotlight.value)
      })
    }
    context.spotlightBar = spotlightBar;

    //Adrenaline Bar
    let adrenalineBar = []
    for(let i=0; i<context.system.adrenaline.max; i++){
      adrenalineBar.push({
        index: i,
        value: parseInt(i)+1,
        img: this._getSpotImage(parseInt(i)+1, context.system.adrenaline.value)
      })
    }
    context.adrenalineBar = adrenalineBar;
  }

  _getGritImage(value, hots, bads, currentGrit){    
    let numberMarker = value<=currentGrit? 1:0
    let img = `systems/outgunned/assets/ui/grit-basic-${numberMarker}.webp`;
    if(hots.includes(value.toString())){      
      img = `systems/outgunned/assets/ui/grit-hot-${numberMarker}.webp`;
    }
    if(bads.includes(value.toString())){
      img = `systems/outgunned/assets/ui/grit-bad-${numberMarker}.webp`;
    }   
    return img;
  }

  _getSpotImage(value, currentSpotlight){
    console.warn(value, currentSpotlight)
    let toggle = value <= currentSpotlight? 'on':'off'
    let img =  `systems/outgunned/assets/ui/selector-circle-${toggle}.webp`; 
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
    for await(let i of context.items) {
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

  async _onAttributeClick(event){
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    const _key = dataset.key    

    if(!event.shiftKey && !event.altKey){
      $(element).toggleClass('selected')
      $(element).siblings().removeClass('selected');
      return;
    }

    let newValue = 0
    let _update = {}
    // Increase by 1
    if (event.shiftKey) {
      newValue = Math.min(parseInt(dataset.value)+1, 3)      
      _update[_key] = newValue;  
    }
    // Decrease by 1
    if (event.altKey) {
      newValue = Math.max(parseInt(dataset.value)-1, 1)      
      _update[_key] = newValue;  
    }
    await this.actor.update(_update)
  }

  async _onSkillClick(event){
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    const _key = dataset.key;    

    if(!event.shiftKey && !event.altKey){
      $('.skill').removeClass('selected')
      $(element).toggleClass('selected')      
      return;
    }

    let newValue = 0
    let _update = {}
    // Increase by 1
    if (event.shiftKey) {
      newValue = Math.min(parseInt(dataset.value)+1, 3)      
      _update[_key] = newValue;  
    }
    // Decrease by 1
    if (event.altKey) {
      newValue = Math.max(parseInt(dataset.value)-1, 1)      
      _update[_key] = newValue;  
    }
    await this.actor.update(_update)
  }

  async _onRollButtonClick(event){
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
    let _modifier = $(modifierEl).val() == ""? 0: $(modifierEl).val()
    _modifier = parseInt(_modifier);

    const gambleEl = $(element).parent().siblings().find('.gamble-checkbox');
    const isGamble = $(gambleEl).is(':checked');
    if (isGamble) {
      _total+=1;
      $(gambleEl).prop("checked", false)
    }

    // Conditions
    console.warn(this.actor.system.conditions)
    let conditionPenalty = 0;
    if(attrKey!="" && skillKey!=""){
      //let conditions = this.actor.system.conditions.map(c=>{c.active==true && c.attribute==attrKey})
      //console.warn(conditions)
      console.warn(`HAS CONDITION FOR ATTR: ${attrKey}`)
      for(const c of Object.keys(this.actor.system.conditions)){
        console.warn(c, attrKey)
        console.warn(this.actor.system.conditions[c].active)
        if(this.actor.system.conditions[c].active && this.actor.system.conditions[c].attribute == attrKey){
          _total-=1;
         }
      }
    }
    console.warn(`CONDITION PENALTY: ${conditionPenalty}`)

    // reset INPUT FIELD modifier
    $(modifierEl).val(0)

    game.outgunned.OutgunnedRoller.rollDice({ rollName: rollName, total: _total, modifier: _modifier, rollType: game.outgunned.OutgunnedRoller.ROLL_TYPE_INITIAL, isGamble: isGamble });

  }


  async _zeroGrit(event){
    event.preventDefault();
    await this.actor.update({"system.grit.value":0})
  }

  async _onBarSelectorClick(event){
    event.preventDefault();    
    const element = event.currentTarget;
    const dataset = element.dataset;
    const updatePath = dataset.path;
    let currentValue = parseInt(dataset.selectValue);
    // handle right click
    if(event.which === 3){
      currentValue = currentValue-1
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
    return await Item.create(itemData, {parent: this.actor});
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
