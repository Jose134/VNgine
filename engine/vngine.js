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
    let currentScreen = null;
    let gameDiv = null;
    let menuDiv = null;
    let settingsDiv = null;
    let savefilesDiv = null;

    //Game DOM
    let dialogBoxCharacter = null;
    let dialogBoxText = null;

    let charactersDiv = null;
    let rightCharacters = [];
    let leftCharacters  = [];
    
    //Decision making
    let decisionButtonsDiv = null;
    let decisionButtons = [];
    let decisionHandlers = [];
    
    //Avoid reloading images
    let previousRightCharacterIndexes = [];
    let previousLeftCharacterIndexes = [];

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
    let savefileList = null;
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
            generateGameScreen();
            generateMenuScreen();
            generateSettingsScreen();
            generateSavefilesScreen();
        }
    }

    const DialogBox = class {
        static writingInterval;
        static dialogBoxText;
        static dialogBoxCharacter;

        static isWriting = false;
        static currentTargetText;
        static writtenCharacters = 0;

        static init = function () {
            this.dialogBoxText = document.getElementById("vngine-dialog-text");
            this.dialogBoxCharacter = document.getElementById("vngine-dialog-character");
        }

        static setCharacter = function (character) {
            this.dialogBoxCharacter.innerText = character;
        }

        static writeText = function (str) {
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
        Audio.init();
        DialogBox.init();
        
        gameFileLoaded();
    }

    //Keyboard events
    window.addEventListener("keydown", e => {
        if (e.code == "Space") {
            if (!spaceHold) {
                gameClickEvent();
                spaceHold = true;
            }
        }
    });

    window.addEventListener("keyup", e => {
        if (e.code == "Space") {
            spaceHold = false;
        }
    });

    //Creates all the DOM elements needed for the game screen
    function generateGameScreen () {
        gameDiv = document.createElement("div");
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
                switchToScreen(screens.MENU);
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
                switchToScreen(screens.SAVEFILES);
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
    }
    
    //Creates all the DOM elements needed for the menu screen
    function generateMenuScreen () {
        //Menu Screen
        menuDiv = document.createElement("div");
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
    }
    
    //Creates all the DOM elements needed for the settings screen
    function generateSettingsScreen () {
        settingsDiv = document.createElement("div");
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
        savefilesDiv = document.createElement("div");
        savefilesDiv.setAttribute("id", "vngine-savefiles");
        savefilesDiv.classList.add("vngine-screen", "vngine-savefiles");

        let savefilesHeader = document.createElement("div");
        savefilesHeader.setAttribute("id", "vngine-savefiles-header");
        savefilesHeader.classList.add("vngine-savefiles-header");

        let savefilesHeaderText = document.createElement("p");
        savefilesHeaderText.setAttribute("id", "vngine-savefiles-header-text");
        savefilesHeaderText.classList.add("vngine-savefiles-header-text");
        savefilesHeaderText.innerText = "Load";

        savefileList = document.createElement("div");
        savefileList.setAttribute("id", "vngine-savefile-list");
        savefileList.classList.add("vngine-savefile-list");

        generateSavefileList();

        //Appending
        savefilesHeader.appendChild(savefilesHeaderText);
        savefilesDiv.appendChild(savefilesHeader);
        savefilesDiv.appendChild(savefileList);
        mainDiv.appendChild(savefilesDiv);
    }

    function generateSavefileList () {
        if (!savefileList) return; //Don't forget to use protection
        /* HTML to generate
        <div class="vngine-savefile">
            <div class="vngine-savefile-picture"></div>
            <h1 class="vngine-savefile-name">22-2-2021 10:03PM</h1>
            <p class="vngine-savefile-sentence">This is a test, bitch!</p>
            <button class="vngine-btn vngine-btn-small">Load</button>
            <button class="vngine-btn vngine-btn-small">Delete</button>
        </div>
        */

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
    }

    function switchToScreen (screen) {
        currentScreen = screen;

        menuDiv.style.display      = "none";
        gameDiv.style.display      = "none";
        settingsDiv.style.display  = "none";
        savefilesDiv.style.display = "none";

        switch (screen) {
            case screens.MENU:
                menuDiv.style.display = "block";
                break;
            case screens.GAME:
                gameDiv.style.display = "block";
                break;
            case screens.SETTINGS:
                settingsDiv.style.display = "block";
                break;
            case screens.SAVEFILES:
                savefilesDiv.style.display = "block";
                break;
            default:
                currentScreen = null;
                console.error(`VNGINE_ERROR: Couldn't load screen named ${screen}`);
                break;
        }
    }

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

    function menuNewGameClick () {
        loadNode(0);
        switchToScreen(screens.GAME);
    }

    function menuContinueClick () {
        switchToScreen(screens.SAVEFILES);
    }

    function menuSettingsClick () {
        switchToScreen(screens.SETTINGS);
    }

    //Function called when the game.json file is loaded
    function gameFileLoaded () {
        switchToScreen(screens.MENU);
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
                gameDiv.style.background = `url("game/res/img/backgrounds/${currentNode.setBackground}")`;
            }
            else if (!gameDiv.style.background) {
                let background = getNodeBackground(currentNodeIndex);
                if (background) {
                    gameDiv.style.background = `url("game/res/img/backgrounds/${background}")`;
                }
                else {
                    console.error(`VNGINE_ERROR: Couldn't get background for node index ${currentNodeIndex}`)
                }
            }


            //Set characters
            if (!compareArrays(currentNode.charactersRight, previousRightCharacterIndexes)) {
                Array.from(rightCharacters).forEach(e => {
                    e.setAttribute("src", "");
                    e.setAttribute("data-character", "");
                });

                if(currentNode.charactersRight) {
                    for (let i = 0; i < currentNode.charactersRight.length; i++) {
                        let characterIndex = currentNode.charactersRight[i];
                        let picURL = `game/res/img/characters/${game.characters[characterIndex].pictures[0]}`;
                        
                        //Add new DOM element if needed
                        if (rightCharacters[i] == null || rightCharacters[i] == undefined) {
                            let character = document.createElement("img");
                            character.classList.add("vngine-character", "vngine-character-right");
                            charactersDiv.append(character);
                            rightCharacters[i] = character;
                        }
    
                        rightCharacters[i].setAttribute("data-character", characterIndex);
                        rightCharacters[i].setAttribute("src", picURL);
                    }
    
                    previousRightCharacterIndexes = currentNode.charactersRight;
                }
            }
            
            if (!compareArrays(currentNode.charactersLeft, previousLeftCharacterIndexes)) {
                Array.from(leftCharacters).forEach(e => {
                    e.setAttribute("src", "");
                    e.setAttribute("data-character", "");
                });
                
                if(currentNode.charactersLeft) {
                    for (let i = 0; i < currentNode.charactersLeft.length; i++) {
                        let characterIndex = currentNode.charactersLeft[i];
                        let picURL = `game/res/img/characters/${game.characters[characterIndex].pictures[0]}`;
                        
                        //Add new DOM element if needed
                        if (leftCharacters[i] == null || leftCharacters[i] == undefined) {
                            let character = document.createElement("img");
                            character.classList.add("vngine-character", "vngine-character-left");
                            charactersDiv.append(character);
                            leftCharacters[i] = character;
                        }
    
                        leftCharacters[i].setAttribute("data-character", characterIndex);
                        leftCharacters[i].setAttribute("src", picURL);
                    }

                    previousLeftCharacterIndexes = currentNode.charactersLeft;
                }
            }
                
            //Checks for decision/dialog
            if (currentNode.decision) {
                //Remove old decision data
                decisionButtonsDiv.innerHTML = "";
                decisionButtons.splice(0, decisionButtons.length);

                for (let i = 0; i < decisionHandlers.length; i++) {
                    document.removeEventListener("click", decisionHandlers[i]);
                }
                decisionHandlers.splice(0, decisionHandlers.length);
                
                //Set up new decision buttons
                for (let i = 0; i < currentNode.decision.length; i++) {
                    decisionButtons.push(document.createElement("button"));
                    decisionButtons[i].classList.add("vngine-btn");
                    decisionButtons[i].innerText = currentNode.decision[i].text;
                    decisionButtons[i].setAttribute("id", `vngine-decision-btn-${i}`);
                    
                    decisionHandlers[i] = function (e) {
                        if (e.target && e.target.id == `vngine-decision-btn-${i}`) {
                            loadNode(currentNode.decision[i].targetNode);
                        }
                    }
                    document.addEventListener("click", decisionHandlers[i]);

                    decisionButtonsDiv.appendChild(decisionButtons[i]);
                }
                
                //Show decision buttons
                decisionButtonsDiv.style.display = "block";
            }
            else if (currentNode.dialog) {
                //Hide decision buttons
                decisionButtonsDiv.style.display = "none";
                
                //Starts dialog
                currentDialogIndex = 0;
                updateDialog();
            }
        }
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
        let elements = Array.from(leftCharacters).concat(Array.from(rightCharacters));
        for (let i = 0; i < elements.length; i++) {
            if (elements[i].getAttribute("data-character") == character) {
                return elements[i];
            }
        }
        return null;
    }

    //Event handler
    function gameClickEvent () {
        if(!currentNode.dialog) return;

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
                DialogBox.cancelWritingAnimation();
                updateDialog();
            }
        }

        switchToScreen(screens.GAME);
    }

    //---------------HELPERS---------------//
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    //Returns true if both arrays are equal (can be different references), false otherwise
    function compareArrays (a, b) {
        return Array.isArray(a) &&
               Array.isArray(b) &&
               a.length === b.length &&
               a.every((val, index) => val === b[index])
        ;
    }
      
}())