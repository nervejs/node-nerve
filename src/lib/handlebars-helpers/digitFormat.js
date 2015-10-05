module.exports = function (Handlebars) {
    'use strict';

    Handlebars.registerHelper('digitFormat', function (number) {
        return number.toString().replace(/(\s)+/g, '').replace(/(\d{1,3})(?=(?:\d{3})+$)/g, '$1 ');
    });
};