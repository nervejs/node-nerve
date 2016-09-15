module.exports = function (Handlebars) {
    'use strict';

    Handlebars.registerHelper('escape', function (options) {
        return options.fn(this).replace(/"/g, '\"');
    });
};