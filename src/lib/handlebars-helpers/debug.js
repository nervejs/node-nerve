/*global console*/

module.exports = function (Handlebars) {
    'use strict';

    Handlebars.registerHelper('debug', function (optionalValue, message) {
        message = message + ':' || '';
        console.log(message, optionalValue);
    });
};