module.exports = function (Handlebars) {
    'use strict';

    Handlebars.registerHelper('ifGt', function (v1, v2, options) {
        if (v1 > v2) {
            return options.fn(this);
        }
        return options.inverse(this);
    });
};