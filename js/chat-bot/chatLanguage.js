'use strict';

t.module('../chat-bot/chatLanguage', () => {
  const e = {};

  // Types
  
  const sampleBrain = {
    'start': {
      text: memory => 'What is your name?',
      type: 'prompt',
      respond: (answer, memory) => {
        memory.userName = answer;
        return sampleBrain['greeting'];
      },
    },
    'greeting': {
      text: memory => 'Greetings, ' + memory.userName + '.',
      type: 'options',
      options: [
        {
          text: memory => 'Greetings.',
          respond: memory => {
            return null;
          },
        },
      ],
    },
  };

  e.addTo = dictionary => {

    const runWord = dictionary.run;
    function run(sequence, state) {
      state.stack.push(sequence);
      runWord({
        state,
      });
    }

    function jump(address) {
      if(address.startsWith('http')) {
        t.log('opening ' + address + ' in a new tab');
        window.open(address, '_blank').focus();
        return null;
      }
      if(address.startsWith('mailto:')) {
        t.log('opening ' + address + ' in a new tab');
        window.open(address, '_blank').focus();
        return null;
      } else if(address.startsWith('javascript:')) {
        t.log('opening ' + address + ' in current tab');
        const link = document.createElement('a');
        link.href = address;
        link.target = '';
        link.click();
        return null;
      }
      const newState = dictionary[address];
      if(newState === undefined) {
        t.warn(`State "${address}" is not defined.`);
        return null;
      }
      t.log('switching to state "' + address + '"');
      return newState;
    }

    dictionary.exit = null;

    dictionary.random = f => {
      const numOptions = f.state.stack.pop();
      const start = f.state.stack.pop();
      f.state.stack.push(Math.floor(Math.random() * numOptions) + start);
    };

    dictionary['options:'] = f => {
      const text = f.state.stack.pop();
      const key = f.state.stack.pop();
      const state = {
        text: typeof text === 'string'
          ? memory => text
          : memory => {
            // text is a sequence that needs to be executed
            const stack = [memory];
            run(text, {
              stack,
            });
            return jump(stack.pop());
          },
        type: 'options',
        options: [],
      };
      dictionary[key] = state;
      f.state.currentOptionsList = state.options;
    };

    dictionary['=>'] = f => {
      const option = {
      };
      f.state.currentOption = option;
      f.state.currentOptionsList.push(option);
    };

    dictionary['<<'] = f => {
      const action = f.state.stack.pop();
      const optionText = f.state.stack.pop();
      f.state.currentOption.text = memory => optionText;
      f.state.currentOption.respond = typeof action === 'object'
        ? memory => {
          // action is a sequence
          const stack = [memory];
          run(action, {
            stack,
          });
          return jump(stack.pop());
        }
        : memory =>
          // action is a string
          jump(action);
    };

    dictionary['make-prompt'] = f => {
      const nextStateKey = f.state.stack.pop();
      const variableName = f.state.stack.pop();
      const text = f.state.stack.pop();
      const key = f.state.stack.pop();
      dictionary[key] = {
        text: memory => text,
        type: 'prompt',
        respond: (value, memory) => {
          memory[variableName] = value;
          return jump(nextStateKey);
        },
      };
    };
  };

  return e;
});
