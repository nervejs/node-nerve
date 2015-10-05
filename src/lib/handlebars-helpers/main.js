module.exports = function (Handlebars) {
    'use strict';

    var debug = require('./debug'),
        digitFormat = require('./digitFormat'),
        ifEq = require('./ifEq'),
        ifLt = require('./ifLt'),
        ifGt = require('./ifGt'),
        jsonEncode = require('./json-encode'),
        numberWidth = require('./number-width'),
        unlessEq = require('./unlessEq'),
        plural = require('./plural'),
        spaceless = require('./spaceless'),
        times = require('./times');

    debug(Handlebars);
    digitFormat(Handlebars);
    ifEq(Handlebars);
    ifGt(Handlebars);
    ifLt(Handlebars);
    jsonEncode(Handlebars);
    numberWidth(Handlebars);
    unlessEq(Handlebars);
    plural(Handlebars);
    spaceless(Handlebars);
    times(Handlebars);
};