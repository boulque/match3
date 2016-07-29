function GameObject(canvas) {
	var self = this;

	this.canvas = canvas;

	this.context = canvas.getContext('2d');

	this.FPS = 50;

	this.init = function() {
		Mouse.init(self.canvas);
		GameData.WIDTH = self.canvas.width;
		GameData.HEIGHT = self.canvas.height;
	}

	this.handleEvents = function() {
		State.handleEvents();
	}

	this.update = function() {
		Mouse.update();
		State.update(1000 / self.FPS);
	}

	this.draw = function() {
		self.context.clearRect(0, 0, GameData.WIDTH, GameData.HEIGHT);
		State.draw(self.context);
	}

	this.mainloop = function() {
		self.handleEvents();
		self.update();
		self.draw();
	}

	this.run = function() {
		self.init();
		LoadingScreen.load();
		LoadingScreen.setLoadingState(States.STARTMENU);

		setInterval(self.mainloop, 1000 / self.FPS);
	}
}



var StateMethods = {
	draw: function(context) {
		for (var i=0; i<this.layers.bg.length; i++) {
			this.layers.bg[i].draw(context);
		}
		for (var i=0; i<this.layers.main.length; i++) {
			this.layers.main[i].draw(context);
		}
		for (var i=0; i<this.layers.fg.length; i++) {
			this.layers.fg[i].draw(context);
		}
		for (var i=0; i<this.layers.GUI.length; i++) {
			this.layers.GUI[i].draw(context);
		}
	},

	drawLoading: function(context) {
		LoadingScreen.draw(context);
	},

	update: function(interval) {
		for (var key in this.layers) {
			for (var i=0; i<this.layers[key].length; i++) {
				this.layers[key][i].update(interval);
			}
		}
	},

	updateLoading: function(interval) {
		LoadingScreen.update(interval);
	}
}

var State = {
	handlers: [],

	layers: {
		bg: [],
		main: [],
		fg: [],
		GUI: []
	},

	objects: {},

	load: function(stateName) {
		var textures = StateData[stateName].textures;
		for (var key in textures) {
			for (var i=0; i<textures[key].length; i++) {
				TextureLoader.load(key, textures[key][i]);
			}
		}

		TextureLoader.loadingState = stateName;
	},

	onLoad: function() {
		this.draw = StateMethods.draw;
		this.update = StateMethods.update;
		this.handlers.push(Handlers[TextureLoader.loadingState].main);
		StateData[TextureLoader.loadingState].initObjects();
		TextureLoader.loadingState = null;
	},

	unload: function() {
		for (var key in this.layers) {
			this.layers[key] = [];
		}

		this.objects = {};
		this.handlers = [];
		this.draw = StateMethods.drawLoading;
		this.update = StateMethods.updateLoading;
	},

	handleEvents: function() {
		for (var i=0; i<this.handlers.length; i++) {
			this.handlers[i].handle();
		}
	},

	changeState: function(state) {
		this.unload();
		this.load(state);
		LoadingScreen.setLoadingState(state);
	}
}

State.draw = StateMethods.drawLoading;
State.update = StateMethods.updateLoading;

var LoadingScreen = {
	layers: {
		bg: [],
		main: [],
		fg: [],
		GUI: []
	},

	loaded: false,

	stateName: null,

	load: function() {
		for (var key in StateData.loadingScreen.textures) {
			for (var i=0; i<StateData.loadingScreen.textures[key].length; i++) {
				TextureLoader.load(key, StateData.loadingScreen.textures[key][i]);
			}
		}
	},

	setLoadingState: function(state) {
		this.stateName = state;
	},

	draw: function(context) {
		context.fillStyle = '#000';
		context.fillRect(0, 0, GameData.WIDTH, GameData.HEIGHT);
	},

	update: function(interval) {
		if (TextureLoader.loaded()) {
			if (TextureLoader.loadingState === null) {
				this.loaded = true;
				State.load(this.stateName);
				this.draw = StateMethods.draw;
				StateData.loadingScreen.initObjects();
			}
			else {
				State.onLoad();
				this.stateName = null;
			}
		}

		if (!this.loaded) return;

		this.updateObjects(interval);
	}
}

LoadingScreen.updateObjects = StateMethods.update;

var TextureLoader = {
	textures: {},

	contentFolderName: 'content',

	textureFolder: {
		'background': 'bg',
		'entity': 'entities'
	},

	loadingState: null,

	texturesLoading: 0,

	load: function(type, name) {
		var texturePath = this.contentFolderName + '/' + this.textureFolder[type] + '/' + name;
		if (this.textures[texturePath]) return;

		var texture = document.createElement('img');
		var obj = this;
		texture.src = texturePath;
		texture.onload = function() { 
			obj.texturesLoading--;
		}
		this.textures[texturePath] = texture;
		this.texturesLoading++;
	},

	get: function(type, name) {
		return this.textures[this.contentFolderName + '/' + this.textureFolder[type] + '/' + name];
	},

	loaded: function() {
		return !this.texturesLoading;
	}
}