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
 * by Thomas Mason (thomasm1248@gmail.com)
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

const t = (function() {
    const doc = `Provides various helper functions for improving diagnostics,\
 promoting functional programming techniques, strengthening correctness,\
 and making it easier to explore a codebase during runtime. (see t.help,\
 t.log, t.tag, t.freeze, t.trampoline, and t.shape)`;

    // Diagnostics

    let enabled = true;
    
    const enable = () => enabled = true;
    enable.doc = `Enables diagnostics. (see t.disable)`;

    const disable = () => enabled = false;
    disable.doc = `Disables diagnostics. (see t.enable)`;

    const assert = function(condition, message) {
        if(!enabled) return;
        if(!condition) {
            if(typeof message === 'function')
                message = message();
            throw new Error(`assert failed: ${message}`);
        }
    }
    assert.doc = `boolean condition -> any message -> undefined -- If\
 condition is true, throw an error containing the provided message.\
 The message can be any type, but if it's a function, the function\
 will be called to obtain the real message.`;

    const shape = function(spec, value, path) {
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
    }
    shape.doc = `any spec -> any value -> any value -- Verifies that the value\
 matches the shape specified by spec. See an example in tame.js for usage.`;

    const log = function(...args) {
        if(!enabled) return args[args.length-1];
        let newArgs = [];
        for(let key in args) {
            let value = args[key];
            if (typeof value === 'object' && !Object.isFrozen(value))
                newArgs.push('(mutable)');
            newArgs.push(value);
        }
        console.log(...newArgs);
        return args[args.length-1];
    }
    log.doc = `...args -> last -- A thin wrapper around console.log that\
 adds a '(mutable)' warning to mutable objects. The last argument is\
 returned.`;

    const tag = function(tag, obj) {
        if(!enabled) return obj;
        t.shape('string', tag);
        t.shape({}, obj);
        if(obj.debugTagHistory === undefined)
            obj.debugTagHistory = [];
        obj.debugTagHistory.push(tag);
        return obj;
    }
    tag.doc = `string t -> object o -> object o -- Appends debug tag string t to the end of\
 o's current debug tag list. (see t.transferTags, t.tags)`;

    const transferTags = function(from, to) {
        if(!enabled) return to;
        t.shape({}, from);
        t.shape({}, to);
        if(from.debugTagHistory === undefined)
            return;
        if(to.debugTagHistory === undefined)
            to.debugTagHistory = [];
        to.debugTagHistory.push(...from.debugTagHistory);
        return to;
    }
    transferTags.doc = `object a -> object b -> object b -- Copies all the debug tags\
 from object a to object b, then returns object b. (see t.tag)`;

    const tags = function(obj) {
        if(!enabled) return '';
        t.shape({}, obj);
        if(obj.debugTagHistory === undefined) return '<no tags>';
        return obj.debugTagHistory.join('\n');
    }
    tags.doc = `object o -> string -- Returns a string containing all the debug\
 tags of the object o, separated by newlines. (see t.tags)`;

    // Doc strings

    const docStrings = {};

    const help = function(x) {
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
    }
    help.doc = `any x -> undefined -- If x is a string, the doc string\
 previously registered for that string by t.keyDoc() is printed.\
 Otherwise, if x is a function or an object, and if a doc string has\
 been defined for it, then the doc string is printed.`;

    const keyDoc = function(key, text) {
        t.shape('string', key);
        t.shape('string', text);
        docStrings[key] = text;
    }
    keyDoc.doc = `string key -> string doc -> undefined -- Registers\
 the doc string under the specified key. The doc string can be\
 printed to the console using t.help(key).`;

    // Extensions
    
    const extensionsEnabled = true;

    const extensions = {};

    const extensionPoint = function(key, args, defaultFunc) {
        if(!extensionsEnabled) return defaultFunc(...args);
        t.shape('string', key);
        t.shape(['any'], args);
        t.shape('function', defaultFunc);
        const extender = extensions[key];
        if(extender === undefined) return defaultFunc(...args);
        return extender(...args);
    }
    extensionPoint.doc = `string key -> any args[] -> function f -> any v --\
 Run function f, and pass the array of args to it. However, the function can\
 be overriden by registering a new function with the same key using t.extend.`;

    const extend = function(key, newFunc) {
        if(!extensionsEnabled) return;
        t.shape('string', key);
        t.shape('function', newFunc);
        extensions[key] = newFunc;
    }
    extend.doc = `string key -> function f -> undefined -- Registers a\
 function with the provided key so that it overrides any extension points that\
 use the same key. (see t.extensionPoint)`;

    const clearExtension = function(key) {
        t.shape('string', key);
        extensions[key] = undefined;
    }
    clearExtension.doc = `string key -> undefined -- Clears the extension\
 for the specified key (if applicable). (see t.extensionPoint, t.extend,\
      t.clearAllExtensions)`;

    const clearAllExtensions = function() {
        for(let key in extensions)
            extensions[key] = undefined;
    }
    clearAllExtensions.doc = `Clears all currently registered\
 extensions. (see t.clearExtension, t.extend, t.extensionPoint)`;

    // Functional programming

    const freeze = function(obj) {
        Object.freeze(obj);
        for(const key of Object.getOwnPropertyNames(obj)) {
            const value = obj[key];
            if(value && typeof value === 'object' && !Object.isFrozen(value)) {
                t.freeze(value);
            }
        }
        return obj;
    }
    freeze.doc = `object o -> object o -- Freezes object o and all the objects\
 within it recursively. (see t.mutable)`;

    const mutable = function(obj) {
        return (typeof obj === 'object' || typeof obj === 'function') &&
               !Object.isFrozen(obj);
    }
    mutable.doc = `any x -> boolean -- Indicates wether or not x is\
 mutable. (see t.freeze)`;

    const trampoline = function(func) {
        while(typeof func !== 'function')
            func = func();
        return func;
    }
    trampoline.doc = `any x -> any y -- If x is a function, call it without\
 arguments. If its return value is also a function, call that function.\
 Continue until something other than a function is returned. Return that.\
 The purpose of this is to allow functions to be written in a more\
 functional-programming style even though Javascript doesn't officially\
 support tail-call-optimization.`;

    // Modules
    
    const modules = {};
    const Module = {
        init: 'function',
    };

    const module = function(key, init) {
        shape('string', key);
        shape('function', init);
        if(modules[key] !== undefined) {
            log(`module '${key}' was defined again (ignored)`);
            return;
        }
        modules[key] = {
            init,
        };
    }
    module.doc = `(key: string, init: function):\
 undefined -- Defines a module. The init function that\
 returns a module object, which is automatically frozen.`;

    const loadModule = function(moduleDefinition) {
        shape(Module, moduleDefinition);
        const module = moduleDefinition.init();
        moduleDefinition.module = freeze(module);
    }

    const require = function(key) {
        const moduleDefinition = modules[key];
        if(moduleDefinition === undefined)
            throw new Error(`module' ${key}' is not defined`);
        if(moduleDefinition.module === undefined)
            loadModule(moduleDefinition);
        return moduleDefinition.module;
    }

    return {
        enable,
        disable,
        assert,
        shape,
        log,
        tag,
        transferTags,
        tags,
        help,
        keyDoc,
        extensionPoint,
        extend,
        clearExtension,
        clearAllExtensions,
        freeze,
        mutable,
        trampoline,
        module,
        require,
        doc,
    };
})();

