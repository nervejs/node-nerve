module.exports = function (Handlebars) {
    'use strict';

    Handlebars.registerHelper('number-width', function (number, width, fillNumber) {
        var numberStr = String(number),
            length = numberStr.length,
            delta = width - length;

        if (isNaN(Number(fillNumber))) {
            fillNumber = '0';
        }

        if (delta > 0) {
            numberStr = new Array(delta + 1).join(fillNumber) + numberStr;
        }

        return numberStr;
    });
};