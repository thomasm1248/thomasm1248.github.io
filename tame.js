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
        let isRootCall = false;
        if(path === undefined) {
            path = 'obj';
            isRootCall = true;
        }
        try {
            if(typeof spec === 'string') {
                if(typeof value !== spec) {
                    const message = `expected '${spec}' from ${path}, got '${typeof value}'`;
                    if(isRootCall) throw new Error(message);
                    else return message;
                }
            } else if(typeof spec === 'object') {
                if(spec.length === undefined) {
                    // Object
                    if(typeof value !== 'object') {
                        const message = `expected 'object' from ${path}, got '${typeof value}'`;
                        if(isRootCall) throw new Error(message);
                        else return message;
                    }
                    for(const key in spec) {
                        const message = t.shape(spec[key], value[key], path + '.' + key);
                        if(typeof message === 'string') {
                            if(isRootCall) throw new Error(message);
                            else return message;
                        }
                    }
                } else {
                    // List
                    let listSpec = spec[0];
                    for(var i = 0; i < value.length; i++) {
                        const message = t.shape(listSpec, value[i], `${path}[${i}]`);
                        if(typeof message === 'string') {
                            if(isRootCall) throw new Error(message);
                            else return message;
                        }
                    }
                }
            }
            else {
                throw new Error("'spec' must be of type 'string' or 'object'");
            }
            if(isRootCall) return value;
        } catch(ex) {
            if(isRootCall)
                t.log(
                    'Expected shape:', spec,
                    '\nActual value:', value);
            throw ex;
        }
    },

    // Same as console.log, but objects are copied
    log() {
        if(!t.enabled) return arguments[arguments.length-1];
        let clones = [];
        for(let key in arguments) {
            let value = arguments[key];
            if(typeof value === 'object' && !Object.isFrozen(value))
                clones.push(structuredClone(value));
            else
                clones.push(value)
        }
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

    mutable(obj) {
        return typeof obj !== 'object' || !Object.isFrozen(obj);
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

t.help.doc = `function f -> undefined -- Prints f.doc to console.`;

t.mutable.doc = `any x -> boolean -- Indicates wether or not x is\
 mutable. (see t.freeze)`;

t.freeze.doc = `object o -> object o -- Freezes object o and all the objects\
 within it recursively. (see t.mutable)`;

t.tags.doc = `object o -> string -- Returns a string containing all the debug\
 tags of the object o, separated by newlines. (see t.tags)`;

t.transferTags.doc = `object a -> object b -> object b -- Copies all the debug tags\
 from object a to object b, then returns object b. (see t.tag)`;

t.tag.doc = `string t -> object o -> object o -- Appends debug tag string t to the end of\
 o's current debug tag list. (see t.transferTags, t.tags)`;

t.log.doc = `any args[] -> any last -- A thin wrapper around console.log that\
 makes clones of unfrozen objects so that the log message doesn't change when\
 the objects do. The last argument is returned. (see t.freeze)`;

t.assert.doc = `boolean condition -> string message -> undefined -- If\
 condition is true, throw an error containing the provided message.`;

t.shape.doc = `any spec -> any value -> any value -- Verifies that the value\
 matches the shape specified by spec. See an example in tame.js for usage.`;

t.freeze(t);
