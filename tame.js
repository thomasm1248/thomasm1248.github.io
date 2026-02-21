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
 * <script src="tame.js"></script>
 *
 * Examples of use:
 *
 * d.assert(foo === 0, `foo was ${foo} instead of zero.`);
 * d.shape({ a: 'string', b: 'number' }, object); // enforce shape
 * d.log('snapshot of foo', foo); // returns last parameter
 * d.freeze(obj); // prevent modification (recursively)
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
    assert(condition, message) {
        console.assert(condition, message);
    },

    shape(spec, value, path) {
        if(path === undefined) path = '';
        if(typeof spec === 'string') {
            if(typeof value !== spec) {
                t.log(
                    'Expected type:', spec,
                    '\nActual value:', value);
                throw new Error(`expected '${spec}', got '${typeof value}'`);
            }
        } else if(typeof spec === 'object') {
            if(typeof value !== 'object') {
                t.log(
                    'Expected shape:', spec,
                    '\nActual value:', value);
                throw new Error(`expected 'object', got '${typeof value}'`);
            }
            for(const key in spec)
                t.shape(spec[key], value[key]);
        }
        else {
            throw new Error("'spec' must be of type 'string' or 'object'");
        }
    },

    // Same as console.log, but objects are copied
    log() {
        let clones = [];
        for(let a in arguments)
            clones.push(structuredClone(arguments[a]));
        console.log(...clones);
        return arguments[arguments.length-1];
    },

    // Recursively freeze objects and their sub-objects
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
};
