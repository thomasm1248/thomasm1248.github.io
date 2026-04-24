'use strict';

t.module('conversationCore', () => {
  const e = {};

  e.startConversation = brain => {
    // brain => sectionLabel
    // Chooses a section to start with and returns it.
    t.shape({
      'system options': {
        options: {
          'entry points': {
            jumps: ['string'],
          },
        },
      },
    },
    brain);

    const entryPointLabels =
      brain['system options'].options['entry points'].jumps;
    t.assert(entryPointLabels.length > 0, 'there are no entry points');

    const randomIndex = Math.floor(
      Math.random() * entryPointLabels.length);
    return entryPointLabels[randomIndex];
  };

  e.jump = (brain, currentSection, option) => {
    // (brain, currentSectionLabel, optionLabel)
    //  => { type: 'error|url|section|done', message|url|label: 'string' }
    // Jumps to a random section pointed to by the chosen option.
    
    // Get list of jumps
    const jumpLabels =
      brain[currentSection]?.options[option].jumps;
    t.assert(
      jumpLabels !== undefined,
      `invalid section provided: ${currentSection}`);
    if(jumpLabels === undefined ||
       jumpLabels.length === 0) {
      return {
        type: 'section',
        label: null,
      };
    }

    // Choose random jump
    const randomIndex = Math.floor(
      Math.random() * jumpLabels.length);
    const chosenJump = jumpLabels[randomIndex];

    // What kind of jump?
    const match = chosenJump.match(/^[a-z]+:.*$/);
    if(match !== null) {
      // URL
      return {
        type: 'url',
        url: chosenJump,
        newTab: chosenJump.startsWith('http'),
      };
    } else {
      // Section
      return {
        type: 'section',
        label: chosenJump,
      };
    }
  };

  e.checkForInterrupts = (brain, passedMS) => {
    // (interrupts, passedMS) => label | null
    // Checks if one of the interrupts happened during the passed ms.
    t.shape('object', brain);
    t.shape('number', passedMS);

    // Randomly choose sections based on interval
    const interruptsThatHappened = [];
    for(const label in brain) {
      const section = brain[label];
      if(section.interval === undefined)
        continue;
      const interruptIntervalMS = section.interval * 60000;
      const probability = passedMS / interruptIntervalMS;
      const happened = Math.random() < probability;
      if(happened) {
        t.log('interrupt:', label);
        interruptsThatHappened.push({
          label,
          interval: section.interval,
        });
      }
    }

    // If more than one was triggered, choose
    // the one with the largest interval
    // (since it happens less often)
    const prioritizedInterrupts = interruptsThatHappened
      .sort((a, b) => a.interval > b.interval);
    if(prioritizedInterrupts.length === 0)
      return null;
    else
      return interruptsThatHappened[0].label;
  }

  return e;
});
