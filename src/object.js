'use strict';

var _ = require('lodash'),
    EventEmitter = require('events').EventEmitter,
    util = require('util');

function NerveObject() {
    EventEmitter.call(this);

    if (_.isFunction(this.init)) {
        this.init.apply(this, arguments);
    }
}

util.inherits(NerveObject, EventEmitter);

NerveObject.extend = function (proto) {
    var Parent = this,
        Child,
        Surrogate;

    Child = function () {
        Parent.apply(this, arguments);
        this.constructor = Child;

        return this;
    };

    Surrogate = function () {
        this.constructor = Child;
        this.super_ = Parent.prototype;
    };
    Surrogate.prototype = Parent.prototype;
    Child.prototype = new Surrogate();
    Child.super_ = Parent.prototype;

    _.merge(Child, Parent);
    _.merge(Child.prototype, proto);
    Child.super_ = Parent.prototype;

    return Child;
};

module.exports = NerveObject;