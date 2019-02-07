import path = require('path');
import fs = require('fs');
import gettextParser = require('gettext-parser');

import { NerveApp } from '../app';
import debug = require('./debug');

let locales: any = {};

class NerveLocales {

    static init(app: NerveApp) {
        let localesDir: string = app.getCfg('localesDir');

        if (localesDir) {
            fs.readdir(localesDir, (err: Error, files: string[]) => {
                if (err) {
                    debug.error('Failed read locales');
                } else {
                    files.forEach((locale: string) => {
                        let filePath: string = path.resolve(app.getCfg('localesDir'), locale, app.getCfg('localesFileName'));

                        fs.readFile(filePath, (err: Error, content: Buffer) => {
                            locales[locale] = gettextParser.po.parse(content.toString()).translations;
                        });
                    });
                }
            });
        }
    }

    static getText(message: string, locale: string, ctx: string): string {
        let result;

        ctx = ctx || '';

        result = locales[locale] && locales[locale][ctx] && locales[locale][ctx][message] && locales[locale][ctx][message].msgstr && locales[locale][ctx][message].msgstr[0];

        return result || message;
    }

}

export = NerveLocales;