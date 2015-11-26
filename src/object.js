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
        Child;

    Child = function () {
        Parent.apply(this, arguments);
        Child.prototype.defaultOptions && console.log(Child.prototype.defaultOptions.name);
        this.constructor = Child;

        return this;
    };
    _.assign(Child, Parent);
    util.inherits(Child, Parent);
    _.assign(Child.prototype, proto);
    _.defaultsDeep(Child.prototype.defaultOptions, Parent.prototype.defaultOptions || {}, proto.defaultOptions || {});
    Child.super_ = Parent.prototype;

    return Child;
};

module.exports = NerveObject;