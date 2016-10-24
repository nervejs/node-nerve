module.exports = function (Handlebars) {
    'use strict';

    Handlebars.registerHelper('htmlEntityEncode', function (str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/#/g, '&#35;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    });

    Handlebars.registerHelper('htmlEntityDecode', function (str) {
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