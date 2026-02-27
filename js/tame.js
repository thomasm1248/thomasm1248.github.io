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
 * 'use strict';
 * No `var`
 * Prefer `const`
 * Avoid `this`
 * No classes
 * No implicit coercion (==) (only use ===)
 * No prototype modification
 * No async in core logic
 * Document every function and object
 * Write pure, immutable, explicit code.
 *  Validate at boundaries. Fail loudly in
 *  dev, disappear in prod.
 */

'use strict';

const t = (function() {

    // Diagnostics

    let enabled = true;
    
    const enable = () => enabled = true;
    enable.meta = `Enables diagnostics. (see t.disable)`;

    const disable = () => enabled = false;
    disable.meta = `Disables diagnostics. (see t.enable)`;

    const log = (...args) => {
        if(!enabled) return args[args.length-1];
        let newArgs = [];
        for(let key in args) {
            const value = args[key];
            if (typeof value !== 'function' && mutable(value)) newArgs.push('(mutable)');
            newArgs.push(value);
        }
        console.log(...newArgs);
        return args[args.length-1];
    }
    log.meta = `...args -> last -- A thin wrapper around console.log that\
 adds a '(mutable)' warning to mutable objects. The last argument is\
 returned.`;

    const warn = (...args) => {
        if (!enabled) return args[args.length - 1];
        let newArgs = [];
        for (let key in args) {
            const value = args[key];
            if (mutable(value)) newArgs.push('(mutable)');
            newArgs.push(value);
        }
        console.warn(...newArgs);
        return args[args.length - 1];
    }
    warn.meta = `...args -> last -- A thin wrapper around console.warn that\
 adds a '(mutable)' warning to mutable objects. The last argument is\
 returned.`;

    // Data validation

    let interactiveMode = false;

    const interactive = (newValue = true) => interactiveMode = newValue;

    const assert = (condition, message) => {
        if(!enabled) return;
        if(!condition) {
            if(typeof message === 'function')
                message = message();
            if(interactiveMode) {
                warn('assert failed:', message);

                debugger;
                // ASSERT FAILED
                // (see log)
                //
                // Return to context:
                return;

            }
            throw new Error(`assert failed: ${message}`);
        }
    }
    assert.meta = `boolean condition -> any message -> undefined -- If\
 condition is true, throw an error containing the provided message.\
 The message can be any type, but if it's a function, the function\
 will be called to obtain the real message.`;

    const shape = (spec, value, path) => {
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
            } else if(typeof spec === 'function') {
                try {
                    spec(value);
                } catch(e) {
                    const message = `custom shape function threw an error:\n${e.message}`;
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
                        const message = shape(spec[key], value[key], path + '.' + key);
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
                        const message = shape(listSpec, value[i], `${path}[${i}]`);
                        if(typeof message === 'string') {
                            if(isRootCall) throw new Error(message);
                            else return message;
                        }
                    }
                }
            }
            else {
                throw new Error("'spec' must be of type 'string', 'function, or 'object'");
            }
            if(isRootCall) return value;
        } catch(ex) {
            if(isRootCall)
                warn(
                    'Expected shape:', spec,
                    '\nActual value:', value);
            if(isRootCall && interactiveMode) {

                debugger;
                // INVALID SHAPE
                // (see log)
                //
                // Return to context:
                return value;

            }
            throw ex;
        }
    }
    shape.meta = `any spec -> any value -> any value -- Verifies that the value\
 matches the shape specified by spec. See an example in tame.js for usage.`;

    const guard = (...args) => {
        shape(['any'], args);
        assert(args.length >= 2, 't.guard needs at least two parameters');
        const func = args[args.length - 1];
        shape('function', func);
        const outSpec = args[args.length - 2];
        const inSpec = args.slice(0, args.length - 2);
        return (...args2) => {
            assert(
                args2.length == inSpec.length,
                () => `received ${args2.length} args instead of ${inSpec.length}`);
            args2.forEach((arg, i) => shape(inSpec[i], arg));
            const result = func(...args2);
            shape(outSpec, result);
            return result;
        };
    };
    guard.meta = `Wraps a function (last param) with t.shape checkers\
 for all its input and output.`;

    // Documentation system

    const functionDocs = {};

    const functions = () => {
        const list = {};
        for(const func in functionDocs) {
            const doc = functionDocs[func];
            list[doc.name] = doc;
        }
        return list;
    };

    const recordFunctionDoc = (moduleName, name, func) => {
        // Ensure the function has meta data
        if(func.meta === undefined) func.meta = {};
        if(typeof func.meta === 'string') func.meta = { desc: func.meta };

        // Record name of function
        func.meta.name = moduleName + '.' + name;

        // Register function's meta data
        functionDocs[func] = func.meta;

        // Link functions to related functions
        if(func.meta.see !== undefined) {
            shape(['function'], func.meta.see);
            const see = {};
            func.meta.see.forEach(otherFunc => {
                const otherMeta = functionDocs[otherFunc];
                if(otherMeta === undefined)
                    warn(`${func.meta.name}'s meta data links to` +
                        ` a function that is located AFTER it in the module.`);
                if(otherMeta.see === undefined) otherMeta.see = {};
                otherMeta.see[func.meta.name] = func.meta;
                see[otherMeta.name] = otherMeta;
            });
            func.meta.see = see;
        }
    }

    const documentModule = (name, module) => {
        for(let field in module) {
            const item = module[field];
            if(typeof item === 'function')
                recordFunctionDoc(name, field, item);
            else if(typeof item === 'object')
                documentModule(name + '.' + field, item);
        }
    };

    // Functional programming

    const freeze = obj => {
        Object.freeze(obj);
        for(const key of Object.getOwnPropertyNames(obj)) {
            const value = obj[key];
            if(value && typeof value === 'object' && !Object.isFrozen(value)) {
                freeze(value);
            }
        }
        return obj;
    }
    freeze.meta = `object o -> object o -- Freezes object o and all the objects\
 within it recursively. (see t.mutable)`;

    const mutable = obj => {
        return (typeof obj === 'object' || typeof obj === 'function') &&
               !Object.isFrozen(obj);
    }
    mutable.meta = `any x -> boolean -- Indicates wether or not x is\
 mutable. (see t.freeze)`;

    const trampoline = func => {
        while(typeof func !== 'function')
            func = func();
        return func;
    }
    trampoline.meta = `any x -> any y -- If x is a function, call it without\
 arguments. If its return value is also a function, call that function.\
 Continue until something other than a function is returned. Return that.\
 The purpose of this is to allow functions to be written in a more\
 functional-programming style even though Javascript doesn't officially\
 support tail-call-optimization.`;

    // Modules
    
    const modules = {};
    const Module = freeze({
        init: 'function',
    });

    const module = (moduleName, init) => {
        shape('string', moduleName);
        shape('function', init);
        if(modules[moduleName] !== undefined) {
            log(`module '${moduleName}' was defined again (ignored)`);
            return;
        }
        modules[moduleName] = {
            init,
        };
    }
    module.meta = `(moduleName, init) => undefined
Defines a module. The signature of the init function should be
config => module
That is, it takes an immutable config object, accesses whichever\
 portions of it that it needs to, uses t.require to obtain dependencies\
 then returns an object that represents the module.
Note: When the module object is returned, it will be automatically\
 frozen with t.freeze.`;

    const loadModule = (moduleName, config) => {
        const moduleDefinition = modules[moduleName];
        const module = moduleDefinition.init(config);
        documentModule(moduleName, module);
        try {
            shape({}, module);
        } catch {
            warn(`Module '${moduleName}' did not return an object`);
            return;
        }
        moduleDefinition.module = freeze(module);
    }

    const require = (moduleName, config) => {
        assert(!mutable(config), 'config must be immutable. (see t.freeze)');
        if(typeof config !== 'undefined')
            shape({}, config);
        const moduleDefinition = modules[moduleName];
        if(moduleDefinition === undefined) {
            warn(`module '${moduleName}' is missing`);
            return undefined;
        }
        if(moduleDefinition.module === undefined)
            loadModule(moduleName, config);
        return moduleDefinition.module;
    }
    require.meta = `(moduleName, config) => module
Lazy loades the requested module. The config parameter must\
 be either 'undefined' or an immutable object (see t.freeze).`;

    const unusedModules = () => {
        const unusedModuleNames = [];
        for(const moduleName in modules) {
            const moduleDef = modules[moduleName];
            if(moduleDef.module === undefined)
                unusedModuleNames.push(moduleName);
        }
        return unusedModuleNames;
    };
    unusedModules.meta = `Lists all the modules that were\
 defined but not required.`;

    return {
        enable,
        disable,
        log,
        warn,
        interactive,
        assert,
        shape,
        guard,
        functions,
        freeze,
        mutable,
        trampoline,
        module,
        require,
        unusedModules,
    };
})();
