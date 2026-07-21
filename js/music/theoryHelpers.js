'use strict';
t.module('modules/music/theoryHelpers', () => {

  const e = {};

  const A4_FREQUENCY_HZ = 440;

  const noteNames = t.freeze([
    'A' ,'A#','B' ,'C' ,'C#','D' ,
    'D#','E' ,'F' ,'F#','G' ,'G#',
  ]);

  const relativeNoteNames = t.freeze([
    'I'  ,'I#' ,'II' ,'II#','III','IV' ,
    'IV#','V'  ,'V#' ,'VI' ,'VI#','VII',
  ]);

  const noteNameIndex = t.freeze({
    'A': 0,
    'A#': 1,
    'Bb': 1,
    'B': 2,
    'C': 3,
    'C#': 4,
    'Db': 4,
    'D': 5,
    'D#': 6,
    'Eb': 6,
    'E': 7,
    'F': 8,
    'F#': 9,
    'Gb': 9,
    'G': 10,
    'G#': 11,
    'Ab': 11,
    'I': 0,
    'I#': 1,
    'IIb': 1,
    'II': 2,
    'II#': 3,
    'IIIb': 3,
    'III': 4,
    'IV': 5,
    'IV#': 6,
    'Vb': 6,
    'V': 7,
    'V#': 8,
    'VIb': 8,
    'VI': 9,
    'VI#': 10,
    'VIIb': 10,
    'VII': 11,
  });

  const majorScaleOffsets = t.freeze([
    0, 2, 4, 5, 7, 9, 11,
  ]);

  const chordOffsets = t.freeze({
    '': [0, 4, 7],
    'm': [0, 3, 7],
    '7': [0, 4, 7, 10],
    'm7': [0, 3, 7, 10],
    'maj7': [0, 4, 7, 11],
  });

  // Public functions
  
  e.relativeNoteToAbsoluteNote = (relativeNoteName, keyRootNoteName) => {
    const rootNoteIndex = noteNameIndex[keyRootNoteName];
    const relativeNoteIndex = noteNameIndex[relativeNoteName];
    const absoluteNoteIndex = (rootNoteIndex + relativeNoteIndex) % 12;
    return noteNames[absoluteNoteIndex];
  };

  e.parseChordProgression = text =>
    text
      .split(',')
      .map(e.parseChord);

  e.parseChord = text => {
    const match = text.match(/^(?<root>[a-gA-GIV]+)(?<type>.*)$/);
    const { root, type } = match.groups;
    return {
      root,
      type,
    };
  };

  return {
    ...e,
    A4_FREQUENCY_HZ,
    noteNames,
    relativeNoteNames,
    noteNameIndex,
  };
});
