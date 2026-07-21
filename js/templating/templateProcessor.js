'use strict';
t.module(async () => {
  const utils = await t.requireAsync('js/templating/templatingUtils');

  function process(templateString, fillInDictionary) {
    // Replaces all the template slots found in templateString
    // with their corresponding fill-ins in fillInDictionary.
    // Returns either:
    //   { error: message }
    //   { result: output }
    // 
    // For example:
    //   templateString: "Hello ${foo}!"
    //   fillInDictionary: { foo: 'world' }
    //   return: { result: "Hello world!" }

    // Add keys for 'else' and 'end'
    fillInDictionary = {
      ...fillInDictionary,
      'else': 'else',
      'end': 'end',
    };

    // Search for '${<key>}'
    const slots = utils.findSlotsInTemplate(templateString);

    // Check for undefined keys
    const undefinedKeys = slots
      .map(s => s.key)
      .filter(k => fillInDictionary[k] === null ||
                   fillInDictionary[k] === undefined);
    if (undefinedKeys.length > 0)
      return {
        error: `Undefined keys: '${undefinedKeys.join("', '")}'.`,
      };

    // Perform replacements
    const stack = [];
    let endOfPreviousSlot = 0;
    const outputStrings = [];
    slots.forEach(thisSlot => {
      const currentMode = stack[0];
      const showOutput = stack.indexOf(false) === -1;
      if(showOutput)
          outputStrings.push(templateString.slice(
            endOfPreviousSlot,
            thisSlot.start));

      const value = fillInDictionary[thisSlot.key];
      t.log('value:', value, ' - stack:', stack);
      if(value === true)
        stack.unshift(true);
      else if(value === false)
        stack.unshift(false);
      else if(value === 'else')
        stack[0] = !stack[0];
      else if(value === 'end')
        stack.shift();
      else if(showOutput)
        outputStrings.push(fillInDictionary[thisSlot.key]);
      endOfPreviousSlot = thisSlot.end;
    });
    outputStrings.push(templateString.slice(endOfPreviousSlot));
    return {
      output: outputStrings.join(''),
    };
  }

  return {
    process,
  };
});
