module.exports = function (Handlebars) {
    'use strict';

    Handlebars.registerHelper('stipEndBrace', function (object) {
        return JSON.stringify(object)
            .replace(/^\{/, '')
            .replace(/\}$/, '');
    });
};