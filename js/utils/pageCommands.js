'use strict';

const _ = {};

t.module(async () => {
  const e = {};

  // Public functions

  e.nextToken = text => {
    const spaceIndex = text.indexOf(' ');
    return {
      token: spaceIndex === -1
        ? text
        : text.slice(0, spaceIndex),
      rest: spaceIndex === -1
        ? ''
        : text.slice(spaceIndex + 1),
    };
  };

  e.create = (name, description, command) => {
    command.description = description;
    _[name] = command;
  }

  // Some initial commands

  e.create(
    'repl',
    'Launches the prompt dialog REPL.',
    () => {
      let lastCommand = '';
      while(true) {
        lastCommand = prompt('Command:', lastCommand);
        if(!lastCommand || lastCommand.length === 0) break;
        const { token, rest } = e.nextToken(lastCommand);
        const command = _[token];
        if(command) {
          const result = command(rest);
          if(result) alert(result);
        } else {
          alert(`"${token}" is not a registered command.`);
        }
      }
    });

  e.create(
    'help',
    'Display this help message.',
    input => {
      if(input.length === 0) {
        let output = '';
        for(const key in _) {
          if(output.length !== 0)
            output += '\n';
          output += `${key} - ${_[key].description}`;
        }
        return output;
      } else {
        const {token} = e.nextToken(input);
        const command = _[token];
        if(command)
          return command.toString();
        else
          return `"${token}" is not a registered command.`;
      }
    });

  return e;
});
