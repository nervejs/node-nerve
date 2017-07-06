import * as Handlebars from 'handlebars';

export = function (HandlebarsObject: typeof Handlebars) {
    HandlebarsObject.registerHelper('number-width', function (number: number, width: number, fillNumber: number | string) {
        let numberStr: string = String(number),
            length: number = numberStr.length,
            delta: number = width - length;

        if (isNaN(Number(fillNumber))) {
            fillNumber = '0';
        }

        if (delta > 0) {
            numberStr = new Array(delta + 1).join(String(fillNumber)) + numberStr;
        }

        return numberStr;
    });
};