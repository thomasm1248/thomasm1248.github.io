'use strict';
t.module(async () => {
  const utils = await t.requireAsync('js/templating/templatingUtils');
  const processor = await t.requireAsync('js/templating/templateProcessor');

  const key2Id = (key, prefix) => prefix + key.replace(' ', '_');
  const id2Key = (id, prefix) => id.slice(prefix.length).replace('_', ' ');
  const getUniqueKeysOfTemplate = template => {
    // Find all the keys in the template
    const keys = utils.findSlotsInTemplate(template)
      .map(slot => slot.key)
      .filter(key => key !== 'else' &&
                     key !== 'end');

    // Keep only the unique keys
    const uniqueKeysSet = {};
    keys
      .forEach(key =>
        uniqueKeysSet[key] = true)

    return uniqueKeysSet;
  };

  function buildUi(uniqueIdPrefix = '') {
    // Create the elements
    const templateInput = document.createElement('textarea');
    const form = document.createElement('div');
    const output = document.createElement('textarea');

    // Make textareas bigger
    templateInput.style.width = 300;
    templateInput.style.height = 300;
    output.style.width = 300;
    output.style.height = 300;

    // When the template changes, change the form
    templateInput.oninput = () => {
      // Create hashset of keys in template
      const uniqueKeys = getUniqueKeysOfTemplate(templateInput.value);

      // Goal: each key has a matching form input element
      
      // Delete form elements that don't have a key
      const inputsWeAlreadyHave = {};
      const boxesToRemove = [];
      for(const box of form.children) {
        const label = box.firstChild;
        const input = box.lastChild;

        const key = id2Key(input.id, uniqueIdPrefix);
        if(!uniqueKeys[key])
          boxesToRemove.push(box);
        else
          inputsWeAlreadyHave[key] = true;
      }
      for(const box of boxesToRemove)
        form.removeChild(box);

      // Add form elements for every new key
      for(const key in uniqueKeys) {
        if(inputsWeAlreadyHave[key]) continue;

        // Create a box to contains a label and input
        const box = document.createElement('div');

        // Create a label
        const label = document.createElement('label');
        label.innerText = key;
        box.appendChild(label);

        // Create the input element itself
        let inputElement
        if(key.startsWith('if ')) {
          inputElement = document.createElement('input');
          inputElement.type = 'checkbox';
        } else {
          const breakTag = document.createElement('br');
          box.appendChild(breakTag);
          inputElement = document.createElement('textarea');
        }
        inputElement.id = key2Id(key, uniqueIdPrefix);
        box.appendChild(inputElement);
        
        // Put the box with its children into the form
        form.appendChild(box);
      }
    };

    // When the form changes, change the output
    form.oninput = (e) => {
      // Create hashset of keys in template
      const uniqueKeys = getUniqueKeysOfTemplate(templateInput.value);

      // Get all the values from the form
      const dictionary = {};
      for(const key in uniqueKeys) {
        const input = document.getElementById(
          key2Id(key, uniqueIdPrefix));
        if(input.type === 'checkbox')
          dictionary[key] = input.checked;
        else
          dictionary[key] = input.value;
      }

      // Process the template using the values
      const result = processor.process(templateInput.value, dictionary);
      if(result.error)
        output.value = result.error;
      else
        output.value = result.output;
    };

    // Return the elements
    return {
      templateInput,
      form,
      output,
    };
  }

  return {
    buildUi,
  };
});
