'use strict';
t.module('denseCode_pipe', () => {
  const e = {};

  e.make = initialValue => {
    // Creates a pipe that can be extended
    // by a converter
    const initialFunction = runtimeValue =>
      runtimeValue ?? initialValue;
    const steps = [initialFunction];
    const pipe = converter => converter(steps);
    pipe.steps = steps;
    return pipe;
  };

  e.extend = (steps, extension) => {
    // Used by converters to extend a pipe
    const newSteps = [...steps, extension];
    const newPipe = converter =>
      converter(newSteps);
    newPipe.steps = newSteps;
    return newPipe;
  };

  e.lift = func =>
    // Transforms a regular function into
    // a converter
    steps =>
      extendPipe(steps, func);

  e.run = steps =>
    // A converter that executes a pipe,
    // reducing it to a value
    steps.reduce(
      (result, nextFunction) => nextFunction(result),
      null);

  e.runWith = value =>
    // A function that builds a converter
    // that executes the pipeline with
    // the provided value (overrides the
    // initial value if there is one).
    steps =>
      steps.reduce(
        (result, nextFunction) => nextFunction(result),
        value);

  e.asFunction = pipe =>
    // Converts a pipeline into a function.
    value =>
      pipe(e.runWith(value));
  
  return e;
});
