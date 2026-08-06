'use strict';
t.module(async () => {

  return {
    addTo: dictionary => {

      // Environment operations

      function get(env, symbol) {
        if(!env) return undefined;
        const value = env[symbol];
        if(value !== undefined) return value;
        return get(env.__parent, symbol);
      }

      function update(env, symbol, value) {
        if(!env) return;
        if(env[symbol] !== undefined)
          env[symbol] = value;
        else
          update(env.__parent, symbol, value);
      }

      function consumeFirstLocal(env, ...symbols) {
        for(const symbol of symbols) {
          const value = env[symbol];
          if(value !== undefined) {
            env[symbol] = undefined;
            return value;
          }
        }
        return undefined;
      }

      // Other utilities
      
      function func(name, implementation) {
        dictionary[name] = {
          __action: 'native function',
          func: implementation,
        };
      }

      function parser(name, implementation) {
        dictionary[name] = {
          __action: 'parse',
          program: {
            __action: 'native function',
            func: implementation,
          },
        };
      }

      const makeSymbol = dictionary['make-symbol'];
      dictionary['make-symbol'] = undefined;
      dictionary[makeSymbol('make-symbol')] = {
        __action: 'native function',
        func: e => {
          const symbol = makeSymbol(e.it);
          e.it = symbol;
          e.symbol = symbol;
        },
      };

      const evalSymbol = makeSymbol('eval');
      const eval = dictionary[evalSymbol];
      dictionary[evalSymbol];
        __action: 'native function',
        func: e => {
          const item = e.it;
          e.it = undefined;
          eval(item, e);
        },
      };

      // Meta

      func('quote', e => {
        e.it = {
          __action: 'value',
          value: e.it,
        };
      });

      func('make-parser', e => {
        const parser = {
          __action: 'parse',
          program: e.it,
        };
        e.it = parser;
        e.parser = parser;
      });

      parser('{', e => {
        const dictionary = get(e, 'dictionary');
        const program = [];

        // Compile program
        e.readNext(e);
        while(true) {
          if(e.it.__action === 'symbol') {
            // Stop when a '}' is reached
            if(e.it.name === '}') break;
            // Compile symbols by looking them up in the dictionary
            const definition = dictionary[e.it];
            program.push(definition);
          } else {
            // Compile non-symbols directly
            program.push(e.it);
          }
          e.readNext(e);
        }

        // Run the compiled program
        eval({
          __action: 'program',
          program,
        }, e);

        // Return null
        e.it = null;
      });

      parser('[', e => {
        const dictionary = get(e, 'dictionary');
        const program = [];

        // Compile program
        e.readNext(e);
        while(true) {
          if(e.it.__action === 'symbol') {
            // Stop when a '}' is reached
            if(e.it.name === '}') break;
            // Compile symbols by looking them up in the dictionary
            const definition = dictionary[e.it];
            program.push(definition);
          } else {
            // Compile non-symbols directly
            program.push(e.it);
          }
          e.readNext(e);
        }

        // Return the code as a value
        e.it = {
          __action: 'value',
          value: {
            __action: 'program',
            program,
          },
        };
      });
      
      // Environment manipulation
      
      parser('->', e => {
        e.readNext(e);
        const symbol = e.it;
      });
      
      dictionary['->'] = parser(e => {
        e.nextToken(e);
        e.asSymbol(e);
        const symbol = e.asSymbol(e.nextToken());
        return [env => 
          // Rename it -> [token]
          env[t] = env.it;
          env.it = undefined;
        }
      );

      func('as', e => {
      }, [], e => {
        cancelParser(e);
        const token = getNextToken(e);
        getCurrentSequence(e).push(env => {
          // Copy it -> [token]
          env[token] = env.it;
        });
      });

      func('discard', e => {
      }, [], e => {
        cancelParser(e);
        const token = getNextToken(e);
        getCurrentSequence(e).push(env => {
          // Discard [token]
          env[token] = undefined;
        });
      });

      // Literals

      dictionary['undefined'] = undefined;
      dictionary['null'] = null;
      dictionary['true'] = true;
      dictionary['false'] = false;

      // Logic
      
      // Math
      
      dictionary['='] = parser(
        e => {
        },
        [],
        e => {
        }
      );

      // Arrays

      func('length', e => {
        const array = consumeFirstLocal(e, 'array', 'list', 'it');
        const length = array.length;
        e.length = length;
        e.it = length;
      });

      // Debugging

      func('print', e => {
        t.log(e.it);
      });

      func('pause', e => {
        t.log(e);
        debugger; // examine the runtime state in the console
      });

      // JS Interop

      func('.get', s => {
        const key = s.stack.pop();
        const object = s.stack.pop();
        s.stack.push(object[key]);
      });

      func('create-object', s => {
        s.stack.push({});
      });

      func('.set', s => {
        const key = s.stack.pop();
        const object = s.stack.pop();
        const value = s.stack.pop();
        object[key] = value;
      });

      func('call', s => {
        const argCount = s.stack.pop();
        const func = s.stack.pop();
        const args = s.stack.splice(s.stack.length - argCount, argCount);
        s.stack.push(func(...args));
      });

      func('.call', s => {
        const argCount = s.stack.pop();
        const methodName = s.stack.pop();
        const object = s.stack.pop();
        const args = s.stack.splice(s.stack.length - argCount, argCount);
        s.stack.push(object[methodName](...args));
      });

      func('as-function', s => {
        const sequence = s.stack.pop();
        const func = (...args) => {
          const state = {
            stack: args,
          };
          run(sequence, state);
          const result = state.stack.pop();
          return result;
        };
        s.stack.push(func);
      });

      func('get-program', s => {
        const name = s.stack.pop();
        const code = s.programs[name];
        s.stack.push(code);
      });
        
    },
  };
});
