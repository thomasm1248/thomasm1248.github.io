'use strict';
t.module(() => {

  function makeCanvas() {
    // Replaces everything currently on the page
    // with a single canvas that automatically resizes
    // to fill the whole window.

    // Clear the current content of the body
    if(document.body.children.length > 0)
      t.log('makeCanvas() replaced the existing content of' +
            ' the page with a canvas. If you want to add' +
            ' your own content to the page on top of the' +
            ' canvas, use makeOverlay() (after calling' +
            ' makeCanvas()) to create layers' +
            ' of UI that can be displayed over the canvas.');
    document.body.innerHTML = '';

    // Create a canvas
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';

    // Automatically resize the canvas to fit the window
    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.onresize = resizeCanvas;
    resizeCanvas();

    return canvas;
  }

  function makeOverlay(html, options) {
    // Builds an overlay that is displayed on top
    // of whatever is currently on the page. The
    // return result is a object with two methods:
    // show() and hide() (hidden by default).
    //
    // If you want access to specific elements
    // within the overlay, give them the data-ref
    // attribute. The returned object will contain
    // a property for each data-ref element.
    //
    // For example:
    //
    // const myOverlay = engine.makeOverlay(`
    //   <h1>Title</h1>
    //   <p data-ref='myTextOutput'></p>
    //   <button data-ref='myButton'>Click Me</button>
    // `);
    // myOverlay.myButton.onclick = e => {
    //   myOverlay.myTextOutput.innerText = 'Hello';
    // };
    // myOverlay.show();
    //
    // This function also accepts a set of options
    // that can be used to activate various features
    // such as center alignment (read the code for
    // more details).

    const { root, refs } = t.createComponent(`
      <div style='display: none;
                  position: absolute;
                  top: 0;
                  left: 0;
                  width: 100%;
                  height: 100%;'>
        <div data-ref='layoutContainer'
             style='width: 100%;
                    height: 100%;'>
          <div data-ref='contentContainer'
               style='${options?.style}'>
            ${html}
          </div>
        </div>
      </div>
    `);

    // Center the overlay content?
    if(options?.center) {
      refs.layoutContainer.style.display = 'flex';
      refs.layoutContainer.style.justifyContent = 'center';
      refs.layoutContainer.style.alignItems = 'flex-start';
    }

    // Set the width of the overlay?
    if(options?.width) {
      refs.contentContainer.style.width = options.width + 'px';
    }

    document.body.appendChild(root);

    return {
      ...refs,
      show: () => {
        root.style.display = 'block';
      },
      hide: () => {
        root.style.display = 'none';
      },
    };
  }
  
  function runGame(canvas, startState) {
    // This function runs your game.
    // 
    // Params:
    //   canvas -     the canvas element that the game
    //                will be displayed in
    //   startState - the state that the game will begin
    //                in
    // 
    // A 'state' is a function that returns an
    // object with the following optional properties:
    //   cleanup -    A function that will be called when
    //                the engine switches to another state.
    //   simulation - A list of functions that will run
    //                during the game simulation. Each function
    //                will be given the amount of time (as a
    //                fraction of a second) that passed since
    //                the last simulation loop, and a 'cache'
    //                object that starts out empty each
    //                simulation tick, but can be used to store
    //                intermediate information that will be
    //                used by the functions.
    //   draw -       The function that will handle drawing
    //                stuff to the canvas.

    const ctx = canvas.getContext('2d');

    let t = Date.now();

    let currentState = startState();

    function mainLoop() {
      window.requestAnimationFrame(mainLoop);

      const cache = {};
      const now = Date.now();
      const dt = (now - t) / 1000;
      t = now;

      if(currentState.simulation) {
        for(const system of currentState.simulation)
          system(dt, cache);
      }

      if(currentState.draw)
        currentState.draw(ctx);
    }

    setTimeout(mainLoop, 0);

    return {
      switchToState: (state, ...args) => {
        if(currentState.cleanup)
          currentState.cleanup();
        currentState = state(...args);
      },
    };
  }

  return {
    makeCanvas,
    makeOverlay,
    runGame,
  };
});
