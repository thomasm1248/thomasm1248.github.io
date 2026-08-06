'use strict';
t.module(async () => {
  const e = {};

  const builtIns = await t.requireAsync('js/tulip/builtInWords');
  const baseLib = await t.requireAsync('js/tulip/lib/base');

  // Environment operations

  function get(env, name) {
    if(!env) return undefined;
    const value = env[name];
    if(value !== undefined) return value;
    return get(env.__parent, name);
  }

  // Parsing

  function tokenize(code) {
    const tokens = code
      .matchAll(/\"[^\"\\]*(\\.[^\"\\]*)*"|\([^)]*\)|[^\n ]+/g)
      .map(match => match[0])
      .toArray();
    return tokens;
  }

  // Runtime
  
  function eval(item, env) {
    if(typeof item === 'function') {
      // Function
      item(env);
    } else if(typeof item !== 'object')
      // Value
      env.it = item;
    } else if(item.__isValue) {
      // Value wrapper
      env.it = item.value;
    } else if(item.__isToken) {
      // Token
      env.token = item;
      const value = get(env, item.name);
      env.it = value;
      env.value = value;
    } else if(item.length !== undefined) {
      // List
      for(let i = 0; i < item.length; i++) {
        const subItem = item[i];
        eval(subItem, env);
      }
    } else if(item.__type === 'if') {
      // If
      if(env.it)
        eval(item.ifTrue, env);
      else if(env.ifFalse)
        eval(item.ifFalse, env);
    } else if(item.__type === 'while') {
      // While
      while(env.it)
        eval(item.body, env);
    } else if(item.__type === 'scope') {
      // Scope
      const newScope = {
        parent: env,
      };
      eval(item.body, newScope);
    } else {
      // Something else
      env.it = item;
    }
  }

  const tokenDict = {};
  const tokenNames = {};
  function makeTokenObject(name) {
    let tokenObject = tokenDict[name];
    if(!tokenObject) {
      tokenObject = {
        __isToken = true,
        name,
      };
      tokenDict[name] = tokenObject;
      tokenNames[tokenObject] = name;
    }
    return tokenObject;
  }

  function read(tokens, dictionary) {
    const env = {
      dictionary,
      tokens,
      nextToken: 0,
      parsers: [{
        // Main parser, runs program
        terminators: [], // never ends
        sequence: [],
        postParse: env => {
          // Get the compiled program
          const sequence = env.sequence;
          // Run the program
          eval(sequence, env);
        },
      }],
    };
    function currentSequence() {
      return env.parsers[env.parsers.length-1].sequence;
    }
    while(env.nextToken < tokens.length) {
      const token = tokens[env.nextToken];
      env.nextToken++;
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
      const currentParser = env.parsers[env.parsers.length-1];
      if(currentParser.terminators.contains(token)) {
        env.terminator = token;
        env.sequence = currentParser.sequence;
        env.parsers.pop();
        eval(currentParser.postParse, env);
        continue;
      }
      const action = dictionary[token];
      if(!action)
        currentSequence().push(makeTokenObject(token));
      else if(action.postParse) {
        env.parsers.push({
          ...action,
          sequence: [],
        });
        if(action.preParse)
          eval(action.preParse, env);
      } else
        currentSequence().push(action);
    }
    
    if(env.parsers.length > 1) {
      const currentParser = env.parsers.pop();
      throw new Error(`Code ended too soon. Expected:` +
        ` ${currentParser.terminators.join(', ')}.`);
    }
    const mainParser = env.parsers.pop();
    env.sequence = mainParser.sequence;
    eval(mainParser.postParse, env);
  }

  // Public functions
  
  e.createCoreDictionary = () => {
    const dictionary = {
      'tokenize': e => {
        e.it = tokenize(e.it);
      },
      'eval': eval,
      'read': e => {
        read(e.it, e.dictionary);
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
