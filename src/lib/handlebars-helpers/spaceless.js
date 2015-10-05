module.exports = function (Handlebars) {
    'use strict';

    Handlebars.registerHelper('spaceless', function (options) {
        return new Handlebars.SafeString(options.fn(this).replace(/>\s+</g, '><').trim());
    });
};