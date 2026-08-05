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
  
  function eval(item, state) {
    if(typeof item === 'function') {
      item(state);
    } else if(typeof item === 'object' && item.length !== undefined) {
      for(let i = 0; i < item.length; i++) {
        const subItem = item[i];
        eval(subItem, state);
      }
    } else {
      state.stack.push(item);
    }
  }

  function read(tokens, dictionary) {
    const state = {
      stack: [],
      dictionary,
      tokens,
      nextToken: 0,
      parsers: [{
        // Main parser, runs program
        terminators: [], // never ends
        sequence: [],
        postParse: state => {
          // Get the compiled program
          const sequence = state.stack.pop();
          // Run the program
          eval(sequence, state);
        },
      }],
    };
    function currentSequence() {
      return state.parsers[state.parsers.length-1].sequence;
    }
    while(state.nextToken < tokens.length) {
      const token = tokens[state.nextToken];
      state.nextToken++;
      // Comments
      if(token.startsWith('(')) continue;
      // Numbers
      if(token.match(/^\d/)) {
        const number = token * 1;
        currentSequence().push(number);
        continue;
      }
      // Strings
      if(token.match(/"$/)) {
        const string = token
          .slice(1, -1)
          .replaceAll('\\n', '\n')
          .replaceAll('\\\\', '\\')
          .replaceAll('\\"', '"');
        currentSequence().push(string);
        continue;
      }
      // Words
      const currentParser = state.parsers[state.parsers.length-1];
      if(currentParser.terminators.contains(token)) {
        state.stack.push(token);
        state.stack.push(currentParser.sequence);
        state.parsers.pop();
        eval(currentParser.postParse, state);
        continue;
      }
      const action = dictionary[token];
      if(!action)
        throw new Error(`Word "${token}" is not defined.`);
      if(action.postParse) {
        state.parsers.push({
          ...action,
          sequence: [],
        });
        if(action.preParse)
          eval(action.preParse, state);
      } else
        currentSequence().push(action);
    }
    
    if(state.parsers.length > 1) {
      const currentParser = state.parsers.pop();
      throw new Error(`Code ended too soon. Expected:` +
        ` ${currentParser.terminators.join(', ')}.`);
    }
    const mainParser = state.parsers.pop();
    state.stack.push(mainParser.sequence);
    eval(mainParser.postParse, state);
  }

  // Public functions
  
  e.createCoreDictionary = () => {
    const dictionary = {
      'tokenize': s => {
        const code = s.stack.pop();
        s.stack.push(tokenize(code));
      },
      'eval': eval,
      'read': s => {
        const tokens = s.stack.pop();
        read(tokens, s.dictionary);
      },
    };
    builtIns.addTo(dictionary);
    read(tokenize(baseLib), dictionary);
    return dictionary;
  };

  e.read = (code, dictionary) => {
    const tokens = tokenize(code);
    read(tokens, dictionary);
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
