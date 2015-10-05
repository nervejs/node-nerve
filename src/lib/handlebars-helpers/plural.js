module.exports = function (Handlebars) {
    'use strict';

    Handlebars.registerHelper('plural', function (number, text5, text1, text2) {
        var text;

        if (number < 0) {
            number = number * (-1);
        }

        number = number % 100;

        if (number >= 5 && number <= 14) {
            text = text5;
        } else {
            number = number % 10;

            if (!number || number >= 5) {
                text = text5;
            } else if (number >= 2) {
                text = text2;
            } else {
                text = text1;
            }
        }

        return text;
    });
};