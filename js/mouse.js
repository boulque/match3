var Mouse = {
	x: null,
	y: null,

	state: 0, // 0 - free, 1 - down, 2 - up

	coordsShift: { x: null, y: null },

	init: function(canvas) {
		canvas.onmousedown = function(e) { if (e.which != 1) return; Mouse.state = 1; }
		canvas.onmouseup = function(e) { Mouse.state = 2; }
		canvas.onmousemove = this.onMouseMove;
		this.coordsShift.x = canvas.getBoundingClientRect().left;
		this.coordsShift.y = canvas.getBoundingClientRect().top;
	},

	onMouseMove: function(e) {
		Mouse.x = e.clientX - Mouse.coordsShift.x;
		Mouse.y = e.clientY - Mouse.coordsShift.y;
	},

	down: function() {
		return this.state == 1;
	},

	up: function() {
		return this.state == 2;
	},

	update: function() {
		if (this.state != 0) this.state = 0;
	}
}