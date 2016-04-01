(function () {
    'use strict';

    var _ = require('lodash');

    exports.get = function (object, key) {
        var arIds = key.split('.'),
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
    };

    exports.set = function (object, key, value) {
        var arIds = key.split('.'),
            obj = {},
            tmp = obj;

        arIds.forEach(function (item, index) {
            if (index === arIds.length - 1) {
                tmp[item] = value;
            } else {
                tmp[item] = {};
                tmp = tmp[item];
            }
        });

        _.merge(object, obj);
    };

}());