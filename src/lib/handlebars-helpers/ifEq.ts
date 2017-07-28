import * as Handlebars from 'handlebars';

export = function (HandlebarsObject: typeof Handlebars) {
    HandlebarsObject.registerHelper('ifEq', function (v1: any, v2: any, options: any) {
        if (String(v1) === String(v2)) {
            return options.fn(this);
        }
        return options.inverse(this);
    });
};