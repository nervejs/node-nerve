module.exports = function (Handlebars) {
    'use strict';

    Handlebars.registerHelper('stripEndBrace', function (object) {
        return object ? JSON.stringify(object)
            .replace(/^\{/, '')
            .replace(/\}$/, '') : '{}';
    });

    Handlebars.registerHelper('stipEndBrace', function (object) {
        return object ? JSON.stringify(object)
            .replace(/^\{/, '')
            .replace(/\}$/, '') : '{}';
    });
};