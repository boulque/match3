function Entity() {}

Entity.prototype = {
	position: null,
	size: null,
	mouseOver: false,

	draw: function(context) {},
	update: function(interval) {},
	onMouseDown: function() {},
	onMouseUp: function() {},
	onMouseOver: function() {},
	onMouseOut: function() {},
	handleEvents: function() {
		if (Mouse.x > this.position.x &&
			Mouse.x < this.position.x + this.size.x &&
			Mouse.y > this.position.y &&
			Mouse.y < this.position.y + this.size.y) 
		{
			if (!this.mouseOver) {
				this.mouseOver = true;
				this.onMouseOver();
			}

			if (Mouse.down()) this.onMouseDown();
			else if (Mouse.up()) this.onMouseUp();
		}
		else if (this.mouseOver) {
			this.mouseOver = false;
			this.onMouseOut();
		}
	}
}

function Button(position, type, anchor) {
	var self = this;

	switch (type) {
	case Buttons.STARTMENU:
		this.texture = TextureLoader.get('entity', 'button1.png');
		break;	
	}

	this.size = { x: this.texture.width, y: this.texture.height / 2 };

	this.position = { x: position[0] - this.size.x*anchor[0], y: position[1] - this.size.y*anchor[1] };

	this.view = {
		'default': [0, 0, this.texture.width, this.texture.height / 2],
		'hover': [0, this.texture.height / 2, this.texture.width, this.texture.height / 2]
	}

	this.textureRect = this.view['default'];

	this.changeView = function(view) {
		self.textureRect = self.view[view];
	}

	this.draw = function(context) {
		context.drawImage(self.texture,
			self.textureRect[0], self.textureRect[1],
			self.textureRect[2], self.textureRect[3],
			self.position.x, self.position.y,
			self.size.x, self.size.y);
	}

	this.onMouseUp = function() {
		State.handlers = [];
		self.onMouseOut();
		State.layers.GUI.push(new BlackScreen(0.5));
	}

	this.onMouseOver = function() {
		self.changeView('hover');
	}

	this.onMouseOut = function() {
		self.changeView('default');
	}
}

Button.prototype = Object.create(Entity.prototype);

function BlackScreen(duration) {
	var self = this;

	this.position = { x: 0, y: 0};

	this.size = { x: GameData.WIDTH, y: GameData.HEIGHT };

	this.duration = duration;

	this.timeElapsed = 0;

	this.opacity = 0;

	this.draw = function(context) {
		context.fillStyle = 'rgba(0, 0, 0, ' + self.opacity + ')';
		context.fillRect(self.position.x, self.position.y, self.size.x, self.size.y);
	}

	this.update = function(interval) {
		self.opacity += (interval / 1000) / self.duration; 
		
		self.timeElapsed += interval / 1000;
		if (self.timeElapsed >= self.duration) {
			State.layers.GUI.pop();
			State.layers.GUI.push(new StartScreen());
		}
	}

}

BlackScreen.prototype = Object.create(Entity.prototype);

function Background(position, textureName) {
	var self = this;

	this.texture = TextureLoader.get('background', textureName);

	this.size = { x: this.texture.width, y: this.texture.height };

	this.position = { x: position[0], y: position[1] };

	this.draw = function(context) {
		context.drawImage(self.texture, self.position.x, self.position.y);
	}
}

Background.prototype = Object.create(Entity.prototype);

function ScoreIndicator(position, score) {
	var self = this;

	this.bgTexture = TextureLoader.get('entity', 'score.png');

	this.indicatorTexture = TextureLoader.get('entity', 'score_indicator.png');

	this.digits = TextureLoader.get('entity', 'digits.png');

	this.position = { x: position[0], y: position[1] };

	this.size = { x: this.bgTexture.width, y: this.bgTexture.height };

	this.maxScore = score;

	this.curScore = 0;

	this.curWidth = 0;

	this.maxWidth = this.indicatorTexture.width;

	this.state = 'stay';

	this.fillSpeed = null;

	this.approachTime = 0.5;

	this.digitRectWidth = 25;

	this.gameFinished = false;

	this.draw = function(context) {
		context.drawImage(self.bgTexture, self.position.x, self.position.y);

		if (self.curWidth > 0) 
			context.drawImage(self.indicatorTexture, 0, 0, self.curWidth, self.size.y, self.position.x + 8, self.position.y, self.curWidth, self.size.y);

		self.drawText(context);
	}

	this.drawText = function(context) {
		var chars = self.curScore.toString();
		chars += '/';

		chars += self.maxScore.toString();

		var textWidth = chars.length * self.digitRectWidth;

		var textLeft = self.position.x + self.size.x / 2 - textWidth / 2;

		for (var i=0; i<chars.length; i++) {
			var pos = (chars[i] == '/') ? 10 : +chars[i];

			context.drawImage(self.digits, self.digitRectWidth*pos, 0, self.digitRectWidth, 
				self.digits.height, textLeft + i*self.digitRectWidth, self.position.y + self.size.y / 2 - 15, self.digitRectWidth, self.digits.height);
		}
	}

	this.update = function(interval) {
		if (self.state == 'fill') {
			if (self.curWidth >= self.maxWidth * self.curScore / self.maxScore) {
				self.curWidth = self.maxWidth * self.curScore / self.maxScore;
				self.setState('stay');
			}
			else {
				self.curWidth += self.fillSpeed * interval / 1000;
			}
		}
	}

	this.setState = function(state) {
		if (self.state != state) self.state = state;
	}

	this.addScore = function(score) {
		if (self.gameFinished) return;

		self.curScore += score;

		if (self.curScore >= self.maxScore) {
			self.curScore = self.maxScore;
			State.objects.field.showFinalScreen(true);
			self.gameFinished = true;
		}
		
		self.fillSpeed = (self.maxWidth * self.curScore / self.maxScore - self.curWidth) / self.approachTime;
		self.setState('fill');
	}
}

ScoreIndicator.prototype = Object.create(Entity.prototype);

function MoveCounter(position, moves) {
	var self = this;

	this.texture = TextureLoader.get('entity', 'movecounter.png');

	this.size = { x: this.texture.width, y: this.texture.height };

	this.position = { x: position[0], y: position[1] };

	this.moves = moves;

	this.draw = function(context) {
		context.drawImage(self.texture, self.position.x, self.position.y);

		context.fillStyle = '#fff';
		context.font = 'bold 31px Calibri';

		var textWidth = context.measureText(self.moves.toString()).width;
		context.fillText(self.moves.toString(), self.position.x + self.size.x / 2 - textWidth / 2, self.position.y + 31);
	}

	this.decrease = function() {
		self.moves--;
	}
}

MoveCounter.prototype = Object.create(Entity.prototype);

function FinalScreen(isWinner) {
	var self = this;

	this.texture = TextureLoader.get('entity', 'finalscreen.png');

	this.subtitleTexture = TextureLoader.get('entity', 'subtitle.png');

	this.size = { x: this.texture.width, y: this.texture.height / 2 };

	this.position = { x: GameData.WIDTH / 2 - this.size.x / 2, y: GameData.HEIGHT / 2 - this.size.y / 2 };

	this.textureRect = [0, isWinner ? 0 : this.size.y, this.size.x, this.size.y];

	this.subtitleRect = [0, isWinner ? 0 : this.subtitleTexture.height / 2, this.subtitleTexture.width, this.subtitleTexture.height / 2];

	this.subtitlePosition = { x: GameData.WIDTH / 2 - this.subtitleRect[2] / 2, y: this.position.y + this.size.y };

	this.state = 'animate';

	this.squeezeCoeff = 0.3;

	this.animDuration = 1;

	this.waitDuration = 1;

	this.timeElapsed = 0;

	GameData.isWinner = isWinner;

	this.draw = function(context) {
		context.fillStyle = 'rgba(0,0,0,0.5)';
		context.fillRect(0, 0, GameData.WIDTH, GameData.HEIGHT);

		context.drawImage(self.texture, self.textureRect[0], self.textureRect[1], self.textureRect[2], self.textureRect[3], 
			self.position.x, self.position.y, self.size.x, self.size.y);

		if (self.state == 'stay')
			context.drawImage(self.subtitleTexture, self.subtitleRect[0], self.subtitleRect[1], self.subtitleRect[2], self.subtitleRect[3],
			self.subtitlePosition.x, self.subtitlePosition.y, self.subtitleRect[2], self.subtitleRect[3]);
	}

	this.update = function(interval) {
		if (self.state == 'animate') {
			self.size.x -= self.size.x * self.squeezeCoeff * interval / 1000;
			self.size.y -= self.size.y * self.squeezeCoeff * interval / 1000;

			self.position.x = GameData.WIDTH / 2 - this.size.x / 2;
			self.position.y = GameData.HEIGHT / 2 - this.size.y / 2;

			self.timeElapsed += interval / 1000;
			if (self.timeElapsed >= self.animDuration) {
				self.state = 'wait';
				self.timeElapsed = 0;
			}
		}
		else if (self.state == 'wait') {
			self.timeElapsed += interval / 1000;
			if (self.timeElapsed >= self.waitDuration) {
				self.state = 'stay';
				State.handlers.push(Handlers[States.RUNNING].finalScreen);
			}
		}
	}
}

FinalScreen.prototype = Object.create(Entity.prototype);

function StartScreen() {
	var self = this;

	this.text = 'Level ' + (GameData.level + 1);

	this.position = { x: 0, y: 0};

	this.size = { x: GameData.WIDTH, y: GameData.HEIGHT };

	this.timeElapsed = 0;

	this.duration = 3;

	this.draw = function(context) {
		context.fillStyle = '#000';
		context.fillRect(0, 0, self.size.x, self.size.y);
		context.fillStyle = '#fff';
		context.font = '40px Calibri Light';
		var textWidth = context.measureText(self.text).width;
		context.fillText(self.text, self.size.x / 2 - textWidth / 2, self.size.y / 2);
	}

	this.update = function(interval) {
		self.timeElapsed += interval / 1000;
		if (self.timeElapsed >= self.duration) {
			State.changeState(States.RUNNING);
		}
	}
}

StartScreen.prototype = Object.create(Entity.prototype);