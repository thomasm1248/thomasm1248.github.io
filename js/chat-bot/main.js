(async () => {
  
  // Load modules
  const {
    forth,
    chatLanguage,
    brainCode,
    chatBotUi,
  } = await t.requireModulesAsync({
    forth: 'forth/core',
    chatLanguage: '../chat-bot/chatLanguage',
    brainCode: '../chat-bot/brainCode',
    chatBotUi: '../chat-bot/chatBotUi',
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
