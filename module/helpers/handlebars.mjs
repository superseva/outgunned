export const registerHandlebarsHelpers = function () {
    Handlebars.registerHelper("ifCond", function (v1, operator, v2, options) {
        switch (operator) {
            case "==":
                return v1 == v2 ? options.fn(this) : options.inverse(this);
            case "===":
                return v1 === v2 ? options.fn(this) : options.inverse(this);
            case "!=":
                return v1 != v2 ? options.fn(this) : options.inverse(this);
            case "!==":
                return v1 !== v2 ? options.fn(this) : options.inverse(this);
            case "<":
                return v1 < v2 ? options.fn(this) : options.inverse(this);
            case "<=":
                return v1 <= v2 ? options.fn(this) : options.inverse(this);
            case ">":
                return v1 > v2 ? options.fn(this) : options.inverse(this);
            case ">=":
                return v1 >= v2 ? options.fn(this) : options.inverse(this);
            case "&&":
                return v1 && v2 ? options.fn(this) : options.inverse(this);
            case "||":
                return v1 || v2 ? options.fn(this) : options.inverse(this);
            default:
                return options.inverse(this);
        }
    });

    // Returns an actual value of the die's face (eg. 1,2,3,4,5,6)
    Handlebars.registerHelper("getDicegroupType", function(group){
        return group[0]
    })

    Handlebars.registerHelper("getSuccessLevelLabel", function(groupLength){
        let label = "";
        if(groupLength<2) {label = ""}
        else if(groupLength===2) {label = "Basic"}
        else if(groupLength===3) {label = "Critical"}
        else if(groupLength===4) {label = "Extreme"}
        else if(groupLength===5) {label = "Impossible"}
        else if(groupLength>=6) {label = "Jackpot"}
        return label;
    })

    Handlebars.registerHelper('times', function(n, block) {
        var accum = '';
        for(var i = 0; i < n; ++i)
            accum += block.fn(i);
        return accum;
    });
}