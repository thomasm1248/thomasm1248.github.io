'use strict';
t.module(() => {

  const templateSlots = /\${(?<key>[^}]+)}/g;

  function findSlotsInTemplate(templateString) {
    // Finds slots ( ${<key>} ) in the templateString.
    // Returns a list of objects of the following shape:
    // {
    //   start: <start index of slot>,
    //   end: <end index of slot>,
    //   key: <the key (the stuff within the braces)>,
    // }
    const matches = templateString.matchAll(templateSlots);
    const slots = [];
    matches
      .map(match => ({
        start: match.index,
        end: match.index + match[0].length,
        key: match.groups['key'],
      }))
      .forEach(x => slots.push(x));
    return slots;
  }

  return {
    findSlotsInTemplate,
  };
});
