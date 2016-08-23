/**
 * Module dependencies.
 */

const debug = require('debug')('express-urlrewrite');
const toRegexp = require('path-to-regexp');
const URL = require('url');

/**
 * Expose `expose`.
 */

module.exports = rewrite;

/**
 *
 * @return {Function}
 * @api public
 */

function rewrite() {
    const src = /\/(.*)(test)(.*)/;
    const dst = '/$1$3';
    var keys = [],
        re, map;

    if (dst) {
        re = toRegexp(src, keys);
        map = toMap(keys);
        debug('rewrite %s -> %s    %s', src, dst, re);
    } else {
        debug('rewrite current route -> %s', src);
    }

    return function(req, res, next) {
        var orig = req.url;
        var m;
        if (dst) {
            m = re.exec(orig);
            if (!m) {
                return next();
            }
        }
        req.url = (dst || src).replace(/\$(\d+)|(?::(\w+))/g, function(_, n, name) {
            if (name) {
                if (m) return m[map[name].index + 1];
                else return req.params[name];
            } else if (m) {
                return m[n];
            } else {
                return req.params[n];
            }
        });
        debug('rewrite %s -> %s', orig, req.url);
        if (req.url.indexOf('?') > 0) {
            req.query = URL.parse(req.url, true).query;
            debug('rewrite updated new query', req.query);
        }

        // 替换原有的view
        res.myRender = res.render;
        res.render = (view, locals, fn) => {
            res.myRender('blank', locals, fn);
        }

        if (dst) next();
        else next('route');
    }
}

/**
 * Turn params array into a map for quick lookup.
 *
 * @param {Array} params
 * @return {Object}
 * @api private
 */

function toMap(params) {
    var map = {};

    params.forEach(function(param, i) {
        param.index = i;
        map[param.name] = param;
    });

    return map;
}
