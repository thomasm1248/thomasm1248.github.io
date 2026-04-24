'use strict';

t.module('chatBotUi', () => {
  const e = {};

  e.displaySectionOfBrain =
    (brain, sectionLabel, sectionTextElement, optionListElement) => {

    if(sectionLabel === null) {
      // No conversation currently
      sectionTextElement.innerHTML = 'Click to start conversation';
      optionListElement.innerHTML = '';
      return;
    }

    // We're in a conversation
    t.shape('string', sectionLabel);
    t.log('about to render section:', sectionLabel);
    const section = brain[sectionLabel];

    // Display section text
    sectionTextElement.innerHTML =
      encodeTextForHtml(section.text);

    // Display options
    optionListElement.innerHTML = '';
    const options = section.options;
    for(const label in options) {
      const option = options[label];
      const htmlText =
        encodeTextForHtml(option.text);
      optionListElement.innerHTML +=
        `<li data-option-label="${label}">${htmlText}</li>`;
    }
  };

  const encodeTextForHtml = text => {
    // Encodes a string so that it
    // can be safely written to HTML.
    const textArea = document.createElement('textarea');
    textArea.innerText = text;
    return textArea.innerHTML.split('<br>').join('\n');
  };

  return e;
});
