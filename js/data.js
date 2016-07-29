var States = Object.freeze({
	STARTMENU: 0,
	RUNNING: 1
});

var Buttons = Object.freeze({
	STARTMENU: 0
});

var Stones = Object.freeze({
	HEART: 0,
	STAR: 1,
	RED: 2,
	GREEN: 3,
	BLUE: 4,
	BLUEDROP: 5
});

var GameData = {
	WIDTH: null,
	HEIGHT: null,
	level: 0,
	isWinner: false
}

var StateData = {};

StateData.loadingScreen = {
	textures: {
	},
	initObjects: function() {
	}
}

StateData[States.STARTMENU] = {
	textures: {
		'background': ['menu_bg.png'],
		'entity': ['button1.png']
	},
	initObjects: function() {
		State.layers.GUI.push(new Button([GameData.WIDTH / 2, 450], Buttons.STARTMENU, [0.5, 0]));
		State.layers.bg.push(new Background([0, 0], 'menu_bg.png'));
	}
}

StateData[States.RUNNING] = {
	textures: {
		'background': ['game_bg.png'],
		'entity': ['field.png', 'stones.png', 'score.png', 'score_indicator.png', 'digits.png', 'movecounter.png', 'finalscreen.png', 'subtitle.png']
	},
	initObjects: function() {
		var level = GameData.level;

		for (var type in Stones) {
			if (Stones[type] == Levels[level].preferredType) StonesScore[Stones[type]] = 4;
			else if (Stones[type] == Levels[level].unpreferredType) StonesScore[Stones[type]] = 1;
			else StonesScore[Stones[type]] = 2;
		}

		State.layers.bg.push(new Background([0, 0], 'game_bg.png'));

		var field = new Field([50, 50]);
		State.layers.main.push(field);
		State.objects.field = field;

		var score = new ScoreIndicator([65, 550], Levels[level].score);
		State.layers.main.push(score);
		State.objects.score = score;

		var moveCounter = new MoveCounter([65, 620], Levels[level].moves);
		State.layers.main.push(moveCounter);
		State.objects.moveCounter = moveCounter;
	}
}

var Handlers = {};

Handlers[States.STARTMENU] = {
	main: {
		handle: function() {
			for (var key in State.layers) {
				for (var i=0; i<State.layers[key].length; i++) {
					State.layers[key][i].handleEvents();
				}
			}
		}
	}
}

Handlers[States.RUNNING] = {
	main: {
		handle: function() {
			for (var key in State.layers) {
				for (var i=0; i<State.layers[key].length; i++) {
					State.layers[key][i].handleEvents();
				}
			}
		}
	},

	finalScreen: {
		handle: function() {
			if (Mouse.up()) {
				if (GameData.isWinner) {
					if (GameData.level < Levels.length - 1) GameData.level++;
					State.layers.GUI.push(new StartScreen());
				}
				else State.changeState(States.RUNNING);
			}
		}
	}
}

var StonesScore = {};

var Levels = [
	{
		score: 300,
		moves: 20,
		preferredType: Stones.RED,
		unpreferredType: Stones.STAR
	},

	{
		score: 400,
		moves: 25,
		preferredType: Stones.BLUEDROP,
		unpreferredType: Stones.BLUE
	}
]