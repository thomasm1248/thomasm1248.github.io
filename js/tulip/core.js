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
  
  function resolveSymbol(env, name) {
    if(name.startsWith('.'))
      return env.it[name.slice(1)];
    return get(env, name);
  }

  /*

Same thing, but in Lisp:

(define resolveSymbol (env name)
  (if (= (slice name 0 1) ".")
    (index (index env "it")
           (slice name 1))
    (get env name)))

Same thing, but in tulip:

func: resolveSymbol
  define: value
  scope{
    name starts-with: "." then{
      1 -> start
      name slice -> name
      env .it .: name => value
    }else{
      name get => value
    }
  }
;

   */
  
  function run(item, env) {
    switch(item.__action) {
      case 'value':
        env.other = env.it;
        env.it = item.value;
        break;
      case 'symbol':
        env.symbol = item;
        env.other = env.it;
        env.it = resolveSymbol(env, item.name);
        break;
      case 'native function':
        item.func(env);
        break;
      case 'if':
        if(env.it)
          run(item.ifTrue, env);
        else if(item.ifFalse)
          run(item.ifFalse, env);
        break;
      case 'loop':
        while(env.it)
          run(item.program, env);
        break;
      case 'program':
        for(const subItem of item.program)
          run(subItem, env);
        break;
      case 'scope':
        const newScope = {
          __parent: env,
        };
        run(item.program, newScope);
        break;
      default:
        env.other = env.it;
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
        name,
        __action: 'symbol',
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
      env.it = readNext(env);
    function readNext(env) {
      // Get next token
      let token = tokens[tokenIndex++];
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
      const definition = dictionary[symbol.name];
      if(definition?.__action === 'parse') {
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
      run(parser.program, parserEnv);
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

          // Run the compiled program
          run({
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
      'run': run,
      'tokenize': {
        name: 'tokenize',
        __action: 'native function',
        func: e => {
          e.it = tokenize(e.it);
        },
      },
      'read': {
        name: 'read',
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
