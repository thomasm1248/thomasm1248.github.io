const canvas = document.getElementById('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext('2d');

// Config

const config = t.freeze({
    speed: 20,
    yStep: 30,
    maxNames: 10,
    pauseStart: 2000,
});

// Model

const initialState = t.freeze({
    nextNameIndex: 1,
    names: ['Abbie'],
    yOffset: -config.yStep + .1,
    startTime: Date.now(),
});

// Reducer

const reducer = (state, message) => {
    switch(message.type) {
        case 'animation frame':
            return doAnimationFrame(state, message.delta);
        default:
            t.warn('unknown message type', message);
            return { state };
    }
};

// Viewer

const startXOffsetFromLeft = 50;
const maxNameWidth = 900;
const maxNameHistoryHeight = 250;
const extraCoverAtTop = 50;
const nextNameCoverHeight = config.yStep + 10;
const fadeGradient = ctx.createLinearGradient(
    0, -maxNameHistoryHeight, 0, 0);
fadeGradient.addColorStop(0, '#ffffffff');
fadeGradient.addColorStop(1, '#ffffff00');

const viewer = (viewState, state) => {
    // Background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(startXOffsetFromLeft, canvas.height / 2);

    // Main message
    ctx.fillStyle = 'black';
    ctx.font = '30px Serif';
    ctx.fillText('Happy birthday ', 0, 0);
    const textWidth = ctx.measureText('Happy birthday ').width;

    // Abbie's names
    ctx.save();
    ctx.translate(textWidth + 0, 30 + state.yOffset);
    state.names.forEach(name => {
        ctx.fillText(name, 0, 0);
        ctx.translate(0, config.yStep);
    });
    ctx.restore();

    // Cover up next name
    ctx.fillStyle = 'white';
    ctx.fillRect(195, 2, maxNameWidth, nextNameCoverHeight);

    // Fade old names
    ctx.fillStyle = fadeGradient;
    ctx.fillRect(
        195,
        -maxNameHistoryHeight - extraCoverAtTop,
        maxNameWidth,
        maxNameHistoryHeight + extraCoverAtTop);

    ctx.restore();
};

// Actor

const actor = () => undefined;

// Animation

const distanceToMove = delta => delta * config.speed;

const numberOfNamesRequired = y =>
    Math.floor(-y / config.yStep) + 1;

const newNameNeeded = (oldY, newY) =>
    numberOfNamesRequired(newY) > numberOfNamesRequired(oldY);

const moveYOffsetUp = (yOffset, delta) => {
    const newYOffset = yOffset - distanceToMove(delta)
    const jumpBack = numberOfNamesRequired(newYOffset) > config.maxNames;
    return t.freeze({
        yOffset: jumpBack
            ? newYOffset + config.yStep
            : newYOffset,
        jumpBack,
    });
};

const nextIndex = current =>
    (current + 1) % nameList.length;

const cycleNameList = (currentList, index) => {
    const listWithNewName = [...currentList, nameList[index]];
    const listTooLong = listWithNewName.length > config.maxNames;
    return listTooLong
        ? listWithNewName.slice(1, listWithNewName.length)
        : listWithNewName;
};

const doAnimationFrame = (state, delta) => {
    if(Date.now() - state.startTime < config.pauseStart)
        return { state };
    const { yOffset, jumpBack } = moveYOffsetUp(state.yOffset, delta);
    const getNewName = jumpBack || newNameNeeded(state.yOffset, yOffset);
    return {
        state: t.freeze({
            ...state,
            nextNameIndex: getNewName
                ? nextIndex(state.nextNameIndex)
                : state.nextNameIndex,
            names: getNewName
                ? cycleNameList(state.names, state.nextNameIndex)
                : state.names,
            yOffset,
        }),
    };
};

// Data

const nameList = t.freeze([
    'Abbie',
    "Abbitha",
    "Tabby the Bully",
    "The Dude Monster",
    "Abbitude",
    "'B'tha",
    "Gale",
    'Rock-hard Abbs',
    "Abster",
    "The Couch",
    'Abbiecadabrie',
    "AbbleGabbleBibbleBabbleJiggyReneJackyJeanMayoMuskMoldaBun",
    "Bibblybabblyboo",
    "Tabby",
    "Tabigail",
    "The Witch",
    "Abble Gabble",
    "Tabitha",
    "Abbismal",
    "Tabulligail",
    "Abbiebabbie",
    "Abbidale",
    "HOT ABBS",
    'Abble Pie',
    'Abb',
    'Abble Juice',
]);

// Run App (replace with library)

let currentState = initialState;
let viewIsDirty = true;

const dispatch = message => {
    const { state } = reducer(currentState, message);
    if(state != currentState) {
        currentState = state;
        viewIsDirty = true;
    }
};

let timeOfLastAnimationFrame = Date.now();

const animationLoop = () => {
    window.requestAnimationFrame(animationLoop);
    const currentTime = Date.now();
    const delta = (currentTime - timeOfLastAnimationFrame) / 1000;
    timeOfLastAnimationFrame = currentTime;
    dispatch(t.freeze({ type: 'animation frame', delta }));
    if(viewIsDirty) {
        viewIsDirty = false;
        viewer(undefined, currentState);
    }
};
animationLoop();
