export class OutgunnedRollerDialog extends Dialog {

    constructor(rollName, actor, attribute, skill, total, modifier, dialogData = {}, options = {}) {
        super(dialogData, options)
        this.rollName = rollName,
        this.actor = actor;
        this.attribute = attribute;
        this.skill = skill;
        this.total = total;
        this.modifier = modifier
    }

    activateListeners(html) {
        super.activateListeners(html);

        html.on('click', '.roll', (event) => {    
            const total = html.find('[name="total"]').val();
            const modifier = html.find('[name="modifier"]').val();               
            game.outgunned.OutgunnedRoller.rollDice({ rollName: this.rollName, total: total, modifier: modifier, rollType: "initial" })
        });
    }

    static async createDialog({ rollName="Roll", actor = null, attribute = null, skill = null, total = 0, modifier = 0 } = {}) {
        const dialogData = {
            rollName:rollName,
            actor: actor,
            attribute: attribute,
            skill: skill,
            total: total,
            modifier: modifier
        }        
        const html = await renderTemplate("systems/outgunned/templates/roller/roller-dialog.html", dialogData);
        const d = new OutgunnedRollerDialog(rollName, actor, attribute, skill, total, modifier, {
            title: rollName,
            content: html,
            buttons: {
                roll: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "ROLL"
                }
            }
        })
        d.render(true);
    }
}