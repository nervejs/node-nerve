module.exports = function (Handlebars) {
    'use strict';

    Handlebars.registerHelper('ifEq', function (v1, v2, options) {
        if (String(v1) === String(v2)) {
            return options.fn(this);
        }
        return options.inverse(this);
    });
};