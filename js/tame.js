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
 * Single orchestration program serves as
 *  entry point.
 * Modules have no state and no
 *  hidden side-effects
 */

'use strict';

const t = (function() {

  // Diagnostics

  let enabled = true;
  
  const enable = () =>
    // Enables diagnostics. (see t.disable)
    enabled = true;

  const disable = () =>
    // Disables diagnostics. (see t.enable)
    enabled = false;

  const log = (...args) => {
    // A thin wrapper around console.log that
    // adds a '(mutable)' warning to mutable objects.
    // The last argument is returned.
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

  const warn = (...args) => {
    // A thin wrapper around console.warn that
    // adds a '(mutable)' warning to mutable objects.
    // The last argument is returned.
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

  // Data validation

  const assert = (condition, message) => {
    // If condition is true, throw an error containing the provided message.
    // The message can be any type, but if it's a function, the function
    // will be called to obtain the real message. This avoids doing
    // string interpolation when it's not needed.
    if(!enabled) return;
    if(!condition) {
      if(typeof message === 'function')
        message = message();
      throw new Error(`assert failed: ${message}`);
    }
  }

  const shape = (value, spec, path) => {
    // shape(value, spec) => undefined
    // Parameter 'path' is for internal use.
    // If the value does not match the shape specified
    // by spec, an error is thrown and a log message is
    // generated.
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
            const message = shape(value[key], spec[key], path + '.' + key);
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
            const message = shape(value[i], listSpec, `${path}[${i}]`);
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
      throw ex;
    }
  }

  const guard = (...args) => {
    // Wraps a function (last param) with t.shape checkers
    // for all its input and output.
    shape(args, ['any']);
    assert(args.length >= 2, 't.guard needs at least two parameters');
    const func = args[args.length - 1];
    shape(func, 'function');
    const outSpec = args[args.length - 2];
    const inSpec = args.slice(0, args.length - 2);
    return (...args2) => {
      assert(
        args2.length == inSpec.length,
        () => `received ${args2.length} args instead of ${inSpec.length}`);
      args2.forEach((arg, i) => shape(arg, inSpec[i]));
      const result = func(...args2);
      shape(result, outSpec);
      return result;
    };
  };

  // Functional programming

  const freeze = obj => {
    // Freezes object obj and all the objects
    // within it recursively. (see t.mutable)
    // Returns the object.
    Object.freeze(obj);
    for(const key of Object.getOwnPropertyNames(obj)) {
      const value = obj[key];
      if(value && typeof value === 'object' && !Object.isFrozen(value)) {
        freeze(value);
      }
    }
    return obj;
  }

  const mutable = obj => {
    // Indicates wether or not obj is
    // mutable. (see t.freeze)`;
    return (typeof obj === 'object' || typeof obj === 'function') &&
           !Object.isFrozen(obj);
  }

  const trampoline = func => {
    // If func is a function, call it without
    // arguments. If its return value is also a function, call that function.
    // Continue until something other than a function is returned. Return that.
    // The purpose of this is to allow functions to be written in a more
    // functional-programming style even though Javascript doesn't officially
    // support tail-call-optimization.
    while(typeof func === 'function')
      func = func();
    return func;
  }

  // Modules
  
  const currentLocation = document.currentScript.src.slice(0, -7); // remove 'tame.js'
  const modules = {};

  const module = (moduleName, module) => {
    // Defines a module. The module can be of any type, but
    // is usually an object containing functions. If the module
    // is a function, then it's assumed that the function is a
    // parameterless function that builds and returns the module.
    // This allows modules to be lazy-loaded as-needed.
    //
    // Most modules will follow the following format:
    //
    // moduleName.js:
    //
    // 'use strict';
    // t.module('moduleName', () => {
    //   const e = {}; // exports
    //
    //   const utils = t.require('utils'); // import another module
    //
    //   e.exportedFunction = (...args) => {
    //     // Descriptive comment
    //     ...
    //   };
    //
    //   return e;
    // });
    //
    // Note: When the module system receives a module, the module
    // will be automatically frozen with t.freeze to prevent
    // users of the module from modifying it.
    shape(moduleName, 'string');
    if(modules[moduleName] !== undefined) {
      log(`module '${moduleName}' was defined again (ignored)`);
      return;
    }
    modules[moduleName] = module;
  }

  const loadModule = moduleName => {
    let module = modules[moduleName];
    module = trampoline(module);
    if(module + '' === '[object Promise]')
      throw new Error(`Module '${moduleName}' is an async` +
                      ' module, and so it requires' +
                      ` t.requireAsync('${moduleName}')` +
                      ' to be loaded');
    freeze(module);
    modules[moduleName] = module;
    m[moduleName] = module;
    return module;
  }

  const loadModuleAsync = async moduleName => {
    let module = modules[moduleName];
    module = trampoline(module);
    if(module + '' === '[object Promise]')
      module = await module;
    freeze(module);
    modules[moduleName] = module;
    m[moduleName] = module;
    return module;
  }

  const importScriptTagAsync = async moduleName => {
    // Create a promise that we can control locally
    let completePromise;
    const promise = new Promise(resolve =>
      completePromise = resolve);

    // Create the script tag
    const scriptTag = document.createElement('script');
    scriptTag.src = `${currentLocation}lib/${moduleName}.js`;

    // When the script loads, complete the promise
    scriptTag.onload = () => completePromise();

    // Add the script to the head
    document.head.appendChild(scriptTag);

    await promise;
    log(`Imported script tag for module '${moduleName}'.`);
  };

  const requireAsync = async moduleName => {
    // Obtains the requested module, loading it
    // if it hasn't been loaded yet. If a script
    // tag hasn't been included for this module
    // (which means it can't be loaded), this
    // function will attempt to import the module
    // by creating a script tag for it dynamically.
    // This only works if the module is stored in
    // a 'lib' folder in the same directory as
    // tame.js. The filename of the module (without
    // the extension) must match the name of the file.
    let module = modules[moduleName];
    if(module === undefined)
      await importScriptTagAsync(moduleName);
    module = modules[moduleName];
    if(module === undefined) {
      warn(`module '${moduleName}' is missing`);
      return undefined;
    }
    if(typeof module === 'function')
      return await loadModuleAsync(moduleName);
    m[moduleName] = module;
    return module;
  }

  const require = moduleName => {
    // Obtains the requested module, loading it
    // if it hasn't been loaded yet.
    const module = modules[moduleName];
    if(module === undefined) {
      warn(`module '${moduleName}' is missing`);
      return undefined;
    }
    if(typeof module === 'function')
      return loadModule(moduleName);
    m[moduleName] = module;
    return module;
  }

  const unusedModules = () => {
    // Lists all the modules that were
    // defined but not required.
    const unusedModuleNames = [];
    for(const moduleName in modules) {
      const module = modules[moduleName];
      if(typeof module === 'function')
        unusedModuleNames.push(moduleName);
    }
    return unusedModuleNames;
  };

  return {
    enable,
    disable,
    log,
    warn,
    assert,
    shape,
    guard,
    freeze,
    mutable,
    trampoline,
    module,
    require,
    requireAsync,
    unusedModules,

    // Shortcuts for use in the console
    l: log,
    r: require,
    ra: requireAsync,
    u: unusedModules,
  };
})();

// For browsing modules in console
const m = {};
