//; Initialize the graphical interface
var canvas = document.getElementById("game-canvas");
var ctx = canvas.getContext("2d");
var animator =
	window.requestAnimationFrame ||
	window.msRequestAnimationFrame ||
	window.mosRequestAnimationFrame ||
	window.webkitRequestAnimationFrame;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var rect = canvas.getBoundingClientRect();




//; Global Variables
var mx = 0;
var my = 0;
var mc = false;
var md = false;

var d2r = Math.PI / 180;
var r2d = 180 / Math.PI;




//; Util functions
function addV(a, b) {
    return {
        x: a.x + b.x,
        y: a.y + b.y
    };
}

function subtractV(a, b) {
    return {
        x: a.x - b.x,
        y: a.y - b.y
    };
}

function scaleV(v, s) {
    v.x *= s;
    v.y *= s;
    return v;
}

function wrapV(v) {
    v.x += canvas.width / 2;
    v.y += canvas.height / 2;
    while(v.x < 0) {v.x += canvas.width;}
    while(v.y < 0) {v.y += canvas.height;}
    v.x %= canvas.width;
    v.y %= canvas.height;
    v.x -= canvas.width / 2;
    v.y -= canvas.height / 2;
    return v;
}

function getDiff(a, b) {
    var diff = {
        x: b.x - a.x,
        y: b.y - a.y
    };
    return wrapV(diff);
}

function getDist(a, b) {
	var diff = getDiff(a, b);
	return Math.sqrt(diff.x * diff.x + diff.y * diff.y);
}

function normalizeV(v) {
    var dist = getDist({x: 0, y: 0}, v);
    if(dist > 0) {
        v.x /= dist;
        v.y /= dist;
    }
    return v;
}

function getMag(v) {
    return getDist({x: 0, y: 0}, v);
}

function getDir(a, b) {
    var diff = getDiff(a, b);
    return Math.atan2(diff.y, diff.x) * r2d;
}

function fixDir(dir) {
    dir += 180;
    while(dir < 0) {dir += 360;}
    dir %= 360;
    dir -= 180;
    return dir;
}

function wrapPos(pos) {
    while(pos.x < 0) {pos.x += canvas.width;}
    while(pos.y < 0) {pos.y += canvas.height;}
    pos.x %= canvas.width;
    pos.y %= canvas.height;
    return pos;
}




//; Drawing functions
function drawPlant(x, y, dir) {
	ctx.save();
	ctx.translate(x, y);
	ctx.rotate(dir * d2r);
	ctx.fillStyle = "green";
	ctx.strokeStyle = "darkgreen";
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.arc(-5, -5, 5, 90 * d2r, 360 * d2r);
	ctx.arc(5, -5, 5, 180 * d2r, 90 * d2r);
	ctx.arc(5, 5, 5, 270 * d2r, 180 * d2r);
	ctx.arc(-5, 5, 5, 0 * d2r, 270 * d2r);
	ctx.fill();
	ctx.stroke();
	ctx.restore();
}

function drawRabbit(x, y, dir) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(dir * d2r);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "tan";
    ctx.fillStyle = "bisque";
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.bezierCurveTo(-20, -30, -20, 30, 15, 0);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

function drawWolf(x, y, dir) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(dir * d2r);
    ctx.fillStyle = "grey";
    ctx.strokeStyle = "darkgrey";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(-20, -15);
    ctx.lineTo(20, 0);
    ctx.lineTo(-20, 15);
    ctx.lineTo(-10, 0);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}




//; Objects
var state;
var Sim;

var Model;
var model;

var Wolf;
var Rabbit;
var Plant;




//; Model
Model = function() {
	this.plants = [];
	this.rabbits = [];
	this.wolves = [];

    this.starvedRabbits = [];
    this.starvedWolves = [];
}




//; Wolf
Wolf = function(x, y) {
    this.pos = {
        x: x,
        y: y
    };
    this.accel = 0.05;
    this.speed = 3;
    this.vel = {
        x: 0,
        y: 0
    };
	
    this.dir = Math.random() * 360;
    this.rotateAccel = 0.05;

    this.health;
    this.heal = function() {this.health = 500;}
    this.heal();

    this.goalChangeChance = 200;
    this.goal = {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height
    };

    this.reproduceChance = 800; // P = 1/x
    this.canReproduce = false;

    this.dead = false;
    this.starved = false;
}

Wolf.prototype.draw = function() {
    for(var i = -canvas.width; i <= canvas.width; i += canvas.width) {
        for(var j = -canvas.height; j <= canvas.height; j += canvas.height) {
            drawWolf(this.pos.x + i, this.pos.y + j, this.dir);
        }
    }
}

Wolf.prototype.updateGoal = function() {
    this.goal.x = Math.random() * canvas.width;
    this.goal.y = Math.random() * canvas.height;
}

Wolf.prototype.updatePos = function(movement) {
    movement = normalizeV(movement);
    movement = scaleV(movement, this.speed);
    var diff = getDiff(this.vel, movement);
    diff = scaleV(diff, this.accel);
    this.vel = addV(this.vel, diff);
    this.pos = addV(this.pos, this.vel);
    this.pos = wrapPos(this.pos);
}

Wolf.prototype.updateDir = function(movement) {
    var dir = getDir({x: 0, y: 0}, movement);
    dir -= this.dir;
    dir = fixDir(dir);
    dir *= this.rotateAccel;
    this.dir += dir;
}

Wolf.prototype.move = function() {
    var movement = {
        x: 0,
        y: 0
    };

    if(model.rabbits.length > 0 && this.health < 130) {
        // Find Food
        var cpos = {x: 0, y: 0};
        var cdist = 1000000;
        var dist;
        var ci;
        for(var i = 0; i < model.rabbits.length; i++) {
            dist = getDist(this.pos, model.rabbits[i].pos);
            if(dist < cdist) {
                cdist = dist;
                cpos = model.rabbits[i].pos;
                ci = i;
            }
        }
        if(cdist < 20) {
            this.heal();
            this.canReproduce = true;
            model.rabbits[ci].kill();
        }
        movement = getDiff(this.pos, cpos);
    } else {
        // Move randomly
        if(Math.random() * this.goalChangeChance < 1) {
            this.updateGoal();
        }
        while(getDist(this.pos, this.goal) < this.speed) {this.updateGoal();}
        movement = addV(movement, getDiff(this.pos, this.goal));
    }

    this.updatePos(movement);
    if(getMag(movement) > 0) {
        this.updateDir(movement);
    }
}

Wolf.prototype.reproduce = function() {
    if(this.health > 300 && Math.random() * this.reproduceChance < 1 && this.canReproduce) {
        model.wolves.push(new Wolf(this.pos.x, this.pos.y));
        this.canReproduce = false;
    }
}

Wolf.prototype.update = function() {
    this.move();
    this.reproduce();
    this.health--;
    if(this.health < 0) {
        this.dead = true;
        this.starved = true;
    }
    return this.dead;
}




//; Rabbit
Rabbit = function(x, y) {
    this.pos = {
        x: x,
        y: y
    };
    this.accel = 0.05;
    this.speed = 2;
    this.vel = {
        x: 0,
        y: 0
    };

    this.dir = Math.random() * 360;
    this.rotateAccel = 0.05;

    this.health;
    this.heal = function() {this.health = 400;}
    this.heal();

    this.watchRadius = 100;

    this.closestFood = 0;
    this.foodScan = 0;

    this.goalChangeChance = 200;
    this.goal = {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height
    };

    this.reproduceChance = 120; // P = 1/x
    this.canReproduce = false;

    this.dead = false;
    this.starved = false;
}

Rabbit.prototype.kill = function() {
    this.dead = true;
}

Rabbit.prototype.draw = function() {
    for(var i = -canvas.width; i <= canvas.width; i += canvas.width) {
        for(var j = -canvas.height; j <= canvas.height; j += canvas.height) {
            drawRabbit(this.pos.x + i, this.pos.y + j, this.dir);
        }
    }
}

Rabbit.prototype.updateGoal = function() {
    this.goal.x = Math.random() * canvas.width;
    this.goal.y = Math.random() * canvas.height;
}

Rabbit.prototype.updatePos = function(movement) {
    movement = normalizeV(movement);
    movement = scaleV(movement, this.speed);
    var diff = getDiff(this.vel, movement);
    diff = scaleV(diff, this.accel);
    this.vel = addV(this.vel, diff);
    this.pos = addV(this.pos, this.vel);
    this.pos = wrapPos(this.pos);
}

Rabbit.prototype.updateDir = function(movement) {
    var dir = getDir({x: 0, y: 0}, movement);
    dir -= this.dir;
    dir = fixDir(dir);
    dir *= this.rotateAccel;
    this.dir += dir;
}

Rabbit.prototype.move = function() {
    var movement = {
        x: 0,
        y: 0
    };

    // Run from wolves
    var dist;
    for(var i = 0; i < model.wolves.length; i++) {
        dist = getDist(this.pos, model.wolves[i].pos);
        if(dist < this.watchRadius) {
            var dir = getDir(model.wolves[i].pos, this.pos);
            movement.x += Math.cos(dir * d2r) * this.speed;
            movement.y += Math.sin(dir * d2r) * this.speed;
        }
    }

    if(getMag(movement) === 0) {
        // Find Food
        if(model.plants.length > 0 && this.health < 200) {
            this.foodScan %= model.plants.length;
            this.closestFood %= model.plants.length;
            var currentDist = getDist(this.pos, model.plants[this.closestFood].pos);
            var newDist = getDist(this.pos, model.plants[this.foodScan].pos);
            if(newDist < currentDist) {
                this.closestFood = this.foodScan;
                currentDist = newDist;
            }
            this.foodScan += Math.ceil(Math.random() * 5);
            if(currentDist < 15) {
                this.heal();
                this.canReproduce = true;
                model.plants[this.closestFood].kill();
            }

            movement = addV(movement, getDiff(this.pos, model.plants[this.closestFood].pos));
        } else {
            if(Math.random() * this.goalChangeChance < 1) {
                this.updateGoal();
            }
            while(getDist(this.pos, this.goal) < this.speed) {this.updateGoal();}
            movement = addV(movement, getDiff(this.pos, this.goal));
        }
    }

    this.updatePos(movement);
    if(getMag(movement) > 0) {
        this.updateDir(movement);
    }
}

Rabbit.prototype.reproduce = function() {
    if(this.health > 300 && Math.random() * this.reproduceChance < 1 && this.canReproduce) {
        model.rabbits.push(new Rabbit(this.pos.x, this.pos.y));
        this.canReproduce = false;
    }
}

Rabbit.prototype.update = function() {
    this.move();
    this.reproduce();
    this.health--;
    if(this.health < 0) {
        this.dead = true;
        this.starved = true;
    }
    return this.dead;
}




//; Plant
Plant = function(x, y) {
	this.pos = {
		x: x,
		y: y
	};

	this.dir = Math.random() * 360;

	this.growChance = 1000; // P = 1/x
	//this.growSpace = 25;
	this.growBox = 70;

	this.dead = false;
}

Plant.prototype.kill = function() {
    this.dead = true;
}

Plant.prototype.draw = function() {
	drawPlant(this.pos.x, this.pos.y, this.dir);
}

Plant.prototype.grow = function() {
    var chance = this.growChance;
    if(model.plants.length > 100) {
        chance += (model.plants.length - 100) * 100;
    }
	if(Math.random() * chance < 1) {
		var x = Math.random() * this.growBox * 2 - this.growBox + this.pos.x;
		var y = Math.random() * this.growBox * 2 - this.growBox + this.pos.y;
		model.plants.push(new Plant(x, y));
	}
}

Plant.prototype.update = function() {
	this.grow();
	return this.dead;
}




//; Sim
Sim = function() {
	model = new Model();
	this.organism = "plant";
    this.buttonScale = [3,2.25,1.5];
}

Sim.prototype.clear = function() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
}

Sim.prototype.updateStarvedOrganisms = function() {
    ctx.globalAlpha = 0.7;
    for(var i = 0; i < model.starvedRabbits.length; i++) {
        model.starvedRabbits[i].draw();
        model.starvedRabbits[i].visibleTime--;
        if(model.starvedRabbits[i].visibleTime < 0) {
            model.starvedRabbits.splice(i, 1);
            i--;
        }
    }
    for(var i = 0; i < model.starvedWolves.length; i++) {
        model.starvedWolves[i].draw();
        model.starvedWolves[i].visibleTime--;
        if(model.starvedWolves[i].visibleTime < 0) {
            model.starvedWolves.splice(i, 1);
            i--;
        }
    }
    ctx.globalAlpha = 1;
}

Sim.prototype.placeOrganisms = function() {
	if(mc && (mx > 300 || my > 100)) {
		switch(this.organism) {
		case "plant":
            model.plants.push(new Plant(mx, my));
			break;
		case "rabbit":
			model.rabbits.push(new Rabbit(mx, my));
			break;
		case "wolf":
			model.wolves.push(new Wolf(mx, my));
			break;
		}
	}
}

Sim.prototype.updateOrganisms = function() {
	for(var i = 0; i < model.plants.length; i++) {
		if(model.plants[i].update()) {
			model.plants.splice(i, 1);
			i--;
		}
	}

	for(var i = 0; i < model.rabbits.length; i++) {
		if(model.rabbits[i].update()) {
            if(model.rabbits[i].starved) {
                model.rabbits[i].visibleTime = 50;
                model.starvedRabbits.push(model.rabbits[i]);
            }
			model.rabbits.splice(i, 1);
			i--;
		}
	}

	for(var i = 0; i < model.wolves.length; i++) {
		if(model.wolves[i].update()) {
            if(model.wolves[i].starved) {
                model.wolves[i].visibleTime = 50;
                model.starvedWolves.push(model.wolves[i]);
            }
			model.wolves.splice(i, 1);
			i--;
		}
	}
}

Sim.prototype.drawOrganisms = function() {
	for(var i = 0; i < model.plants.length; i++) {
		model.plants[i].draw();
	}

	for(var i = 0; i < model.rabbits.length; i++) {
		model.rabbits[i].draw();
	}

	for(var i = 0; i < model.wolves.length; i++) {
		model.wolves[i].draw();
	}
}

Sim.prototype.updateMenu = function() {
    ctx.fillStyle = "#442d06";
    ctx.strokeStyle = "#261802";
    ctx.lineWidth = 5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-10, -10);
    ctx.lineTo(-10, 100);
    ctx.arc(285, 85, 15, 90 * d2r, 0, true);
    ctx.lineTo(300, -10);
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.translate(50, 50);
    ctx.scale(this.buttonScale[0], this.buttonScale[0]);
    drawPlant(0, 0);
    ctx.restore();

    ctx.save();
    ctx.translate(150, 50);
    ctx.scale(this.buttonScale[1], this.buttonScale[1]);
    drawRabbit(0, 3, 270);
    ctx.restore();

    ctx.save();
    ctx.translate(250, 50);
    ctx.scale(this.buttonScale[2], this.buttonScale[2]);
    drawWolf(0, 0, 270);
    ctx.restore();

    this.buttonScale = [3, 2.25, 1.5];
    if(my > 0 && my < 100) {
        if(mx < 100) {
            if(!md) { 
                this.buttonScale[0] *= 1.2;
            } else {
                this.organism = "plant";
            }
        } else if(mx < 200) {
            if(!md) {
                this.buttonScale[1] *= 1.2;
            } else {
                this.organism = "rabbit";
            }
        } else if(mx < 300) {
            if(!md) {
                this.buttonScale[2] *= 1.2;
            } else {
                this.organism = "wolf";
            }
        }
    }
}

Sim.prototype.update = function() {
	this.clear();
    this.updateStarvedOrganisms();
	this.placeOrganisms();
	this.updateOrganisms();
	this.drawOrganisms();
    this.updateMenu();
}




//; Draw Loop
model = new Model();

state = new Sim();

function draw() {;
	animator(draw);
	state.update();
	mc = false;
}




//; Event Handlers
canvas.onmousemove = function(e) {
	mx = e.clientX - rect.left;
	my = e.clientY - rect.top;
}

canvas.onclick = function(e) {
	mc = true;
}

canvas.onmousedown = function(e) {
    md = true;
}

canvas.onmouseup = function(e) {
    md = false;
}




//; Start
draw();
