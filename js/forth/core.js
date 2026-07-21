'use strict';
t.module(async () => {
  const e = {};

  const builtIns = await t.requireAsync('js/forth/builtInWords');
  const baseLib = await t.requireAsync('js/forth/lib/base');

  // Parsing

  function tokenize(code) {
    const tokens = code
      .matchAll(/\"[^\"\\]*(\\.[^\"\\]*)*"|\([^)]*\)|[^\n ]+/g)
      .map(match => match[0])
      .toArray();
    return tokens;
  }

  // Runtime
  
  function run(sequence, state) {
    const frame = {
      pc: 0,
      sequence,
      state,
    };
    while(frame.pc < sequence.length) {
      const action = sequence[frame.pc];
      frame.pc++;
      if(typeof action === 'function')
        // Action is a function
        action(frame);
      else
        // Action is a sequence
        run(action, state);
    }
  }

  function read(tokens, dictionary, programs) {
    const state = {
      stack: [],
      sequence: [],
      dictionary,
      tokens,
      nextToken: 0,
      programs,
    };
    while(state.nextToken < tokens.length) {
      const token = tokens[state.nextToken];
      state.nextToken++;
      // Comments
      if(token.startsWith('(')) continue;
      // Numbers
      if(token.match(/^\d/)) {
        const number = token * 1;
        state.sequence.push(f =>
          f.state.stack.push(number));
        continue;
      }
      // Strings
      if(token.match(/"$/)) {
        const string = token
          .slice(1, -1)
          .replaceAll('\\n', '\n')
          .replaceAll('\\\\', '\\')
          .replaceAll('\\"', '"');
        state.sequence.push(f =>
          f.state.stack.push(string));
        continue;
      }
      // Words
      const action = dictionary[token];
      if(!action)
        throw new Error(`Word "${token}" is not defined.`);
      if(action.immediate) {
        run([action], state);
      } else {
        state.sequence.push(action);
      }
    }
    
    if(state.sequence.length > 0) {
      const sequence = state.sequence;
      state.sequence = [];
      run(sequence, state);
    }
  }

  // Public functions
  
  e.createCoreDictionary = () => {
    const dictionary = {
      'tokenize': f => {
        const code = f.state.stack.pop();
        f.state.stack.push(tokenize(code));
      },
      'run': f => {
        const sequence = f.state.stack.pop();
        run(sequence, f.state);
      },
      'read': f => {
        const tokens = f.state.stack.pop();
        read(tokens, f.state.dictionary, f.state.programs);
      },
    };
    builtIns.addTo(dictionary);
    read(tokenize(baseLib), dictionary);
    return dictionary;
  };

  e.read = (code, dictionary, programs = {}) => {
    const tokens = tokenize(code);
    read(tokens, dictionary, programs);
  };

  e.preloadLibsAsync = async (...paths) => {
    const libCollection = {};
    const programs = await Promise.all(paths
      .map(async path => ({
        path,
        code: await t.requireAsync('forth/lib/' + path),
      })));
    programs.forEach(x =>
      libCollection[x.path] = x.code);
    return libCollection;
  };

  return e;
});
