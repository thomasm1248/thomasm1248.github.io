t.module('functionalUiFramework', config => {
    const e = {};

    // Util

    const Optional = shape =>
        value => {
            if(value === undefined) return;
            t.shape(shape, value);
        };
    const Required = (shape, message) =>
        value => {
            t.assert(value !== undefined, message);
            t.shape(shape);
        };
    const assertImmutable = (value, message) =>
        t.assert(!t.mutable(value), message);

    // Main exports

    e.makeApp = (initialState, viewer, reducer, actor) => {
        t.shape('function', viewer);
        t.shape('function', reducer);
        t.shape('function', actor);

        // Initialization
        let currentState = t.freeze(initialState);
        let viewIsDirty = true;

        // Dispatch
        const dispatch = message => {
            // Update state
            const result = reducer(currentState, t.freeze(message));
            t.shape({
                newState: Required('any'),
                commands: Optional(['any']),
            }, result);
            if(currentState !== result.newState) {
                currentState = t.freeze(result.newState);
                viewIsDirty = true;
            }

            // Execute commands
            if(result.commands !== undefined) {
                result.commands.forEach(command => {
                    actor(t.freeze(command));
                });
            }
        };
        dispatch.meta = 'dispatches a message to the provided reducer';


        // Animation Loop
        const updateView = () => {
            viewer(currentState);
        };
        let timeOfLastAnimationLoop = Date.now();
        const animationLoop = () => {
            window.requestAnimationFrame(animationLoop);
            const currentTime = Date.now();
            const delta = (currentTime - timeOfLastAnimationLoop) / 1000;
            timeOfLastAnimationLoop = currentTime;
            dispatch(t.freeze({ type: 'animation frame', delta }));
            if(!viewIsDirty) return;
            updateView();
            viewIsDirty = false;
        };
        animationLoop();

        return {
            dispatch,
        };
    };
    e.makeApp.meta = {
        desc: `(initialState, reducer, viewer, actor) => { dispatch }
Parameters:
initialState: An immutable value.
reducer: (currentState, message) => { newState, commands: [...] (optional) }
viewer: currentState => undefined
actor: command => Promise (async) | undefined (sync)`,
    };

    return e;
});

