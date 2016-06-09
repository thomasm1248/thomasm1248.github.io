var bitSpawnRate = 10;
var canvas;
var ctx;
var animator;

var numPlayers = 4;

// Keys for controling the character's position.

var key = [];
for(var i = 0; i < numPlayers; i++) {
    key.push(
        {
            u: false,
            l: false,
            r: false
        }
    );
}

// Multipliers for conversion between radians and degrees.
var d2r = Math.PI / 180;
var r2d = 180 / Math.PI;

// A multiplier to shorten the x cord for movement at a down angle.
var xFactor = Math.cos(30 * d2r);

var Player;
var players = [];

var Bit;
var bits = [];









function debug(arg1, arg2) {
    if(arg1 === undefined) {
        console.trace();
    } else if(arg2 === undefined) {
        console.log(arg1);
    } else if(arg1) {
        console.log(arg2);
    }

    return;
}

function dist(x1, y1, x2, y2) {
    var offsetx = x2 - x1;
    var offsety = y2 - y1;

    offsetx = Math.pow(offsetx, 2);
    offsety = Math.pow(offsety, 2);

    return Math.sqrt(offsetx + offsety);
}









Player = function(x, y) {
    this.x = x;
    this.y = y;

    this.mx = 0;
    this.my = 0;

    this.speed = 5;
    this.control = 20;

    this.control /= 100;
}

Player.prototype.draw = function() {
    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.lineWidth =  3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(this.mx * 20, this.my * 20);
    ctx.strokeStyle = "red";
    ctx.stroke();

    ctx.fillStyle = "skyblue";
    ctx.strokeStyle = "black";
    ctx.shadowColor = "gray";
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, 360 * d2r);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.stroke();

    ctx.restore();
}

Player.prototype.move = function(index) {
    var goalmx = 0;
    var goalmy = 0;

    if(key[index].u) {
        goalmy -= this.speed;
    }

    if(key[index].l) {
        goalmx -= this.speed * xFactor;
        goalmy += this.speed / 2;
    }

    if(key[index].r) {
        goalmx += this.speed * xFactor;
        goalmy += this.speed / 2;
    }

    /*
    // Draw momentum and goal momentum.
    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(this.mx * 10, this.my * 10);
    ctx.strokeStyle = "blue";
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(goalmx * 10, goalmy * 10);
    ctx.strokeStyle = "green";
    ctx.stroke();

    ctx.restore();
    */

    goalmx -= this.mx;
    goalmy -= this.my;

    this.mx += goalmx * this.control;
    this.my += goalmy * this.control;

    this.x += this.mx;
    this.y += this.my;
}

Player.prototype.update = function(index) {
    this.draw();
    this.move(index);
}









Bit = function() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.width;
}

Bit.prototype.draw = function() {
}

Bit.prototype.update = function() {
    this.draw();

    return false;
}









function draw() {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for(var i = 0; i < bits.length; i++) {
        if(bits[i].update()) {
            bits.splice(i, 1);
            i--;
        }
    }

    for(var i = 0; i < players.length; i++) {
        if(players[i].update(i)) {
            players.spice(i, 1);
            i--;
        }
    }

    if(Math.random * 100 < bitSpawnRate) {
        bits.push(new Bit());
    }

    animator(draw);
}









window.addEventListener("keydown", keyevent);
window.addEventListener("keyup", keyevent);

function keyevent(e) {
    var down = false;
    if(e.type === "keydown") {
        down = true;
    }

    switch(e.keyCode) {
        case 65:
            key[0].l = down;
            e.preventDefault();
            break;
        case 87:
            key[0].u = down;
            e.preventDefault();
            break;
        case 68:
            key[0].r = down;
            e.preventDefault();
            break;
        case 71:
            key[1].l = down;
            e.preventDefault();
            break;
        case 89:
            key[1].u = down;
            e.preventDefault();
            break;
        case 74:
            key[1].r = down;
            e.preventDefault();
            break;
        case 76:
            key[2].l = down;
            e.preventDefault();
            break;
        case 80:
            key[2].u = down;
            e.preventDefault();
            break;
        case 222:
            key[2].r = down;
            e.preventDefault();
            break;
        case 37:
            key[3].l = down;
            e.preventDefault();
            break;
        case 38:
            key[3].u = down;
            e.preventDefault();
            break;
        case 39:
            key[3].r = down;
            e.preventDefault();
            break;
        case 100:
            key[3].l = down;
            e.preventDefault();
            break;
        case 104:
            key[3].u = down;
            e.preventDefault();
            break;
        case 102:
            key[3].r = down;
            e.preventDefault();
            break;
    }
}









canvas = document.getElementById("canvas");
ctx = canvas.getContext("2d");

animator =
    window.requestAnimationFrame ||
    window.msRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame;

for(var i = 0; i < numPlayers; i++) {
    players.push(
        new Player(
            Math.random() * canvas.width, 
            Math.random() * canvas.height
        )
    );
}

draw();
