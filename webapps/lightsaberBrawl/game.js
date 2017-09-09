// Init canvas
var canvas = document.getElementById("game_canvas");
var ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

document.bgColor = "#000000";

ctx.fillRect(0, 0, canvas.width, canvas.height);

// Init animator
var animator =
    window.requestAnimationFrame ||
    window.msRequestAnimationFrame ||
    window.mosRequestAnimationFrame ||
    window.webkitRequestAnimationFrame;




// Image variable
var images = [];




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

var spacebar = false;




// Player skins
var skins = [
    // Blue Jedi
    [
        "#39210e",
        "#100a04",
        "#7b7bff",
        "#0000f4"
    ],
    // Green Jedi
    [
        "#39210e",
        "#100a04",
        "#6bff6b",
        "#008400"
    ],
    // Blue Rebel
    [
        "#231010",
        "#130b0a",
        "#7b7bff",
        "#0000f4"
    ],
    // Green Rebel
    [
        "#231010",
        "#130b0a",
        "#6bff6b",
        "#008400"
    ],
    // Red Sith
    [
        "#0b0b0b",
        "#0f0f0f",
        "#ff7b7b",
        "#f40000"
    ],
    // Yoda
    [
        "#0f2206",
        "#0a0c07",
        "#6bff6b",
        "#008400"
    ],
    // Angel
    [
        "#eeeeee",
        "#2d2d2d",
        "#ffffff",
        "#cccccc"
    ],
    // Red Laser Being
    [
        "#000000",
        "#d30303",
        "#000000",
        "#d30303"
    ],
    // Yellow Laser Being
    [
        "#000000",
        "#acae1e",
        "#000000",
        "#acae1e"
    ],
    // Blue Laser Being
    [
        "#000000",
        "#0000f4",
        "#000000",
        "#0000f4"
    ],
    // White Laser Being
    [
        "#000000",
        "#ffffff",
        "#000000",
        "#ffffff"
    ],
    // Green Laser Being
    [
        "#000000",
        "#31ac01",
        "#000000",
        "#31ac01"
    ],
    [
    // Rose Death
        "#720c5e",
        "#26031f",
        "#f7a0e6",
        "#ed53cf"
    ],
    // Invisiblade
    [
        "#eeeeee",
        "#2d2d2d",
        "#111111",
        "#111111"
    ]
];

var names = [
    "Obi Wan",
    "Sidious",
    "Luke",
    "Yoda"
];

var laserColors = {
    core: "#ff7b7b",
    glow: "#f40000"
};




// Object names
var model;
var Model;

var state;
var PlayingState;
var MenuState;
var GameOverState;

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
    this.skin = 0;

    this.maxSaberLength = 100;
    this.saberLength = this.maxSaberLength;
    this.saberDrawSpeed = 25;

    this.rad = 20; // 20

    this.color = {
        fill: skins[this.skin][0],
        stroke: skins[this.skin][1],
        core: skins[this.skin][2],
        glow: skins[this.skin][3]
    };

    this.waitTimerSet = 50;
    this.waitTimer = 0;

    this.respawnRadSet = 400;
    this.respawnRad = this.respawnRadSet;
    this.respawnSpeed = 20;
    this.respawn = false;

    this.deathRad = 0;
    this.deathSpeed = 10;

    this.kills = 0;
    this.deaths = 0;

    this.dead = false;
}

Player.prototype.drawSaber = function() {
    ctx.save();

    ctx.translate(this.pos.x, this.pos.y);
    ctx.rotate(this.dir * d2r);

    ctx.shadowColor = this.color.glow;
    ctx.shadowBlur = 5;

    ctx.strokeStyle = this.color.core;
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

    ctx.restore();
}

Player.prototype.drawRespawn = function() {
    if(this.respawn) {
        if(this.respawnRad <= this.rad) {
            this.respawn = false;
        }

        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);

        ctx.globalAlpha = this.respawnRad / this.respawnRadSet;
        ctx.lineWidth = this.respawnRad / 8;
        ctx.strokeStyle = "#12d0ed";
        ctx.beginPath();
        ctx.arc(0, 0, this.respawnRad, 0, 360 * d2r);
        ctx.stroke();
        ctx.globalAlpha = 1;

        ctx.restore();

        this.respawnRad -= this.respawnRad / this.respawnSpeed;
    }
}

Player.prototype.kill = function() {
    if(!this.respawn) {
        this.dead = true;
        this.deaths++;
        this.deathRad = 0;
        return true;
    } else {
        return false;
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
                if(enemies[i].kill()) {this.kills++;}
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

Player.prototype.drawDeath = function() {
    ctx.save();
    ctx.translate(this.pos.x, this.pos.y);

    ctx.globalAlpha = 1 / (this.deathRad / 10);
    ctx.lineWidth = this.deathRad / 8;
    ctx.strokeStyle = "#12d0ed";
    ctx.beginPath();
    ctx.arc(0, 0, this.deathRad, 0, 360 * d2r);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.restore();

    this.deathRad += this.deathSpeed;
}

Player.prototype.wait = function() {
    /*ctx.globalAlpha = 0.2;
    this.drawSaber();
    this.drawBody();
    ctx.globalAlpha = 1;*/

    this.drawDeath();

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

Player.prototype.updateSkin = function() {
    this.color = {
        fill: skins[this.skin][0],
        stroke: skins[this.skin][1],
        core: skins[this.skin][2],
        glow: skins[this.skin][3]
    };
}

Player.prototype.setup = function() {
    this.drawSaber();
    this.drawBody();

    var up = key[this.keys].u;
    var left = key[this.keys].l;
    var down = key[this.keys].d;
    var right = key[this.keys].r;

    if(up) {
        key[this.keys].u = false;
        this.skin++;
        this.skin %= skins.length;
        this.updateSkin();
    } else if(down) {
        key[this.keys].d = false;
        this.skin--;
        this.skin += skins.length;
        this.skin %= skins.length;
        this.updateSkin();
    }

    if(left) {
        key[this.keys].l = false;
        state.activated[this.keys] = false;
        this.dead = true;
    }

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
    ctx.shadowColor = laserColors.glow;
    ctx.shadowBlur = 5;

    ctx.strokeStyle = laserColors.core;
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
    model = new Model();

    this.activated = [
        false,
        false,
        false,
        false
    ];

    this.titleImage = images[0];
}

MenuState.prototype.drawBG = function() {
    ctx.fillStyle = "#000000";
    ctx.globalAlpha = 0.5;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
}

MenuState.prototype.drawTitle = function() {
    ctx.drawImage(
        this.titleImage,
        canvas.width / 2 - this.titleImage.naturalWidth / 2,
        canvas.height / 2 - this.titleImage.naturalHeight
    );
}

MenuState.prototype.playerSelect = function() {
    if(key[0].l && !this.activated[0]) {
        key[0].l = false;
        this.activated[0] = true;
        model.players.push(new Player(
            canvas.width * 0.2,
            canvas.height * 0.75,
            270,
            0
        ));
    }
    if(key[1].l && !this.activated[1]) {
        key[1].l = false;
        this.activated[1] = true;
        model.players.push(new Player(
            canvas.width * 0.4,
            canvas.height * 0.75,
            270,
            1
        ));
    }
    if(key[2].l && !this.activated[2]) {
        key[2].l = false;
        this.activated[2] = true;
        model.players.push(new Player(
            canvas.width * 0.6,
            canvas.height * 0.75,
            270,
            2
        ));
    }
    if(key[3].l && !this.activated[3]) {
        key[3].l = false;
        this.activated[3] = true;
        model.players.push(new Player(
            canvas.width * 0.8,
            canvas.height * 0.75,
            270,
            3
        ));
    }

    for(var i = 0; i < model.players.length; i++) {
        if(model.players[i].setup()) {
            model.players.splice(i, 1);
            i--;
        }
    }
}

MenuState.prototype.update = function() {
    this.drawBG();
    this.drawTitle();

    this.playerSelect();

    // Provide Temporary way to start the game
    if(spacebar) {
        state = new PlayingState();
    }
}




// PlayingState
PlayingState = function() {
    var sector = 360 / model.players.length;
    for(var i = 0; i < model.players.length; i++) {
        model.players[i].saberLength = 0;
        model.players[i].respawn = true;
        model.players[i].respawnRad = model.players[i].respawnRadSet;

        var dir = i * sector;
        model.players[i].dir = dir;
        model.players[i].pos.x = canvas.width / 2 + Math.cos(dir * d2r) * 200;
        model.players[i].pos.y = canvas.height / 2 + Math.sin(dir * d2r) * 200;
    }

    this.gameTimerSet = 7200;
    this.gameTimer = this.gameTimerSet;
}

PlayingState.prototype.drawBG = function() {
    //ctx.fillStyle = "#55a351";
    ctx.fillStyle = "#000000";
    ctx.globalAlpha = 0.5;
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

    for(var i = 0; i < model.players.length; i++) {
        model.players[i].drawRespawn();
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

PlayingState.prototype.update = function() {
    this.drawBG();

    this.updateLasers();
    this.updateSoldiers();

    this.updateDeadPlayers();
    this.updatePlayers();

    this.gameTimer--;
    if(this.gameTimer <= 0) {
        state = new GameOverState();
    }
}




// GameOverState
GameOverState = function() {
    // Draw a background
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;

    // Draw Game Over message
    ctx.drawImage(
        images[1],
        canvas.width / 2 - images[1].naturalWidth / 2,
        canvas.height / 3 - images[1].naturalHeight
    );

    // Make all the dead players alive a gain
    for(var i = 0; i < model.deadPlayers.length; i++) {
        model.players.push(model.deadPlayers[i]);
    }

    // Draw the players
    for(var i = 0; i < model.players.length; i++) {
        var x = canvas.width / 5 * (model.players[i].keys + 1);
        var y = canvas.height * 0.60;

        model.players[i].pos.x = x;
        model.players[i].pos.y = y;
        model.players[i].dir = 270;

        model.players[i].saberLength = model.players[i].maxSaberLength;

        model.players[i].drawSaber();
        model.players[i].drawBody();

        ctx.save();
        ctx.translate(x, y);

        var buffer = 100;
        var lineHeight = 20;
        var spacing = 20;
        var left = -20;
        var center = 40;
        var right = 100;

        ctx.fillStyle = "yellow";
        ctx.font = lineHeight + "px Courier New";

        var score = model.players[i].kills * 5;
        score -= model.players[i].deaths;

        ctx.strokeStyle = "yellow";
        ctx.beginPath();
        ctx.moveTo(left - 80, buffer + lineHeight * 2 + spacing * 2);
        ctx.lineTo(right, buffer + lineHeight * 2 + spacing * 2);
        ctx.stroke();

        ctx.textAlign = "right";
        ctx.fillText(
            "Kills:",
            left,
            buffer + lineHeight
        );
        ctx.fillText(
            "- Deaths:",
            left,
            buffer + lineHeight * 2 + spacing
        );
        ctx.fillText(
            "Score:",
            left,
            buffer + lineHeight * 3 + spacing * 3
        );

        ctx.fillText(
            model.players[i].kills,
            center,
            buffer + lineHeight
        );
        ctx.fillText(
            model.players[i].deaths,
            center,
            buffer + lineHeight * 2 + spacing
        );
        ctx.fillText(
            score,
            center,
            buffer + lineHeight * 3 + spacing * 3
        );

        ctx.fillText(
            "x5",
            right,
            buffer + lineHeight
        );
        ctx.fillText(
            "x1",
            right,
            buffer + lineHeight * 2 + spacing
        );

        ctx.restore();
    }
}

GameOverState.prototype.update = function() {
    if(spacebar) {
        spacebar = false;
        state = new MenuState();
    }

    return;
}




// Draw function
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
            key[1].u = val;
            e.preventDefault();
            break;
        case 74:
            key[1].l = val;
            e.preventDefault();
            break;
        case 75:
            key[1].d = val;
            e.preventDefault();
            break;
        case 76:
            key[1].r = val;
            e.preventDefault();
            break;
            //  Arrow
        case 38:
            key[2].u = val;
            e.preventDefault();
            break;
        case 37:
            key[2].l = val;
            e.preventDefault();
            break;
        case 40:
            key[2].d = val;
            e.preventDefault();
            break;
        case 39:
            key[2].r = val;
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
            // Misc.
        case 32:
            spacebar = val
            e.preventDefault();
            break;
    }
}




// Start everything
var imagesLoaded = 0;
function loaded() {
    imagesLoaded++;

    /*var barW = 200;
    var barH = 20;

    ctx.fillStyle = "green";
    ctx.strokeStyle = "gray";
    ctx.lineWidth = 3;

    ctx.fillRect(
        canvas.width / 2 - barW / 2,
        canvas.height / 2 - barH / 2,
        imagesLoaded / images.length * barW,
        barH
    );

    ctx.strokeRect(
        canvas.width / 2 - barW / 2,
        canvas.height / 2 - barH / 2,
        barW,
        barH
    );*/

    if(imagesLoaded === images.length) {
        state = new MenuState();
        draw();
    }
}

images.push(new Image());
images[0].src = "lightsaberBrawlTitle.png";

images.push(new Image());
images[1].src = "gameOverMessage.png";

for(var i = 0; i < images.length; i++) {
    images[i].onload = loaded;
}
