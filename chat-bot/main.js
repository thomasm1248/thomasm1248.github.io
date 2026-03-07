const initChatBot = () => {
  
  // Load modules
  const parser = t.require('chatLanguage');
  const brainCode = t.require('brainCode').code;
  const convoManager = t.require('conversationCore');
  const chatBotUi = t.require('chatBotUi');

  // Parse brain
  const brain = parser.parse(null, brainCode, 'brainCode');

  // Connect to UI
  const sectionTextElement = document.getElementById('demon-says');
  const optionListElement = document.getElementById('option-list');

  // State
  let currentSectionLabel = null;

  // Connect event listeners
  sectionTextElement.onclick = e => {
    if(currentSectionLabel !== null) return;
    startConversation();
  };
  optionListElement.onclick = e => {
    const optionLabel = e.srcElement.dataset.optionLabel;
    if(optionLabel === undefined) return;
    selectOption(optionLabel);
  };
  setInterval(() => {
    checkForInterrupts();
  }, 1000);



  // Main logic

  // Start a conversation
  const startConversation = () => {
    currentSectionLabel = convoManager.startConversation(brain),
    t.shape('string', currentSectionLabel);
    renderUi();
  };

  // Select an option during conversation
  const selectOption = label => {
    const result = convoManager.jump(
      brain,
      currentSectionLabel,
      label);
    
    switch(result.type) {
      case 'section':
        jumpToSection(result.label);
        break;
      case 'url':
        openUrl(result.url, result.newTab);
        jumpToSection(null);
        break;
      default:
        t.warn(
          'jumping to option returned weird result:',
          result);
        break;
    }
  };

  // Jump to next conversation section
  const jumpToSection = label => {
    if(label === null) {
      // End the conversation
      currentSectionLabel = null;
      renderUi();
      return;
    }
    if(brain[label] === undefined) {
      // Section not defined
      console.log(`section '${label}' was not defined`);
      currentSectionLabel = null;
      renderUi();
      return;
    }
    // Jump to section
    currentSectionLabel = label;
    renderUi();
  };

  // Check for interrupts
  let lastCheck = Date.now();
  const checkForInterrupts = () => {
    // Calculate milliseconds that have passed
    const currentTime = Date.now();
    const passedMS = currentTime - lastCheck;
    lastCheck = currentTime;
    
    // Don't interrupt during conversations
    if(currentSectionLabel !== null) return;

    // Check for an interrupt
    const label = convoManager.checkForInterrupts(
      brain,
      passedMS);

    // Start a new conversation
    if(label !== null) {
      currentSectionLabel = label;
      renderUi();
    }
  };



  // UI operations

  const renderUi = () => {
    chatBotUi.displaySectionOfBrain(
      brain,
      currentSectionLabel,
      sectionTextElement,
      optionListElement);
  };

  const openUrl = (url, newTab) => {
    const link = document.createElement('a');
    link.href = url;
    if(newTab) link.target = '_blank';
    link.click();
  };



  // Initialize UI
  renderUi();

};
