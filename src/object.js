'use strict';

var _ = require('lodash'),
    EventEmitter = require('events').EventEmitter,
    util = require('util');

function NerveObject() {
    if (_.isFunction(this.init)) {
        this.init.apply(this, arguments);
    }
}

util.inherits(NerveObject, EventEmitter);

NerveObject.extend = function (proto) {
    var Parent = this,
        Child;

    Child = function () {
        Parent.apply(this, arguments);
    };

    Child.prototype = _.merge({}, Parent.prototype, proto);
    _.merge(Child, Parent);

    Child.super_ = Parent.prototype;

    return Child;
};

module.exports = NerveObject;