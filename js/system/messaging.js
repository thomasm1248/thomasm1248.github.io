'use strict';
t.module(() => {

  function register(topic, callback, targetWindow = window.parent) {
    targetWindow.addEventListener('message', e => {
      if(e.data?.topic !== topic) return;
      callback(e.data.message);
    });
    return message => {
      targetWindow.postMessage({
        topic,
        message,
      }, '*');
    };
  }

  return {
    register,
  };
});
