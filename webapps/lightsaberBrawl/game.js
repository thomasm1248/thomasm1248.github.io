// Init canvas
var canvas = document.getElementById("game_canvas");
var ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

document.bgColor = "#000000";

// Init animator
var animator =
    window.requestAnimationFrame ||
    window.msRequestAnimationFrame ||
    window.mosRequestAnimationFrame ||
    window.webkitRequestAnimationFrame;




// Event variables
var key = [
    {
        u: false,
        l: false,
        d: false,
        r: false
    },
    {
        u: false,
        l: false,
        d: false,
        r: false
    },
    {
        u: false,
        l: false,
        d: false,
        r: false
    },
    {
        u: false,
        l: false,
        d: false,
        r: false
    }
];




// Player colors
var colors = [
    // Blue Jedi
    [
        "#39210e",
        "#100a04",
        "#7b7bff",
        "#0000f4"
    ],
    // Red Sith
    [
        "#0b0b0b",
        "#0f0f0f",
        "#ff7b7b",
        "#f40000"
    ],
    // Green Jedi
    [
        "#39210e",
        "#100a04",
        "#6bff6b",
        "#008400"
    ],
    // Yoda
    [
        "#0f2206",
        "#0a0c07",
        "#6bff6b",
        "#008400"
    ]
];

var names = [
    "Obi Wan",
    "Sidious",
    "Luke",
    "Yoda"
];




// Object names
var model;
var Model;

var state;
var PlayingState;
var MenuState;

var Player;
var Soldier;
var Laser;




// Various variables
var d2r = Math.PI / 180;
var r2d = 180 / Math.PI;




// Util functions

function getDist(x1, y1, x2, y2) {
    var dx = x2 - x1;
    var dy = y2 - y1;

    return Math.sqrt(dx * dx + dy * dy);
}

function getDir(x1, y1, x2, y2) {
    var x = x2 - x1;
    var y = y2 - y1;

    var dir = Math.atan2(y, x) * r2d;

    if(dir < 0) {
        dir += 360;
    }

    return dir;
}

function redCircle(x, y) {
    ctx.strokeStyle = "red";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, 360 * d2r);
    ctx.stroke();
}

function line(a, b, c, d) {
    ctx.strokeStyle = "red";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(a, b);
    ctx.lineTo(c, d);
    ctx.stroke();
}

function polish(dir) {
    while(dir < 0) {
        dir += 360;
    }

    return dir %= 360;
}

function dot(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y;
}




// Player
Player = function(x, y, dir, keys) {
    this.pos = {
        x: x,
        y: y
    };

    this.vel = {
        x: 0,
        y: 0
    };

    this.speed = 7;
    this.accel = 0.2;
    this.turnSpeed = 6;
    this.turnAccel = 7;
    this.turnVel = 0;

    this.dir = dir;

    this.keys = keys;

    this.maxSaberLength = 100;
    this.saberLength = 0;
    this.saberDrawSpeed = 25;

    this.rad = 20; // 20

    this.color = {
        fill: colors[this.keys][0],
        stroke: colors[this.keys][1],
        core: colors[this.keys][2],
        glow: colors[this.keys][3]
    };

    this.waitTimerSet = 50;
    this.waitTimer = 0;

    this.respawnRadSet = 400;
    this.respawnRad = this.respawnRadSet;
    this.respawnSpeed = 20;
    this.respawn = true;

    this.kills = 0;

    this.dead = false;
}

Player.prototype.drawSaber = function() {
    var core = this.color.core;
    var glow = this.color.glow;

    ctx.save();

    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.dir * d2r);

    ctx.shadowColor = glow;
    ctx.shadowBlur = 5;

    ctx.strokeStyle = core;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 0);
    ctx.lineTo(this.saberLength, 0);
    ctx.stroke();

    ctx.shadowColor = "transparent";

    ctx.restore();
}

Player.prototype.drawBody = function() {
    ctx.save();

    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.dir * d2r);

    ctx.fillStyle = this.color.fill;
    ctx.strokeStyle = this.color.stroke;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, this.rad, 0, 360 * d2r);
    ctx.fill();
    ctx.stroke();

    if(this.respawn) {
        if(this.respawnRad <= this.rad) {
            this.respawn = false;
        }

        ctx.globalAlpha = this.respawnRad / this.respawnRadSet;
        ctx.lineWidth = this.respawnRad / 8;
        ctx.strokeStyle = "#12d0ed";
        ctx.beginPath();
        ctx.arc(0, 0, this.respawnRad, 0, 360 * d2r);
        ctx.stroke();
        ctx.globalAlpha = 1;

        this.respawnRad -= this.respawnRad / this.respawnSpeed;
    }

    ctx.restore();
}

Player.prototype.kill = function() {
    if(!this.respawn) {
        this.dead = true;
    }
}

Player.prototype.checkSaberEnemyCols = function(enemies) {
    //  Get cords. of saber tip
    var x = this.pos.x + Math.cos(this.dir * d2r) * this.saberLength;
    var y = this.pos.y + Math.sin(this.dir * d2r) * this.saberLength;

    //  Get stepX and stepY
    var step = 10;
    var stepX = (this.pos.x - x) / this.saberLength * step;
    var stepY = (this.pos.y - y) / this.saberLength * step;

    //  Ray cast until (x, y) reaches this.pos
    while(getDist(x, y, this.pos.x, this.pos.y) > this.rad) {
        for(var i = 0; i < enemies.length; i++) {
            if(
                getDist(
                    x,
                    y,
                    enemies[i].pos.x,
                    enemies[i].pos.y
                ) <
                enemies[i].rad
            ) {
                enemies[i].kill();
            }
        }

        for(var i = 0; i < model.soldiers.length; i++) {
            if(
                getDist(
                    x,
                    y,
                    model.soldiers[i].pos.x,
                    model.soldiers[i].pos.y
                ) < model.soldiers[i].rad) {
                model.soldiers[i].kill();
            }
        }

        x += stepX;
        y += stepY;
    }
}

Player.prototype.checkPlayerEnemyCols = function(enemies) {
    for(var i = 0; i < enemies.length; i++) {
        var dist = getDist(
            this.pos.x,
            this.pos.y,
            enemies[i].pos.x,
            enemies[i].pos.y
        );

        var totalRads = this.rad + enemies[i].rad;

        if(dist <= totalRads) {
            var dir = getDir(
                enemies[i].pos.x,
                enemies[i].pos.y,
                this.pos.x,
                this.pos.y
            );

            var dif = totalRads - dist;

            this.pos.x += Math.cos(dir * d2r) * dif;
            this.pos.y += Math.sin(dir * d2r) * dif;
        }
    }

    for(var i = 0; i < model.soldiers.length; i++) {
        var dist = getDist(
            this.pos.x,
            this.pos.y,
            model.soldiers[i].pos.x,
            model.soldiers[i].pos.y
        );

        var totalRads = this.rad + model.soldiers[i].rad;

        if(dist <= totalRads) {
            var dir = getDir(
                model.soldiers[i].pos.x,
                model.soldiers[i].pos.y,
                this.pos.x,
                this.pos.y
            );

            var dif = totalRads - dist;

            this.pos.x += Math.cos(dir * d2r) * dif;
            this.pos.y += Math.sin(dir * d2r) * dif;
        }
    }
}

Player.prototype.checkEnemies = function() {
    //  Get a list of enemies
    var enemies = []
    for(var i = 0; i < model.players.length; i++) {
        if(model.players[i].keys != this.keys) {
            enemies.push(model.players[i]);
        }
    }

    //  Remove enemies that are too far away
    for(var i = 0; i < enemies.length; i++) {
        if(
            getDist(
                this.pos.x,
                this.pos.y,
                enemies[i].pos.x,
                enemies[i].pos.y
            ) > this.saberLength + enemies[i].saberLength
        ) {
            enemies.splice(i, 1);
            i--;
        }
    }

    //  Check for player to enemy cols.
    this.checkPlayerEnemyCols(enemies);

    //  Check for saber cols. with enemies
    this.checkSaberEnemyCols(enemies);
}

Player.prototype.updatePos = function() {
    this.pos.x += this.vel.x;
    this.pos.y += this.vel.y;
}

Player.prototype.move = function() {
    //  Move forward/backward
    var xv = 0, yv = 0;

    // Compute forward vector
    xv += Math.cos(this.dir * d2r) * this.speed;
    yv += Math.sin(this.dir * d2r) * this.speed;

    // Get difference between momentum and forward vector
    var diffX = xv - this.vel.x;
    var diffY = yv - this.vel.y;
    var dist = getDist(xv, yv, this.vel.x, this.vel.y);

    // Make momentum more like forward vector
    if(dist < this.accel) {
        this.vel.x = xv;
        this.vel.y = yv;
    } else {
        this.vel.x += diffX / dist * this.accel;
        this.vel.y += diffY / dist * this.accel;
    }

    // Add momentum to position
    this.updatePos();

    //  Keep from moving off the arena
    if(this.pos.x < this.rad) {
        // Bounce off left
        this.pos.x = this.rad;
        this.vel.x *= -0.5;
    }

    if(this.pos.x > canvas.width - this.rad) {
        // Bounce off right
        this.pos.x = canvas.width - this.rad;
        this.vel.x *= -0.5;
    }

    if(this.pos.y < this.rad) {
        // Bounce off top
        this.pos.y = this.rad;
        this.vel.y *= -0.5;
    }

    if(this.pos.y > canvas.height - this.rad) {
        // Bounce off bottom
        this.pos.y = canvas.height - this.rad;
        this.vel.y *= -0.5;
    }

    //  Rotate
    var dir = 0;
    if(key[this.keys].r) {
        dir += this.turnSpeed;
    }

    if(key[this.keys].l) {
        dir -= this.turnSpeed;
    }

    var dif = dir - this.turnVel;
    dif /= this.turnAccel;
    this.turnVel += dif;
    this.dir += this.turnVel;
}

Player.prototype.wait = function() {
    /*ctx.globalAlpha = 0.2;
    this.drawSaber();
    this.drawBody();
    ctx.globalAlpha = 1;*/

    if(this.waitTimer < 0) {
        var x = Math.random() * (canvas.width - 200) + 100;
        var y = Math.random() * (canvas.height - 200) + 100;

        this.dead = false;
        for(var i = 0; i < model.players.length; i++) {
            if(
                getDist(
                    x,
                    y,
                    model.players[i].pos.x,
                    model.players[i].pos.y
                ) < this.saberLength * 2 + model.players[i].saberLength * 2
            ) {
                this.dead = true;
                break;
            }
        }

        if(!this.dead) {
            this.pos.x = x;
            this.pos.y = y;
            this.dir = Math.random() * 360;
            this.vel.x = 0;
            this.vel.y = 0;
            this.saberLength = 0;
            this.respawn = true;
            this.respawnRad = this.respawnRadSet;
        }
    }

    this.waitTimer--;

    return this.dead;
}

Player.prototype.update = function() {
    if(this.maxSaberLength - this.saberLength < 0.1) {
        this.saberLength = this.maxSaberLength;
    } else {
        var diff = this.maxSaberLength - this.saberLength;
        diff /= this.saberDrawSpeed;
        this.saberLength += diff;
    }

    this.checkEnemies();
        
    this.move();

    if(this.dead) {
        this.waitTimer = this.waitTimerSet;
    }
    return this.dead;
}




// Soldier
Soldier = function(x, y) {
    this.pos = {
        x: x,
        y: y
    };

    this.vel = {
        x: 0,
        y: 0
    };

    this.speed = 4;
    this.accel = 0.2;
    this.goal = {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height
    };
    this.goalTimerSet = 10;
    this.goalTimer = this.goalTimerSet;

    this.rad = 20;

    this.state = "move";
    this.toStateMove = 0.01;
    this.toStateShoot = 0.05;

    this.shootFreq = 0.03;

    this.dead = false;
}

Soldier.prototype.draw = function() {
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);

    ctx.fillStyle = "#dddddd";
    ctx.strokeStyle = "#555555";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, this.rad, 0, 360 * Math.PI);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
}

Soldier.prototype.newGoal = function() {
    this.goal.x += Math.random() * 600 - 300;
    this.goal.y += Math.random() * 600 - 300;

    if(this.goal.x < 0) {
        this.goal.x = 0;
    }

    if(this.goal.x > canvas.width) {
        this.goal.x = canvas.width;
    }

    if(this.goal.y < 0) {
        this.goal.y = 0;
    }

    if(this.goal.y > canvas.height) {
        this.goal.y = canvas.height;
    }

    this.goalTimer = this.goalTimerSet;
}

Soldier.prototype.updatePos = function() {
    this.pos.x += this.vel.x;
    this.pos.y += this.vel.y;
}

Soldier.prototype.move = function() {
    if(this.goalTimer < 0) {
        this.newGoal();
    }

    var dirToGoal = getDir(this.pos.x, this.pos.y, this.goal.x, this.goal.y);
    var steer = {
        x: Math.cos(dirToGoal * d2r) * this.speed,
        y: Math.sin(dirToGoal * d2r) * this.speed
    };

    // Don't go anywhere if in state shoot
    if(this.state === "shoot") {
        steer.x = 0;
        steer.y = 0;
    }

    var dist = getDist(this.vel.x, this.vel.y, steer.x, steer.y);
    var diff = {
        x: steer.x - this.vel.x,
        y: steer.y - this.vel.y
    };

    if(dist > 0) {
        this.vel.x += diff.x / dist * this.accel;
        this.vel.y += diff.y / dist * this.accel;
    }

    this.updatePos();

    this.goalTimer--;
}

Soldier.prototype.checkSoldierPlayerCols = function() {
    for(var i = 0; i < model.players.length; i++) {
        var dist = getDist(
            this.pos.x,
            this.pos.y,
            model.players[i].pos.x,
            model.players[i].pos.y
        );

        var totalRads = this.rad + model.players[i].rad;

        if(dist <= totalRads) {
            var dir = getDir(
                model.players[i].pos.x,
                model.players[i].pos.y,
                this.pos.x,
                this.pos.y
            );

            var dif = totalRads - dist;

            this.pos.x += Math.cos(dir * d2r) * dif;
            this.pos.y += Math.sin(dir * d2r) * dif;
        }
    }

    for(var i = 0; i < model.soldiers.length; i++) {
        if(model.soldiers[i].pos.x === this.pos.x) {
            continue;
        }

        var dist = getDist(
            this.pos.x,
            this.pos.y,
            model.soldiers[i].pos.x,
            model.soldiers[i].pos.y
        );

        var totalRads = this.rad + model.soldiers[i].rad;

        if(dist <= totalRads) {
            var dir = getDir(
                model.soldiers[i].pos.x,
                model.soldiers[i].pos.y,
                this.pos.x,
                this.pos.y
            );

            var dif = totalRads - dist;

            this.pos.x += Math.cos(dir * d2r) * dif;
            this.pos.y += Math.sin(dir * d2r) * dif;
        }
    }
}

Soldier.prototype.kill = function() {
    this.dead = true;
}

Soldier.prototype.shoot = function() {
    if(Math.random() <= this.shootFreq) {
        model.lasers.push(new Laser(
            this.pos.x,
            this.pos.y,
            Math.random() * 360
        ));
    }
}

Soldier.prototype.update = function() {
    if(this.state === "shoot") {
        this.shoot();
    }
    this.move();

    if(this.state === "shoot" && Math.random() <= this.toStateMove) {
        this.state = "move";
    }

    if(this.state === "move" && Math.random() <= this.toStateShoot) {
        this.state = "shoot";
    }

    this.draw();

    return this.dead;
}




// Laser
Laser = function(x, y, dir) {
    this.pos = {
        x: x,
        y: y
    };

    this.ppos = [];

    this.dir = dir;

    this.defaultSpeed = 3;
    this.speed = this.defaultSpeed;

    this.used = false;
}

Laser.prototype.draw = function() {
    ctx.shadowColor = colors[1][3];
    ctx.shadowBlur = 5;

    ctx.strokeStyle = colors[1][2];
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(this.pos.x, this.pos.y);
    for(var i = 0; i < this.ppos.length; i++) {
        ctx.lineTo(this.ppos[i].x, this.ppos[i].y);
    }
    ctx.stroke();

    ctx.shadowColor = "transparent";
}

Laser.prototype.checkWalls = function() {
    if(this.pos.x < -20) {
        this.used = true;
    }

    if(this.pos.x > canvas.width + 20) {
        this.used = true;
    }

    if(this.pos.y < -20) {
        this.used = true;
    }

    if(this.pos.y > canvas.height + 20) {
        this.used = true;
    }
}

Laser.prototype.checkCols = function() {
    this.checkWalls();

    this.enemies = [];
    for(var i = 0; i < model.players.length; i++) {
        var dist = getDist(
            this.pos.x,
            this.pos.y,
            model.players[i].pos.x,
            model.players[i].pos.y
        );
        var pDist = getDist(
            this.ppos[0].x,
            this.ppos[0].y,
            model.players[i].pos.x,
            model.players[i].pos.y
        );
        if(dist < model.players[i].rad && pDist > model.players[i].rad) {
            model.players[i].kill();
            this.used = true;
        } else if(dist < model.players[i].saberLength) {
            var x = model.players[i].pos.x;
            var y = model.players[i].pos.y;

            x += Math.cos(model.players[i].dir * d2r) * model.players[i].saberLength;
            y += Math.sin(model.players[i].dir * d2r) * model.players[i].saberLength;

            var dir = model.players[i].dir + 180;

            var px = model.players[i].pos.x;
            var py = model.players[i].pos.y;

            var stepSize = this.speed;
            var stepX = Math.cos(dir * d2r) * stepSize;
            var stepY = Math.sin(dir * d2r) * stepSize;

            while(getDist(x, y, px, py) > model.players[i].rad) {
                if(getDist(x, y, this.pos.x, this.pos.y) < this.speed + 7) {
                    this.dir = model.players[i].dir;
                    this.speed = 10;
                    break;
                }

                x += stepX;
                y += stepY;
            }
        }
    }

    for(var i = 0; i < model.soldiers.length; i++) {
        var dist = getDist(
            this.pos.x,
            this.pos.y,
            model.soldiers[i].pos.x,
            model.soldiers[i].pos.y
        );

        var pDist = getDist(
            this.ppos[0].x,
            this.ppos[0].y,
            model.soldiers[i].pos.x,
            model.soldiers[i].pos.y
        );

        if(dist < model.soldiers[i].rad && pDist > model.soldiers[i].rad) {
            model.soldiers[i].kill();
            this.used = true;
        }
    }
}

Laser.prototype.shift = function() {
    this.ppos.push({
        x: this.pos.x,
        y: this.pos.y
    });

    if(this.ppos.length > 5) {
        this.ppos.splice(0, 1);
    }
}

Laser.prototype.move = function() {
    this.shift();

    this.pos.x += Math.cos(this.dir * d2r) * this.speed;
    this.pos.y += Math.sin(this.dir * d2r) * this.speed;
}

Laser.prototype.update = function() {
    this.move();
    this.speed = this.defaultSpeed;
    this.checkCols();
    this.draw();

    return this.used;
}




// Model
Model = function() {
    this.players = [];
    this.deadPlayers = [];
    this.soldiers = [];
    this.lasers = [];
}




// MenuState
MenuState = function() {
}

MenuState.prototype.drawBG = function() {
    ctx.fillStyle = "#000000";
    ctx.globalAlpha = 0.2;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
}

MenuState.prototype.update = function() {
    this.drawBG();
}




// PlayingState
PlayingState = function() {
    // Reset the model
    model = new Model();

    // Add four new Players to the model
    model.players.push(new Player(
        canvas.width / 2 - 200,
        canvas.height / 2,
        180,
        0
    ));
    model.players.push(new Player(
        canvas.width / 2 + 200,
        canvas.height / 2,
        0,
        1
    ));
    model.players.push(new Player(
        canvas.width / 2,
        canvas.height / 2 + 200,
        90,
        2
    ));
    model.players.push(new Player(
        canvas.width / 2,
        canvas.height / 2 - 200,
        270,
        3
    ));
}

PlayingState.prototype.drawBG = function() {
    //ctx.fillStyle = "#55a351";
    ctx.fillStyle = "#000000";
    ctx.globalAlpha = 0.2;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
}

PlayingState.prototype.updatePlayers = function() {
    //model.players[0].speed = 14;
    //model.players[0].accel = 0.4;
    //model.players[0].accel = 0.8;
    for(var i = 0; i < model.players.length; i++) {
        if(model.players[i].update()) {
            model.deadPlayers.push(model.players[i]);
            model.players.splice(i, 1);
            i--;
        }
    }

    for(var i = 0; i < model.players.length; i++) {
        model.players[i].drawSaber();
    }

    for(var i = 0; i < model.players.length; i++) {
        model.players[i].drawBody();
    }
}

PlayingState.prototype.updateDeadPlayers = function() {
    for(var i = 0; i < model.deadPlayers.length; i++) {
        if(!model.deadPlayers[i].wait()) {
            model.players.push(model.deadPlayers[i]);
            model.deadPlayers.splice(i, 1);
            i--;
        }
    }
}

PlayingState.prototype.updateSoldiers = function() {
    for(var i = 0; i < model.soldiers.length; i++) {
        if(model.soldiers[i].update()) {
            model.soldiers.splice(i, 1);
            i--;
        }
    }

    if(model.soldiers.length < 10) {
        var x = Math.random() * (canvas.width + 200) - 100;
        var y = Math.random() * (canvas.height + 200) - 100;

        if((x < 0 || x > canvas.width) && (y < 0 || y > canvas.height)) {
            model.soldiers.push(new Soldier(x, y));
        }
    }
}

PlayingState.prototype.updateLasers = function() {
    for(var i = 0; i < model.lasers.length; i++) {
        if(model.lasers[i].update()) {
            model.lasers.splice(i, 1);
            i--;
        }
    }
}

PlayingState.prototype.drawScoreBoard = function() {
    var scoresTemp = [];
    for(var i in model.players) {
        scoresTemp.push([
            names[model.players[i].keys],
            model.players[i].kills,
            false,
            model.players[i].hasLongSaber,
            model.players[i].speed > model.players[i].defaultSpeed
        ]);
    }
    for(var i in model.deadPlayers) {
        scoresTemp.push([
            names[model.deadPlayers[i].keys],
            model.deadPlayers[i].kills,
            true,
            model.players[i].hasLongSaber,
            false
        ]);
    }

    var scores = [];
    while(scoresTemp.length > 0) {
        var champ = 0;
        var champI = 0;
        for(var i in scoresTemp) {
            if(scoresTemp[i][1] > champ) {
                champ = scoresTemp[i][1];
                champI = i;
            }
        }
        scores.push(scoresTemp[champI]);
        scoresTemp.splice(champI, 1);
    }

    var width = 200;
    var height = 250;
    var margin = 20;

    ctx.save();
    ctx.translate(canvas.width - width - margin, margin);

    ctx.globalAlpha = 0.5;

    ctx.fillStyle = "#333333";
    ctx.strokeStyle = "#666666";
    ctx.lineWidth = 5;
    ctx.lineJoin = "round";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeRect(0, 0, width, height);

    ctx.fillStyle = "white";
    ctx.fontStyle = "normal";
    ctx.font = "30px Comic Sans MS";
    ctx.fillText("Score Board", 10, 40);

    ctx.font = "20px Comic Sans MS";
    var text = "";
    for(var i in scores) {
        text = scores[i][0];
        text += " ~ ";
        text += scores[i][1];
        if(scores[i][4]) {
            ctx.fillStyle = "green";
        } else {
            ctx.fillStyle = "white";
        }
        if(scores[i][3]) {
            ctx.shadowBlur = 5;
            ctx.shadowColor = "white";
        } else {
            ctx.shadowColor = "transparent";
        }
        if(scores[i][2]) {
            ctx.globalAlpha = 0.3;
        } else {
            ctx.globalAlpha = 0.5;
        }
        ctx.fillText(text, 15, i * 30 + 100);
    }

    ctx.shadowColor = "transparent";
    ctx.globalAlpha = 1;

    ctx.restore();
}

PlayingState.prototype.update = function() {
    this.drawBG();

    this.updateLasers();
    this.updateSoldiers();

    this.updateDeadPlayers();
    this.updatePlayers();

    //this.drawScoreBoard();
}





// Draw function

state = new PlayingState();

function draw() {
    animator(draw);

    state.update();
}




// Event handlers

window.addEventListener("keydown", keyHandler, false);
window.addEventListener("keyup", keyHandler, false);
function keyHandler(e) {
    var val = e.type === "keydown";

    switch(e.keyCode) {
        //  WASD
        case 87:
            key[0].u = val;
            e.preventDefault();
            break;
        case 65:
            key[0].l = val;
            e.preventDefault();
            break;
        case 83:
            key[0].d = val;
            e.preventDefault();
            break;
        case 68:
            key[0].r = val;
            e.preventDefault();
            break;
            //  IJKL
        case 73:
            key[2].u = val;
            e.preventDefault();
            break;
        case 74:
            key[2].l = val;
            e.preventDefault();
            break;
        case 75:
            key[2].d = val;
            e.preventDefault();
            break;
        case 76:
            key[2].r = val;
            e.preventDefault();
            break;
            //  Arrow
        case 38:
            key[1].u = val;
            e.preventDefault();
            break;
        case 37:
            key[1].l = val;
            e.preventDefault();
            break;
        case 40:
            key[1].d = val;
            e.preventDefault();
            break;
        case 39:
            key[1].r = val;
            e.preventDefault();
            break;
            //  Num pad
        case 56:
            key[3].u = val;
            e.preventDefault();
            break;
        case 52:
            key[3].l = val;
            e.preventDefault();
            break;
        case 53:
            key[3].d = val;
            e.preventDefault();
            break;
        case 54:
            key[3].r = val;
            e.preventDefault();
            break;
    }
}




// Start everything
draw();
