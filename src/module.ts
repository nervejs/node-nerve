import _ = require('lodash');
import {NerveApp} from './app';
import NerveObject = require('./object');
import fs = require('fs');
import locales = require('./lib/locales');
import debug = require('./lib/debug');
import NerveActiveUser = require("./active-user");

let localesCache: any = {};

class NerveModule extends NerveObject {

    protected app: NerveApp;
    protected activeUser: NerveActiveUser;

    constructor(app: NerveApp, options: any) {
        super();

        this.options = _.assign({}, options);
        this.app = app;
    }

    getApp(): NerveApp {
        return this.app;
    }

    getActiveUser(): NerveActiveUser {
        return this.activeUser;
    }

    setActiveUser(activeUser: NerveActiveUser) {
        this.activeUser = activeUser;

        return this;
    }

    getLocales(): any {
        return null;
    }

    readLocales(pathToFile: string): Promise<any> {
        let locales;

        return new Promise((resolve, reject) => {
            fs.readFile(pathToFile, (err: Error, content: Buffer) => {
                if (err) {
                    debug.error(err.toString());
                    reject(err);
                } else {
                    locales = JSON.parse(content.toString());
                    resolve(this.walkLocales(locales));
                }
            });
        });
    }

    walkLocales(locales: any) {
        let result: any = {};

        Object.keys(locales).forEach((key: string) => {
            let item: { text: string; vars: any; ctx: string; } = locales[key];

            if (_.isString(item)) {
                result[key] = this.getTextBySource(item);
            } else if (_.isObject(item) && item.text && (item.vars || item.ctx)) {
                result[key] = this.getTextBySource(item.text, item.ctx, item.vars);
            } else if (_.isObject(item)) {
                result[key] = this.walkLocales(item);
            }
        });

        return result;
    }

    getTextBySource(message: string, ctx?: string, params?: any): string {
        let localeStr: string,
            globalParams: any = this.getLocalesParams();

        if (_.isObject(ctx)) {
            params = ctx;
            ctx = '';
        }

        localeStr = locales.getText(message, this.activeUser.get('locale'), ctx) || message;

        if (params || globalParams) {
            params = _.assign({}, params, globalParams);

            Object.keys(params).forEach(function (item) {
                var reg = new RegExp('##' + item + '##', 'g');

                localeStr = localeStr.replace(reg, params[item]);
            });
        }

        return localeStr;
    }

    getText(id: string): string {
        let currentLocale: string = this.activeUser.get('locale'),
            localesObject = localesCache[this.constructor.name] && localesCache[this.constructor.name][currentLocale] ? localesCache[this.constructor.name][currentLocale] : {},
            arIds = id.split('.'),
            iteration = 0,
            localesItem = localesObject;

        while (localesItem && iteration < arIds.length) {
            if (localesItem[arIds[iteration]]) {
                localesItem = localesItem[arIds[iteration]];
            } else {
                localesItem = null;
            }

            iteration++;
        }

        return localesItem;
    }

    getLocalesParams(): any {
        return null;
    }

    getLocalesVars(): Promise<any> {
        let currentLocale = this.activeUser.get('locale'),
            localesPromise,
            localesObject = {};

        if (!localesCache[this.constructor.name] || (this.app && this.app.getCfg('isTestServer'))) {
            localesCache[this.constructor.name] = {};
        }

        return new Promise((resolve: Function) => {
            if (localesCache[this.constructor.name][currentLocale]) {
                resolve({
                    locales: localesCache[this.constructor.name][currentLocale]
                });
            } else {
                localesPromise = this.getLocales();

                if (localesPromise) {
                    localesPromise
                        .then((locales: any[]) => {
                            if (Array.isArray(locales)) {
                                locales.forEach((localesItem: any) => localesObject = _.assign(localesObject, localesItem));
                            } else {
                                localesObject = locales;
                            }

                            localesCache[this.constructor.name][currentLocale] = localesObject;

                            resolve({
                                locales: localesObject
                            });
                        });
                } else {
                    resolve({});
                }
            }
        });
    }

}

export = NerveModule;