import * as Handlebars from 'handlebars';

export = function (HandlebarsObject: typeof Handlebars) {
    HandlebarsObject.registerHelper('digitFormat', function (number: number) {
        let numberStr: string = String(number || '');

        return numberStr
            .replace(/(\s)+/g, '')
            .replace(/(\d{1,3})(?=(?:\d{3})+$)/g, '$1 ');
    });
};