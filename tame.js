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

  const disable = () =>
    // Disables diagnostics to improve performance.
    // (see t.enable)
    enabled = false;
  
  const enable = () =>
    // Enables diagnostics. (see t.disable)
    enabled = true;

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

  const isShape = (value, shape, path) => {
    // shape(value, spec) => undefined
    // Parameter 'path' is for internal use.
    // If the value does not match the shape specified
    // by spec, an error message is returned, otherwise,
    // null is returned.
    if(path === undefined)
      path = 'x';
    if(shape === 'any')
      return null;
    if(typeof shape === 'string') {
      if(typeof value !== shape)
        return `Expected ${path} to be '${shape}', but it was '${typeof value}'.`;
    } else if(typeof shape === 'function') {
      const result = shape(value);
      if(result === null) return null;
      else return `${path} failed a custom shape check: ${result}`;
    } else if(typeof shape === 'object') {
      if(Array.isArray(shape)) {
        // List
        let contentsShape = shape[0];
        if(contentsShape === undefined) return null;
        if(!Array.isArray(value))
          return `Expected ${path} to be a list.`;
        for(var i = 0; i < value.length; i++) {
          const result = isShape(value[i], contentsShape, `${path}[${i}]`);
          if(result) return result;
        }
        return null;
      } else {
        // Object
        if(typeof value !== 'object')
          return `Expected ${path} to be an object, but it was a '${typeof value}'.`;
        for(const key in shape) {
          const result = shape(value[key], shape[key], path + '.' + key);
          if(result) return result;
        }
        return null;
      }
    }
    else {
      throw new Error("'shape' must be of type 'string', 'function, or 'object'");
    }
  }

  const shape = (value, shape) => {
    const result = isShape(value, shape);
    if(result) {
      warn(
        'Expected shape:', shape,
        '\nActual value:', value);
      throw new Error(result);
    }
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
  };

  const trampolineAsync = async func => {
    // If func is a function, call it without
    // arguments. If its return value is also a function, call that function.
    // Continue until something other than a function is returned. Return that.
    // The purpose of this is to allow functions to be written in a more
    // functional-programming style even though Javascript doesn't officially
    // support tail-call-optimization.
    // 
    // Also, since this is the async version of t.trampoline, if a function
    // returns a promise, the promise will be awaited before continuing.
    while(true) {
      if(typeof func === 'function') {
        func = func();
        continue;
      }
      if(func + '' === '[object Promise]') {
        func = await func;
        continue;
      }
      return func;
    }
  }

  // Modules
  
  const rootFolder = document.currentScript.src.slice(0, -7); // remove 'tame.js'
  const modules = {};

  const module = module => {
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
    // t.module('moduleName', async () => {
    //
    //   const utils = await t.requireAsync('utils'); // import another module
    //
    //   function myFunction(...args) {
    //     // Descriptive comment
    //     ...
    //   }
    //
    //   // Exports:
    //   return {
    //     myFunction,
    //   };
    // });
    //
    // Note: When the module system receives a module, the module
    // will be automatically frozen with t.freeze to prevent
    // users of the module from modifying it.
    const modulePath = document.currentScript.src;
    const moduleName = modulePath.slice(rootFolder.length, -3); // remove '.js'
    const existingEntry = modules[moduleName];
    if(existingEntry?.__putRawModuleHere === null)
      // Send module to be processed
      existingEntry.__putRawModuleHere = module;
    else if(existingEntry)
      // Warn about double-defined module
      warn(`Module "${moduleName}" has somehow been defined more` +
           ` than once. New definition ignored.`);
    else
      throw new Error('Not sure how this happenned.');
  }

  const importScriptTagAsync = async moduleName => {
    // Create a promise that we can control locally
    let completePromise;
    let failPromise;
    const promise = new Promise((resolve, reject) => {
      completePromise = resolve;
      failPromise = reject;
    });

    // Create the script tag
    const scriptTag = document.createElement('script');
    scriptTag.src = `${rootFolder}${moduleName}.js`;

    // When the script loads, complete the promise
    scriptTag.onload = () => completePromise();
    scriptTag.onerror = () => failPromise(new Error(`Failed to import script '${moduleName}.js'. Double-check that the path exists.`));

    // Add the script to the head
    document.head.appendChild(scriptTag);

    await promise;
  };

  const requireAsync = async moduleName => {
    // Obtains the requested module, loading it
    // if it hasn't been loaded yet. If a script
    // tag hasn't been included for this module
    // (which means it can't be loaded), this
    // function will attempt to import the module
    // by creating a script tag for it dynamically.
    // This only works if the module's name
    // describes its location relative to the
    // location of this tame.js file.
    //
    // For example, if your folder structure
    // looks like this:
    //
    // root
    //  | tame.js
    //  + lib
    //    | myModule.js
    // 
    // then the module's name should be
    // 'lib/myModule', and it should be imported
    // with `await t.requireAsync('lib/myModule');

    // Try to get the module
    let module = modules[moduleName];
    // Am I responsible for importing the module?
    if(module === undefined) {
      // Begin importing script tag
      const importPromise = importScriptTagAsync(moduleName);
      // Prepare to give other requesters the final module
      const finalModulePromise = makePromise();
      modules[moduleName] = finalModulePromise.promise;
      // When script tag loads, route it here
      finalModulePromise.promise.__putRawModuleHere = null;
      // TODO make use of __putRawModuleHere
      // Wait for module to arrive
      await importPromise;

      // Process the module

      // Get the raw module
      const rawModule = finalModulePromise.promise.__putRawModuleHere;
      if(!rawModule) {
        warn(`Module ${moduleName} is missing.`);
        finalModulePromise.succeed(undefined);
        return undefined;
      }
      // Unpack the module
      const finalModule = await trampolineAsync(rawModule);
      freeze(finalModule);
      // Make it so others can access the module
      modules[moduleName] = finalModule;
      finalModulePromise.succeed(finalModule);
      m[moduleName.replaceAll('/', '_')] = finalModule;
      return finalModule;
    }
    // Is the module currently being processed?
    if(module + '' === '[object Promise]')
      return await module;
    // Otherwise, the module must be ready to be used
    return module;
  }

  const requireModulesAsync = async map => {
    const entries = await Promise.all(
      Object.entries(map).map(async ([name, path]) => [
        name,
        await requireAsync(path),
      ])
    );

    return Object.fromEntries(entries);
  };

  // DOM helpers

  const createComponent = html => {
    // Returns {
    //   root: <root element>,
    //   refs: {
    //     <id>: <internal element>,
    //   },
    // }
    //
    // Creates a compound HTML component from an
    // HTML string, and returns references to the
    // root element, and various internal elements
    // that are marked with the 'data-ref' attribute.
    //
    // For example:
    //
    // const card = t.createComponent(`
    //   <div>
    //     <h1 class='card-header'>${title}</h1>
    //     <p data-ref='text'></p>
    //     <button data-ref='button'>${actionText}</button>
    //   </div>
    // `);
    // card.refs.text.innerText = 'Hello.';
    // card.refs.button.onclick = func;
    // return card.root;
    const wrapper = document.createElement('template');
    wrapper.innerHTML = html.trim();
    const root = wrapper.content.firstChild;

    const refs = {};
    root.querySelectorAll('[data-ref]').forEach(subElement => {
      const refName = subElement.dataset.ref;
      refs[refName] = subElement;
      subElement.removeAttribute('data-ref');
    });

    return { root, refs };
  };

  const escapeHTML = str => {
    // Prepares text to be inserted into the DOM
    // by replacing various special characters
    // with their corresponding HTML codes/tags.
    if (!str) return '';
    
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '\n': '<br>',
    };
    
    return str.replace(/[&<>"'\n]/g, match => map[match]);
  };

  // Misc helpers for writing more terse code
  
  const repeat = func => {
    // Allows repeated calls to a function.
    //
    // For example:
    //
    // const listOfMonkeys = t.repeat(makeMonkey)
    //   ('Don', 3, 'energetic')
    //   ('Marco', 5, 'envious')
    //   ('Jack', 2, 'pious')
    // (); // ends the call chain
    //
    // Is the same as:
    //
    // const listOfMonkeys = [
    //   makeMonkey('Don', 3, 'energetic'),
    //   makeMonkey('Marco', 5, 'envious'),
    //   makeMonkey('Jack', 2, 'pious'),
    // ];
    const builder = (listSoFar = []) =>
      (...args) => {
        if(args.length === 0) return listSoFar;
        listSoFar.push(func(...args));
        return builder(listSoFar);
      };
    return builder();
  };
  
  const table = (...keys) =>
    // A quick way to build tables of data in javascript.
    //
    // For example:
    //
    // const myTable = t.table
    //   ('col1',  'col2' )
    //   //////////////////
    //   ('hello', 'world')
    //   (1,       2      )
    //   (true            )
    //   (null,    0,  123)
    // ();
    //
    // Produces the same result as:
    // 
    // const myTable = [
    //   { col1: 'hello', col2: 'world' },
    //   { col1: 1,       col2: 2 },
    //   { col1: true,    col2: undefined },
    //   { col1: null,    col2: 0 },
    // ];
    repeat((...args) => {
      const object = {};
      for(let i = 0; i < keys.length; i++)
        object[keys[i]] = args[i];
      return object;
    });

  const makePromise = () => {
    const promise = {};
    promise.promise = new Promise((succeed, fail) => {
      promise.succeed = succeed;
      promise.fail = fail;
    });
    return promise;
  };

  return/* Exports */{
    disable,
    enable,
    log,
    warn,
    assert,
    isShape,
    shape,
    freeze,
    mutable,
    trampoline,
    trampolineAsync,
    module,
    requireAsync,
    requireModulesAsync,
    createComponent,
    escapeHTML,
    repeat,
    table,
    makePromise,

    // Expose root (from perspective of tame.js)
    root: rootFolder,

    // Shortcuts for use in the console
    l: log,
    r: requireAsync,
  };
})();

// For browsing modules in console
const m = {};

// If it exists, load the 'global' module by default
t.requireAsync('global');
