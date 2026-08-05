'use strict';
t.module(async () => {

  return {
    addTo: dictionary => {

      function func(name, implementation, terminators = null) {
        if(terminators)
          implementation = {
            postParse: implementation,
            terminators,
          };
        dictionary[name] = implementation;
      }

      const eval = dictionary.eval;

      function getCurrentSequence(state) {
        const currentParser = state.parsers[state.parsers.length-1];
        return currentParser.sequence;
      }

      // Meta

      func('read-token', s => {
        s.stack.push(s.tokens[s.nextToken++]);
      });
      
      func('dictionary', s => {
        s.stack.push(s.dictionary);
      });

      func('compile', s => {
        const item = s.stack.pop();
        getCurrentSequence(s).push(item);
      });

      func('quote', s => {
        const item = s.stack.pop();
        s.stack.push(state =>
          state.stack.push(item));
      });

      func('as-parser', s => {
        const action = s.stack.pop();
        const ends = s.stack.pop().split('/');
        action.parse = ends;
        s.stack.push(action);
      });

      func('run-parser', s => {
        const parser = s.stack.pop();
        if(parser.preParse)
          eval(parser.preParse, s);
        s.parsers.push(parser);
      });

      func('{', s => {
        const sequence = s.stack.pop();
        s.stack.pop();
        eval(sequence, s);
      }, ['}']);

      func('[', s => {
        const sequence = s.stack.pop();
        s.stack.pop();
        getCurrentSequence(s).push(s2 =>
          s2.stack.push(sequence));
      }, [']']);

      // Control Flow
      
      func('endif', s => {
        const falseBody = s.stack.pop();
        const trueBody = s.stack.pop();
        const condition = s.stack.pop();
        if(condition)
          eval(trueBody, s);
        else
          eval(falseBody, s);
      };

      func('endwhile', s => {
        const body = s.stack.pop();
        let condition = s.stack.pop();
        while(condition) {
          eval(body, s);
          condition = s.stack.pop();
        }
      });
      
      // Stack

      func('dup', s => {
        const a = s.stack[s.stack.length-1];
        s.stack.push(a);
      });

      func('2dup', s => {
        const top2 = s.stack.slice(-2);
        s.stack.push(...top2);
      });

      func('over', s => {
        const a = s.stack[s.stack.length-2];
        s.stack.push(a);
      });

      func('swap', s => {
        const topItem = s.stack.pop();
        s.stack.splice(s.stack.length-1, 0, topItem);
      });

      func('tuck', s => {
        const topItem = s.stack[s.stack.length-1];
        s.stack.splice(s.stack.length-1, 0, topItem);
      });

      func('drop', s => {
        s.stack.pop();
      });

      func('rot', s => {
        // push top item under next two
        const topItem = s.stack.pop();
        s.stack.splice(s.stack.length-2, 0, topItem);
      });

      func('-rot', s => {
        // pull 3rd item to top
        const third = s.stack.splice(s.stack.length-3, 1)[0];
        s.stack.push(third);
      });

      func('nip', s => {
        s.stack.splice(s.stack.length-2, 1);
      });

      // Literals

      dictionary['null'] = null;
      dictionary['true'] = true;
      dictionary['false'] = false;

      // Logic

      func('not', s => {
        const v = s.stack.pop();
        s.stack.push(!v);
      });

      func('and', s => {
        const b = s.stack.pop();
        const a = s.stack.pop();
        s.stack.push(a && b);
      });

      func('or', s => {
        const b = s.stack.pop();
        const a = s.stack.pop();
        s.stack.push(a || b);
      });

      func('=', s => {
        const b = s.stack.pop();
        const a = s.stack.pop();
        s.stack.push(a === b);
      });

      func('>', s => {
        const b = s.stack.pop();
        const a = s.stack.pop();
        s.stack.push(a > b);
      });

      func('>=', s => {
        const b = s.stack.pop();
        const a = s.stack.pop();
        s.stack.push(a >= b);
      });

      func('<', s => {
        const b = s.stack.pop();
        const a = s.stack.pop();
        s.stack.push(a < b);
      });

      func('<=', s => {
        const b = s.stack.pop();
        const a = s.stack.pop();
        s.stack.push(a <= b);
      });

      // Math

      func('+', s => {
        const b = s.stack.pop();
        const a = s.stack.pop();
        s.stack.push(a + b);
      });

      func('-', s => {
        const b = s.stack.pop();
        const a = s.stack.pop();
        s.stack.push(a - b);
      });

      func('/', s => {
        const b = s.stack.pop();
        const a = s.stack.pop();
        s.stack.push(a / b);
      });

      func('*', s => {
        const b = s.stack.pop();
        const a = s.stack.pop();
        s.stack.push(a * b);
      });

      func('%', s => {
        const b = s.stack.pop();
        const a = s.stack.pop();
        s.stack.push(a % b);
      });

      // Strings
      
      // Arrays

      func('length', s => {
        const array = s.stack.pop();
        s.stack.push(array.length);
      });

      // Debugging

      func('print', s => {
        t.log(s.stack.pop());
      });

      func('pause', s => {
        t.log(s);
        debugger; // examine the runtime state in the console
      });

      func('print-stack', s => {
        t.log(JSON.stringify(s.stack));
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
