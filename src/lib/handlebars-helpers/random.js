module.exports = function (Handlebars) {
    'use strict';

    Handlebars.registerHelper('random', function () {
        return String(Math.random()).slice(2);
    });
};