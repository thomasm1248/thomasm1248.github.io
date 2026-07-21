(async () => {
  
  // Load modules
  const {
    forth,
    chatLanguage,
    brainCode,
    chatBotUi,
  } = await t.requireModulesAsync({
    forth: 'js/forth/core',
    chatLanguage: 'js/chat-bot/chatLanguage',
    brainCode: 'js/chat-bot/brainCode',
    chatBotUi: 'js/chat-bot/chatBotUi',
  });

  // Parse brain
  const dictionary = forth.createCoreDictionary();
  chatLanguage.addTo(dictionary);
  forth.read(brainCode, dictionary);
  const brain = dictionary;

  // Insert chatbot UI into the page
  const chatBotContainer = document.getElementById('demon-chat-bot');
  chatBotContainer.appendChild(chatBotUi.createChatBot(brain));

})();
