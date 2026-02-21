/* #####  ###  #   # #####   ##### #   # #####
 *   #   #   # ## ## #         #   #   # #
 *   #   ##### # # # ####      #   ##### ####
 *   #   #   # #   # #         #   #   # #
 *   #   #   # #   # #####     #   #   # #####
 * 
 * ####  #####  ###   #### #####
 * #   # #     #   # #       #
 * ####  ####  #####  ###    #
 * #   # #     #   #     #   #
 * ####  ##### #   # ####    #
 *
 * by Thomas Mason
 *
 * This is my solution for taming the beast (Javascript).
 * It provides some useful functions that make it easy to
 * write safer code that fails fast and is easy to debug.
 *
 * Including:
 *
 * <script src="tame.js"></script>
 *
 * Examples of use:
 *
 * t.assert(foo === 0, `foo was ${foo} instead of zero.`);
 * t.shape({ a: {c: 'string'}, b: ['number'] }, object); // enforce shape
 * t.log('snapshot of foo', foo); // returns last parameter
 * t.freeze(obj); // prevent modification (recursively)
 * t.tag('modified in bar()', obj);
 * t.transferTags(obj, obj2);
 * t.log('obj2', t.tags(obj2))
 *
 * Rules to follow in your code:
 *
 * No `var`
 * Prefer `const`
 * Avoid `this`
 * No classes
 * No implicit coercion (==) (only use ===)
 * No prototype modification
 * No async in core logic
 * Prefer functional paradigm
 */

var t = {
    enabled: true,

    assert(condition, message) {
        if(!t.enabled) return;
        console.assert(condition, message);
    },

    shape(spec, value, path) {
        if(!t.enabled) return value;
        if(path === undefined) path = 'obj';
        if(typeof spec === 'string') {
            if(typeof value !== spec) {
                t.log(
                    'Expected type:', spec,
                    '\nActual value:', value);
                throw new Error(`expected '${spec}' from ${path}, got '${typeof value}'`);
            }
        } else if(typeof spec === 'object') {
            if(spec.length === undefined) {
                // Object
                if(typeof value !== 'object') {
                    t.log(
                        'Expected shape:', spec,
                        '\nActual value:', value);
                    throw new Error(`expected 'object' from ${path}, got '${typeof value}'`);
                }
                for(const key in spec)
                    t.shape(spec[key], value[key], path + '.' + key);
            } else {
                // List
                let listSpec = spec[0];
                for(var i = 0; i < value.length; i++)
                    t.shape(listSpec, value[i], `${path}[${i}]`);
            }
        }
        else {
            throw new Error("'spec' must be of type 'string' or 'object'");
        }
        return value;
    },

    // Same as console.log, but objects are copied
    log() {
        if(!t.enabled) return arguments[arguments.length-1];
        let clones = [];
        for(let a in arguments)
            clones.push(structuredClone(arguments[a]));
        console.log(...clones);
        return arguments[arguments.length-1];
    },

    tag(tag, obj) {
        t.shape('string', tag);
        t.shape({}, obj);
        if(obj.debugTagHistory === undefined)
            obj.debugTagHistory = [];
        obj.debugTagHistory.push(tag);
        return obj;
    },

    transferTags(from, to) {
        t.shape({}, from);
        t.shape({}, to);
        if(from.debugTagHistory === undefined)
            return;
        if(to.debugTagHistory === undefined)
            to.debugTagHistory = [];
        to.debugTagHistory.push(...from.debugTagHistory);
        return to;
    },

    tags(obj) {
        t.shape({}, obj);
        if(obj.debugTagHistory === undefined) return '<no tags>';
        return obj.debugTagHistory.join('\n');
    },

    freeze(obj) {
        Object.freeze(obj);
        for(const key of Object.getOwnPropertyNames(obj)) {
            const value = obj[key];
            if(value && typeof value === 'object' && !Object.isFrozen(value)) {
                t.freeze(value);
            }
        }
        return obj;
    },

    help(func) {
        t.shape('function', func);
        if(typeof func.doc !== 'string') {
            t.log('no doc found');
            return;
        }
        t.log(func.doc);
    },
};
