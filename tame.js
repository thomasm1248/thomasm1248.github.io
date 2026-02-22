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
 * If a function uses an optimized tail call,
 *   it should end with '_c' to indicate that
 *   t.trampoline() is required
 */

var t = (function() {
    let enabled = true;
    const docStrings = {};
    let extensionsEnabled = true;
    const extensions = {};

    const exports = {

        enable() {
            enabled = true;
        },

        disable() {
            enabled = false;
        },

        assert(condition, message) {
            if(!enabled) return;
            if(!condition) {
                if(typeof message === 'function')
                    message = message();
                t.log('assert failed:', message);
            }
        },

        shape(spec, value, path) {
            if(!enabled) return value;
            let isRootCall = false;
            if(path === undefined) {
                path = 'obj';
                isRootCall = true;
            }
            try {
                if(spec === 'any') {
                    if(isRootCall)
                        return value;
                    else
                        return;
                }
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
                            if(key === 'doc') continue; // skip doc strings in spec
                            const message = t.shape(spec[key], value[key], path + '.' + key);
                            if(typeof message === 'string') {
                                if(isRootCall) throw new Error(message);
                                else return message;
                            }
                        }
                    } else {
                        // List
                        let listSpec = spec[0];
                        if(listSpec === 'any') {
                            if(isRootCall)
                                return value;
                            else
                                return;
                        }
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
            if(!enabled) return arguments[arguments.length-1];
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
            if(!enabled) return obj;
            t.shape('string', tag);
            t.shape({}, obj);
            if(obj.debugTagHistory === undefined)
                obj.debugTagHistory = [];
            obj.debugTagHistory.push(tag);
            return obj;
        },

        transferTags(from, to) {
            if(!enabled) return to;
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
            if(!enabled) return '';
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
            return (typeof obj === 'object' || typeof obj === 'function') &&
                   !Object.isFrozen(obj);
        },

        trampoline(func) {
            while(typeof func !== 'function')
                func = func();
            return func;
        },

        extensionPoint(key, args, defaultFunc) {
            if(!extensionsEnabled) return defaultFunc(...args);
            t.shape('string', key);
            t.shape(['any'], args);
            t.shape('function', defaultFunc);
            const extender = extensions[key];
            if(extender === undefined) return defaultFunc(...args);
            return extender(...args);
        },

        extend(key, newFunc) {
            if(!extensionsEnabled) return;
            t.shape('string', key);
            t.shape('function', newFunc);
            extensions[key] = newFunc;
        },

        clearExtension(key) {
            t.shape('string', key);
            extensions[key] = undefined;
        },

        clearAllExtensions() {
            extensions = {};
        };

        help(x) {
            if(typeof x === 'string') {
                if(t.docStrings[x] === undefined)
                    t.log('no doc found');
                else
                    t.log(t.docStrings[x]);
                return;
            }
            if(typeof x !== 'function' && typeof x !== 'object') {
                t.log('only functions and objects can have doc strings');
                return;
            }
            if(typeof x.doc !== 'string') {
                t.log('no doc found');
                return;
            }
            t.log(x.doc);
        },

        keyDoc(key, text) {
            t.shape('string', key);
            t.shape('string', text);
            docStrings[key] = text;
        },

        doc: `Provides various helper functions for improving diagnostics,\
 promoting functional programming techniques, strengthening correctness,\
 and making it easier to explore a codebase during runtime. (see t.help,\
 t.log, t.tag, t.freeze, t.trampoline, and t.shape)`,
    };

    exports.clearAllExtensions.doc = `Clears all currently registered\
 extensions. (see t.clearExtension, t.extend, t.extensionPoint)`;

    exports.clearExtension.doc = `string key -> undefined -- Clears the extension\
 for the specified key (if applicable). (see t.extensionPoint, t.extend,\
 t.clearAllExtensions)`;

    exports.extensionPoint.doc = `string key -> any args[] -> function f -> any v --\
 Run function f, and pass the array of args to it. However, the function can\
 be overriden by registering a new function with the same key using t.extend.`;

    exports.extend.doc = `string key -> function f -> undefined -- Registers a\
 function with the provided key so that it overrides any extension points that\
 use the same key. (see t.extensionPoint)`;

    exports.enable.doc = `Enables diagnostics. (see t.disable)`;

    exports.disable.doc = `Disables diagnostics. (see t.enable)`;

    exports.help.doc = `any x -> undefined -- If x is a string, the doc string\
     previously registered for that string by t.keyDoc() is printed.\
     Otherwise, if x is a function or an object, and if a doc string has\
     been defined for it, then the doc string is printed.`;

    exports.keyDoc.doc = `string key -> string doc -> undefined -- Registers\
     the doc string under the specified key. The doc string can be\
     printed to the console using t.help(key).`;

    exports.mutable.doc = `any x -> boolean -- Indicates wether or not x is\
     mutable. (see t.freeze)`;

    exports.freeze.doc = `object o -> object o -- Freezes object o and all the objects\
     within it recursively. (see t.mutable)`;

    exports.tags.doc = `object o -> string -- Returns a string containing all the debug\
     tags of the object o, separated by newlines. (see t.tags)`;

    exports.transferTags.doc = `object a -> object b -> object b -- Copies all the debug tags\
     from object a to object b, then returns object b. (see t.tag)`;

    exports.tag.doc = `string t -> object o -> object o -- Appends debug tag string t to the end of\
     o's current debug tag list. (see t.transferTags, t.tags)`;

    exports.log.doc = `any args[] -> any last -- A thin wrapper around console.log that\
     makes clones of unfrozen objects so that the log message doesn't change when\
     the objects do. The last argument is returned. (see t.freeze)`;

    exports.assert.doc = `boolean condition -> any message -> undefined -- If\
     condition is true, throw an error containing the provided message.\
     The message can be any type, but if it's a function, the function\
     will be called to obtain the real message.`;

    exports.shape.doc = `any spec -> any value -> any value -- Verifies that the value\
     matches the shape specified by spec. See an example in tame.js for usage.`;

    exports.trampoline.doc = `any x -> any y -- If x is a function, call it without\
     arguments. If its return value is also a function, call that function.\
     Continue until something other than a function is returned. Return that.\
     The purpose of this is to allow functions to be written in a more\
     functional-programming style even though Javascript doesn't officially\
     support tail-call-optimization.`;

    return exports.freeze(exports);
})();

