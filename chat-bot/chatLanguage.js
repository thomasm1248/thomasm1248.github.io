'use strict';

t.module('chatLanguage', () => {
  const e = {};

  // Types
  
  const Int = value => {
    if(Math.round(value) !== value)
      throw new Error('value was not an integer');
  };
  const Optional = shape =>
    value => {
      if(value === undefined) return;
      t.shape(shape, value);
    };
  const Dictionary = shape =>
    value => {
      t.shape({}, value);
      for(const key in value)
        t.shape(shape, value[key]);
    };
  const Option = t.freeze({
    text: 'string',
    jumps: ['string'],
  });
  const Section = t.freeze({
    text: 'string',
    interval: Optional('number'), // minutes
    options: Dictionary(Option),
  });
  const Brain = Dictionary(Section);

  // Parsing

  e.parse = (brain, text, textSourceName) => {
    // (brain, text, sourceName) => brain
    // If brain is null, then a new empty brain
    // will be created. Either way, the text will be
    // parsed, and the brain will be updated to contain
    // the declarations in the text.

    // Validation
    if(brain === null)
      // Default brain if none was provided
      brain = {
        'system options': {
          text: 'These options belong to the system,' +
                ' and can only be modified at the' +
                ' start of a module.',
          options: {
            'entry points': {
              text: 'These define the entry points' +
                    ' that new conversations can' +
                    ' start on. One will be chosen' +
                    ' at random.',
              jumps: [],
            },
          },
        },
      };
    t.shape(Brain, brain);
    t.assert(t.mutable(brain), 'brain must be mutable');
    t.shape('string', text);
    t.shape('string', textSourceName);

    // Parse text
    const parsedLines = text
      // Split text into lines
      .split('\n')
      // Trim lines and record line numbers
      .map((l, i) => ({
        text: l.trim(),
        lineNumber: i + 1,
      }))
      // Discard empty lines
      .filter(l => l.text.length > 0)
      // Parse each line
      .map(l => {
        const firstCharacter = l.text[0];
        try {
          switch(firstCharacter) {
            case '~': // Interrupt interval
              {
                const match = l.text.match(/^~(?<amount>\d+)(?<unit>[mhDMY])$/);
                if(match === null)
                  throw new Error('Expected a valid interrupt interval line.');
                const amount = match.groups.amount;
                const unit = match.groups.unit;
                // Convert unit to minutes
                let minutes;
                switch(unit) {
                  case 'm':
                    minutes = amount * 1; // cast as number
                    break;
                  case 'h':
                    minutes = amount * 60;
                    break;
                  case 'D':
                    minutes = amount * 24 * 60;
                    break;
                  case 'M':
                    minutes = amount * 30 * 24 * 60;
                    break;
                  case 'Y':
                    minutes = amount * 365 * 24 * 60;
                    break;
                  default:
                    throw new Error('Unit was not [mhdMy].');
                }
                return {
                  ...l,
                  type: 'interrupt interval',
                  minutes,
                };
              }
            case '.': // Option
              {
                const match = l.text.match(/^\.(?<label>[^\s:]+):(?<text>.*)$/);
                if(match === null)
                  throw new Error('Expected a valid option line.');
                const label = match.groups.label;
                const text = match.groups.text.trim();
                return {
                  ...l,
                  type: 'option',
                  label,
                  text,
                };
              }
            case '-': // Jump
              {
                const match = l.text.match(/^->(?<jump>.+)$/);
                if(match === null)
                  throw new Error('Expected a valid jump line.');
                const jump = match.groups.jump.trim();
                return {
                  ...l,
                  type: 'jump',
                  jump,
                };
              }
            default:  // Section
              {
                const match = l.text.match(/^(?<label>[^\s:]+):(?<text>.*)$/);
                if(match === null)
                  throw new Error('Expected a valid section line.');
                const label = match.groups.label;
                const text = match.groups.text.trim();
                return {
                  ...l,
                  type: 'section',
                  label,
                  text,
                };
              }
          }
        } catch({ message }) {
          return {
            ...l,
            type: 'error',
            message,
          };
        }
      });

    // Begin collecting errors
    const errors = parsedLines.filter(l => l.type === 'error');

    // Gather parsed lines into structured brain format
    let section = brain['system options'];
    let option = section.options['entry points'];
    parsedLines
      .filter(l => l.type !== 'error')
      .forEach(l => {
        switch(l.type) {
          case 'section':
            if(brain[l.label] === undefined) {
              const newSection = {
                text: l.text,
                options: [],
              };
              brain[l.label] = newSection;
              section = newSection;
              option = null;
              break;
            }
            errors.push({
              ...l,
              message: 'A section with that label is' +
                       ' already defined.',
            });
            break;
          case 'interrupt interval':
            if(option === null &&
               section.interval === undefined) {
              section.interval = l.minutes;
              break;
            }
            errors.push({
              ...l,
              message: 'You can only specify one' +
                       ' interval for a section.',
            });
            break;
          case 'option':
            if(section.options[l.label] === undefined) {
              const newOption = {
                text: l.text,
                jumps: [],
              };
              section.options[l.label] = newOption;
              option = newOption;
              break;
            }
            errors.push({
              ...l,
              message: 'An option can\'t be defined' +
                       ' more than once for a section.',
            });
            break;
          case 'jump':
            if(option !== null) {
              option.jumps.push(l.jump);
              break;
            }
            errors.push({
              ...l,
              message: 'A jump must be defined after' +
                       ' an option.',
            });
            break;
          default:
            t.warn('Parser created invalid data:', l);
            break;
        }
      });

    // Print errors to console
    errors.forEach(e => {
      console.warn(`Error: ${textSourceName}, line ${e.lineNumber}:\n` +
             `  ${e.text}\n` +
             `    "${e.message}"`);
    });

    return brain;
  };

  return e;
});
