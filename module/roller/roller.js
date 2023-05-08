export class OutgunnedRoller {

    static ROLL_TYPE_INITIAL = "initial"
    static ROLL_TYPE_REROLL = "reroll"
    static ROLL_TYPE_FREE = "freeReroll"
    static ROLL_TYPE_ALL = "allIn"

    static async rollDice({ rollName = 'Roll', actor = null, attribute = null, skill = null, total = 0, modifier = 0, rollType="", carryOverDice = []} = {}) {
        console.warn(`ROLL TYPE: ${rollType}`)
        const totalDice = parseInt(total) + parseInt(modifier)
        const formula = `${totalDice}do`
        const roll = new Roll(formula);
        await roll.evaluate({ async: true });
        try{
            game.dice3d.showForRoll(roll, game.user, true, null)
        }catch(er){
            console.error(er)
        }
        //roll.toMessage();
        await OutgunnedRoller.parseRoll({rollName:rollName, roll: roll, carryOverDice: carryOverDice, rollType: rollType})
    }

    static async parseRoll({rollName = "", actor = null, total = 0, roll = null, rollType = "", carryOverDice = [] } = {}) {
        console.warn(`ROLL TYPE: ${rollType}`)

        let results = roll.terms[0].results.map(r=>r.result)
        results = [...results, ...carryOverDice]
        let duplicates = results.map((e,i,a) => a.filter(f => f === e ).length).reduce((p,c,i) => c === 1 ? p : p.concat(results[i]) ,[]);
        let toReroll = results.filter(x => !duplicates.includes(x)).length;
        let isSuccess = duplicates.length > carryOverDice.length;
        //! IF ROLL TYPE INITIAL
        if(rollType===OutgunnedRoller.ROLL_TYPE_INITIAL){
            await OutgunnedRoller.sendToChat({rollName: rollName,results: results, carryOverDice: duplicates, toReroll: toReroll, isSuccesses: isSuccess})
        }
        // duplicates should go to carryOverDice
        // toReroll number should be re-rolled
        // UPDATE SUCCESSES
        //let successes = OutgunnedRoller.countSuccesses(results)

        //! IF ROLL TYPE REROLL
        if(rollType===OutgunnedRoller.ROLL_TYPE_REROLL){
            //if(isSuccess){
                await OutgunnedRoller.sendToChat({rollName: rollName,results: results, carryOverDice: duplicates, toReroll: toReroll, isSuccesses: isSuccess})
            //}else{
               // await OutgunnedRoller.sendToChat({rollName: rollName,results: results, carryOverDice: duplicates, toReroll: toReroll, isSuccesses: isSuccess})
           // }
            // compare successes
            // if successes - continue
            // if no successes -  discard a success group
        }

        
        //! IF ROLL TYPE FREE
        // SEE IF THERE IS NEW SUCESSES

        //! SEND TO CHAT
        
        // if(toReroll.length){
        //     await OutgunnedRoller.rollDice({total:toReroll.length, carryOverDice:duplicatesTotal})
        // }
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

    static countSuccesses = (arr = [])=> {
        let successes = {
            2:0,
            3:0,
            4:0,
            5:0,
            6:0
        }
        let grouped = OutgunnedRoller.sortAndGroupArray(arr)
        Object.keys(successes).forEach(k=>{
            successes[k] =  grouped.filter(i=>i.length===parseInt(k)).length
        })
        //console.warn(`2 PAIRS: ${pairs2}`)
        console.warn(grouped)        
        return successes;
    }
        

    static async rerollDice({total = 0, carryOverDice = null}={}){
        await OutgunnedRoller.rollDice({total:total, modifier:0})
    }
    static async rollAllOrNothing(){

    }

    static async sendToChat({rollName = "",results=[], carryOverDice = [], toReroll = 0, isSuccesses = false}={}){
        console.warn(carryOverDice)
        console.warn(toReroll)
        console.warn(isSuccesses)
        const groupedResults = OutgunnedRoller.sortAndGroupArray(results)
        let rollData = {
            rollName: rollName,
            isSuccesses: isSuccesses,
            groupedResults: groupedResults
        }

        let outgunnedFlags = {
            isSuccesses: isSuccesses,
            carryOverDice: carryOverDice,
            toReroll: toReroll
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