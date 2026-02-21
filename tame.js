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

    shape(spec, obj) {
        let invalid = false;
        let invalidFields = [];
        for(const key in spec) {
            if(typeof obj[key] !== spec[key]) {
                invalid = true;
                invalidFields.push(key);
            }
        }
        if(invalid) {
            console.log(
                'Expected shape:', spec,
                '\nActual object:', structuredClone(obj));
            throw new Error(`Invalid field(s) '${invalidFields.join("', '")}'`);
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
