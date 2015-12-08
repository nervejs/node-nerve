module.exports = function (Handlebars) {
    'use strict';

    Handlebars.registerHelper('getByKey', function (ctx, key, stringifyDelimiter, stringifyDelimiterLength) {
        var arIds = key.split('.'),
            iteration = 0,
            value = ctx;

        while (value && iteration < arIds.length) {
            if (value[arIds[iteration]] !== undefined) {
                value = value[arIds[iteration]];
            } else {
                value = null;
            }

            iteration++;
        }

        if (stringifyDelimiter) {
            value = JSON.stringify(value, stringifyDelimiter, stringifyDelimiterLength);
        }

        return value;
    });
};