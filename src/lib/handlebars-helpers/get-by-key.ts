import * as Handlebars from 'handlebars';

export = function (HandlebarsObject: typeof Handlebars) {
    HandlebarsObject.registerHelper('getByKey', function (ctx: any, key: string, stringifyDelimiter: (string | number)[], stringifyDelimiterLength: number) {
        let arIds = key.split('.'),
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