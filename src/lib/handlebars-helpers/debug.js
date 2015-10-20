/*global console*/

module.exports = function (Handlebars) {
    'use strict';

    Handlebars.registerHelper('debug', function (optionalValue) {
        console.log(optionalValue);
    });
};