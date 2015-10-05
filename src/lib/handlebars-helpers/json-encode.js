module.exports = function (Handlebars) {
    'use strict';

    Handlebars.registerHelper('jsonEncode', function (str, options) {
        return String(str).replace(/\\/g, '\\\\');
    });
};