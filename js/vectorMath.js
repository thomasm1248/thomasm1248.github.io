t.module('vectorMath', config => {
    const e = {};

    const Vector = t.freeze({
        x: 'number',
        y: 'number',
    });

    e.vector = (x, y) => {
        return t.freeze(t.shape(Vector, {
            x,
            y,
        }));
    };
    e.vector.meta = `Creates a vector.`;

    e.add = (a, b) => {
        t.shape(Vector, a);
        t.shape(Vector, b);
        return t.freeze({
            x: a.x + b.x,
            y: a.y + b.y,
        });
    };
    e.add.meta = `Adds two vectors together and returns result.`;

    e.subtract = (a, b) => {
        t.shape(Vector, a);
        t.shape(Vector, b);
        return t.freeze({
            x: a.x - b.x,
            y: a.y - b.y,
        });
    };
    e.subtract.meta = `Subtracts two vectors together and returns result.`;

    return e;
});
