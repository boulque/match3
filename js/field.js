function Field(position) {
	var self = this;

	this.texture = TextureLoader.get('entity', 'field.png');

	this.position = { x: position[0], y: position[1] };

	this.size = { x: this.texture.width, y: this.texture.height };

	this.field = [];

	this.padding = 35;

	this.cellSize = 60;

	this.rows = 7;

	this.cols = 8;

	this.draggingStone = null;

	this.movedStones = [];

	this.fallingStones = [];

	this.fieldRect = {
		x: this.position.x + this.padding,
		y: this.position.y + this.padding,
		width: this.cols * this.cellSize,
		height: this.rows * this.cellSize
	};

	this.mouseDown = false;

	function init() {
		self.generateStartField();

		for (var i=0; i<self.cols; i++) {
			self.fallingStones.push([]);
		}
	}

	this.draw = function(context) {
		context.drawImage(self.texture, self.position.x, self.position.y);
	}

	this.update = function(interval) {
		if (self.draggingStone === null) return;

		var cell = self.getHoveredCell();

		if (cell === null || (cell[0] != self.draggingStone.startCellNumber[0] && cell[1] != self.draggingStone.startCellNumber[1])) {
			self.resetStones();
			return;
		}

		var stone = self.getStone(cell);

		if (stone === null) {
			self.resetStones();
			return;
		}

		if (stone.cellNumber[0] == self.draggingStone.cellNumber[0]) {
			if (stone.cellNumber[1] == self.draggingStone.cellNumber[1]) return;

			if (stone.cellNumber[1] > self.draggingStone.cellNumber[1]) {
				for (var i = self.draggingStone.cellNumber[1] + 1; i <= stone.cellNumber[1]; i++) 
				{
					self.moveStone(self.getStone([cell[0], i]), 'up');
				}
			}
			else {
				for (var i = self.draggingStone.cellNumber[1] - 1; i >= stone.cellNumber[1]; i--) 
				{
					self.moveStone(self.getStone([cell[0], i]), 'down');
				}
			}

		}
		else if (stone.cellNumber[1] == self.draggingStone.cellNumber[1]) {
			if (stone.cellNumber[0] == self.draggingStone.cellNumber[0]) return;

			if (stone.cellNumber[0] > self.draggingStone.cellNumber[0]) {
				for (var i = self.draggingStone.cellNumber[0] + 1; i <= stone.cellNumber[0]; i++) 
				{
					self.moveStone(self.getStone([i, cell[1]]), 'left');
				}
			}
			else {
				for (var i = self.draggingStone.cellNumber[0] - 1; i >= stone.cellNumber[0]; i--) 
				{
					self.moveStone(self.getStone([i, cell[1]]), 'right');
				}
			}
		}
	}

	this.addStones = function(col, num) {
		var startCoord = self.fieldRect.y - self.cellSize;
		
		for (var i=0; i<self.fallingStones[col].length; i++) {
			if (self.fallingStones[col][i].position.y - self.cellSize < startCoord) {
				startCoord = self.fallingStones[col][i].position.y - self.cellSize;
			}
		}

		for (var i=0; i<num; i++) {
			var s = new Stone(startCoord - self.cellSize*i, [col, num-i-1], self.cellSize, 
				self.fieldRect, Math.floor(Math.random() * Object.keys(Stones).length));

			State.layers.fg.push(s);
			self.fallingStones[col].push(s);
		}
	}

	this.moveStone = function(stone, direction) {
		if (stone.moved) {
			self.movedStones.pop();
			stone.moved = false;
		} else {
			stone.moved = true;
			self.movedStones.push(stone);
		}

		if (direction == 'up') {
			stone.cellNumber[1]--;
			self.draggingStone.cellNumber[1]++;
		}
		else if (direction == 'down') {
			stone.cellNumber[1]++;
			self.draggingStone.cellNumber[1]--;
		}
		else if (direction == 'left') {
			stone.cellNumber[0]--;
			self.draggingStone.cellNumber[0]++;
		}
		else if (direction == 'right') {
			stone.cellNumber[0]++;
			self.draggingStone.cellNumber[0]--;
		}

		self.field[stone.cellNumber[1]][stone.cellNumber[0]] = stone;
		self.field[self.draggingStone.cellNumber[1]][self.draggingStone.cellNumber[0]] = self.draggingStone;
		stone.setState('move');
	}

	this.getStone = function(pos) {
		return self.field[pos[1]][pos[0]];
	}

	this.onMouseUp = function() {
		self.mouseDown = false;

		if (self.draggingStone !== null) {

			var stones = self.movedStones.slice();
			stones.push(self.draggingStone);

			var combinations = self.getCombinations(stones);

			if (!combinations.length) {
				self.resetStones();
			}
			else {
				State.objects.moveCounter.decrease();
				self.confirmPosition();
				self.handleCombinations(combinations);
			}
		}
	}

	this.getHoveredCell = function() {
		var cellX = Math.floor((Mouse.x - self.position.x - self.padding) / self.cellSize);
		var cellY = Math.floor((Mouse.y - self.position.y - self.padding) / self.cellSize);

		if (cellX >= self.cols || cellX < 0 || cellY < 0 || cellY >= self.rows) return null;

		return [cellX, cellY];
	}

	this.resetStones = function() {
		for (var i=0; i<self.movedStones.length; i++) {
			var coord = self.movedStones[i].startCellNumber;
			self.movedStones[i].resetPosition();
			self.field[coord[1]][coord[0]] = self.movedStones[i];
		}
		self.draggingStone.resetPosition();

		var coord = self.draggingStone.startCellNumber;
		self.field[coord[1]][coord[0]] = self.draggingStone;

		var stones = self.movedStones.slice();
		stones.push(self.draggingStone);

		var combinations = self.getCombinations(stones);
		self.handleCombinations(combinations);

		self.draggingStone = null;
		self.movedStones = [];
	}

	this.getCombinations = function(stones) {
		var result = [];
		
		for (var i=0; i<stones.length; i++) {
			for (var n=0; n<2; n++) {
				var comb = [];
				var previousType;

				if (n == 0) {
					var from = stones[i].startCellNumber[0] - 2;
					if (from < 0) from = 0;
					var to = stones[i].startCellNumber[0] + 2;
					if (to >= self.cols) to = self.cols - 1;
				}
				else {
					var from = stones[i].startCellNumber[1] - 2;
					if (from < 0) from = 0;
					var to = stones[i].startCellNumber[1] + 2;
					if (to >= self.rows) to = self.rows - 1;
				}

				for (var h=from; h<=to; h++) {
					var curStone;

					if (n == 0) curStone = self.getStone([h, stones[i].startCellNumber[1]]);
					else curStone = self.getStone([stones[i].startCellNumber[0], h]);

					if (curStone === null || curStone.moved && self.mouseDown) {
						if (comb.length < 3) comb = [];
						previousType = null;
						continue;
					}

					if (!comb.length) {
						comb.push(curStone);
						previousType = curStone.type;
						continue;
					}

					if (curStone.type == previousType) comb.push(curStone);
					else if (comb.length < 3) {
						comb = [];
						comb.push(curStone);
					}
					else break;

					previousType = curStone.type;
				}

				if (comb.length >= 3) {
					for (var j=0; j<comb.length; j++) {
						var added = false;
						for (var k=0; k<result.length; k++) {
							if (result[k] == comb[j]) {
								added = true;
								break;
							}
						}
						if (!added) result.push(comb[j]);
					}
				}

			}
		}

		return result;
	}

	this.confirmPosition = function() {
		for (var i=0; i<self.movedStones.length; i++) {
			self.movedStones[i].confirmPosition();
		}
		self.draggingStone.confirmPosition();
		self.draggingStone.setState('move');
		self.draggingStone = null;
		self.movedStones = [];
	}

	this.generateStartField = function() {
		var colPaddings = [];

		for (var i=0; i<self.cols; i++) {
			colPaddings.push(Math.floor(Math.random()*100) + 150);
		}

		for (var i=0; i<self.rows; i++) {
			var row = [];
			for (var j=0; j<self.cols; j++) {
				var stone = new Stone(self.fieldRect.y - (self.rows - i) * self.cellSize - colPaddings[j], 
					[j, i], self.cellSize, self.fieldRect, Math.floor(Math.random() * Object.keys(Stones).length));

				row.push(stone);
			}
			self.field.push(row);
		}

		for (var i=0; i<self.rows; i++) {
			for (var j=0; j<self.cols; j++) {
				var type = self.getStone([j, i]).type;

				for (var n=0; n<2; n++) {
					if (i > self.rows - 3 && n == 1) continue;
					if (j > self.cols - 3 && n == 0) continue;

					var counter = 0;
					
					for (var k=1; k<3; k++) {
						if (n==0) {
							if (self.getStone([j + k, i]).type == type) counter++;
							else break;
						}
						else {
							if (self.getStone([j, i + k]).type == type) counter++;
							else break;
						}
					}

					if (counter == 2) {
						while (true) {
							var rolledType = Math.floor(Math.random() * Object.keys(Stones).length);
							if (rolledType == type) continue;

							if (n==0) {
								if (i < self.rows - 1 && rolledType == self.getStone([j+1, i+1]).type) continue;
								if (i > 0 && rolledType == self.getStone([j+1, i-1]).type) continue;

								var ySpawn = self.field[i][j+1].position.y;
								self.field[i][j+1] = new Stone(ySpawn, [j+1, i], self.cellSize, self.fieldRect, rolledType);
								break;
							}
							else {
								if (j < self.cols - 1 && rolledType == self.getStone([j+1, i+1]).type) continue;
								if (j > 0 && rolledType == self.getStone([j-1, i+1]).type) continue;

								var ySpawn = self.field[i+1][j].position.y;
								self.field[i+1][j] = new Stone(ySpawn, [j, i+1], self.cellSize, self.fieldRect, rolledType);
								break;
							}
						}
					}
				}
			}
		}
		
		for (var i=0; i<self.rows; i++) {
			for (var j=0; j<self.cols; j++) {
				State.layers.fg.push(self.field[i][j]);
			}
		}

	}

	this.handleCombinations = function(combinations) {
		var positions = [];
		var stonesNumber = [];
		var score = 0;

		for (var i=0; i<self.cols; i++) {
			positions.push(0);
			stonesNumber.push(0);
		}

		for (var i=0; i<combinations.length; i++) {
			score += StonesScore[combinations[i].type];
			
			var fsCol = self.fallingStones[combinations[i].cellNumber[0]];

			for (var j=0; j<State.layers.fg.length; j++) {
				if (State.layers.fg[j] == combinations[i]) {
					State.layers.fg.splice(j, 1);
					break;
				}
			}

			self.field[combinations[i].cellNumber[1]][combinations[i].cellNumber[0]] = null;
			
			for (var j=0; j<combinations[i].cellNumber[1]; j++) {
				var s = self.getStone([combinations[i].cellNumber[0], j]);
				var stoneIncluded = false;

				for (var k=0; k<combinations.length; k++) {
					if (combinations[k] == s) {
						stoneIncluded = true;
						break;
					}
				}

				if (s !== null && !stoneIncluded) {
					s.cellNumber[1]++;
				}
			}
			
			if (combinations[i].cellNumber[1] > positions[combinations[i].cellNumber[0]]) 
				positions[combinations[i].cellNumber[0]] = combinations[i].cellNumber[1];
			stonesNumber[combinations[i].cellNumber[0]]++;

			if (!fsCol.length) continue;

			for (var j=0; j<fsCol.length; j++) {
				if (fsCol[j].cellNumber[1] < combinations[i].cellNumber[1]) {
					fsCol[j].cellNumber[1]++;
				}
			}
			
		}

		State.objects.score.addScore(score);

		for (var i=0; i<positions.length; i++) {
			if (positions[i] == 0) continue;

			for (var j=0; j<positions[i]; j++) {
				var s = self.getStone([i, j]);
				if (s !== null) {
					self.fallingStones[i].push(s);
					self.field[j][i] = null;
					s.setState('fall');
				}
			}
		}

		for (var i=0; i<self.cols; i++) {
			if (stonesNumber[i] != 0)
				self.addStones(i, stonesNumber[i]);
		}
	}

	this.onStoneFallen = function(stone) {
		var fallenStones = [];

		self.field[stone.cellNumber[1]][stone.cellNumber[0]] = stone;

		for (var i=0; i<self.fallingStones.length; i++) {
			if (self.fallingStones[stone.cellNumber[0]][i] == stone) {
				self.fallingStones[stone.cellNumber[0]].splice(i, 1);
				break;
			}
		}

		stone.confirmPosition();
		var combinations = self.getCombinations([stone]);
		if (!combinations.length) {
			if (State.objects.moveCounter.moves == 0 && self.fallingStonesEmpty() && !State.objects.score.gameFinished) {
				self.showFinalScreen(false);
			}
			return;
		}
		self.handleCombinations(combinations);
	}

	this.fallingStonesEmpty = function() {
		for (var i=0; i<self.fallingStones.length; i++) {
			if (self.fallingStones[i].length) return false;
		}

		return true;
	}

	this.showFinalScreen = function(win) {
		var coords = self.getHoveredCell();
		if (coords !== null && self.getStone(coords) !== null) self.getStone(coords).onMouseOut();
		State.handlers.pop();
		State.layers.GUI.push(new FinalScreen(win));
	}

	init();

}

Field.prototype = Object.create(Entity.prototype);

function Stone(ySpawn, cell, cellSize, fieldRect, type) {
	var self = this;

	this.texture = TextureLoader.get('entity', 'stones.png');

	this.position = { x: fieldRect.x + cell[0]*cellSize, y: ySpawn };

	this.cellNumber = cell.slice();

	this.startCellNumber = cell.slice();

	this.fieldRect = Object.create(fieldRect);

	this.cellSize = cellSize;

	this.size = { x: cellSize, y: cellSize };

	this.state = 'fall';

	this.dragOpts = {
		shiftX: null,
		shiftY: null
	}

	this.fallingSpeed = 350;

	this.movingTime = 0.2;

	this.timeElapsed = 0;

	this.velocity = null;

	this.moved = false;

	this.moveVector = {x: null, y: null};

	this.type = type;

	var rectPosition = { x: null, y: null };

	switch (type) {
	case Stones.HEART:
		rectPosition.x = 0;
		rectPosition.y = 0;
		break;
	case Stones.STAR:
		rectPosition.x = 120;
		rectPosition.y = 0;
		break;
	case Stones.RED:
		rectPosition.x = 240;
		rectPosition.y = 0;
		break;
	case Stones.GREEN:
		rectPosition.x = 360;
		rectPosition.y = 0;
		break;
	case Stones.BLUE:
		rectPosition.x = 480;
		rectPosition.y = 0;
		break;
	case Stones.BLUEDROP:
		rectPosition.x = 600;
		rectPosition.y = 0;
		break;
	}

	this.view = {
		'default': [rectPosition.x, rectPosition.y, 60, 60],
		'hover': [rectPosition.x + 60, rectPosition.y, 60, 60]
	}

	this.textureRect = this.view['default'];

	this.draw = function(context) {
		if (self.position.y <= self.fieldRect.y - self.cellSize) return;

		var drawRect = self.textureRect.slice();
		var position = Object.create(self.position);
		var size = [self.cellSize, self.cellSize];

		if (self.position.y < self.fieldRect.y) {
			var delta = self.fieldRect.y - self.position.y;

			drawRect[1] += delta;
			drawRect[3] -= delta;
			position.y += delta;
			size[1] -= delta;
		}

		if (self.position.x < self.fieldRect.x) {
			var delta = self.fieldRect.x - self.position.x;

			drawRect[0] += delta;
			drawRect[2] -= delta;
			position.x += delta;
			size[0] -= delta;
		}
		
		if (self.position.x + self.cellSize > self.fieldRect.x + self.fieldRect.width) {
			var delta = self.fieldRect.x + self.fieldRect.width - self.position.x;

			drawRect[2] = delta;
			size[0] = delta;
		}

		if (self.position.y + self.cellSize > self.fieldRect.y + self.fieldRect.height) {
			var delta = self.fieldRect.y + self.fieldRect.height - self.position.y;

			drawRect[3] = delta;
			size[1] = delta;
		}

		context.drawImage(self.texture, drawRect[0], drawRect[1], drawRect[2], drawRect[3], position.x, position.y, size[0], size[1]);
	}

	this.onMouseOver = function() {
		self.changeView('hover');
	}

	this.onMouseOut = function() {
		self.changeView('default');
	}

	this.changeView = function(view) {
		self.textureRect = self.view[view];
	}

	this.onMouseDown = function() {
		if (State.objects.moveCounter.moves == 0) return;
		if (self.state != 'free') return;
		self.dragOpts.shiftX = Mouse.x - self.position.x;
		self.dragOpts.shiftY = Mouse.y - self.position.y;
		self.setState('drag');
		State.objects.field.draggingStone = self;
		State.objects.field.mouseDown = true;
		self.changeStonePos();
		self.moved = true;
	}

	this.update = function(interval) {
		if (self.state == 'drag') {
			self.position.x = Mouse.x - self.dragOpts.shiftX;
			self.position.y = Mouse.y - self.dragOpts.shiftY;
		}
		else if (self.state == 'move') {
			self.position.x += self.moveVector.x * self.velocity * interval / 1000;
			self.position.y += self.moveVector.y * self.velocity * interval / 1000;
			
			if (self.moveVector.x == 0 && self.moveVector.y == 0) self.timeElapsed = self.movingTime;

			if (self.timeElapsed >= self.movingTime || 
				(self.moveVector.x > 0 && self.position.x > self.fieldRect.x + self.cellSize * self.cellNumber[0]) ||
				(self.moveVector.x < 0 && self.position.x < self.fieldRect.x + self.cellSize * self.cellNumber[0]) ||
				(self.moveVector.y > 0 && self.position.y > self.fieldRect.y + self.cellSize * self.cellNumber[1]) ||
				(self.moveVector.y < 0 && self.position.y < self.fieldRect.y + self.cellSize * self.cellNumber[1])) 
			{
				self.position.x = self.fieldRect.x + self.cellSize * self.cellNumber[0];
				self.position.y = self.fieldRect.y + self.cellSize * self.cellNumber[1];
				self.setState('free');
				self.timeElapsed = 0;
			} 

			self.timeElapsed += interval / 1000;
		}
		else if (self.state == 'fall') {
			self.position.y += self.fallingSpeed * interval / 1000;

			if (self.position.y > self.fieldRect.y + self.cellSize * self.cellNumber[1]) {
				self.position.y = self.fieldRect.y + self.cellSize * self.cellNumber[1];
				self.setState('free');
				
				State.objects.field.onStoneFallen(self);
			}
		}
	}

	this.setState = function(state) {
		if (self.state == state) return;

		if (state == 'move') {
			var vec = { 
				x: self.fieldRect.x + self.cellSize * self.cellNumber[0] - self.position.x, 
				y: self.fieldRect.y + self.cellSize * self.cellNumber[1] - self.position.y
			};

			var vec_len = Math.sqrt(vec.x * vec.x + vec.y * vec.y);

			self.velocity = vec_len / self.movingTime;

			self.moveVector = { x: vec_len == 0 ? 0 : vec.x / vec_len, y: vec_len == 0 ? 0 : vec.y / vec_len };
		}
		else if (state == 'fall' && self.state == 'move') {
			self.position.x = self.fieldRect.x + self.cellSize * self.startCellNumber[0];
			self.position.y = self.fieldRect.y + self.cellSize * self.startCellNumber[1];
		}

		self.state = state;
	}

	this.resetPosition = function() {
		self.cellNumber[0] = self.startCellNumber[0];
		self.cellNumber[1] = self.startCellNumber[1];
		self.moved = false;
		self.setState('move');
	}

	this.confirmPosition = function() {
		self.startCellNumber[0] = self.cellNumber[0];
		self.startCellNumber[1] = self.cellNumber[1];
		self.moved = false;
	}

	this.changeStonePos = function() {
		for (var i=0; i<State.layers.fg.length; i++) {
			if (State.layers.fg[i] == self) {
				State.layers.fg.push(self);
				State.layers.fg.splice(i, 1);
				break;
			}
		}
	}
}

Stone.prototype = Object.create(Entity.prototype);