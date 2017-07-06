import * as Handlebars from 'handlebars';

export = function (HandlebarsObject: typeof Handlebars) {
    HandlebarsObject.registerHelper('jsonEncode', function (str: string, options: any) {
        return String(str).replace(/\\/g, '\\\\');
    });
};