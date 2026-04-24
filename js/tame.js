/* #####  ###  #   # #####   ##### #   # #####
 *   #   #   # ## ## #     #   #   # #
 *   #   ##### # # # ####    #   ##### ####
 *   #   #   # #   # #     #   #   # #
 *   #   #   # #   # #####   #   #   # #####
 * 
 * ####  #####  ###   #### #####
 * #   # #   #   # #     #
 * ####  ####  #####  ###  #
 * #   # #   #   #   #   #
 * ####  ##### #   # ####  #
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
    // ...args -> last -- A thin wrapper around console.log that
    // adds a '(mutable)' warning to mutable objects. The last argument is
    // returned.
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
    // ...args -> last -- A thin wrapper around console.warn that
    // adds a '(mutable)' warning to mutable objects. The last argument is
    // returned.
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

  let interactiveMode = false;

  const interactive = (newValue = true) => interactiveMode = newValue;

  const assert = (condition, message) => {
    // boolean condition -> any message -> undefined -- If
    // condition is true, throw an error containing the provided message.
    // The message can be any type, but if it's a function, the function
    // will be called to obtain the real message.
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

  const shape = (spec, value, path) => {
    // any spec -> any value -> any value -- Verifies that the value
    // matches the shape specified by spec. See an example in tame.js for usage.
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

  const guard = (...args) => {
    // Wraps a function (last param) with t.shape checkers
    // for all its input and output.
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

  // Functional programming

  const freeze = obj => {
    // object o -> object o -- Freezes object o and all the objects
    // within it recursively. (see t.mutable)
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
    // any x -> boolean -- Indicates wether or not x is
    // mutable. (see t.freeze)`;
    return (typeof obj === 'object' || typeof obj === 'function') &&
           !Object.isFrozen(obj);
  }

  const trampoline = func => {
    // any x -> any y -- If x is a function, call it without
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
  
  const modules = {};

  const module = (moduleName, init) => {
    // (moduleName, init) => undefined
    // Defines a module. The signature of
    // the init function should be
    // () => module
    // That is, it uses t.require to obtain dependencies
    // then returns an object that represents the module. If something
    // other than a function is provided instead, that value/object
    // is treated as the module itself.
    // Note: When the module object is returned, it will be automatically
    // frozen with t.freeze.
    shape('string', moduleName);
    if(modules[moduleName] !== undefined) {
      log(`module '${moduleName}' was defined again (ignored)`);
      return;
    }
    modules[moduleName] = init;
  }

  const loadModule = moduleName => {
    let module = modules[moduleName];
    module = trampoline(module);
    freeze(module);
    modules[moduleName] = module;
    m[moduleName] = module;
    return module;
  }

  const require = moduleName => {
    // (moduleName, config) => module
    // Lazy loades the requested module.
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
    interactive,
    assert,
    shape,
    guard,
    freeze,
    mutable,
    trampoline,
    module,
    require,
    unusedModules,

    // Shortcuts for console
    l: log,
    i: () => interactive(true),
    r: require,
    u: unusedModules,
  };
})();

// For browsing modules in console
const m = {};
