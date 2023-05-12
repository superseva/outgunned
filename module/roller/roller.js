export class OutgunnedRoller {

    static ROLL_TYPE_INITIAL = "initial"
    static ROLL_TYPE_REROLL = "reroll"
    static ROLL_TYPE_FREE = "freeReroll"
    static ROLL_TYPE_ALL = "allIn"
    static ROLL_TYPE_DISCARD = "discard"

    static async rollDice({ rollName = 'Roll', actor = null, attribute = null, skill = null, total = 0, modifier = 0, rollType = "", carryOverDice = [] } = {}) {
        console.warn(`ROLL TYPE: ${rollType}`)
        const totalDice = parseInt(total) + parseInt(modifier)
        const formula = `${totalDice}do`
        const roll = new Roll(formula);
        await roll.evaluate({ async: true });
        try {
            game.dice3d.showForRoll(roll, game.user, true, null)
        } catch (er) {
            console.error(er)
        }
        //roll.toMessage();
        await OutgunnedRoller.parseRoll({ rollName: rollName, roll: roll, carryOverDice: carryOverDice, rollType: rollType })
    }

    static async parseRoll({ rollName = "", actor = null, total = 0, roll = null, rollType = "", carryOverDice = [] } = {}) {
        console.warn(`ROLL TYPE: ${rollType}`)

        let results = roll.terms[0].results.map(r => r.result)
        results = [...results, ...carryOverDice]
        let duplicates = results.map((e, i, a) => a.filter(f => f === e).length).reduce((p, c, i) => c === 1 ? p : p.concat(results[i]), []);
        let toReroll = results.filter(x => !duplicates.includes(x)).length;
        let isSuccess = duplicates.length > carryOverDice.length;
        //! IF ROLL TYPE INITIAL
        if (rollType === OutgunnedRoller.ROLL_TYPE_INITIAL) {
            await OutgunnedRoller.sendToChat({ rollName: rollName, results: results, carryOverDice: duplicates, toReroll: toReroll, isSuccess: isSuccess, rollType: rollType })
        }
        // duplicates should go to carryOverDice
        // toReroll number should be re-rolled
        // UPDATE SUCCESSES
        //let successes = OutgunnedRoller.countSuccesses(results)

        //! IF ROLL TYPE REROLL
        if (rollType === OutgunnedRoller.ROLL_TYPE_REROLL) {
            await OutgunnedRoller.sendToChat({ rollName: rollName, results: results, carryOverDice: duplicates, toReroll: toReroll, isSuccess: isSuccess, rollType: rollType })
        }
        //! IF ROLL TYPE FREE
        if (rollType === OutgunnedRoller.ROLL_TYPE_FREE) {
            console.warn('PARSING FREE REROLL')
            await OutgunnedRoller.sendToChat({ rollName: rollName, results: results, carryOverDice: duplicates, toReroll: toReroll, isSuccess: isSuccess, rollType: rollType })
        }
        //! IF ROLL TYPE ALL IN
        if (rollType === OutgunnedRoller.ROLL_TYPE_ALL) {
            console.warn('PARSING ALL IN')
            await OutgunnedRoller.sendToChat({ rollName: rollName, results: results, carryOverDice: duplicates, toReroll: toReroll, isSuccess: isSuccess, rollType: rollType })
        }

    }

    static async discard({diceGroup = 0, rollName = 'Roll', actor = null, rollType = "", carryOverDice = [], results = [] } = {}) {
        //await OutgunnedRoller.rollDice({total:total, modifier:0})
        console.warn(`DISCARDING DICE GROUP: ${diceGroup} FROM: `)
        console.warn(results)
        // TODO
        // remove dice group from results        
        const cleanedResults = results.filter(x => x !== diceGroup);
        console.warn(cleanedResults)
        // calculate duplicates
        let duplicates = cleanedResults.map((e, i, a) => a.filter(f => f === e).length).reduce((p, c, i) => c === 1 ? p : p.concat(cleanedResults[i]), []);
        let toReroll = cleanedResults.filter(x => !duplicates.includes(x)).length;
        let isSuccess = duplicates.length > 0;
        console.warn("DUPLICATES LEFT")
        console.warn(duplicates)
        // if any duoplicates left it is a success
        // proceed to ALL IN
        //if(isSuccess){
        await OutgunnedRoller.sendToChat({ rollName: rollName, results: cleanedResults, carryOverDice: duplicates, toReroll: toReroll, isSuccess: isSuccess, rollType: OutgunnedRoller.ROLL_TYPE_DISCARD })
        //}else{
        //ui.notifications.notify('No Successes Left');
        //}
    }


    // group arrays        
    static sortAndGroupArray = (arr = []) => {
        let result = [];
        let groupArray;
        arr.sort((a, b) => a - b);
        for (let i = 0; i < arr.length; i++) {
            if (arr[i - 1] !== arr[i]) {
                groupArray = [];
                result.push(groupArray);
            };
            groupArray.push(arr[i]);
        };
        return result;
    };

    static countSuccesses = (arr = []) => {
        let successes = {
            2: 0,
            3: 0,
            4: 0,
            5: 0,
            6: 0
        }
        let grouped = OutgunnedRoller.sortAndGroupArray(arr)
        Object.keys(successes).forEach(k => {
            successes[k] = grouped.filter(i => i.length === parseInt(k)).length
        })
        //console.warn(`2 PAIRS: ${pairs2}`)
        console.warn(grouped)
        return successes;
    }

    static async sendToChat({ rollName = "", results = [], carryOverDice = [], toReroll = 0, isSuccess = false, rollType = "" } = {}) {
        console.warn(carryOverDice)
        console.warn(toReroll)
        console.warn(isSuccess)
        console.warn(rollType)
        const groupedResults = OutgunnedRoller.sortAndGroupArray(results)
        groupedResults.sort(function (a, b) { return b.length - a.length; });
        // prepare buttons
        const showReroll = (isSuccess && rollType === OutgunnedRoller.ROLL_TYPE_INITIAL && toReroll > 0) ? true : false;
        const showFree = (rollType === OutgunnedRoller.ROLL_TYPE_INITIAL && toReroll > 0) ? true : false;
        const showAllIn = ((rollType === OutgunnedRoller.ROLL_TYPE_REROLL || rollType === OutgunnedRoller.ROLL_TYPE_FREE) && toReroll > 0 && isSuccess) ? true : false;
        const showDiscard = (!isSuccess && rollType === OutgunnedRoller.ROLL_TYPE_REROLL) ? true : false;
        console.warn(showReroll, showFree, showAllIn, showDiscard)
        let rollData = {
            rollName: rollName,
            isSuccess: isSuccess,
            groupedResults: groupedResults,
            rollType: rollType,
            showReroll: showReroll,
            showFree: showFree,
            showAllIn: showAllIn,
            showDiscard: showDiscard
        }

        let outgunnedFlags = {
            rollName: rollName,
            results: results,
            isSuccess: isSuccess,
            carryOverDice: carryOverDice,
            toReroll: toReroll,
            rollType: rollType
        }
        const html = await renderTemplate("systems/outgunned/templates/chat/roller-chat.html", rollData);
        let chatData = {
            user: game.user.id,
            rollMode: game.settings.get("core", "rollMode"),
            content: html,
            flags: { outgunnedFlags: outgunnedFlags },
            type: CONST.CHAT_MESSAGE_TYPES.ROLL,
        };
        await ChatMessage.create(chatData);
    }
}