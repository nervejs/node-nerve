module.exports = function (Handlebars) {
    'use strict';

    Handlebars.registerHelper('spaceless', function (options) {
        return options.fn(this)
            .replace(/>\s+</g, '><')
            .replace(/[\t\n]/g, '')
            .trim();
    });
};