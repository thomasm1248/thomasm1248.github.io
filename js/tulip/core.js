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
    switch(item.__action) {
      case 'value':
        env.it = item.value;
        break;
      case 'symbol':
        env.symbol = item;
        env.it = get(env, symbol);
      case 'native function':
        item.func(env);
        break;
      case 'if':
        if(env.it)
          eval(item.ifTrue, env);
        else if(item.ifFalse)
          eval(item.ifFalse, env);
        break;
      case 'loop':
        while(env.it)
          eval(item.program, env);
        break;
      case 'program':
        for(const subItem of item.program)
          eval(subItem, env);
        break;
      case 'scope':
        const newScope = {
          __parent: env,
        };
        eval(item.program, newScope);
        break;
      default:
        env.it = item;
        break;
    }
  }

  // Symbol table (for performance)

  const symbolTable = {};

  function makeSymbol(name) {
    let symbol = symbolTable[name];
    if(!symbol) {
      symbol = {
        __action: 'symbol',
        name,
      };
      symbolTable[name] = symbol;
    }
    return symbol;
  }

  // Read program

  function read(tokens, dictionary) {
    let tokenIndex = 0;

    // How to parse the next token
    const wrappedReadNext = env =>
      env.it = readNext();
    function readNext() {
      // Get next token
      const token = tokens[tokenIndex++];
      // Skip comments
      while(token !== undefined && token.startsWith('('))
        token = tokens[tokenIndex++];
      // Exit if the end has been reached
      if(token === undefined) return undefined;
      // Numbers
      if(token.match(/^\d/))
        return token * 1;
      // Strings
      if(token.match(/"$/))
        return token
          .slice(1, -1)
          .replaceAll('\\n', '\n')
          .replaceAll('\\\\', '\\')
          .replaceAll('\\"', '"');
      // Symbols
      const symbol = makeSymbol(token);
      const definition = dictionary[symbol];
      if(definition.__action === 'parse') {
        // Symbol refers to a parser, so activate it
        return runParser(definition, env);
      }
      return symbol;
    }

    // How to run a parser
    function runParser(parser, env) {
      const parserEnv = {
        __parent: env,
        sequence: [],
        readNext: wrappedReadNext,
      };
      eval(parser.program, parserEnv);
      return parserEnv.it;
    }

    // Base parser
    const baseParser = {
      __action: 'parse',
      program: {
        __action: 'native function',
        func: e => {
          const dictionary = get(e, 'dictionary');
          const program = [];

          // Compile program
          e.readNext(e);
          while(e.it !== undefined) {
            if(e.it.__action === 'symbol') {
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
        },
      },
    };

    // Create a root environment for the parsing
    const parsingEnv = {
      dictionary,
    };

    // Parse the tokens
    return runParser(baseParser, parsingEnv);
  }

  // Public functions
  
  e.createCoreDictionary = () => {
    const dictionary = {
      'make-symbol': makeSymbol,
      [makeSymbol('eval')]: eval,
      [makeSymbol('tokenize')]: {
        __action: 'native function',
        func: e => {
          e.it = tokenize(e.it);
        },
      },
      [makeSymbol('read')]: {
        __action: 'native function',
        func: e => {
          e.it = read(e.it, get(e, 'dictionary'));
        },
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
