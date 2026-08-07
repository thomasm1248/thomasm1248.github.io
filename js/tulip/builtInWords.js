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
          name,
          __action: 'native function',
          func: implementation,
        };
      }

      function parser(name, implementation) {
        dictionary[name] = {
          name,
          __action: 'parse',
          program: {
            __action: 'native function',
            func: implementation,
          },
        };
      }

      const run = dictionary.run;
      func('run', e => {
        const item = e.it;
        e.it = undefined;
        run(item, e);
      });

      function parseUntil(e, ...terminators) {
        const dictionary = get(e, 'dictionary');
        const program = [];

        // Compile program
        e.readNext(e);
        while(true) {
          if(e.it.__action === 'symbol') {
            // Stop when a terminator is reached
            if(terminators.find(t => t === e.it.name))
              return {
                program: {
                  __action: 'program',
                  program,
                },
                terminator: e.it.name,
              };
            // Compile symbols by looking them up in the dictionary
            const definition = dictionary[e.it.name];
            // Does symbol have a definition?
            if(definition === undefined)
              program.push(e.it); // Compile the symbol
            else
              program.push(definition); // Compile the definition
          } else {
            // Compile non-symbols directly
            program.push(e.it);
          }
          e.readNext(e);
        }
      }

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
        const program = parseUntil(e, '}').program;

        // Run the compiled program
        run(program, e);

        // Return null
        e.it = null;
      });

      parser('[', e => {
        const program = parseUntil(e, ']').program;

        // Return the code as a value
        e.it = {
          __action: 'value',
          value: program,
        };
      });

      // Control flow

      parser('then{', e => {
        const {
          program: ifTrue,
          terminator,
        } = parseUntil(e, '}else{', '}');

        let ifFalse = terminator === '}else{'
          ? parseUntil(e, '}').program
          : undefined;

        e.it = {
          __action: 'if',
          ifTrue,
          ifFalse,
        };
      });

      parser('loop{', e => {
        const body = parseUntil(e, '}').program;

        e.it = {
          __action: 'loop',
          program: body,
        };
      });
      
      // Environment manipulation
      
      parser('->', e => {
        e.readNext(e);
        const symbol = e.it;
        e.it = {
          __action: 'native function',
          does: `move 'it' to '${symbol.name}'`,
          func: e => {
            const value = e.it;
            e.it = undefined;
            e[symbol.name] = value;
          },
        };
      });
      
      parser('update', e => {
        e.readNext(e);
        const symbol = e.it;
        e.it = {
          __action: 'native function',
          does: `move 'it' to '${symbol.name}' (of any scope)`,
          func: e => {
            const value = e.it;
            e.it = undefined;
            update(e, symbol.name, value);
          },
        };
      });
      
      parser('as', e => {
        e.readNext(e);
        const symbol = e.it;
        e.it = {
          __action: 'native function',
          does: `copy 'it' to '${symbol.name}'`,
          func: e => {
            e[symbol.name] = e.it;
          },
        };
      });
      
      parser('discard', e => {
        e.readNext(e);
        const symbol = e.it;
        e.it = {
          __action: 'native function',
          does: `discard '${symbol.name}'`,
          func: e => {
            e[symbol.name] = undefined;
          },
        };
      });

      // Literals

      dictionary['undefined'] = undefined;
      dictionary['null'] = null;
      dictionary['true'] = true;
      dictionary['false'] = false;

      // Logic
      
      func('&&', e => {
        e.it = e.other && e.it;
        e.other = undefined;
      });
      
      func('||', e => {
        e.it = e.other || e.it;
        e.other = undefined;
      });
      
      func('!', e => {
        e.it = !e.it;
      });

      // Comparison
      
      func('==', e => {
        e.it = e.other === e.it;
        e.other = undefined;
      });
      
      func('!=', e => {
        e.it = e.other !== e.it;
        e.other = undefined;
      });
      
      func('>', e => {
        e.it = e.other > e.it;
        e.other = undefined;
      });
      
      func('>=', e => {
        e.it = e.other >= e.it;
        e.other = undefined;
      });
      
      func('<', e => {
        e.it = e.other < e.it;
        e.other = undefined;
      });
      
      func('<=', e => {
        e.it = e.other <= e.it;
        e.other = undefined;
      });
      
      // Math
      
      func('+', e => {
        e.it = e.other + e.it;
        e.other = undefined;
      });
      
      func('-', e => {
        e.it = e.other - e.it;
        e.other = undefined;
      });
      
      func('*', e => {
        e.it = e.other * e.it;
        e.other = undefined;
      });
      
      func('/', e => {
        e.it = e.other / e.it;
        e.other = undefined;
      });
      
      func('%', e => {
        e.it = e.other % e.it;
        e.other = undefined;
      });

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
