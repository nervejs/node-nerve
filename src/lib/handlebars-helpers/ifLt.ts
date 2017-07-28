import * as Handlebars from 'handlebars';

export = function (HandlebarsObject: typeof Handlebars) {
    HandlebarsObject.registerHelper('ifLt', function (v1: any, v2: any, options: any) {
        if (v1 < v2) {
            return options.fn(this);
        }

        return options.inverse(this);
    });
};