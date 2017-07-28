import _ = require('lodash');
import NerveObject = require('./object');
import NerveProperty = require('./lib/property');
import {NerveApp} from './app';

class NerveActiveUser extends NerveObject {

    protected fields: any = {};
    protected app: NerveApp;
    protected attr: any = {};
    protected isFetchedState: boolean = false;

    constructor(app: NerveApp, options: any) {
        super();

        this.app = app;
        this.options = _.merge({}, options);
    }

    /**
     * Запрос за данными пользователя
     *
     * @returns {Promise}
     */
    request(): Promise<void> {
        let self: any = this,
            promises = Object.keys(this.options.fields).map((field: string) => {
                return this.options.fields[field] && _.isFunction(self[field]) ? self[field]() : Promise.resolve();
            });

        return Promise.all(promises)
            .then((results: any[]) => {
                results.forEach((item: any) => {
                    if (item && !item.error) {
                        _.merge(this.attr, item);
                    }
                });

                this.emit('fetched');
            });
    }

    get(key: string): any {
        return NerveProperty.get(this.attr, key);
    }

    setSingle(key: string, value: any) {
        NerveProperty.set(this.attr, key, value);

        return this;
    }

    set(key: any, value?: any) {
        let attrs: any;

        if (_.isObject(key)) {
            attrs = key;
            Object.keys(attrs).forEach((key: string) => this.setSingle(key, attrs[key]));
        } else {
            this.setSingle(key, value);
        }

        return this;
    }

    toJSON(): any {
        return this.attr;
    }

    isAuthorized(): boolean {
        return !!this.get('isAuthorized');
    }

    fetched(callback: Function) {
        if (this.isFetchedState) {
            callback();
        } else {
            this.on('fetched', callback);
        }
    }

}

export = NerveActiveUser;