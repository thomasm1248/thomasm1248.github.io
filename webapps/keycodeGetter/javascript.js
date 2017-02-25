window.onload = function() {
	
	window.addEventListener("keydown", ifDown, false);

	canvas = document.getElementById("myCanvas");
	context = canvas.getContext("2d");

	context.fillStyle = "black";
	context.fillRect(0, 0, 60, 20);
	context.fillStyle = 'green';
	context.font = 'normal normal 1em Andale Mono';
	context.fillText("it works!", 5, 15);

	function ifDown(e) {
		context.fillStyle = "black";
		context.fillRect(0, 0, 400, 400);
		context.fillStyle = 'green';
		context.font = 'normal normal 1em Andale Mono';
		context.fillText(e.keyCode, 5, 15);
		e.preventDefault();
	}
}