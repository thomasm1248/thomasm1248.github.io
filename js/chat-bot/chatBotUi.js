'use strict';

t.module(() => {
  const e = {};

  e.createChatBot = brain => {
    let currentState = null;
    const memoryFromStorage = localStorage.getItem('chat-bot-memory');
    const memory = memoryFromStorage
      ? JSON.parse(memoryFromStorage)
      : {};

    const { root, refs } = t.createComponent(`
      <div>
        <img src="../files/homepage-assets/chat-bot/demon-bear.png"/>
        <p data-ref='demonSays'></p>
        <ul data-ref='optionList'></ul>
        <input data-ref='input' class='hidden'/>
      </div>
    `);

    function render() {
      if(currentState === null) {
        refs.demonSays.innerText = 'Click to start conversation.';
        refs.optionList.innerHTML = '';
        refs.input.classList.add('hidden');
      } else if(currentState.type === 'options') {
        refs.demonSays.innerText = currentState.text(memory);
        refs.optionList.innerHTML = '';
        currentState.options
          .forEach(option => {
            const { root: element } = t.createComponent(`
              <li>${t.escapeHTML(option.text(memory))}</li>
            `);
            element.onclick = e => {
              currentState = option.respond(memory);
              localStorage.setItem(
                'chat-bot-memory', JSON.stringify(memory));
              render();
              e.stopPropagation();
            };
            refs.optionList.appendChild(element);
          });
        refs.input.classList.add('hidden');
      } else if(currentState.type === 'prompt') {
        refs.demonSays.innerText = currentState.text(memory);
        refs.optionList.innerHTML = '';
        refs.input.value = '';
        refs.input.classList.remove('hidden');
      } else {
        t.warn('invalid state type');
      }
    }

    render();

    root.onclick = e => {
      if(currentState !== null) return;
      currentState = brain.start;
      render();
    };

    refs.input.onkeydown = e => {
      if(e.key !== 'Enter') return;
      currentState = currentState.respond(refs.input.value, memory);
      localStorage.setItem('chat-bot-memory', JSON.stringify(memory));
      render();
    };

    return root;
  };

  return e;
});
