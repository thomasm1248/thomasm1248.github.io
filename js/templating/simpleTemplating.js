'use strict';
t.module(() => {

  // Public functions

  function replace(target, value, string) {
    return string.replaceAll(target, value);
  }

  function replaceSection({ start, end }, callback, string) {
    const startMatch = string.match(`\n[^\n]*${start}[^\n]\n`);
    if(!startMatch) {
      t.warn(`Could not find start of section ${start}..${end}.`);
      return null;
    }
    const endMatch = string.match(`\n[^\n]*${end}[^\n]\n`);
    if(!endMatch) {
      t.warn(`Could not find end of section ${start}..${end}.`);
      return null;
    }
    const outerStartIndex = startMatch.index;
    const innerStartIndex = startMatch.index + startMatch[0].length;
    const outerEndIndex = endMatch.index + endMatch[0].length;
    const innerEndIndex = endMatch.index;
    const innerString = string.substring(innerStartIndex, innerEndIndex);
    const result = callback(innerString);
    return `${string.substring(0, outerStartIndex)}\n${result}\n${string.substring(outerEndIndex)}`;
  }

  return {
    replace,
    replaceSection,
  };
});
