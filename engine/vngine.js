(function () {
    let game = null; //Game data object

    let mainDiv = document.getElementById("vngine-div");
    
    //Screens
    const screens = {
        GAME:      "game",
        MENU:      "menu",
        SETTINGS:  "settings",
        SAVEFILES: "savefiles"
    }

    //Characters DOM
    let characterImgs = [];
    let charactersDiv = null;
    
    //Decision making
    let decisionButtonsDiv = null;
    let decisionButtons = [];
    let decisionHandlers = [];

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
    let writingText = false;

    //Keyboard
    let spaceHold = false;

    //Savefiles DOM
    let loadHandlers = [];

    //Audio
    let audioUIClick = "game/res/audio/ui_click.wav";

    const Audio = class {
        static sfxAudioElement = null;
        static bgmAudioElement = null;

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
                this.bgmAudioElement.play();
            }
            
        }
    }

    const ScreenManager = class {
        static currentScreen = null;
        static gameDiv = null;
        static menuDiv = null;
        static settingsDiv = null;
        static savefilesDiv = null;

        static init = function () {
            this.gameDiv      = generateGameScreen();
            this.menuDiv      = generateMenuScreen();
            this.settingsDiv  = generateSettingsScreen();
            this.savefilesDiv = generateSavefilesScreen();
        }

        static switchToScreen = function (screen) {
            this.currentScreen = screen;
    
            this.menuDiv.style.display      = "none";
            this.gameDiv.style.display      = "none";
            this.settingsDiv.style.display  = "none";
            this.savefilesDiv.style.display = "none";
    
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
                    this.savefilesDiv.style.display = "block";
                    break;
                default:
                    this.currentScreen = null;
                    console.error(`VNGINE_ERROR: Couldn't load screen named ${screen}`);
                    break;
            }
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
    
    //Initialization
    window.onload = function () {
        if (!mainDiv) {
            console.error("VNGINE_ERROR: no element with id 'vngine-div' was found!");
            return;
        }

        //Loads the game JSON file into the "game" variable
        game = gameJSON;
        
        //Initialize subsystems
        ScreenManager.init();
        KeyboardInput.init();
        Audio.init();
        DialogBox.init();

        //Sets up keyboard callbacks
        KeyboardInput.addKeyCallback("Space",        () => gameClickEvent());
        KeyboardInput.addKeyCallback("ControlLeft",  () => DialogBox.toggleVisibility());
        KeyboardInput.addKeyCallback("ControlRight", () => DialogBox.toggleVisibility());

        ScreenManager.switchToScreen(screens.MENU);
    }

    //Creates all the DOM elements needed for the game screen
    function generateGameScreen () {
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

        optionsContainer.appendChild(menuText);
        optionsContainer.appendChild(saveText);
        optionsContainer.appendChild(loadText);
        optionsContainer.appendChild(skipText);
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
        let settingsDiv = document.createElement("div");

        return settingsDiv;
    }
    
    //Creates all the DOM elements needed for the Load/Save screen
    function generateSavefilesScreen () {
        /* HTML to generate
        <div id="vngine-savefiles" class="vngine-screen vngine-savefiles">
            <div id="vngine-savefiles-header" class="vngine-savefiles-header">
                <p id="vngine-savefiles-text" class="vngine-savefiles-header-text">Load</p>
            </div>
            <div id="vngine-savefile-list" class="vngine-savefile-list">
                
            </div>
        </div>
        */
        let savefilesDiv = document.createElement("div");
        savefilesDiv.setAttribute("id", "vngine-savefiles");
        savefilesDiv.classList.add("vngine-screen", "vngine-savefiles");

        let savefilesHeader = document.createElement("div");
        savefilesHeader.setAttribute("id", "vngine-savefiles-header");
        savefilesHeader.classList.add("vngine-savefiles-header");

        let savefilesHeaderText = document.createElement("p");
        savefilesHeaderText.setAttribute("id", "vngine-savefiles-header-text");
        savefilesHeaderText.classList.add("vngine-savefiles-header-text");
        savefilesHeaderText.innerText = "Load";

        savefileList = generateSavefileList();

        //Appending
        savefilesHeader.appendChild(savefilesHeaderText);
        savefilesDiv.appendChild(savefilesHeader);
        savefilesDiv.appendChild(savefileList);
        mainDiv.appendChild(savefilesDiv);

        return savefilesDiv;
    }

    function generateSavefileList () {
        /* HTML to generate
        <div class="vngine-savefile">
            <div class="vngine-savefile-picture"></div>
            <h1 class="vngine-savefile-name">22-2-2021 10:03PM</h1>
            <p class="vngine-savefile-sentence">This is a test, bitch!</p>
            <button class="vngine-btn vngine-btn-small">Load</button>
            <button class="vngine-btn vngine-btn-small">Delete</button>
        </div>
        */
        let savefileList = document.createElement("div");
        savefileList.setAttribute("id", "vngine-savefile-list");
        savefileList.classList.add("vngine-savefile-list");

        for (let i = 0; i < loadHandlers.length; i++) {
            document.removeEventListener("click", loadHandlers[i]);
        }
        loadHandlers.splice(0, loadHandlers.length);

        let keys = Object.keys(localStorage);
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
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
            loadHandlers[i] = function (e) {
                if (e.target && e.target.id == `load-${key}`) {
                    load(key);
                }
            };
            document.addEventListener("click", loadHandlers[i]);
            
            let deleteButton = document.createElement("button");
            deleteButton.innerText = "Delete";
            deleteButton.setAttribute("id", `delete-${key}`);
            deleteButton.classList.add("vngine-btn", "vngine-btn-small");

            //Appending
            savefileDiv.appendChild(savefileImg);
            savefileDiv.appendChild(savefileName);
            savefileDiv.appendChild(savefileText);
            savefileDiv.appendChild(loadButton);
            savefileDiv.appendChild(deleteButton);
            savefileList.appendChild(savefileDiv);

        }

        return savefileList;
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
                ScreenManager.gameDiv.style.background = `url("game/res/img/backgrounds/${currentNode.setBackground}")`;
            }
            else if (!ScreenManager.gameDiv.style.background) {
                let background = getNodeBackground(currentNodeIndex);
                if (background) {
                    ScreenManager.gameDiv.style.background = `url("game/res/img/backgrounds/${background}")`;
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
                if (background) {
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

        for (let i = 0; i < decisionHandlers.length; i++) {
            document.removeEventListener("click", decisionHandlers[i]);
        }
        decisionHandlers.splice(0, decisionHandlers.length);
        
        //Set up new decision buttons
        for (let i = 0; i < options.length; i++) {
            decisionButtons.push(document.createElement("button"));
            decisionButtons[i].classList.add("vngine-btn");
            decisionButtons[i].innerText = options[i].text;
            decisionButtons[i].setAttribute("id", `vngine-decision-btn-${i}`);
            
            decisionHandlers[i] = function (e) {
                if (e.target && e.target.id == `vngine-decision-btn-${i}`) {
                    //Hide decision buttons
                    decisionButtonsDiv.style.display = "none";

                    //Loads the target node of the decision
                    loadNode(options[i].targetNode);
                }
            }
            document.addEventListener("click", decisionHandlers[i]);

            decisionButtonsDiv.appendChild(decisionButtons[i]);
        }
        
        //Show decision buttons
        decisionButtonsDiv.style.display = "block";
    }

    //Writes the dialog text
    function updateDialog () {
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
        if(!DialogBox.visible || !currentNode.dialog) return;

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

    //---------------SAVE-LOAD---------------//

    //Saves game information on localStorage
    function save (saveFile) {
        if (!saveFile) return;

        let saveData = {
            "nodeIndex": currentNodeIndex,
            "dialogIndex": currentDialogIndex-1
        };

        localStorage.setItem(saveFile, JSON.stringify(saveData))
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

    //---------------HELPERS---------------//

    //Returns true if both arrays are equal (can be different references), false otherwise
    function compareArrays (a, b) {
        return Array.isArray(a) &&
               Array.isArray(b) &&
               a.length === b.length &&
               a.every((val, index) => val === b[index])
        ;
    }
      
}())