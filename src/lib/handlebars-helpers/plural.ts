import * as Handlebars from 'handlebars';

export = function (HandlebarsObject: typeof Handlebars) {
    HandlebarsObject.registerHelper('plural', function (number: number, text5: string, text1: string, text2: string) {
        let text;

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