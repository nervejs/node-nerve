module.exports = function (Handlebars) {
    'use strict';

    Handlebars.registerHelper('jsonStringify', function (object, delimiter, delimiterLength) {
        var result = JSON.stringify(object, delimiter, delimiterLength);

        if (result) {
            result = result
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        }

        return result;
    });
};