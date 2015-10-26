module.exports = function (Handlebars) {
    'use strict';

    Handlebars.registerHelper('jsonStringify', function (object) {
        return JSON.stringify(object);
    });
};