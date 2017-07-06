import * as Handlebars from 'handlebars';

export = function (HandlebarsObject: typeof Handlebars) {
    HandlebarsObject.registerHelper('random', function () {
        return String(Math.random()).slice(2);
    });
};