t.module('asyncUtils', config => {
    const e = {};

    e.delay = ms =>
        new Promise(res => setTimeout(res, ms));
    e.delay.meta = `async ms => Delay for ms milliseconds.`;

    return e;
});
