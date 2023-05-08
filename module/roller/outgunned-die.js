export default class OutgunnedDie extends Die {
    constructor(termData) {
        termData.faces = 6;
        super(termData);
    }

    static DENOMINATION = 'o';

    /** @override */
    getResultLabel(result) {
        return {
            "1": '<img src="systems/outgunned/assets/dice/white-1.webp" />',
            "2": '<img src="systems/outgunned/assets/dice/white-2.webp" />',
            "3": '<img src="systems/outgunned/assets/dice/white-3.webp" />',
            "4": '<img src="systems/outgunned/assets/dice/white-4.webp" />',
            "5": '<img src="systems/outgunned/assets/dice/white-5.webp" />',
            "6": '<img src="systems/outgunned/assets/dice/white-6.webp" />'
        }[result.result];
    }

    static values = {
        1: 1,
        2: 2,
        3: 3,
        4: 4,
        5: 5,
        6: 6,
    };

    // get total() {
    //     if (!this._evaluated) return null;
    //     return this.results.reduce((t, r) => {
    //         if (!r.active) return t;
    //         if (r.count !== undefined) return t + r.count;
    //         return t + OutgunnedDie.getValue(r.result);
    //     }, 0);
    // }

    /** @override */
    // roll(options) {
    //     const roll = super.roll(options);
    //     roll.effect = roll.result === 5 || roll.result === 6;
    //     return roll;
    // }

    // get resultValues() {
    //     return this.results.map(result => {
    //         return OutgunnedDie.getResultLabel(result.result);
    //     });
    // }

    // static getValue(dieSide) {
    //     // 1 if Effect, otherwise take the value
    //     return typeof OutgunnedDie.values[dieSide] === 'string'
    //         ? 1
    //         : OutgunnedDie.values[dieSide];
    // }


}