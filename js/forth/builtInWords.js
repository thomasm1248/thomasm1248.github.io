'use strict';
t.module('forth/builtInWords', async () => {

  return {
    addTo: dictionary => {

      function func(name, implementation, immediate = false) {
        if(immediate)
          implementation.immediate = true;
        dictionary[name] = implementation;
      }

      const runFunc = dictionary.run;
      const run = (sequence, state) => {
        state.stack.push(sequence);
        runFunc({
          state,
        });
      };

      // Meta
      
      func('get', f => {
        const name = f.state.stack.pop();
        f.state.stack.push(f.state.dictionary[name]);
      });

      func('set', f => {
        const name = f.state.stack.pop();
        const value = f.state.stack.pop();
        f.state.dictionary[name] = value;
      });

      func(';', f => {
        const sequence = f.state.sequence;
        const name = f.state.sequenceName;
        f.state.sequenceName = null;
        f.state.sequence = [];
        if(name) {
          // Compile new word
          if(f.state.sequenceIsImmediate)
            sequence.immediate = true;
          f.state.dictionary[name] = sequence;
        } else {
          // Execute code immediately
          run(sequence, f.state);
        }
        f.state.sequenceIsImmediate = false;
      }, true);

      func(':', f => {
        // Execute preceeding code
        const sequence = f.state.sequence;
        f.state.sequenceName = null;
        f.state.sequence = [];
        f.state.sequenceIsImmediate = false;
        run(sequence, f.state);
        // Begin new word definition
        f.state.sequenceName =
          f.state.tokens[f.state.nextToken++];
        f.state.sequence = [];
      }, true);

      func('immediate', f => {
        f.state.sequenceIsImmediate = true;
      }, true);

      func('compile-sequence', f =>
        f.state.stack.push(f.state.sequence));
      
      func('runtime-sequence', f =>
        f.state.stack.push(f.sequence));

      func('compile', f => {
        const step = f.state.stack.pop();
        f.state.sequence.push(step);
      });

      func('compile-literal', f => {
        const value = f.state.stack.pop();
        f.state.sequence.push(frame =>
          frame.state.stack.push(value));
      });

      func('convert-to-literal', f => {
        const value = f.state.stack.pop();
        f.state.stack.push(frame =>
          frame.state.stack.push(value));
      });

      // Control Flow

      func('jump', f => {
        const destination = f.state.stack.pop();
        f.pc = destination;
      });

      func('jump-if-false', f => {
        const destination = f.state.stack.pop();
        const condition = f.state.stack.pop();
        if(!condition)
          f.pc = destination;
      });
      
      // Stack

      func('dup', f => {
        const a = f.state.stack[f.state.stack.length-1];
        f.state.stack.push(a);
      });

      func('2dup', f => {
        const a = f.state.stack[f.state.stack.length-1];
        const b = f.state.stack[f.state.stack.length-2];
        f.state.stack.push(b);
        f.state.stack.push(a);
      });

      func('over', f => {
        const a = f.state.stack[f.state.stack.length-2];
        f.state.stack.push(a);
      });

      func('swap', f => {
        const a = f.state.stack.pop();
        const b = f.state.stack.pop();
        f.state.stack.push(a);
        f.state.stack.push(b);
      });

      func('drop', f => {
        f.state.stack.pop();
      });

      func('rot', f => {
        // ( a b c ) -> ( c a b )
        const c = f.state.stack.pop();
        const b = f.state.stack.pop();
        const a = f.state.stack.pop();
        f.state.stack.push(c);
        f.state.stack.push(a);
        f.state.stack.push(b);
      });

      func('-rot', f => {
        // ( a b c ) -> ( b c a )
        const c = f.state.stack.pop();
        const b = f.state.stack.pop();
        const a = f.state.stack.pop();
        f.state.stack.push(b);
        f.state.stack.push(c);
        f.state.stack.push(a);
      });

      func('nip', f => {
        const top = f.state.stack.pop();
        f.state.stack.pop();
        f.state.stack.push(top);
      });

      // Literals

      func('null', f => {
        f.state.stack.push(null);
      });

      func('true', f => {
        f.state.stack.push(true);
      });

      func('false', f => {
        f.state.stack.push(false);
      });

      // Logic

      func('not', f => {
        const v = f.state.stack.pop();
        f.state.stack.push(!v);
      });

      func('and', f => {
        const b = f.state.stack.pop();
        const a = f.state.stack.pop();
        f.state.stack.push(a && b);
      });

      func('or', f => {
        const b = f.state.stack.pop();
        const a = f.state.stack.pop();
        f.state.stack.push(a || b);
      });

      func('=', f => {
        const b = f.state.stack.pop();
        const a = f.state.stack.pop();
        f.state.stack.push(a === b);
      });

      func('>', f => {
        const b = f.state.stack.pop();
        const a = f.state.stack.pop();
        f.state.stack.push(a > b);
      });

      func('>=', f => {
        const b = f.state.stack.pop();
        const a = f.state.stack.pop();
        f.state.stack.push(a >= b);
      });

      func('<', f => {
        const b = f.state.stack.pop();
        const a = f.state.stack.pop();
        f.state.stack.push(a < b);
      });

      func('<=', f => {
        const b = f.state.stack.pop();
        const a = f.state.stack.pop();
        f.state.stack.push(a <= b);
      });

      // Math

      func('+', f => {
        const b = f.state.stack.pop();
        const a = f.state.stack.pop();
        f.state.stack.push(a + b);
      });

      func('-', f => {
        const b = f.state.stack.pop();
        const a = f.state.stack.pop();
        f.state.stack.push(a - b);
      });

      func('/', f => {
        const b = f.state.stack.pop();
        const a = f.state.stack.pop();
        f.state.stack.push(a / b);
      });

      func('*', f => {
        const b = f.state.stack.pop();
        const a = f.state.stack.pop();
        f.state.stack.push(a * b);
      });

      func('%', f => {
        const b = f.state.stack.pop();
        const a = f.state.stack.pop();
        f.state.stack.push(a % b);
      });

      // Strings
      
      // Arrays

      func('length', f => {
        const array = f.state.stack.pop();
        f.state.stack.push(array.length);
      });

      // Debugging

      func('print', f => {
        t.log(f.state.stack.pop());
      });

      func('pause', f => {
        t.log(f);
        debugger; // examine the runtime state in the console
      });

      func('print-stack', f => {
        t.log(JSON.stringify(f.state.stack));
      });

      // JS Interop

      func('.get', f => {
        const key = f.state.stack.pop();
        const object = f.state.stack.pop();
        f.state.stack.push(object[key]);
      });

      func('create-object', f => {
        f.state.stack.push({});
      });

      func('.set', f => {
        const key = f.state.stack.pop();
        const object = f.state.stack.pop();
        const value = f.state.stack.pop();
        object[key] = value;
      });

      func('call', f => {
        const argCount = f.state.stack.pop();
        const func = f.state.stack.pop();
        const args = f.state.stack.splice(f.state.stack.length - argCount, argCount);
        f.state.stack.push(func(...args));
      });

      func('.call', f => {
        const argCount = f.state.stack.pop();
        const methodName = f.state.stack.pop();
        const object = f.state.stack.pop();
        const args = f.state.stack.splice(f.state.stack.length - argCount, argCount);
        f.state.stack.push(object[methodName](...args));
      });

      func('as-function', f => {
        const sequence = f.state.stack.pop();
        const func = (...args) => {
          const state = {
            stack: args,
          };
          run(sequence, state);
          const result = state.stack.pop();
          return result;
        };
        f.state.stack.push(func);
      });

      func('get-program', f => {
        const name = f.state.stack.pop();
        const code = f.state.programs[name];
        f.state.stack.push(code);
      });
        
    },
  };
});
