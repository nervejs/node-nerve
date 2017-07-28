import * as Handlebars from 'handlebars';

export = function (HandlebarsObject: typeof Handlebars) {
    HandlebarsObject.registerHelper('htmlEntityEncode', function (str: string) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/#/g, '&#35;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    });

    HandlebarsObject.registerHelper('htmlEntityDecode', function (str: string) {
        return String(str)
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '\"')
            .replace(/&#x27;/g, '\'')
            .replace(/&#037;/g, '%')
            .replace(/&#39;/g, '\'')
            .replace(/&#039;/g, '\'')
            .replace(/&#92;/g, '\\')
            .replace(/&#092;/g, '\\')
            .replace(/&#x3D;/g, '=')
            .replace(/&#x3d;/g, '=')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&#35;/g, '#');
    });
};