'use strict';

var path = require('path'),
    fs = require('fs'),
    gettextParser = require('gettext-parser'),
    locales = {};

exports.init = function (app) {
    var localesDir = app.getCfg('localesDir');

    if (localesDir) {
        fs.readdir(localesDir, function (err, files) {
            files.forEach(function (locale) {
                var filePath = path.resolve(app.getCfg('localesDir'), locale, app.getCfg('localesFileName'));

                fs.readFile(filePath, function (err, content) {
                    locales[locale] = gettextParser.po.parse(content.toString()).translations;
                });
            });
        });
    }
};

exports.getText = function (message, locale, ctx) {
    var result;

    ctx = ctx || '';

    result = locales[locale] && locales[locale][ctx] && locales[locale][ctx][message] && locales[locale][ctx][message].msgstr && locales[locale][ctx][message].msgstr[0];

    return result || message;
};
