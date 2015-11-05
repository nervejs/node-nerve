module.exports = function (Handlebars) {
    'use strict';

    Handlebars.registerHelper('getByKey', function (ctx, key, stringifyDelimiter, stringifyDelimiterLength) {
        var value = ctx[key];

        if (stringifyDelimiter) {
            value = JSON.stringify(value, stringifyDelimiter, stringifyDelimiterLength);
        }

        return value;
    });
};