import _ = require('lodash');

class NerveProperty {

    static get(object: any, key: string): any {
        let arIds = key.split('.'),
            iteration = 0,
            cfgItem = object;

        while (cfgItem && iteration < arIds.length) {
            if (!_.isUndefined(cfgItem[arIds[iteration]])) {
                cfgItem = cfgItem[arIds[iteration]];
            } else {
                cfgItem = undefined;
            }

            iteration++;
        }

        return cfgItem;
    }

    static set(object: any, key: string, value: any) {
        let arIds: string[] = key.split('.'),
            obj: any = {},
            tmp: any = obj;

        arIds.forEach(function (item, index) {
            if (index === arIds.length - 1) {
                tmp[item] = value;
            } else {
                tmp[item] = {};
                tmp = tmp[item];
            }
        });

        _.merge(object, obj);
    }

}

export = NerveProperty;