(function () {
    let game = null; //Game data object

    let mainDiv = document.getElementById("vngine-div");
    
    //Screens
    const screens = {
        GAME:      "game",
        MENU:      "menu",
        SETTINGS:  "settings",
        SAVEFILES: "savefiles",
        BACKLOG:   "backlog"
    }

    //Characters DOM
    let characterImgs = [];
    let charactersDiv = null;
    
    //Decision making
    let decisionButtonsDiv = null;
    let decisionButtons = [];

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

    let skip = false;
    let skipInterval = null;
    let skipIntervalTime = 50;

    //Update needed flags
    let needToUpdateSavefilesScreen = true;
    let needToUpdateBacklogScreen = true;

    //Audio
    let audioUIClick = "game/res/audio/ui_click.wav";

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

    const ScreenManager = class {
        static currentScreen = null;
        static previousScreen = null;
        static gameDiv = null;
        static menuDiv = null;
        static settingsDiv = null;
        static savefilesDiv = null;
        static backlogDiv = null;

        static init = function () {
            this.gameDiv      = generateGameScreen();
            this.menuDiv      = generateMenuScreen();
            this.settingsDiv  = generateSettingsScreen();
            this.savefilesDiv = generateSavefilesScreen();
            this.backlogDiv   = generateBacklogScreen();
        }

        static switchToScreen = function (screen) {
            this.previousScreen = this.currentScreen;
            this.currentScreen = screen;
    
            this.menuDiv.style.display      = "none";
            this.gameDiv.style.display      = "none";
            this.settingsDiv.style.display  = "none";
            this.savefilesDiv.style.display = "none";
            this.backlogDiv.style.display   = "none";
    
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
        static visible = true;

        static writingInterval;
        static dialogBoxText;
        static dialogBoxCharacter;

        static isWriting = false;
        static currentTargetText;
        static writtenCharacters = 0;

        static init = function () {
            this.dialogBoxDiv = document.getElementById("vngine-dialog-box");
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
            this.visible = !this.visible;
            this.dialogBoxDiv.style.display = this.visible ? "block" : "none";
        }

        static setVisible = function (visible) {
            this.visible = visible;
            this.dialogBoxDiv.style.display = this.visible ? "block" : "none";
        }
    }

    const KeyboardInput = class {
        static keyInfo = {};

        static init = function () {
            //Set up event listeners
            window.addEventListener("keydown", e => {
                if (this.keyInfo[e.code] && !this.keyInfo[e.code].held) {
                    //Set key as held
                    this.keyInfo[e.code].held = true;

                    //Call all the callbacks
                    if (this.keyInfo[e.code].callbacks) {
                        this.keyInfo[e.code].callbacks.forEach(c => c());
                    }
                }
            });
        
            window.addEventListener("keyup", e => {
                if (this.keyInfo[e.code]) {
                    this.keyInfo[e.code].held = false;
                }
            });
        }

        static addKeyCallback = function (keycode, callback) {
            if (!this.keyInfo[keycode]) {
                this.keyInfo[keycode] = {};
                this.keyInfo[keycode].held = false;
                this.keyInfo[keycode].callbacks = new Array();
            }

            this.keyInfo[keycode].callbacks.push(callback);
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
        
        //Sets up keyboard callbacks
        KeyboardInput.addKeyCallback("Space",        () => gameClickEvent());
        KeyboardInput.addKeyCallback("Enter",        () => gameClickEvent());
        KeyboardInput.addKeyCallback("ControlLeft",  () => DialogBox.toggleVisibility());
        KeyboardInput.addKeyCallback("ControlRight", () => DialogBox.toggleVisibility());
        KeyboardInput.addKeyCallback("Escape",       () => escapePressedEvent());
        KeyboardInput.addKeyCallback("KeyS",         () => toggleSkip());

        //Sets up mouse wheel callbacks
        MouseWheelInput.addWheelDownCallback(() => gameClickEvent());

        //Goes to the main menu
        ScreenManager.switchToScreen(screens.MENU);
    }

    //Creates all the DOM elements needed for the game screen
    function generateGameScreen () {
        /* HTML to generate
        <div id="vngine-game" class="vngine-screen vngine-game">
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

        let clickDetector = document.createElement("div");
        clickDetector.setAttribute("id", "vngine-game-click-detector");
        clickDetector.classList.add("vngine-game-click-detector");
        document.addEventListener("click", e => {
            if (e.target && e.target.id == "vngine-game-click-detector") {
                gameClickEvent();
            }
        });

        decisionButtonsDiv = document.createElement("div");
        decisionButtonsDiv.classList.add("vngine-btn-group");

        charactersDiv = document.createElement("div");
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
        optionsContainer.classList.add("vngine-option-text-container");

        let menuText = document.createElement("a");
        menuText.innerText = "Menu";
        menuText.classList.add("vngine-option-text");
        menuText.setAttribute("id", "menuText");
        document.addEventListener("click", e => {
            if (e.target && e.target.id == "menuText") {
                ScreenManager.switchToScreen(screens.MENU);
            }
        });

        let backlogText = document.createElement("a");
        backlogText.innerText = "Backlog";
        backlogText.classList.add("vngine-option-text");
        backlogText.setAttribute("id", "backlogText");
        document.addEventListener("click", e => {
            if (e.target && e.target.id == "backlogText") {
                ScreenManager.switchToScreen(screens.BACKLOG);
            }
        });

        let saveText = document.createElement("a");
        saveText.innerText = "Save";
        saveText.classList.add("vngine-option-text");
        saveText.setAttribute("id", "saveText");
        document.addEventListener("click", e => {
            if (e.target && e.target.id == "saveText") {
                let now = new Date();
                let key = now.getUTCFullYear() + "-" + now.getMonth() + "-" + now.getDay() + "   "
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
                ScreenManager.switchToScreen(screens.SAVEFILES);
            }
        });

        let skipText = document.createElement("a");
        skipText.innerText = "Skip";
        skipText.classList.add("vngine-option-text");
        skipText.setAttribute("id", "skipText");
        document.addEventListener("click", e => {
            if (e.target && e.target.id == "skipText") {
                toggleSkip();
            }
        });

        let settingsText = document.createElement("a");
        settingsText.innerText = "Settings";
        settingsText.classList.add("vngine-option-text");
        settingsText.setAttribute("id", "settingsText");
        document.addEventListener("click", e => {
            if (e.target && e.target.id == "settingsText") {
                ScreenManager.switchToScreen(screens.SETTINGS);
            }
        });

        optionsContainer.appendChild(menuText);
        optionsContainer.appendChild(backlogText);
        optionsContainer.appendChild(saveText);
        optionsContainer.appendChild(loadText);
        optionsContainer.appendChild(skipText);
        optionsContainer.appendChild(settingsText);
        vngineDialogBox.appendChild(dialogBoxCharacter);
        vngineDialogBox.appendChild(dialogBoxText);
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
                menuNewGameClick();
            }
        });
        
        let continueBtn = document.createElement("button");
        continueBtn.innerText = "Continue";
        continueBtn.setAttribute("id", "vngine-menu-continue-btn");
        continueBtn.classList.add("vngine-btn");
        document.addEventListener("click", e => {
            if (e.target && e.target.id == "vngine-menu-continue-btn") {
                menuContinueClick();
            }
        });
        
        let settingsBtn = document.createElement("button");
        settingsBtn.innerText = "Settings";
        settingsBtn.setAttribute("id", "vngine-menu-settings-btn");
        settingsBtn.classList.add("vngine-btn");
        document.addEventListener("click", e => {
            if (e.target && e.target.id == "vngine-menu-settings-btn") {
                menuSettingsClick();
            }
        });
        
        //Append
        btnGroup.appendChild(newGameBtn);
        btnGroup.appendChild(continueBtn);
        btnGroup.appendChild(settingsBtn);
        menuDiv.appendChild(titleText);
        menuDiv.appendChild(btnGroup);

        mainDiv.appendChild(menuDiv);

        return menuDiv;
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
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            if (key == "userSettings") continue;

            let data = JSON.parse(localStorage.getItem(key));

            let savefileDiv = document.createElement("div");
            savefileDiv.setAttribute("id", `vngine-savefile-${key}`);
            savefileDiv.classList.add("vngine-savefile");
            
            let savefileImg = document.createElement("div");
            savefileImg.classList.add("vngine-savefile-picture");
            background = getNodeBackground(data.nodeIndex);
            if (background) {
                savefileImg.style.backgroundImage = `url(game/res/img/backgrounds/${background})`;
            }

            let savefileName = document.createElement("h1");
            savefileName.classList.add("vngine-savefile-name");
            savefileName.innerText = key;
            
            let savefileText = document.createElement("p");
            savefileText.classList.add("vngine-savefile-sentence");
            if(game.nodes[data.nodeIndex].dialog) {
                savefileText.innerText = game.nodes[data.nodeIndex].dialog[data.dialogIndex].text;
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
                    load(key);
                }
            });
            
            let deleteButton = document.createElement("button");
            deleteButton.innerText = "Delete";
            deleteButton.setAttribute("id", `delete-${key}`);
            deleteButton.classList.add("vngine-btn", "vngine-btn-small");
            deleteButton.addEventListener("click", e => {
                if (e.target && e.target.id == `delete-${key}`) {
                    deleteSavefile(key);
                }
            });

            //Appending
            savefileDiv.appendChild(savefileImg);
            savefileDiv.appendChild(savefileName);
            savefileDiv.appendChild(savefileText);
            savefileDiv.appendChild(loadButton);
            savefileDiv.appendChild(deleteButton);
            savefileList.appendChild(savefileDiv);

        }

        savefilesBody.appendChild(savefileList);
    }

    function generateBacklogScreen () {
        /* HTML to generate
        
        */

        let backlogDiv = document.createElement("div");
        backlogDiv.setAttribute("id", "vngine-savefiles");
        backlogDiv.classList.add("vngine-screen", "vngine-savefiles");
        if (game.backlogBackground) {
            backlogDiv.style.backgroundImage = `url(game/res/img/backgrounds/${game.backlogBackground})`;
        }
        
        let backlogHeader = document.createElement("div");
        backlogHeader.setAttribute("id", "vngine-savefiles-header");
        backlogHeader.classList.add("vngine-header");

        let backBtn = document.createElement("button");
        backBtn.setAttribute("id", "vngine-savefiles-back");
        backBtn.classList.add("vngine-btn", "vngine-back-btn");
        backBtn.innerText = "Back";
        backBtn.addEventListener("click", e => {
            if (e.target && e.target.id == "vngine-savefiles-back") {
                ScreenManager.switchToPreviousScreen();
            }
        });
        
        let backlogHeaderText = document.createElement("p");
        backlogHeaderText.setAttribute("id", "vngine-savefiles-header-text");
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

    //Returns the background that should be displayed in a given node
    function getNodeBackground (nodeIndex) {
        let index = nodeIndex;
        let background = undefined;
        while (index >= 0 && !background) {
            background = game.nodes[index].setBackground;
            index--;

            if (background) break;
        }

        return background;
    }

    //Returns the characters that should be displayed in a given node
    function getNodeCharacters (nodeIndex) {
        let index = nodeIndex;
        let characters = undefined;
        while (index >= 0 && !background) {
            characters = game.nodes[index].setCharacters;
            index--;

            if (characters) break;
        }

        return characters;
    }

    function menuNewGameClick () {
        loadNode(0);
        DialogBox.setVisible(true);
        ScreenManager.switchToScreen(screens.GAME);
    }

    function menuContinueClick () {
        ScreenManager.switchToScreen(screens.SAVEFILES);
    }

    function menuSettingsClick () {
        ScreenManager.switchToScreen(screens.SETTINGS);
    }

    //Loads a node from the game given its index
    function loadNode (index) {
        currentNode = game.nodes[index];
        currentNodeIndex = index;

        if (!currentNode) {
            console.error(`VNGINE_ERROR: Couldn't load game node with index ${index}`);
        }
        else {
            //Set Background
            if (currentNode.setBackground) {
                ScreenManager.gameDiv.style.backgroundImage = `url("game/res/img/backgrounds/${currentNode.setBackground}")`;
            }
            else if (!ScreenManager.gameDiv.style.backgroundImage) {
                let background = getNodeBackground(currentNodeIndex);
                if (background) {
                    ScreenManager.gameDiv.style.backgroundImage = `url("game/res/img/backgrounds/${background}")`;
                }
                else {
                    console.error(`VNGINE_ERROR: Couldn't get background for node with index ${currentNodeIndex}`)
                }
            }

            //Set characters
            if (currentNode.setCharacters) {
                renderCharacters(currentNode.setCharacters);
            }
            else if (!characterImgs.map(c => c.getAttribute("src") != "").includes(true)) {
                let characters = getNodeCharacters(currentNodeIndex);
                if (characters) {
                    renderCharacters(characters)
                }
                else {
                    console.error(`VNGINE_ERROR: Couldn't get character pictures for node with index ${currentNodeIndex}`)
                }
            }
                
            //Checks for decision/dialog
            if (currentNode.decision) {
                DialogBox.setVisible(false);
                renderDecisionOptions(currentNode.decision);
            }
            else if (currentNode.dialog) {
                //Starts dialog
                DialogBox.setVisible(true);
                currentDialogIndex = 0;
                updateDialog();
            }
            else {
                console.warn(`VNGINE_WARNING: node with index ${index} doesn't have either dialog or decision`);
            }
        }
    }

    function renderBacklog () {
        let backlogList = document.getElementById("vngine-backlog-list");

        let backlog = Backlog.getAsTextArray();
        let html = "";
        backlog.forEach(str => {
            html += `<li>${str}</li>`;
        });

        backlogList.innerHTML = html;
    }

    //Display the given characters on the game screen
    function renderCharacters (characters) {
        characterImgs.forEach(img => {
            img.setAttribute("src", "");
            img.setAttribute("data-character", "");
            img.style.left = "";
            img.style.right = "";
        });

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
        decisionButtonsDiv.innerHTML = "";
        decisionButtons.splice(0, decisionButtons.length);
        
        //Set up new decision buttons
        for (let i = 0; i < options.length; i++) {
            decisionButtons.push(document.createElement("button"));
            decisionButtons[i].classList.add("vngine-btn");
            decisionButtons[i].innerText = options[i].text;
            decisionButtons[i].setAttribute("id", `vngine-decision-btn-${i}`);
            
            decisionButtons[i].addEventListener("click", e => {
                if (e.target && e.target.id == `vngine-decision-btn-${i}`) {
                    //Hide decision buttons
                    decisionButtonsDiv.style.display = "none";

                    //Adds entry to the backlog
                    Backlog.push({
                        type: backlogEntryType.DECISION,
                        nodeIndex: currentNodeIndex,
                        decisionIndex: i
                    });
                    needToUpdateBacklogScreen = true;

                    //Loads the target node of the decision
                    loadNode(options[i].targetNode);
                }
            });

            decisionButtonsDiv.appendChild(decisionButtons[i]);
        }
        
        //Show decision buttons
        decisionButtonsDiv.style.display = "block";
    }

    //Writes the dialog text
    function updateDialog () {
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

        let music = currentNode.dialog[currentDialogIndex].playMusic;
        if(music) {
            Audio.playMusic(`game/res/audio/${music}`);
        }

        let effect = currentNode.dialog[currentDialogIndex].playEffect;
        if (effect) {
            Audio.playEffect(`game/res/audio/${effect}`)
        }

        //Updates dialog text
        DialogBox.setCharacter(game.characters[characterIndex].name);
        DialogBox.writeText(currentNode.dialog[currentDialogIndex].text);

        currentDialogIndex++;
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

    //Event handler
    function gameClickEvent () {
        if(ScreenManager.currentScreen != screens.GAME || !DialogBox.visible || !currentNode.dialog) return;

        if (DialogBox.isWriting) {
            DialogBox.cancelWritingAnimation();
        }
        else {
            if (currentDialogIndex >= currentNode.dialog.length) {
                if (!currentNode.nextNode) {
                    return;
                }
    
                loadNode(currentNode.nextNode);
            }
            else {
                updateDialog();
            }
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
            ScreenManager.currentScreen == screens.BACKLOG) {
            
            ScreenManager.switchToPreviousScreen();
        }
    }

    //---------------SAVE-LOAD---------------//

    //Saves game information on localStorage
    function save (saveFile) {
        if (!saveFile) return;

        let saveData = {
            "nodeIndex": currentNodeIndex,
            "dialogIndex": currentDialogIndex-1
        };

        localStorage.setItem(saveFile, JSON.stringify(saveData));
        needToUpdateSavefilesScreen = true;
    }

    //Loads game information from localStorage
    function load (saveFile) {
        let loadedData = localStorage.getItem(saveFile);
        if (loadedData) {
            loadedData = JSON.parse(loadedData);
            
            loadNode(loadedData.nodeIndex);
            if (game.nodes[loadedData.nodeIndex].dialog) {
                currentDialogIndex = loadedData.dialogIndex;
                updateDialog();
            }
        }

        ScreenManager.switchToScreen(screens.GAME);
    }

    function deleteSavefile (saveFile) {
        localStorage.removeItem(saveFile);
        needToUpdateSavefilesScreen = true;
    }
      
}())