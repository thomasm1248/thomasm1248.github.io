var canvas;
var ctx;
var animator;

var up = false;
var down = false;
var left = false;
var right = false;
var spacebar = false;

var msx;
var msy;
var msclick = false;

var d2r = Math.PI / 180;
var r2d = 180 / Math.PI;









canvas = document.getElementById("page-canvas_div-game_canvas");
ctx = canvas.getContext("2d");

ctx.translate(0.5, 0.5);




animator =
    window.requestAnimationFrame ||
    window.msRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame;









var model, Model;

var state;
var Playing;

var Player;
var Bullet;
var EnemyL1;









// programing util functions:
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

// drawing util functions:
function translate(pos) {
    ctx.translate(pos.x, pos.y);
}

function rotate(degs) {
    ctx.rotate(degs * d2r);
}

function rect(x, y, w, h) {
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
}

function line(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}




// trig util functions:
function cos(degs) {
    return Math.cos(degs * d2r);
}

function sin(degs) {
    return Math.sin(degs * d2r);
}

function getDir(p1, p2) {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x) * r2d;
}




// math util functions
function dist(x1, y1, x2, y2) {
    var xd = x2 - x1;
    var yd = y2 - y1;

    xd *= xd;
    yd *= yd;

    return Math.sqrt(xd + yd);
}

function getMag(v) {
    return dist(0, 0, v.x, v.y);
}

function map(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
}

function onCanvas(x, y) {
    if(x < 0) {
        return false;
    } else if(x > canvas.width) {
        return false;
    } else if(y < 0) {
        return false;
    } else if(y > canvas.height) {
        return false;
    }

    return true;
}

function fixAngle(an) {
    if(an < 0) {
        an += 360 * Math.ceil(Math.abs(an));
    }

    an %= 360;

    return an;
}

function modOffset(num, mod, offset) {
    num += offset;
    num %= mod;
    num -= offset;

    return num;
}

function getDiff(dir1, dir2) {
    dir1 -= dir2;
    dir1 = fixAngle(dir1);
    dir1 = modOffset(dir1, 360, 180);

    return Math.abs(dir1);
}









Model = function() {
    this.player = new Player();
    this.weapons = [];
    this.enemies = [];
}









Playing = function() {
    model = new Model();

    model.enemies.push(new EnemyL1(0, 0, 90));
    model.enemies.push(new EnemyL1(0, 0, -90));
    model.enemies.push(new EnemyL1(0, 0, 0));

    this.bgImage = new Image();
    this.bgImage.src = "../media/stone_bg.png";
    this.bgPattern = ctx.createPattern(this.bgImage, "repeat");

    this.bpos = {
        x: 0,
        y: 0
    };
}

Playing.prototype.updateBPos = function() {
    this.bpos.x -= model.player.m.x;
    this.bpos.y -= model.player.m.y;
}

Playing.prototype.stone = function() {
    this.updateBPos();
    this.bpos.x %= this.bgImage.width;
    this.bpos.y %= this.bgImage.height;

    ctx.save();
    ctx.translate(
        -this.bgImage.width + this.bpos.x,
        -this.bgImage.height + this.bpos.y
    );

    ctx.fillStyle = this.bgPattern;
    ctx.fillRect(this.bgImage.width - this.bpos.x, this.bgImage.height - this.bpos.y, canvas.width, canvas.height);

    ctx.restore();
}

Playing.prototype.grid = function() {
    this.updateBPos();
    var gridSize = 200;
    this.bpos.x = (this.bpos.x + gridSize) % gridSize;
    this.bpos.y = (this.bpos.y + gridSize) % gridSize;

    ctx.strokeStyle = "blue";
    for(var i = this.bpos.x; i < canvas.width; i += gridSize) {
        line(i, 0, i, canvas.height);
    }

    for(var i = this.bpos.y; i < canvas.height; i += gridSize) {
        line(0, i, canvas.width, i);
    }
}

Playing.prototype.updateWeapons = function() {
    for(var i = 0; i < model.weapons.length; i++) {
        if(model.weapons[i].update()) {
            model.weapons.splice(i, 1);
            i--;
        }
    }
}

Playing.prototype.updateEnemies = function() {
    for(var i = 0; i < model.enemies.length; i++) {
        if(model.enemies[i].update()) {
            model.enemies.splice(i, 1);
            i--;
        }
    }
}

Playing.prototype.update = function() {
    //this.stone();
    ctx.fillStyle = "darkblue";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    this.grid();

    model.player.update();

    this.updateEnemies();

    this.updateWeapons();
}









Player = function() {
    // what the player looks like.
    this.image = new Image();
    this.image.src = "../media/ship.png";

    // laser shooting sound
    this.laserSound = new Audio("../media/player_zap.mp3");
    this.laserSound.volume = 0.5;

    this.width = 22.5;

    // position on screen not world.
    this.p = {
        x: canvas.width / 2,
        y: canvas.height / 2
    };

    // direction player is pointing. N:0, E:90, S:180, W:270.
    this.dir = 0;

    // momentum. (only used by other objects in world because player is still)
    this.m = {
        x: 0,
        y: 0
    };

    this.maxSpeed = 20;
    this.rotSpeed = 3;
    this.accelSpeed = 1.2;
    this.brakeSpeed = 1.05;
    this.frictionSpeed = 1.003;
    this.stopThreshold = 0.02;
}

Player.prototype.draw = function() {
    ctx.save();

    // move to spot where drawing will happen.
    translate(this.p);
    rotate(this.dir);

    ctx.drawImage(this.image, -25, -25, 50, 50);

    ctx.restore();
}

Player.prototype.accelForward = function() {
    var goal = {
        x: cos(this.dir) * this.maxSpeed,
        y: sin(this.dir) * this.maxSpeed
    };

    var diff = {
        x: goal.x - this.m.x,
        y: goal.y - this.m.y
    };

    diff.x *= this.accelSpeed / 100;
    diff.y *= this.accelSpeed / 100;

    this.m.x += diff.x;
    this.m.y += diff.y;
}

Player.prototype.brake = function() {
    this.m.x /= this.brakeSpeed;
    this.m.y /= this.brakeSpeed;
}

Player.prototype.friction = function() {
    this.m.x /= this.frictionSpeed;
    this.m.y /= this.frictionSpeed;

    if(getMag(this.m) < this.stopThreshold) {
        this.m.x = 0;
        this.m.y = 0;
    }
}

Player.prototype.move = function() {
    if(left) {
        this.dir -= this.rotSpeed;
    }
    if(right) {
        this.dir += this.rotSpeed;
    }
    if(up) {
        this.accelForward();
    }
    if(down) {
        this.brake();
    }

    this.friction();
}

Player.prototype.attack = function() {
    if(spacebar) {
        var x = this.p.x + cos(this.dir - 90) * this.width;
        var y = this.p.y + sin(this.dir - 90) * this.width;
        model.weapons.push(new Bullet(x, y, this.dir));

        x = this.p.x + cos(this.dir + 90) * this.width;
        y = this.p.y + sin(this.dir + 90) * this.width;
        model.weapons.push(new Bullet(x, y, this.dir));

        this.laserSound.play();
    }
}

Player.prototype.update = function() {
    this.move();
    this.attack();
    this.draw();
}









Bullet = function(x, y, dir) {
    this.p = {
        x: x,
        y: y
    };

    this.dir = dir;

    this.range = 2;
    this.raySpeed = 10;
    this.length = 40;
}

Bullet.prototype.rayCast = function() {
    var x1 = this.p.x;
    var y1 = this.p.y;

    var x2 = this.p.x;
    var y2 = this.p.y;

    while(onCanvas(x2, y2)) {
        x2 += cos(this.dir) * this.raySpeed;
        y2 += sin(this.dir) * this.raySpeed;
    }

    var howFar = dist(x1, y1, x2, y2);
    var d = howFar;
    howFar *= Math.random();
    howFar = map(howFar, 0, d, 0 + this.length / 2, d - this.length / 2);

    var x = x1 + cos(this.dir) * howFar;
    var y = y1 + sin(this.dir) * howFar;

    ctx.save();
    ctx.translate(x, y);

    ctx.strokeStyle = "red";
    ctx.lineWidth = 1;
    line(
        cos(this.dir) * (this.length / 2),
        sin(this.dir) * (this.length / 2),
        cos(this.dir + 180) * (this.length / 2),
        sin(this.dir + 180) * (this.length / 2)
    );

    ctx.restore();
}

Bullet.prototype.update = function() {
    this.dir += Math.random() * this.range * 2 - this.range;

    this.rayCast();

    // returning true will cause it to be removed from the array.
    return true;
}









EnemyL1 = function(x, y, dir) {
    this.image = new Image();
    this.image.src = "../media/enemy_L1.png";

    this.p = {
        x: x,
        y: y
    };

    this.m = {
        x: model.player.m.x,
        y: model.player.m.y
    };

    this.dir = dir;

    this.dead = false;

    this.state = "chasing";

    this.rangeWidth = 4;
    this.maxSpeed = 10;
    this.accelSpeed = 0.5;
    this.frictionSpeed = 1.003;
    this.rotSpeed = 0.4;
}

EnemyL1.prototype.draw = function() {
    ctx.save();
    translate(this.p);
    rotate(this.dir);

    ctx.drawImage(this.image, -25, -25, 50, 50);

    ctx.restore();
}

EnemyL1.prototype.getGoal = function() {
    return model.player.p;
}

EnemyL1.prototype.steerForward = function() {
    var goal = {
        x: cos(this.dir) * this.maxSpeed,
        y: sin(this.dir) * this.maxSpeed
    };

    var diff = {
        x: goal.x - this.m.x,
        y: goal.y - this.m.y
    };

    diff.x *= this.accelSpeed / 100;
    diff.y *= this.accelSpeed / 100;

    this.m.x += diff.x;
    this.m.y += diff.y;
}

EnemyL1.prototype.chasing = function(angle) {
    if(dist(this.p.x, this.p.y, model.player.p.x, model.player.p.y) > 150) {
        this.steerForward();
    }

    if(angle > 15) {
        this.dir += this.rotSpeed;
    } else if(angle < 345) {
        this.dir -= this.rotSpeed;
    }

    if(angle > 45 || angle < 315) {
        this.state = "fleeing";
    }
}

EnemyL1.prototype.fleeing = function(angle) {
    if(angle < 165) {
        this.dir += this.rotSpeed;
    } else if(angle > 195) {
        this.dir -= this.rotSpeed;
    }

    this.steerForward();

    if(dist(this.p.x, this.p.y, model.player.p.x, model.player.p.y) > 800) {
        this.state = "returning";
    }
}

EnemyL1.prototype.returning = function(angle) {
    if(angle < 180) {
        this.dir += this.rotSpeed;
    } else {
        this.dir -= this.rotSpeed;
    }

    this.steerForward();

    if(
        dist(this.p.x, this.p.y, model.player.p.x, model.player.p.y) < 400 &&
        Math.abs(angle) < 45 &&
        getDiff(this.dir, model.player.dir) < 20
    ) {
        this.state = "chasing";
    }
}

EnemyL1.prototype.steer = function(goal) {
    var dirToPlayer = getDir(this.p, model.player.p);
    var dirDiff = dirToPlayer - this.dir;

    dirDiff = fixAngle(dirDiff);

    switch(this.state) {
        case "chasing":
            this.chasing(dirDiff);
            break;
        case "fleeing":
            this.fleeing(dirDiff);
            break;
        case "returning":
            this.returning(dirDiff);
            break;
    }

    this.p.x += this.m.x;
    this.p.y += this.m.y;
}

EnemyL1.prototype.pointingAtPlayer = function() {
    var dirToPlayer = getDir(this.p, model.player.p);
    var dirDiff = dirToPlayer - this.dir;

    dirDiff = fixAngle(dirDiff);
    dirDiff = modOffset(dirDiff, 360, 180);

    if(Math.abs(dirDiff) < this.rangeWidth) {
        return true;
    }

    return false;
}

EnemyL1.prototype.shoot = function() {
    if(this.pointingAtPlayer()) {
        model.weapons.push(new Bullet(this.p.x, this.p.y, this.dir));
    }
}

EnemyL1.prototype.move = function() {
    var goal = this.getGoal();
    this.steer(goal);

    this.shoot();
}

EnemyL1.prototype.friction = function() {
    this.m.x /= this.frictionSpeed;
    this.m.y /= this.frictionSpeed;
}

EnemyL1.prototype.moveRelativeToPlayer = function() {
    this.p.x -= model.player.m.x;
    this.p.y -= model.player.m.y;
}

EnemyL1.prototype.update = function() {
    this.move();
    this.friction();
    this.moveRelativeToPlayer();
    this.draw();

    return this.dead;
}









state = new Playing();

function draw() {
    animator(draw);
    state.update();

    msclick = false;

    return;
}









window.addEventListener("keydown", keyPress, false);
window.addEventListener("keyup", keyRelease, false);

function keyPress(e) {
    var isGameKey = true;
    switch(e.keyCode) {
        case 37:
            left = true;
            break;
        case 38:
            up = true;
            break;
        case 39:
            right = true;
            break;
        case 40:
            down = true;
            break;
        case 32:
            spacebar = true;
            break;
        default:
            isGameKey = false;
            break;
    }

    if(!isGameKey) {
        e.preventDefault();
    }

    return;
}

function keyRelease(e) {
    var isGameKey = true;
    switch(e.keyCode) {
        case 37:
            left = false;
            break;
        case 38:
            up = false;
            break;
        case 39:
            right = false;
            break;
        case 40:
            down = false;
            break;
        case 32:
            spacebar = false;
            break;
        default:
            isGameKey = false;
            break;
    }

    if(!isGameKey) {
        e.preventDefault();
    }

    return;
}









draw();
