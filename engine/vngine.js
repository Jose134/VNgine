(function () {
    let game = null; //Game data object

    let mainDiv = document.getElementById("vngine-div");
    
    //Screens
    const screens = {
        GAME:      "game",
        MENU:      "menu",
        SETTINGS:  "settings",
        SAVEFILES: "savefiles",
        BACKLOG:   "backlog",
        GALLERY:   "gallery"
    };

    //Characters DOM
    let characterImgs = [];

    //Game status
    let currentNode = null;
    let currentNodeIndex = 0;
    let currentDialogIndex = 0;

    //Text animation
    const textVeryFastTime = 15; //time that takes to write the next character (in ms)
    const textFastTime = 50;   
    const textMediumTime = 100;
    const textSlowTime = 200;  
    let textSpeed = textFastTime;

    //Skip
    let skip = false;
    let skipInterval = null;
    let skipIntervalTime = 50;

    //Gallery
    let unlockedCG = [];
    let galleryPages = 0;

    //Update needed flags
    let needToUpdateSavefilesScreen = true;
    let needToUpdateBacklogScreen = true;

    //Audio
    let audioUITap = "engine/res/audio/tap.mp3";

    //Game variables
    let customVariableKeys = [];

    const MathParser = class {
        //Math expression evaluation by @Aaron R.
        //https://stackoverflow.com/questions/11422513/evaluate-an-equation-in-javascript-without-eval
        static parens = /\(([0-9+\-*/\^ .]+)\)/             // Regex for identifying parenthetical expressions
        static exp = /(\d+(?:\.\d+)?) ?\^ ?(\d+(?:\.\d+)?)/ // Regex for identifying exponentials (x ^ y)
        static mul = /(\d+(?:\.\d+)?) ?\* ?(\d+(?:\.\d+)?)/ // Regex for identifying multiplication (x * y)
        static div = /(\d+(?:\.\d+)?) ?\/ ?(\d+(?:\.\d+)?)/ // Regex for identifying division (x / y)
        static add = /(\d+(?:\.\d+)?) ?\+ ?(\d+(?:\.\d+)?)/ // Regex for identifying addition (x + y)
        static sub = /(\d+(?:\.\d+)?) ?- ?(\d+(?:\.\d+)?)/  // Regex for identifying subtraction (x - y)static
        static gt  = /(\d+(?:\.\d+)?) ?> ?(\d+(?:\.\d+)?)/   // Regex for identifying greater than comparison (x > y)
        static gte = /(\d+(?:\.\d+)?) ?>= ?(\d+(?:\.\d+)?)/  // Regex for identifying greate or equal comparison (x >= y)
        static lt  = /(\d+(?:\.\d+)?) ?< ?(\d+(?:\.\d+)?)/   // Regex for identifying less than comparison (x < y)
        static lte = /(\d+(?:\.\d+)?) ?<= ?(\d+(?:\.\d+)?)/  // Regex for identifying less or equal comparison (x <= y)
        static eq  = /(\d+(?:\.\d+)?) ?== ?(\d+(?:\.\d+)?)/  // Regex for identifying equal comparison (x == y)

        /**
         * Evaluates a numerical expression as a string and returns a Number
         * Follows standard PEMDAS operation ordering
         * @param {String} expr Numerical expression input
         * @returns {Number} Result of expression
         */
        static evaluate = function (expr) {
            if(isNaN(Number(expr)))
            {
                if (this.parens.test(expr))
                {
                    let newExpr = expr.replace(this.parens, function(match, subExpr) {
                        return this.evaluate(subExpr);
                    });
                    return this.evaluate(newExpr);
                }
                else if (this.exp.test(expr))
                {
                    let newExpr = expr.replace(this.exp, function(match, base, pow) {
                        return Math.pow(Number(base), Number(pow));
                    });
                    return this.evaluate(newExpr);
                }
                else if (this.mul.test(expr))
                {
                    let newExpr = expr.replace(this.mul, function(match, a, b) {
                        return Number(a) * Number(b);
                    });
                    return this.evaluate(newExpr);
                }
                else if (this.div.test(expr))
                {
                    let newExpr = expr.replace(this.div, function(match, a, b) {
                        if (b != 0)
                            return Number(a) / Number(b);
                        else
                            throw new Error('Division by zero');
                    });
                    return this.evaluate(newExpr);
                }
                else if (this.add.test(expr))
                {
                    let newExpr = expr.replace(this.add, function(match, a, b) {
                        return Number(a) + Number(b);
                    });
                    return this.evaluate(newExpr);
                }
                else if (this.sub.test(expr))
                {
                    let newExpr = expr.replace(this.sub, function(match, a, b) {
                        return Number(a) - Number(b);
                    });
                    return this.evaluate(newExpr);
                }
                else if (this.gt.test(expr)) {
                    let newExpr = expr.replace(this.gt, function(match, a, b) {
                        return Number(a) > Number(b);
                    });
                    return this.evaluate(newExpr);
                }
                else if (this.gte.test(expr)) {
                    let newExpr = expr.replace(this.gte, function(match, a, b) {
                        return Number(a) >= Number(b);
                    });
                    return this.evaluate(newExpr);
                }
                else if (this.lt.test(expr)) {
                    let newExpr = expr.replace(this.lt, function(match, a, b) {
                        return Number(a) < Number(b);
                    });
                    return this.evaluate(newExpr);
                }
                else if (this.lte.test(expr)) {
                    let newExpr = expr.replace(this.lte, function(match, a, b) {
                        return Number(a) <= Number(b);
                    });
                    return this.evaluate(newExpr);
                }
                else if (this.eq.test(expr)) {
                    let newExpr = expr.replace(this.eq, function(match, a, b) {
                        return Number(a) == Number(b);
                    });
                    return this.evaluate(newExpr);
                }
                else
                {
                    return expr;
                }
            }
            
            return Number(expr);
        }
    }

    const Audio = class {
        static sfxAudioElement = null;
        static bgmAudioElement = null;
        
        static masterVolume = 100;
        static bgmVolume = 100;
        static sfxVolume = 100;

        static init = function () {
            this.sfxAudioElement = document.createElement("audio");
            this.sfxAudioElement.setAttribute("id", "vngine-audio-sfx");

            this.bgmAudioElement = document.createElement("audio");
            this.bgmAudioElement.setAttribute("id", "vngine-audio-bgm");
        }

        //Plays an audio effect
        static playEffect = function (src) {
            if (this.sfxAudioElement.getAttribute(src) != src) {
                this.sfxAudioElement.setAttribute("src", src);
                this.sfxAudioElement.load();
            }
            
            if (src === "") {
                this.sfxAudioElement.pause();
            }
            else {
                this.sfxAudioElement.volume = this.masterVolume / 100 * this.sfxVolume / 100;
                this.sfxAudioElement.play();
            }
        }

        //Plays background music
        static playMusic = function playMusic (src) {
            if (this.bgmAudioElement.getAttribute("src") != src) {
                this.bgmAudioElement.setAttribute("src", src);
                this.bgmAudioElement.load();
            }
            
            if (src === "") {
                this.bgmAudioElement.pause();
            }
            else {
                this.bgmAudioElement.volume = this.masterVolume / 100 * this.bgmVolume / 100;
                this.bgmAudioElement.loop = true;
                this.bgmAudioElement.play();
            }
            
        }
    }

    const UIDialogType = {
        CONFIRM: "confirm",
        INPUT: "input"
    }

    const UIDialog = class {

        static init = function () {
            generateDialogModal();
        }

        static show = function (type, callback, customMsg) {
            switch (type) {
                case UIDialogType.CONFIRM:
                    renderConfirmationDialog(callback, customMsg);
                    document.getElementById("vngine-dialog-modal").style.display = "block";
                    break;
                case UIDialogType.INPUT:
                    renderInputDialog(callback, customMsg);
                    document.getElementById("vngine-dialog-modal").style.display = "block";
                    break;    
                default:
                    console.error(`VNGINE_ERROR: ${type} not recognized as a UIDialogType`)
                    break;
            }
        }
    }

    const ScreenManager = class {
        static currentScreen = null;
        static previousScreen = null;

        static gameDiv = null;
        static menuDiv = null;
        static settingsDiv = null;
        static savefilesDiv = null;
        static backlogDiv = null;
        static galleryDiv = null;

        static init = function () {
            this.gameDiv      = generateGameScreen();
            this.menuDiv      = generateMenuScreen();
            this.settingsDiv  = generateSettingsScreen();
            this.savefilesDiv = generateSavefilesScreen();
            this.backlogDiv   = generateBacklogScreen();
            this.galleryDiv   = generateGalleryScreen();
        }

        static switchToScreen = function (screen) {
            this.previousScreen = this.currentScreen;
            this.currentScreen = screen;
    
            this.menuDiv.style.display      = "none";
            this.gameDiv.style.display      = "none";
            this.settingsDiv.style.display  = "none";
            this.savefilesDiv.style.display = "none";
            this.backlogDiv.style.display   = "none";
            this.galleryDiv.style.display   = "none";
    
            switch (screen) {
                case screens.MENU:
                    this.menuDiv.style.display = "block";
                    break;
                case screens.GAME:
                    this.gameDiv.style.display = "block";
                    break;
                case screens.SETTINGS:
                    this.settingsDiv.style.display = "block";
                    break;
                case screens.SAVEFILES:
                    if (needToUpdateSavefilesScreen) {
                        renderSavefileList();
                        needToUpdateSavefilesScreen = false;
                    }
                    this.savefilesDiv.style.display = "block";
                    break;
                case screens.BACKLOG:
                    if (needToUpdateBacklogScreen) {
                        renderBacklog();
                        needToUpdateBacklogScreen = false;
                    }
                    this.backlogDiv.style.display = "block";
                    break;
                case screens.GALLERY:
                    renderGallery(0);
                    this.galleryDiv.style.display = "block";
                    break;
                default:
                    this.currentScreen = null;
                    console.error(`VNGINE_ERROR: Couldn't load screen named ${screen}`);
                    break;
            }
        }

        static switchToPreviousScreen = function () {
            this.switchToScreen(this.previousScreen);
        }
    
    }

    const DialogBox = class {
        static dialogBoxDiv;
        static optionsDiv;
        static visible = true;

        static writingInterval;
        static dialogBoxText;
        static dialogBoxCharacter;

        static isWriting = false;
        static currentTargetText;
        static writtenCharacters = 0;

        static init = function () {
            this.dialogBoxDiv = document.getElementById("vngine-dialog-box");
            this.optionsDiv = document.getElementById("vngine-option-text-container");
            this.dialogBoxText = document.getElementById("vngine-dialog-text");
            this.dialogBoxCharacter = document.getElementById("vngine-dialog-character");
        }

        static setCharacter = function (character) {
            this.dialogBoxCharacter.innerText = character;
        }

        static writeText = function (str) {
            this.cancelWritingAnimation();
            
            this.dialogBoxText.innerText = "";
            this.writtenCharacters = 0;

            this.currentTargetText = str;
            this.isWriting = true;
            
            this.writingInterval = setInterval(() => {
                if (this.writtenCharacters == str.length) {
                    this.isWriting = false;
                    clearInterval(this.writingInterval);
                    return;
                }

                if (str[this.writtenCharacters] == " ") {
                    this.dialogBoxText.innerText += " " + str[this.writtenCharacters+1];
                    this.writtenCharacters += 2;
                }
                else {
                    this.dialogBoxText.innerText += str[this.writtenCharacters];
                    this.writtenCharacters++;
                }
            }, textSpeed);
        }

        static cancelWritingAnimation = function () {
            this.isWriting = false;
            clearInterval(this.writingInterval);
            this.dialogBoxText.innerText = this.currentTargetText;
        }

        static toggleVisibility = function () {
            if (currentNode &&
                currentNode.decision ||
                currentNode.input
            ) return;

            this.visible = !this.visible;
            this.dialogBoxDiv.style.display = this.visible ? "block" : "none";
            this.optionsDiv.style.display = this.visible ? "block" : "none";
        }

        static setVisible = function (visible) {
            this.visible = visible;
            this.dialogBoxDiv.style.display = this.visible ? "block" : "none";
            this.optionsDiv.style.display = this.visible ? "block" : "none";
        }
    }

    const keyEvent = {
        DOWN: 0,
        UP: 1
    };

    const KeyboardInput = class {
        static keyInfo = {};

        static init = function () {
            //Set up event listeners
            window.addEventListener("keydown", e => {
                if (this.keyInfo[e.code] && !this.keyInfo[e.code].held) {
                    //Set key as held
                    this.keyInfo[e.code].held = true;

                    //Call all the callbacks if the dialog modal is not displaying
                    //We need to check for the modal to prevent the user from triggering game functions
                    //while typing in the form
                    let modalDisplay = document.getElementById("vngine-dialog-modal").style.display;
                    if (!modalDisplay || modalDisplay == "none") {
                        if (this.keyInfo[e.code].keyDownCallbacks) {
                            this.keyInfo[e.code].keyDownCallbacks.forEach(c => c());
                        }
                    }
                }
            });
        
            window.addEventListener("keyup", e => {
                if (this.keyInfo[e.code]) {
                    //Set key as not being held
                    this.keyInfo[e.code].held = false;

                    //Call all the callbacks if the dialog modal is not displaying
                    //We need to check for the modal to prevent the user from triggering game functions
                    //while typing in the form
                    let modalDisplay = document.getElementById("vngine-dialog-modal").style.display;
                    if (!modalDisplay || modalDisplay == "none") {
                        if (this.keyInfo[e.code].keyUpCallbacks) {
                            this.keyInfo[e.code].keyUpCallbacks.forEach(c => c());
                        }
                    }
                }
            });
        }

        static addKeyCallback = function (event, keycode, callback) {
            if (!this.keyInfo[keycode]) {
                this.keyInfo[keycode] = {};
                this.keyInfo[keycode].held = false;
                this.keyInfo[keycode].keyDownCallbacks = [];
                this.keyInfo[keycode].keyUpCallbacks = [];
            }

            if (event == keyEvent.DOWN) {
                this.keyInfo[keycode].keyDownCallbacks.push(callback);
            }
            else if (event == keyEvent.UP) {
                this.keyInfo[keycode].keyUpCallbacks.push(callback);
            }
            else {
                console.error(`VNGINE_ERROR: Key event type ${event} not recognized`);
            }
        }
    }

    const MouseWheelInput = class {
        static wheelUpCallbacks = [];
        static wheelDownCallbacks = [];

        static init = function () {
            //Set up event listeners
            window.addEventListener("wheel", e => {
                if (e.deltaY < 0) {
                    this.wheelUpCallbacks.forEach(c => c());
                }
                else if (e.deltaY > 0) {
                    this.wheelDownCallbacks.forEach(c => c());
                }
            })
        }

        static addWheelUpCallback = function (callback) {
            this.wheelUpCallbacks.push(callback);
        }
        
        static addWheelDownCallback = function (callback) {
            this.wheelDownCallbacks.push(callback);
        }
    }

    const Settings = class {
        static defaultSettings = {
            "textSpeed": textFastTime,
            "masterVolume": 100,
            "bgmVolume": 100,
            "sfxVolume": 100
        };

        static load = function () {
            let userSettings = localStorage.getItem("userSettings");
            if (userSettings == null) {
                userSettings = this.defaultSettings;
            }
            else {
                try {
                    userSettings = JSON.parse(userSettings);
                }
                catch (e) {
                    console.warn(`VNGINE_WARNING: Exception thrown while trying to parse userSettings ${e}`);
                    userSettings = this.defaultSettings;
                }
            }
            textSpeed = userSettings.textSpeed
            Audio.masterVolume = userSettings.masterVolume;
            Audio.bgmVolume = userSettings.bgmVolume;
            Audio.sfxVolume = userSettings.sfxVolume;
        }
        
        static save = function () {
            let userSettings = {
                "textSpeed": textSpeed,
                "masterVolume": Audio.masterVolume,
                "bgmVolume": Audio.bgmVolume,
                "sfxVolume": Audio.sfxVolume
            };

            localStorage.setItem("userSettings", JSON.stringify(userSettings));
        }

        static clear = function () {
            localStorage.setItem("userSettings", JSON.stringify(this.defaultSettings));
            this.load();
        }
    }

    const backlogEntryType = {
        DIALOG: 0,
        DECISION: 1
    }

    const Backlog = class {
        static stack = [];

        static push = function (backlogEntry) {
            this.stack.push(backlogEntry);
        }

        static pop = function () {
            this.stack.pop();
        }

        static top = function () {
            if (this.stack.length > 0) {
                return this.stack[this.stack.length-1];
            }

            return null;
        }

        static length = function () {
            return this.stack.length
        }

        static getAsArray = function () {
            return this.stack;
        }

        static getAsTextArray = function () {
            let output = [];
            this.stack.forEach(entry => {
                if (entry.type == backlogEntryType.DIALOG) {
                    let dialogEntry = game.nodes[entry.nodeIndex].dialog[entry.dialogIndex];
                    output.push(`${game.characters[dialogEntry.character].name}: ${dialogEntry.text}`)
                }
                else if (entry.type == backlogEntryType.DECISION) {
                    let decisionTaken = game.nodes[entry.nodeIndex].decision[entry.decisionIndex];
                    output.push(`*${decisionTaken.text}*`);
                }
            });

            return output;
        }
    }
    
    //Initialization
    window.onload = function () {
        if (!mainDiv) {
            console.error("VNGINE_ERROR: no element with id 'vngine-div' was found!");
            return;
        }

        //Loads the game JSON file into the "game" variable
        game = gameJSON;
        
        //Loads user settings
        Settings.load();
        
        //Initialize subsystems
        KeyboardInput.init();
        MouseWheelInput.init();
        Audio.init();
        ScreenManager.init();
        DialogBox.init();
        UIDialog.init();
        
        //Sets up keyboard callbacks
        KeyboardInput.addKeyCallback(keyEvent.DOWN, "Space",        () => gameClickEvent());
        KeyboardInput.addKeyCallback(keyEvent.DOWN, "Enter",        () => gameClickEvent());
        KeyboardInput.addKeyCallback(keyEvent.DOWN, "ControlLeft",  () => DialogBox.toggleVisibility());
        KeyboardInput.addKeyCallback(keyEvent.DOWN, "ControlRight", () => DialogBox.toggleVisibility());
        KeyboardInput.addKeyCallback(keyEvent.DOWN, "Escape",       () => escapePressedEvent());
        KeyboardInput.addKeyCallback(keyEvent.DOWN, "KeyS",         () => toggleSkip());
        KeyboardInput.addKeyCallback(keyEvent.UP,   "KeyS",         () => toggleSkip());
        KeyboardInput.addKeyCallback(keyEvent.DOWN, "KeyF",         () => toggleFullscreen());

        //Sets up mouse wheel callbacks
        MouseWheelInput.addWheelDownCallback(() => gameClickEvent());
        MouseWheelInput.addWheelUpCallback(() => gameBack());

        //Loads the unlocked CGs array
        unlockedCG = localStorage.getItem("cg");
        if (unlockedCG == null) {
            //If there's no cg stored, make it an empty array
            unlockedCG = [];
        }
        else {
            //Convert string to array of ints (comma separated)
            unlockedCG = unlockedCG.split(",").map(x => parseInt(x));
        }

        if (game.uiColors) {
            readColorPalette();
        }

        if (game.uiAudio) {
            readAudio();
        }

        if (game.customVariables) {
            customVariableKeys = Object.keys(game.customVariables);
        }

        //Goes to the main menu
        ScreenManager.switchToScreen(screens.MENU);
    }

    function generateDialogModal () {
        /* HTML to generate
        <div id="vngine-dialog-modal" class="vngine-dialog-modal">
            <div id="vngine-dialog-modal-content" class="vngine-dialog-modal-content">
                <div id="vngine-dialog-modal-body" class="vngine-dialog-modal-body"></div>
            </div>
        </div>
        */
        let modalDiv = document.createElement("div");
        modalDiv.setAttribute("id", "vngine-dialog-modal");
        modalDiv.classList.add("vngine-dialog-modal");
        
        let modalContentDiv = document.createElement("div");
        modalContentDiv.setAttribute("id", "vngine-dialog-modal-content");
        modalContentDiv.classList.add("vngine-dialog-modal-content");

        let modalBodyDiv = document.createElement("div");
        modalBodyDiv.setAttribute("id", "vngine-dialog-modal-body");
        modalBodyDiv.classList.add("vngine-dialog-modal-body");

        //Appending
        modalContentDiv.appendChild(modalBodyDiv);
        modalDiv.appendChild(modalContentDiv);

        mainDiv.appendChild(modalDiv);

        return modalDiv;
    }

    //Creates all the DOM elements needed for the game screen
    function generateGameScreen () {
        /* HTML to generate
        <div id="vngine-game" class="vngine-screen vngine-game">
            <div id="vngine-game-background" class="vngine-game-background"></div>
            <div class="vngine-option-text-container">
                <a class="vngine-option-text" id="menuText">Menu</a>
                <a class="vngine-option-text" id="saveText">Save</a>
                <a class="vngine-option-text" id="loadText">Load</a>
                <a class="vngine-option-text">Skip</a>
                <a class="vngine-option-text" id="settingsText">Settings</a>
            </div>
            <div id="vngine-game-click-detector" class="vngine-game-click-detector"></div>
            <div class="vngine-btn-group"></div><div class="vngine-characters-div"></div>
            <div id="vngine-dialog-box" class="vngine-dialog-box" style="display: block;">
                <p id="vngine-dialog-character" class="vngine-dialog-character"></p>
                <p id="vngine-dialog-text" class="vngine-dialog-text"></p>
            </div>
        </div>
        */

        let gameDiv = document.createElement("div");
        gameDiv.setAttribute("id", "vngine-game");
        gameDiv.classList.add("vngine-screen", "vngine-game");

        let gameBackground = document.createElement("div");
        gameBackground.setAttribute("id", "vngine-game-background");
        gameBackground.classList.add("vngine-game-background");

        let clickDetector = document.createElement("div");
        clickDetector.setAttribute("id", "vngine-game-click-detector");
        clickDetector.classList.add("vngine-game-click-detector");
        document.addEventListener("click", e => {
            if (e.target && e.target.id == "vngine-game-click-detector") {
                gameClickEvent();
            }
        });

        let decisionButtonsDiv = document.createElement("div");
        decisionButtonsDiv.setAttribute("id", "vngine-decision-buttons");
        decisionButtonsDiv.classList.add("vngine-btn-group");

        let charactersDiv = document.createElement("div");
        charactersDiv.setAttribute("id", "vngine-characters-div");
        charactersDiv.classList.add("vngine-characters-div");

        let vngineDialogBox = document.createElement("div");
        vngineDialogBox.setAttribute("id", "vngine-dialog-box");
        vngineDialogBox.classList.add("vngine-dialog-box");

        dialogBoxCharacter = document.createElement("p");
        dialogBoxCharacter.setAttribute("id", "vngine-dialog-character");
        dialogBoxCharacter.classList.add("vngine-dialog-character");

        dialogBoxText = document.createElement("p");
        dialogBoxText.setAttribute("id", "vngine-dialog-text");
        dialogBoxText.classList.add("vngine-dialog-text");

        let optionsContainer = document.createElement("div");
        optionsContainer.setAttribute("id", "vngine-option-text-container");
        optionsContainer.classList.add("vngine-option-text-container");

        let menuText = document.createElement("a");
        menuText.innerText = "Menu";
        menuText.classList.add("vngine-option-text");
        menuText.setAttribute("id", "menuText");
        document.addEventListener("click", e => {
            if (e.target && e.target.id == "menuText") {
                Audio.playEffect(audioUITap);
                ScreenManager.switchToScreen(screens.MENU);
            }
        });

        let backText = document.createElement("a");
        backText.innerText = "Back";
        backText.classList.add("vngine-option-text");
        backText.setAttribute("id", "backText");
        document.addEventListener("click", e => {
            if (e.target && e.target.id == "backText") {
                Audio.playEffect(audioUITap);
                gameBack();
            }
        });

        let backlogText = document.createElement("a");
        backlogText.innerText = "Backlog";
        backlogText.classList.add("vngine-option-text");
        backlogText.setAttribute("id", "backlogText");
        document.addEventListener("click", e => {
            if (e.target && e.target.id == "backlogText") {
                Audio.playEffect(audioUITap);
                ScreenManager.switchToScreen(screens.BACKLOG);
            }
        });

        let saveText = document.createElement("a");
        saveText.innerText = "Save";
        saveText.classList.add("vngine-option-text");
        saveText.setAttribute("id", "saveText");
        document.addEventListener("click", e => {
            if (e.target && e.target.id == "saveText") {
                Audio.playEffect(audioUITap);
                let now = new Date();
                let key = now.getUTCFullYear() + "-" + (now.getMonth()+1) + "-" + (now.getDay()+1) + "   "
                        + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
                save(key);
            }
        });
        
        let loadText = document.createElement("a");
        loadText.innerText = "Load";
        loadText.classList.add("vngine-option-text");
        loadText.setAttribute("id", "loadText");
        document.addEventListener("click", e => {
            if (e.target && e.target.id == "loadText") {
                Audio.playEffect(audioUITap);
                ScreenManager.switchToScreen(screens.SAVEFILES);
            }
        });

        let skipText = document.createElement("a");
        skipText.innerText = "Skip";
        skipText.classList.add("vngine-option-text");
        skipText.setAttribute("id", "skipText");
        document.addEventListener("click", e => {
            if (e.target && e.target.id == "skipText") {
                Audio.playEffect(audioUITap);
                toggleSkip();
            }
        });

        let settingsText = document.createElement("a");
        settingsText.innerText = "Settings";
        settingsText.classList.add("vngine-option-text");
        settingsText.setAttribute("id", "settingsText");
        document.addEventListener("click", e => {
            if (e.target && e.target.id == "settingsText") {
                Audio.playEffect(audioUITap);
                ScreenManager.switchToScreen(screens.SETTINGS);
            }
        });

        //Appending
        optionsContainer.appendChild(menuText);
        optionsContainer.appendChild(backText);
        optionsContainer.appendChild(backlogText);
        optionsContainer.appendChild(saveText);
        optionsContainer.appendChild(loadText);
        optionsContainer.appendChild(skipText);
        optionsContainer.appendChild(settingsText);
        vngineDialogBox.appendChild(dialogBoxCharacter);
        vngineDialogBox.appendChild(dialogBoxText);
        gameDiv.appendChild(gameBackground);
        gameDiv.appendChild(optionsContainer);
        gameDiv.appendChild(clickDetector);
        gameDiv.appendChild(decisionButtonsDiv);
        gameDiv.appendChild(charactersDiv);
        gameDiv.appendChild(vngineDialogBox);

        mainDiv.appendChild(gameDiv);

        return gameDiv;
    }
    
    //Creates all the DOM elements needed for the menu screen
    function generateMenuScreen () {
        /* HTML to generate
        <div id="vngine-menu" class="vngine-screen vngine-menu" style="display: block;">
            <h1 id="vngine-menu-title" class="vngine-menu-title">Test Game</h1>
            <div class="vngine-btn-group">
                <button class="vngine-btn" id="vngine-menu-newgame-btn">New Game</button>
                <button id="vngine-menu-continue-btn" class="vngine-btn">Continue</button>
                <button id="vngine-menu-settings-btn" class="vngine-btn">Settings</button>
            </div>
        </div>
        */

        //Menu Screen
        let menuDiv = document.createElement("div");
        menuDiv.setAttribute("id", "vngine-menu");
        menuDiv.classList.add("vngine-screen", "vngine-menu");
        menuDiv.style.display = "none";
        if (game.menuBackground) {
            menuDiv.style.backgroundImage = `url(game/res/img/backgrounds/${game.menuBackground})`;
        }

        //Logo
        let logo = null;
        if (game.enableVNgineLogo) {
            logo = document.createElement("img");
            logo.setAttribute("id", "vngine-menu-logo");
            logo.classList.add("vngine-menu-logo");
            logo.src = (game.VNgineLogoVersion && game.VNgineLogoVersion == "dark")
                ? "engine/res/img/poweredbydark.png"
                : "engine/res/img/poweredbylight.png"
            ;
            logo.addEventListener("click", e => {
                window.open("https://github.com/Jose134/vngine", "_a")
            })
        }
        
        //Title text
        let titleText = document.createElement("h1");
        titleText.setAttribute("id", "vngine-menu-title");
        titleText.classList.add("vngine-menu-title");
        titleText.innerText = game.title;

        //Buttons div
        let btnGroup = document.createElement("div");
        btnGroup.classList.add("vngine-btn-group");
        
        //Buttons
        let newGameBtn = document.createElement("button");
        newGameBtn.innerText = "New Game";
        newGameBtn.classList.add("vngine-btn");
        newGameBtn.setAttribute("id", "vngine-menu-newgame-btn");
        document.addEventListener("click", e => {
            if (e.target && e.target.id == "vngine-menu-newgame-btn") {
                Audio.playEffect(audioUITap);
                Backlog.stack = [];
                if (skip) toggleSkip();
                
                ScreenManager.switchToScreen(screens.GAME);
                DialogBox.setVisible(true);
                
                loadNode(0);
                if (currentNode.dialog) {
                    updateDialog();
                }
            }
        });
        
        let continueBtn = document.createElement("button");
        continueBtn.innerText = "Continue";
        continueBtn.setAttribute("id", "vngine-menu-continue-btn");
        continueBtn.classList.add("vngine-btn");
        document.addEventListener("click", e => {
            if (e.target && e.target.id == "vngine-menu-continue-btn") {
                Audio.playEffect(audioUITap);
                ScreenManager.switchToScreen(screens.SAVEFILES);
            }
        });
        
        let galleryBtn = document.createElement("button");
        galleryBtn.innerText = "CG Gallery";
        galleryBtn.setAttribute("id", "vngine-menu-gallery-btn");
        galleryBtn.classList.add("vngine-btn");
        document.addEventListener("click", e => {
            if (e.target && e.target.id == "vngine-menu-gallery-btn") {
                Audio.playEffect(audioUITap);
                ScreenManager.switchToScreen(screens.GALLERY);
            }
        });
        
        let settingsBtn = document.createElement("button");
        settingsBtn.innerText = "Settings";
        settingsBtn.setAttribute("id", "vngine-menu-settings-btn");
        settingsBtn.classList.add("vngine-btn");
        document.addEventListener("click", e => {
            if (e.target && e.target.id == "vngine-menu-settings-btn") {
                Audio.playEffect(audioUITap);
                ScreenManager.switchToScreen(screens.SETTINGS);
            }
        });
        
        //Appending
        btnGroup.appendChild(newGameBtn);
        btnGroup.appendChild(continueBtn);
        btnGroup.appendChild(galleryBtn);
        btnGroup.appendChild(settingsBtn);
        menuDiv.appendChild(titleText);
        if(logo) menuDiv.appendChild(logo);
        menuDiv.appendChild(btnGroup);

        mainDiv.appendChild(menuDiv);

        return menuDiv;
    }

    //Creates all the DOM elements needed for the gallery screen
    function generateGalleryScreen () {
        /* HTML to generate

        */
        let galleryDiv = document.createElement("div");
        galleryDiv.setAttribute("id", "vngine-gallery");
        galleryDiv.classList.add("vngine-screen", "vngine-gallery");
        if (game.galleryBackground) {
            galleryDiv.style.backgroundImage = `url(game/res/img/backgrounds/${game.galleryBackground})`;
        }
        
        let galleryHeader = document.createElement("div");
        galleryHeader.setAttribute("id", "vngine-gallery-header");
        galleryHeader.classList.add("vngine-header");

        let backBtn = document.createElement("button");
        backBtn.setAttribute("id", "vngine-gallery-back");
        backBtn.classList.add("vngine-btn", "vngine-back-btn");
        backBtn.innerText = "Back";
        backBtn.addEventListener("click", e => {
            if (e.target && e.target.id == "vngine-gallery-back") {
                Audio.playEffect(audioUITap);
                ScreenManager.switchToPreviousScreen();
            }
        });
        
        let galleryHeaderText = document.createElement("p");
        galleryHeaderText.setAttribute("id", "vngine-gallery-header-text");
        galleryHeaderText.classList.add("vngine-header-text");
        galleryHeaderText.innerText = "Gallery";

        let galleryBody = document.createElement("div");
        galleryBody.setAttribute("id", "vngine-gallery-body");
        galleryBody.classList.add("vngine-gallery-body");

        let galleryFooter = document.createElement("div");
        galleryFooter.setAttribute("id", "vngine-gallery-footer");
        galleryFooter.classList.add("vngine-gallery-footer");

        galleryPages = Math.ceil(game.gallery.length / 6);
        for (let i = 0; i < galleryPages; i++) {
            let pageText = document.createElement("a");
            pageText.setAttribute("id", `vngine-gallery-page-text-${i}`);
            pageText.classList.add("vngine-gallery-page-text");
            pageText.innerText = `${i+1}`;
            pageText.addEventListener("click", e => {
                Audio.playEffect(audioUITap);
                if (!e.target.classList.contains("vngine-gallery-page-selected")) {
                    renderGallery(i);
                }
            });

            galleryFooter.appendChild(pageText);
        }

        //Appending
        galleryHeader.appendChild(backBtn);
        galleryHeader.appendChild(galleryHeaderText);
        galleryDiv.appendChild(galleryHeader);
        galleryDiv.appendChild(galleryBody);
        galleryDiv.appendChild(galleryFooter);
        mainDiv.appendChild(galleryDiv);

        return galleryDiv;
    }
    
    //Creates all the DOM elements needed for the settings screen
    function generateSettingsScreen () {
        /* HTML to generate

        */
        let settingsDiv = document.createElement("div");
        settingsDiv.setAttribute("id", "vngine-settings");
        settingsDiv.classList.add("vngine-screen", "vngine-settings");
        if (game.settingsBackground) {
            settingsDiv.style.backgroundImage = `url(game/res/img/backgrounds/${game.settingsBackground})`;
        }
        
        let settingsHeader = document.createElement("div");
        settingsHeader.setAttribute("id", "vngine-settings-header");
        settingsHeader.classList.add("vngine-header");

        let backBtn = document.createElement("button");
        backBtn.setAttribute("id", "vngine-settings-back");
        backBtn.classList.add("vngine-btn", "vngine-back-btn");
        backBtn.innerText = "Back";
        backBtn.addEventListener("click", e => {
            if (e.target && e.target.id == "vngine-settings-back") {
                Audio.playEffect(audioUITap);
                ScreenManager.switchToPreviousScreen();
            }
        });
        
        let settingsHeaderText = document.createElement("p");
        settingsHeaderText.setAttribute("id", "vngine-settings-header-text");
        settingsHeaderText.classList.add("vngine-header-text");
        settingsHeaderText.innerText = "Settings";

        let settingsBody = document.createElement("div");
        settingsBody.setAttribute("id", "vngine-settings-body");
        settingsBody.classList.add("vngine-settings-body");

        //Text speed panel
        let settingsTextSpeedDiv = document.createElement("div");
        settingsTextSpeedDiv.setAttribute("id", "vngine-settings-text-speed");
        settingsTextSpeedDiv.classList.add("vngine-settings-text-speed");

        let textSpeedLabel = document.createElement("label");
        textSpeedLabel.setAttribute("for", "vngine-text-speed-range");
        textSpeedLabel.innerText = "Text Speed: ";

        let textSpeedSelect = document.createElement("select");
        textSpeedSelect.setAttribute("id", "vngine-text-speed-select");
        textSpeedSelect.setAttribute("name", "vngine-text-speed-select");
        textSpeedSelect.addEventListener("change", e => {
            switch (e.target.value) {
                case "veryfast":
                    textSpeed = textVeryFastTime;
                    break;
                case "fast":
                    textSpeed = textFastTime;
                    break;
                case "medium":
                    textSpeed = textMediumTime;
                    break;
                case "slow":
                    textSpeed = textSlowTime;
                    break;
            }
            Settings.save();
        });

        let textSpeedOptionVeryFast = document.createElement("option");
        textSpeedOptionVeryFast.setAttribute("value", "veryfast");
        textSpeedOptionVeryFast.innerText = "Very Fast";
        
        let textSpeedOptionFast = document.createElement("option");
        textSpeedOptionFast.setAttribute("value", "fast");
        textSpeedOptionFast.innerText = "Fast";
        
        let textSpeedOptionMedium = document.createElement("option");
        textSpeedOptionMedium.setAttribute("value", "medium");
        textSpeedOptionMedium.innerText = "Medium";
        
        let textSpeedOptionSlow = document.createElement("option");
        textSpeedOptionSlow.setAttribute("value", "slow");
        textSpeedOptionSlow.innerText = "Slow";

        //NOTE: We need to append the options before being able to modify the selectedIndex
        textSpeedSelect.appendChild(textSpeedOptionVeryFast);
        textSpeedSelect.appendChild(textSpeedOptionFast);
        textSpeedSelect.appendChild(textSpeedOptionMedium);
        textSpeedSelect.appendChild(textSpeedOptionSlow);
        
        textSpeedSelect.selectedIndex =
            textSpeed == textVeryFastTime ? 0 :
            textSpeed == textFastTime     ? 1 : 
            textSpeed == textMediumTime   ? 2 :
            textSpeed == textSlowTime     ? 3 :
            1
        ;

        //Sound panel
        let settingsSoundDiv = document.createElement("div");
        settingsSoundDiv.setAttribute("id", "vngine-settings-sound");
        settingsSoundDiv.classList.add("vngine-settings-sound");

        let masterVolumeLabel = document.createElement("label");
        masterVolumeLabel.setAttribute("for", "vngine-settings-master-volume-range");
        masterVolumeLabel.innerText = "Master";

        let masterVolumeRange = document.createElement("input");
        masterVolumeRange.setAttribute("type", "range");
        masterVolumeRange.setAttribute("id", "vngine-settings-master-volume-range");
        masterVolumeRange.setAttribute("name", "vngine-settings-master-volume-range");
        masterVolumeRange.value = Audio.masterVolume;
        masterVolumeRange.addEventListener("change", e => {
            document.getElementById("vngine-settings-master-volume-text").innerText = e.target.value + '%';
            Audio.masterVolume = e.target.value;
            Settings.save();
        });

        let masterVolumePercentageText = document.createElement("a");
        masterVolumePercentageText.setAttribute("id", "vngine-settings-master-volume-text");
        masterVolumePercentageText.innerText = masterVolumeRange.value + '%';

        let bgmVolumeLabel = document.createElement("label");
        bgmVolumeLabel.setAttribute("for", "vngine-settings-bgm-volume-range");
        bgmVolumeLabel.innerText = "Music";

        let bgmVolumeRange = document.createElement("input");
        bgmVolumeRange.setAttribute("type", "range");
        bgmVolumeRange.setAttribute("id", "vngine-settings-bgm-volume-range");
        bgmVolumeRange.setAttribute("name", "vngine-settings-bgm-volume-range");
        bgmVolumeRange.value = Audio.bgmVolume;
        bgmVolumeRange.addEventListener("change", e => {
            document.getElementById("vngine-settings-bgm-volume-text").innerText = e.target.value + '%';
            Audio.bgmVolume = e.target.value;
            Settings.save();
        });

        let bgmVolumePercentageText = document.createElement("a");
        bgmVolumePercentageText.setAttribute("id", "vngine-settings-bgm-volume-text");
        bgmVolumePercentageText.innerText = bgmVolumeRange.value + '%';

        let sfxVolumeLabel = document.createElement("label");
        sfxVolumeLabel.setAttribute("for", "vngine-settings-sfx-volume-range");
        sfxVolumeLabel.innerText = "Effects";

        let sfxVolumeRange = document.createElement("input");
        sfxVolumeRange.setAttribute("type", "range");
        sfxVolumeRange.setAttribute("id", "vngine-settings-sfx-volume-range");
        sfxVolumeRange.setAttribute("name", "vngine-settings-sfx-volume-range");
        sfxVolumeRange.value = Audio.sfxVolume;
        sfxVolumeRange.addEventListener("change", e => {
            document.getElementById("vngine-settings-sfx-volume-text").innerText = e.target.value + '%';
            Audio.sfxVolume = e.target.value;
            Settings.save();
        });

        let sfxVolumePercentageText = document.createElement("a");
        sfxVolumePercentageText.setAttribute("id", "vngine-settings-sfx-volume-text");
        sfxVolumePercentageText.innerText = sfxVolumeRange.value + '%';
        

        //Footer
        let settingsFooterDiv = document.createElement("div");
        settingsFooterDiv.setAttribute("id", "vngine-settings-footer");
        settingsFooterDiv.classList.add("vngine-settings-footer");

        let setToDefaultBtn = document.createElement("button");
        setToDefaultBtn.setAttribute("id", "vngine-settings-clear-data");
        setToDefaultBtn.classList.add("vngine-btn");
        setToDefaultBtn.innerText = "Set to default";
        setToDefaultBtn.addEventListener("click", e => {
            Audio.playEffect(audioUITap);
            Settings.clear();
            textSpeedSelect.selectedIndex = 
                textSpeed == textVeryFastTime ? 0 :
                textSpeed == textFastTime     ? 1 : 
                textSpeed == textMediumTime   ? 2 :
                textSpeed == textSlowTime     ? 3 :
                1
            ;
            masterVolumeRange.value = Audio.masterVolume;
            masterVolumePercentageText.innerText = masterVolumeRange.value + '%';
            
            bgmVolumeRange.value = Audio.bgmVolume;
            bgmVolumePercentageText.innerText = bgmVolumeRange.value + '%';
            
            sfxVolumeRange.value = Audio.sfxVolume;
            sfxVolumePercentageText.innerText = sfxVolumeRange.value + '%';
        });

        //Appending
        settingsHeader.appendChild(backBtn);
        settingsHeader.appendChild(settingsHeaderText);
        settingsTextSpeedDiv.appendChild(textSpeedLabel);
        settingsTextSpeedDiv.appendChild(document.createElement("br"));
        settingsTextSpeedDiv.appendChild(textSpeedSelect);
        settingsSoundDiv.appendChild(masterVolumeLabel);
        settingsSoundDiv.appendChild(document.createElement("br"));
        settingsSoundDiv.appendChild(masterVolumeRange);
        settingsSoundDiv.appendChild(masterVolumePercentageText);
        settingsSoundDiv.appendChild(document.createElement("br"));
        settingsSoundDiv.appendChild(bgmVolumeLabel);
        settingsSoundDiv.appendChild(document.createElement("br"));
        settingsSoundDiv.appendChild(bgmVolumeRange);
        settingsSoundDiv.appendChild(bgmVolumePercentageText);
        settingsSoundDiv.appendChild(document.createElement("br"));
        settingsSoundDiv.appendChild(sfxVolumeLabel);
        settingsSoundDiv.appendChild(document.createElement("br"));
        settingsSoundDiv.appendChild(sfxVolumeRange);
        settingsSoundDiv.appendChild(sfxVolumePercentageText);
        settingsFooterDiv.appendChild(setToDefaultBtn);
        settingsBody.appendChild(settingsTextSpeedDiv);
        settingsBody.appendChild(settingsSoundDiv);
        settingsBody.appendChild(settingsFooterDiv);
        settingsDiv.appendChild(settingsHeader);
        settingsDiv.appendChild(settingsBody);
        mainDiv.appendChild(settingsDiv);

        return settingsDiv;
    }
    
    //Creates all the DOM elements needed for the Load/Save screen
    function generateSavefilesScreen () {
        /* HTML to generate
        <div id="vngine-savefiles" class="vngine-screen vngine-savefiles">
            <div id="vngine-savefiles-header" class="vngine-savefiles-header">
                <button id="vngine-savefiles-back" class="vngine-btn vngine-back-btn">Back</button>
                <p id="vngine-savefiles-text" class="vngine-savefiles-header-text">Load</p>
            </div>
            <div id="vngine-savefile-list" class="vngine-savefile-list">
                
            </div>
        </div>
        */

        let savefilesDiv = document.createElement("div");
        savefilesDiv.setAttribute("id", "vngine-savefiles");
        savefilesDiv.classList.add("vngine-screen", "vngine-savefiles");
        if (game.savefilesBackground) {
            savefilesDiv.style.backgroundImage = `url(game/res/img/backgrounds/${game.savefilesBackground})`;
        }
        
        let savefilesHeader = document.createElement("div");
        savefilesHeader.setAttribute("id", "vngine-savefiles-header");
        savefilesHeader.classList.add("vngine-header");

        let backBtn = document.createElement("button");
        backBtn.setAttribute("id", "vngine-savefiles-back");
        backBtn.classList.add("vngine-btn", "vngine-back-btn");
        backBtn.innerText = "Back";
        backBtn.addEventListener("click", e => {
            if (e.target && e.target.id == "vngine-savefiles-back") {
                Audio.playEffect(audioUITap);
                ScreenManager.switchToPreviousScreen();
            }
        });
        
        let savefilesHeaderText = document.createElement("p");
        savefilesHeaderText.setAttribute("id", "vngine-savefiles-header-text");
        savefilesHeaderText.classList.add("vngine-header-text");
        savefilesHeaderText.innerText = "Load";

        let savefilesBody = document.createElement("div");
        savefilesBody.setAttribute("id", "vngine-savefiles-body");

        //Appending
        savefilesHeader.appendChild(backBtn);
        savefilesHeader.appendChild(savefilesHeaderText);
        savefilesDiv.appendChild(savefilesHeader);
        savefilesDiv.appendChild(savefilesBody);
        mainDiv.appendChild(savefilesDiv);

        return savefilesDiv;
    }

    function generateBacklogScreen () {
        /* HTML to generate
        
        */

        let backlogDiv = document.createElement("div");
        backlogDiv.setAttribute("id", "vngine-backlog");
        backlogDiv.classList.add("vngine-screen", "vngine-backlog");
        if (game.backlogBackground) {
            backlogDiv.style.backgroundImage = `url(game/res/img/backgrounds/${game.backlogBackground})`;
        }
        
        let backlogHeader = document.createElement("div");
        backlogHeader.setAttribute("id", "vngine-backlog-header");
        backlogHeader.classList.add("vngine-header");

        let backBtn = document.createElement("button");
        backBtn.setAttribute("id", "vngine-backlog-back");
        backBtn.classList.add("vngine-btn", "vngine-back-btn");
        backBtn.innerText = "Back";
        backBtn.addEventListener("click", e => {
            if (e.target && e.target.id == "vngine-backlog-back") {
                Audio.playEffect(audioUITap);
                ScreenManager.switchToPreviousScreen();
            }
        });
        
        let backlogHeaderText = document.createElement("p");
        backlogHeaderText.setAttribute("id", "vngine-backlog-header-text");
        backlogHeaderText.classList.add("vngine-header-text");
        backlogHeaderText.innerText = "Backlog";

        let backlogBody = document.createElement("div");
        backlogBody.setAttribute("id", "vngine-backlog-body");
        backlogBody.classList.add("vngine-backlog-body");

        let backlogList = document.createElement("ol");
        backlogList.setAttribute("id", "vngine-backlog-list");
        backlogList.classList.add("vngine-backlog-list");

        //Appending
        backlogHeader.appendChild(backBtn);
        backlogHeader.appendChild(backlogHeaderText);
        backlogBody.append(backlogList);
        backlogDiv.appendChild(backlogHeader);
        backlogDiv.appendChild(backlogBody);
        mainDiv.appendChild(backlogDiv);

        return backlogDiv;
    }

    //Displays a confirmation dialog in the dialog modal
    function renderConfirmationDialog (callback, customMsg) {
        let modalBody = document.getElementById("vngine-dialog-modal-body");
        //Clear modal's body
        modalBody.innerHTML = "";

        let msg = document.createElement("p");
        msg.classList.add("vngine-dialog-modal-msg")
        msg.innerText = customMsg ? customMsg : "Are you sure?";

        let btnDiv = document.createElement("div");

        let yesBtn = document.createElement("btn");
        yesBtn.innerText = "Yes";
        yesBtn.classList.add("vngine-btn", "vngine-btn-inline");
        yesBtn.addEventListener("click", e => {
            Audio.playEffect(audioUITap);
            callback("yes");
            document.getElementById("vngine-dialog-modal").style.display = "none";
        });
        
        let noBtn = document.createElement("div");
        noBtn.innerText = "No";
        noBtn.classList.add("vngine-btn", "vngine-btn-inline");
        noBtn.addEventListener("click", e => {
            Audio.playEffect(audioUITap);
            callback("no");
            document.getElementById("vngine-dialog-modal").style.display = "none";
        });

        //Appending
        btnDiv.appendChild(yesBtn);
        btnDiv.appendChild(noBtn);
        modalBody.appendChild(msg);
        modalBody.appendChild(btnDiv);
    }
    
    //Displays an input dialog in the dialog modal
    function renderInputDialog (callback, customMsg) {
        let modalBody = document.getElementById("vngine-dialog-modal-body");
        modalBody.innerHTML = "";

        let msg = document.createElement("p");
        msg.classList.add("vngine-dialog-modal-msg")
        msg.innerText = customMsg ? customMsg : "";

        let input = document.createElement("input");
        input.setAttribute("type", "text");
        

        let okayBtn = document.createElement("div");
        okayBtn.innerText = "Ok";
        okayBtn.classList.add("vngine-btn");
        okayBtn.addEventListener("click", e => {
            Audio.playEffect(audioUITap);
            callback(input.value);
            document.getElementById("vngine-dialog-modal").style.display = "none";
        });

        //Appending
        modalBody.appendChild(msg);
        modalBody.appendChild(input);
        modalBody.appendChild(okayBtn);
    }
    
    //Displays the savefiles
    function renderSavefileList () {
        /* HTML to generate
        <div class="vngine-savefile">
            <div class="vngine-savefile-picture"></div>
            <h1 class="vngine-savefile-name">22-2-2021 10:03PM</h1>
            <p class="vngine-savefile-sentence">This is a test, bitch!</p>
            <button class="vngine-btn vngine-btn-small">Load</button>
            <button class="vngine-btn vngine-btn-small">Delete</button>
        </div>
        */
        let savefilesBody = document.getElementById("vngine-savefiles-body");
        savefilesBody.innerHTML = "";

        let savefileList = document.createElement("div");
        savefileList.setAttribute("id", "vngine-savefile-list");
        savefileList.classList.add("vngine-savefile-list");

        let keys = Object.keys(localStorage);

        let autosave = keys.find(val => val == "Autosave");
        if (autosave) keys.splice(keys.indexOf("Autosave"), 1);

        let userSettings = keys.find(val => val == "userSettings");
        if (userSettings) keys.splice(keys.indexOf("userSettings"), 1);
        
        let cg = keys.find(val => val == "cg");
        if (cg) keys.splice(keys.indexOf(cg), 1);

        keys.sort((a, b) => {
            let aDate = a.split('   ')[0];
            let aTime = a.split('   ')[1];

            let bDate = b.split('   ')[0];
            let bTime = b.split('   ')[1];

            if (aDate > bDate) {
                return -1;
            }
            else if (aDate < bDate) {
                return 1;
            }
            else {
                if (aTime > bTime) {
                    return -1;
                }
                else {
                    return 1;
                }
            }
        });

        if (autosave) {
            keys.unshift(autosave);
        }

        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];

            let data = JSON.parse(localStorage.getItem(key));

            let savefileDiv = document.createElement("div");
            savefileDiv.setAttribute("id", `vngine-savefile-${key}`);
            savefileDiv.classList.add("vngine-savefile");
            
            let savefileImg = document.createElement("div");
            savefileImg.classList.add("vngine-savefile-picture");
            background = getLatestBackground(data.backlog);
            if (background) {
                savefileImg.style.backgroundImage = `url(game/res/img/backgrounds/${background})`;
            }

            let savefileName = document.createElement("h1");
            savefileName.classList.add("vngine-savefile-name");
            savefileName.innerText = key;
            
            let savefileText = document.createElement("p");
            savefileText.classList.add("vngine-savefile-sentence");
            if(game.nodes[data.nodeIndex].dialog) {
                let backup = game.customVariables;
                game.customVariables = data.customVariables;
                savefileText.innerText = processString(game.nodes[data.nodeIndex].dialog[data.dialogIndex].text);
                game.customVariables = backup;
            }
            else {
                savefileText.innerHTML = "<i>Decision</i>";
            }

            let loadButton = document.createElement("button");
            loadButton.innerText = "Load";
            loadButton.setAttribute("id", `load-${key}`);
            loadButton.classList.add("vngine-btn", "vngine-btn-small");
            loadButton.addEventListener("click", e => {
                if (e.target && e.target.id == `load-${key}`) {
                    Audio.playEffect(audioUITap);
                    load(key);
                }
            });
            
            let deleteButton = null;
            if (key != "Autosave") {
                deleteButton = document.createElement("button");
                deleteButton.innerText = "Delete";
                deleteButton.setAttribute("id", `delete-${key}`);
                deleteButton.classList.add("vngine-btn", "vngine-btn-small");
                deleteButton.addEventListener("click", e => {
                    if (e.target && e.target.id == `delete-${key}`) {
                        Audio.playEffect(audioUITap);
                        UIDialog.show(UIDialogType.CONFIRM, res => {
                            if (res === "yes") {
                                deleteSavefile(key);
                                renderSavefileList();
                            }
                        });
                    }
                });
            }

            //Appending
            savefileDiv.appendChild(savefileImg);
            savefileDiv.appendChild(savefileName);
            savefileDiv.appendChild(savefileText);
            savefileDiv.appendChild(loadButton);
            if (deleteButton) savefileDiv.appendChild(deleteButton);
            savefileList.appendChild(savefileDiv);

        }

        savefilesBody.appendChild(savefileList);
    }

    //Displays the backlog messages
    function renderBacklog () {
        let backlogList = document.getElementById("vngine-backlog-list");

        let backlog = Backlog.getAsTextArray();
        let html = "";
        backlog.forEach(str => {
            html += `<li>${processString(str)}</li>`;
        });

        backlogList.innerHTML = html;
    }

    //Display unlocked CGs
    function renderGallery (page) {
        let maxPages = Math.ceil(game.gallery.length / 6);
        if (page >= maxPages) {
            page = 0;
            console.error(`VNGINE_ERROR: can't render page ${page}, it's out of bounds`);
        }

        let pageTexts = Array.from(document.getElementsByClassName("vngine-gallery-page-text")).forEach(e => {
            if (e.getAttribute("id") == `vngine-gallery-page-text-${page}`) {
                e.classList.add("vngine-gallery-page-text-selected");
            }
            else {
                e.classList.remove("vngine-gallery-page-text-selected");
            }
        });

        let galleryBody = document.getElementById("vngine-gallery-body");
        
        galleryBody.innerHTML = "";
        for (let i = 0; i < 6; i++) {
            let cgIndex = page*6 + i;
            let img = document.createElement("img");
            img.setAttribute("id", `vngine-gallery-item-${cgIndex}`);
            img.classList.add("vngine-gallery-item");

            if (unlockedCG.includes(cgIndex)) {
                img.src = `game/res/img/cg/${game.gallery[cgIndex]}`;
                img.addEventListener("click", e => {
                    Audio.playEffect(audioUITap);
                    if (e.target.classList.contains("vngine-gallery-item-fullscreen")) {
                        e.target.classList.remove("vngine-gallery-item-fullscreen");
                    }
                    else {
                        e.target.classList.add("vngine-gallery-item-fullscreen");
                    }
                });
            }
            else {
                img.src = "game/res/img/cg/cgLocked.png";
            }

            galleryBody.appendChild(img);
        }
    }

    //Display the given characters on the game screen
    function renderCharacters (characters) {
        if (characters === null) {
            let charactersDiv = document.getElementById("vngine-characters-div");
            characterImgs = [];
            charactersDiv.innerHTML = "";
            return;
        }

        characterImgs.forEach(img => {
            img.setAttribute("src", "");
            img.setAttribute("data-character", "");
            img.style.left = "";
            img.style.right = "";
        });

        let charactersDiv = document.getElementById("vngine-characters-div");
        if (characters.length > characterImgs.length) {
            let imgAmount = characters.length - characterImgs.length
            for (let i = 0; i < imgAmount; i++) {
                let character = document.createElement("img");
                character.classList.add("vngine-character");
                charactersDiv.append(character);
                characterImgs.push(character);
            }
        }

        characters.forEach((character, i) => {
            let pictureIndex = character.picture == undefined ? 0 : character.picture;
            let picURL = `game/res/img/characters/${game.characters[character.index].pictures[pictureIndex]}`;
            
            if (character.left != undefined) {
                characterImgs[i].style.left = `${character.left}%`;
            }
            else if (character.right != undefined) {
                characterImgs[i].style.right = `${character.right}%`;
            }

            characterImgs[i].setAttribute("data-character", character.index);
            characterImgs[i].setAttribute("src", picURL);
        });
    }

    //Display and sets up decision buttons for the given options
    function renderDecisionOptions (options) {
        //Remove old decision data
        let decisionButtonsDiv = document.getElementById("vngine-decision-buttons");
        decisionButtonsDiv.innerHTML = "";
        
        //Set up new decision buttons
        for (let i = 0; i < options.length; i++) {
            let button = document.createElement("button");
            button.classList.add("vngine-btn");
            button.innerText = processString(options[i].text);
            button.setAttribute("id", `vngine-decision-btn-${i}`);
            
            button.addEventListener("click", e => {
                if (e.target && e.target.id == `vngine-decision-btn-${i}`) {
                    Audio.playEffect(audioUITap);
                    //Hide decision buttons
                    decisionButtonsDiv.style.display = "none";

                    //Adds entry to the backlog
                    Backlog.push({
                        type: backlogEntryType.DECISION,
                        nodeIndex: currentNodeIndex,
                        decisionIndex: i
                    });
                    needToUpdateBacklogScreen = true;

                    //Checks for custom variable setting
                    if (options[i].setVariable) {
                        let variable = options[i].setVariable.variable;
                        let expression = options[i].setVariable.expression;
                        if (variable === undefined) {
                            console.error(`VNGINE_ERROR: variable property not found in setVariable of option ${i} in node ${currentScreen}`);
                        }
                        else if (expression === undefined) {
                            console.error(`VNGINE_ERROR: expression property not found in setVariable of option ${i} in node ${currentScreen}`);
                        }
                        else if (!customVariableKeys.includes(variable)) {
                            console.error(`VNGINE_ERROR: ${variable} is not a custom game variable`);
                        }
                        else {
                            game.customVariables[variable] = MathParser.evaluate(processString(expression));
                        }
                    }

                    //Loads the target node of the decision
                    loadNode(options[i].targetNode);
                    updateDialog();
                }
            });

            decisionButtonsDiv.appendChild(button);
        }
        
        //Show decision buttons
        decisionButtonsDiv.style.display = "block";
    }

    //Returns the background that should be displayed given the current backlog
    function getLatestBackground (backlogArray) {
        let index = backlogArray.length-1;
        let background = undefined;
        while (index >= 0 && background === undefined) {
            background = game.nodes[backlogArray[index].nodeIndex].setBackground;
            index--;

            if (background !== undefined) break;
        }

        return background;
    }

    //Returns the characters that should be displayed given the current backlog
    function getLatestCharacters (backlogArray) {
        let index = backlogArray.length-1;
        let characters = undefined;
        while (index >= 0 && characters === undefined) {
            characters = game.nodes[backlogArray[index].nodeIndex].setCharacters;
            index--;

            if (characters !== undefined) break;
        }

        return characters;
    }

    //Loads a node from the game given its index
    function loadNode (index) {
        currentNode = game.nodes[index];
        currentNodeIndex = index;

        if (!currentNode) {
            console.error(`VNGINE_ERROR: Couldn't load game node with index ${index}`);
        }
        else {
            //Checks for CG unlocks
            if (currentNode.unlockCG != undefined) {
                unlockCG(currentNode.unlockCG);
            }
            
            //Set Background
            if (currentNode.setBackground !== undefined) {
                document.getElementById("vngine-game-background").style.backgroundImage = `url("game/res/img/backgrounds/${currentNode.setBackground}")`;
            }
            else if (!document.getElementById("vngine-game-background").style.backgroundImage) {
                let background = getLatestBackground(Backlog.getAsArray());
                if (background !== undefined) {
                    document.getElementById("vngine-game-background").style.backgroundImage = `url("game/res/img/backgrounds/${background}")`;
                }
                else {
                    console.warn(`VNGINE_WARNING: Couldn't get background for node with index ${currentNodeIndex}`);
                }
            }

            //Set characters
            if (currentNode.setCharacters !== undefined) {
                renderCharacters(currentNode.setCharacters);
            }
            else if (!characterImgs.map(c => c.getAttribute("src") != "").includes(true)) {
                let characters = getLatestCharacters(Backlog.getAsArray());
                if (characters !== undefined) {
                    renderCharacters(characters);
                }
                else {
                    console.warn(`VNGINE_WARNING: Couldn't get character pictures for node with index ${currentNodeIndex}`);
                }
            }
                
            //Checks for decision/dialog
            if (currentNode.decision) {
                DialogBox.setVisible(false);
                renderDecisionOptions(currentNode.decision);
            }
            else if (currentNode.input) {
                DialogBox.setVisible(false);
                readInput(currentNode.input);
            }
            else if (currentNode.logicBranch) {
                evaluateLogicBranch(currentNode.logicBranch);
            }
            else if (currentNode.dialog) {
                //Starts dialog
                DialogBox.setVisible(true);
                document.getElementById("vngine-decision-buttons").style.display = "none";
                currentDialogIndex = 0;
            }
            else {
                console.warn(`VNGINE_WARNING: node with index ${index} doesn't have a defined type`);
            }
        }
    }

    //Writes the dialog text
    function updateDialog () {
        if (!currentNode.dialog) return; //Security always first

        //Adds an entry to the backlog
        Backlog.push({
            type: backlogEntryType.DIALOG,
            nodeIndex: currentNodeIndex,
            dialogIndex: currentDialogIndex
        });
        needToUpdateBacklogScreen = true;

        let characterIndex = currentNode.dialog[currentDialogIndex].character;

        //Change character pictures if needed
        let updatePicture = currentNode.dialog[currentDialogIndex].changeCharacterPicture;
        if (updatePicture) {
            updatePicture.forEach(data => {
                let e = getCharacterDOMimg(data.character);
                if (e != null) {
                    let picURL = `game/res/img/characters/${game.characters[data.character].pictures[data.picture]}`;
                    e.setAttribute("src", picURL);
                }
            });
        }
        
        //Change character position if needed
        let updatePosition = currentNode.dialog[currentDialogIndex].changeCharacterPosition;
        if (updatePosition) {
            updatePosition.forEach(data => {
                let e = getCharacterDOMimg(data.character);
                if (e != null) {
                    if (data.left) {
                        e.style.transition = `left ${data.time ? data.time : 0}ms ${data.type ? data.type : "linear"}`;
                        e.style.right = "";
                        e.style.left = `${data.left}%`;
                    }
                    else if (data.right) {
                        e.style.transition = `right ${data.time ? data.time : 0}ms ${data.type ? data.type : "linear"}`;
                        e.style.left = "";
                        e.style.right = `${data.right}%`;
                    }
                }
            });
        }

        let music = currentNode.dialog[currentDialogIndex].playMusic;
        if(music) {
            Audio.playMusic(`game/res/audio/${music}`);
        }

        let effect = currentNode.dialog[currentDialogIndex].playEffect;
        if (effect) {
            Audio.playEffect(`game/res/audio/${effect}`)
        }

        //Updates dialog text
        DialogBox.setCharacter(processString(game.characters[characterIndex].name));
        DialogBox.writeText(processString(currentNode.dialog[currentDialogIndex].text));

        currentDialogIndex++;

        //We check for autosaving after increasing the index so that it saves on the correct part of the dialog
        let autosave = currentNode.dialog[currentDialogIndex-1].autosave;
        if(autosave && autosave == true) {
            save("Autosave");
        }
    }

    //Returns the DOM img element displaying the given character
    function getCharacterDOMimg (character) {
        for (let i = 0; i < characterImgs.length; i++) {
            if (characterImgs[i].getAttribute("data-character") == character) {
                return characterImgs[i];
            }
        }
        return null;
    }

    //Unlocks the cg with given index, saves the information on localStorage
    function unlockCG (index) {
        if (!unlockedCG.includes(index)) {
            unlockedCG.push(index);
            localStorage.setItem("cg", unlockedCG.toString());
        }
    }

    //Executes an input node
    function readInput (data) {
        if (customVariableKeys.includes(data.variable)) {
            UIDialog.show(UIDialogType.INPUT, res => {
                game.customVariables[data.variable] = res;
                loadNode(currentNode.nextNode);
                updateDialog();
            }, data.message ? processString(data.message) : "");
        }
        else {
            console.error(`VNGINE_ERROR: ${data.variable} is not a variable`);
        }
    }

    //Executes a logic branching node
    function evaluateLogicBranch (logicBranch) {
        if (logicBranch.length > 0) {
            for (let i = 0; i < logicBranch.length; i++) {
                let expr = processString(logicBranch[i].expression);
                if (MathParser.evaluate(expr) == "true" ) {
                    loadNode(logicBranch[i].targetNode);
                    updateDialog();
                    return;
                }
            }
        }
        else {
            console.warn(`VNGINE_WARNING: No branches to evaluate on node with index ${currentNodeIndex}`);
        }

        if (currentNode.defaultNode) {
            loadNode(currentNode.defaultNode);
        }
        else {
            console.error(`VNGINE_ERROR: No default node found on node with index ${currentNodeIndex}`);
        }
    }

    //Event handler
    function gameClickEvent () {
        if(ScreenManager.currentScreen != screens.GAME || !DialogBox.visible || !currentNode.dialog) return;

        if (DialogBox.isWriting) {
            DialogBox.cancelWritingAnimation();
        }
        else {
            if (currentDialogIndex >= currentNode.dialog.length) {
                if (currentNode.nextNode == null || currentNode.nextNode == undefined) {
                    ScreenManager.switchToScreen(screens.MENU);
                    return;
                }
    
                loadNode(currentNode.nextNode);

                if (currentNode.dialog) {
                    updateDialog();
                }
            }
            else {
                updateDialog();
            }
        }
    }

    function gameBack () {
        if(ScreenManager.currentScreen != screens.GAME || Backlog.length() <= 1) return;

        Backlog.pop();
        let entry = Backlog.top();
        Backlog.pop();
        if (entry) {
            if (entry.type == backlogEntryType.DECISION) {
                loadNode(entry.nodeIndex);
            }
            else if (entry.type == backlogEntryType.DIALOG) {
                loadNode(entry.nodeIndex);
                currentDialogIndex = entry.dialogIndex;
                updateDialog();
            }
            else {
                console.error(`VNGINE_ERROR: Entry type ${entry.type} not recognized`);
            }
        }
    }

    function toggleFullscreen () {
        if (mainDiv.classList.contains("fullscreen")) {
            mainDiv.classList.remove("fullscreen");
        }
        else {
            mainDiv.classList.add("fullscreen");
        }
    }

    function toggleSkip () {
        skip = !skip; //Invert the bool
        if (skip) {
            document.getElementById("skipText").classList.add("vngine-option-text-hold");
            skipInterval = setInterval(skipIntervalFunction, skipIntervalTime);
        }
        else {
            document.getElementById("skipText").classList.remove("vngine-option-text-hold");
            clearInterval(skipInterval);
        }
    }

    function skipIntervalFunction () {
        if (game.nodes[currentNodeIndex].decision) {
            clearInterval(skipInterval);
            skip = false;
            document.getElementById("skipText").classList.remove("vngine-option-text-hold");
        }
        else {
            gameClickEvent();
        }
    }

    function escapePressedEvent () {
        if (ScreenManager.currentScreen == screens.SETTINGS  ||
            ScreenManager.currentScreen == screens.SAVEFILES ||
            ScreenManager.currentScreen == screens.BACKLOG   ||
            ScreenManager.currentScreen == screens.GALLERY) {
            
            ScreenManager.switchToPreviousScreen();
        }
    }

    //---------------SAVE-LOAD---------------//

    //Saves game information on localStorage
    function save (saveFile) {
        if (!saveFile) return;

        let saveData = {
            "nodeIndex": currentNodeIndex,
            "dialogIndex": currentDialogIndex-1,
            "backlog": Backlog.getAsArray(),
            "customVariables": game.customVariables
        };

        localStorage.setItem(saveFile, JSON.stringify(saveData));
        needToUpdateSavefilesScreen = true;
    }

    //Loads game information from localStorage
    function load (saveFile) {
        let loadedData = localStorage.getItem(saveFile);
        if (loadedData) {
            loadedData = JSON.parse(loadedData);
            document.getElementById("vngine-game-background").style.backgroundImage = "";
            renderCharacters(null);

            game.customVariables = loadedData.customVariables;
            
            Backlog.stack = loadedData.backlog;
            loadNode(loadedData.nodeIndex);
            if (game.nodes[loadedData.nodeIndex].dialog) {
                currentDialogIndex = loadedData.dialogIndex;
                updateDialog();
            }
            Backlog.pop();
        }

        ScreenManager.switchToScreen(screens.GAME);
    }

    function deleteSavefile (saveFile) {
        localStorage.removeItem(saveFile);
        needToUpdateSavefilesScreen = true;
    }

    //Sets the root css variables with the values in the game file
    function readColorPalette () {
        let docStyle = getComputedStyle(document.documentElement);
        let keys = Object.keys(game.uiColors);
        keys.forEach(key => {
            cssKey = `--vngine-color-ui-${key}`;
            if (docStyle.getPropertyValue(cssKey)) {
                document.documentElement.style.setProperty(cssKey, game.uiColors[key]);
            }
            else {
                console.warn(`VNGINE_WARNING: root doesn't contain property ${cssKey}`);
            }
        });
    }

    //Sets the audio variables with the values in the game file
    function readAudio () {
        let keys = Object.keys(game.uiAudio);
        keys.forEach(key => {
            switch (key) {
                case "tap":
                    audioUITap = `game/res/audio/${game.uiAudio[key]}`;
                    break;
                default:
                    console.warn(`VNGINE_WARNING: ${key} not recognized as a valid audio property`);
                    break;
            }
        });
    }

    //Replaces game variables with their values in a string
    function processString (str) {
        let result = str;
        let regex = new RegExp(/{[^{}]+}/g);
        
        let finished = false;
        while (!finished) {
            let matches = [];
            let regexSearch = null;
            while((regexSearch = regex.exec(result)) != null) {
                matches.push(regexSearch[0]);
            }

            if (matches.length > 0) {
                for (let i = 0; i < matches.length; i++) {
                    let m = matches[i].substr(1, matches[i].length-2); //Remove brackets {}

                    if (m.includes(".")) { //We expect to be accessing a property of a character
                        let split = m.split(".");
                        if (split[0].startsWith("character")) {
                            let indexStr = split[0].slice(9); //Remove "character" to leave the index only
                            let index = parseInt(indexStr); //Tries to parse the index to int
                            if (index != NaN) {
                                if (game.characters[index]) {
                                    if (split[1] == "name") {
                                        result = result.replace(matches[i], game.characters[index].name);
                                    }
                                    else {
                                        console.error(`VNGINE_ERROR: property ${split[1]} of character not-recognized`);
                                        finished = true; //We return to avoid an infinite loop
                                    }
                                }
                                else {
                                    console.error(`VNGINE_ERROR: ${index} is not a valid character index`);
                                    finished = true; //We return to avoid an infinite loop
                                }
                            }
                            else {
                                console.error(`VNGINE_ERROR: ${indexStr} is not a number`);
                                finished = true; //We return to avoid an infinite loop
                            }
                        }
                        else {
                            console.error(`VNGINE_ERROR: variable ${m} contains a non-valid character`);
                            finished = true; //We return to avoid an infinite loop
                        }
                    }
                    else { //We expect a game custom variable
                        if (customVariableKeys.includes(m)) {
                            result = result.replace(matches[i], game.customVariables[m]);
                        }
                        else {
                            console.error(`VNGINE_ERROR: ${m} is not a game custom variable`);
                            finished = true; //We return to avoid an infinite loop
                        }
                    }
                }
            }
            else {
                finished = true;
            }
        }

        return result;
    }
      
}())
