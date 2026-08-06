'use strict';
t.module(async () => {

  return {
    addTo: dictionary => {

      // Environment operations

      function get(env, name) {
        if(!env) return undefined;
        const value = env[name];
        if(value !== undefined) return value;
        return get(env.__parent, name);
      }

      function update(env, name, value) {
        if(!env) return;
        if(env[name] !== undefined)
          env[name] = value;
        else
          update(env.__parent, name, value);
      }

      function consumeFirstLocal(env, ...names) {
        for(const name of names) {
          const value = env[name];
          if(value !== undefined) {
            env[name] = undefined;
            return value;
          }
        }
        return undefined;
      }

      // Other utilities
      
      function func(name, implementation) {
        dictionary[name] = implementation;
      }

      function parser(preParse, terminators, postParse) {
        return {
          preParse,
          terminators,
          postParse,
        };
      }

      const eval = dictionary.eval;
      dictionary.eval = e => {
        eval(e.it, e);
      };

      function getCurrentSequence(env) {
        const parsers = get(env, 'parsers');
        const currentParser = parsers[parsers.length-1];
        return currentParser.sequence;
      }

      function getNextToken(env) {
        const nextToken = get(e, 'nextToken');
        const token = get(e, 'tokens')[nextToken++];
        update(e, 'nextToken', nextToken);
        return token;
      }

      function cancelParser(env) {
        const parsers = get(env, 'parsers');
        parsers.pop();
      }

      // Meta

      func('read-token', e => {
        const token = getNextToken(e);
        e.it = token;
        e.token = token;
      });
      
      func('dictionary', e => {
        const dictionary = get(e, 'dictionary');
        e.it = dictionary;
        e.dictionary = dictionary;
      });

      func('compile', e => {
        getCurrentSequence(s).push(e.it);
        e.it = undefined;
      });

      func('quote', e => {
        e.it = {
          __isValue: true,
          value: e.it,
        };
      });

      func('as-parser', e => {
        const action = e.action;
        const ends = e.ends.split('/');
        const parser = {
          postParse: action,
          terminators: ends,
        };
        e.it = parser;
        e.parser = parser;
      });

      func('run-parser', e => {
        const parser = consumeFirstLocal(e, 'parser', 'it');
        if(parser.preParse)
          eval(parser.preParse, e);
        get(e, 'parsers').push(parser);
      });

      dictionary['{'] = parser(
        e => {
        },
        ['}'],
        e => {
          const sequence = e.sequence;
          e.sequence = undefined;
          eval(sequence, e);
        }
      );

      dictionary['['] = parser(
        e => {
        },
        [']'],
        e => {
          getCurrentSequence(e).push({
            __isValue: true,
            value: e.sequence,
          });
          e.sequence = undefined;
        }
      );
      
      // Environment manipulation
      
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
