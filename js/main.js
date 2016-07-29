(function() {
	function doScript() {
		var canvas = document.createElement('canvas');

		canvas.width = 1000;
		canvas.height = 700;

		document.body.appendChild(canvas);

		var game = new GameObject(canvas);
		game.run();
	}

	document.addEventListener('DOMContentLoaded', doScript, false);
})();