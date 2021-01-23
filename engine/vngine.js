(function () {
    let game = null; //Game data object

    let mainDiv = document.getElementById("vngine-div");;
    
    //Screens
    let currentScreen = "";
    let loadingDiv = null;
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
    let previousBackground = null;

    //Game status
    let currentNode = null;
    let currentNodeIndex = 0;
    let currentDialogIndex = 0;

    //Text animation
    const textFastTime = 50;   //time that takes to write the next character (in ms)
    const textMediumTime = 100; //time that takes to write the next character (in ms)
    const textSlowTime = 200;   //time that takes to write the next character (in ms)
    let textSpeed = textMediumTime;
    let writingText = false;

    //Keyboard
    let spaceHold = false;

    //Savefiles DOM
    let savefileList = null;
    let loadHandlers = [];

    //Audio
    let audioBGM = null;
    let audioEffects = null;
    
    //Initialization
    window.onload = function () {
        if (!mainDiv) {
            console.error("VNGINE_ERROR: no element with id 'vngine-div' was found!");
            return;
        }

        //Loads the game JSON file into the "game" variable
        game = gameJSON;
        
        //Create audio elements
        audioBGM = document.createElement("audio");
        audioBGM.setAttribute("id", "vngine-audio-bgm");
        
        audioEffects = document.createElement("audio");
        audioEffects.setAttribute("id", "vngine-audio-effects");

        //Generate screens
        generateLoadingScreen();
        generateGameScreen();
        generateMenuScreen();
        generateSettingsScreen();
        generateSavefilesScreen();
        
        switchToScreen("loading");
        
        gameFileLoaded();
        
        /* Old method to get the game file
        let gamePath = mainDiv.getAttribute("data-game-file");
        if (!gamePath) {
            //Default path
            gamePath = "game/game.json"
        }

        fetch(gamePath)
        .then(res => res.json())
            .then(data => {
                game = data;
                gameFileLoaded();
            });
        */
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

    //Creates all the DOM elements needed for the loading screen
    function generateLoadingScreen () {
        loadingDiv = document.createElement("div");
        loadingDiv.setAttribute("id", "vngine-loading");
        loadingDiv.classList.add("vngine-screen", "vngine-loading");

        let textWrapper = document.createElement("div");
        textWrapper.classList.add("vngine-loading-text-wrapper");

        let loadingText = document.createElement("h1");
        loadingText.classList.add("vngine-loading-text");
        loadingText.innerText = "Loading...";

        textWrapper.appendChild(loadingText);
        loadingDiv.appendChild(textWrapper);

        mainDiv.appendChild(loadingDiv);
    }

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
        dialogBoxCharacter.classList.add("vngine-dialog-character");

        dialogBoxText = document.createElement("p");
        dialogBoxText.classList.add("vngine-dialog-text");

        let optionsContainer = document.createElement("div");
        optionsContainer.classList.add("vngine-option-text-container");

        let menuText = document.createElement("a");
        menuText.innerText = "Menu";
        menuText.classList.add("vngine-option-text");
        menuText.setAttribute("id", "menuText");
        document.addEventListener("click", e => {
            if (e.target && e.target.id == "menuText") {
                switchToScreen("menu");
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
                switchToScreen("savefiles");
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
            if (game.nodes[data.nodeIndex].background) {
                savefileImg.style.backgroundImage = `url(game/res/img/backgrounds/${game.nodes[data.nodeIndex].background})`;
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

        loadingDiv.style.display  = "none";
        menuDiv.style.display     = "none";
        gameDiv.style.display     = "none";
        settingsDiv.style.display = "none";
        savefilesDiv.style.display = "none";

        switch (screen) {
            case "loading":
                loadingDiv.style.display = "block";
                break;
            case "menu":
                menuDiv.style.display = "block";
                break;
            case "game":
                gameDiv.style.display = "block";
                break;
            case "settings":
                settingsDiv.style.display = "block";
                break;
            case "savefiles":
                savefilesDiv.style.display = "block";
                break;
            default:
                currentScreen = "";
                console.error(`VNGINE_ERROR: Couldn't load screen named ${screen}`);
                break;
        }
    }

    function menuNewGameClick () {
        loadNode(0);
        switchToScreen("game");
    }

    function menuContinueClick () {
        switchToScreen("savefiles");
    }

    function menuSettingsClick () {
        switchToScreen("settings");
    }

    //Function called when the game.json file is loaded
    function gameFileLoaded () {
        menuDiv.innerHTML += game.title + " by " + game.author;
        switchToScreen("menu");
    }

    //Loads a node from the game given its id (index)
    function loadNode (id) {
        currentNode = game.nodes[id];
        currentNodeIndex = id;

        if (!currentNode) {
            console.error(`VNGINE_ERROR: Couldn't load game node with id ${id}`);
        }
        else {
            //Set Background
            if (previousBackground != currentNode.background) {
                gameDiv.style.background = `url("game/res/img/backgrounds/${currentNode.background}")`;
                previousBackground = currentNode.background;
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

        let changeMusic = currentNode.dialog[currentDialogIndex].changeMusic;
        if(changeMusic) {
            audioBGM.setAttribute("src", `game/res/audio/${changeMusic}`);
            audioBGM.play();
        }
        else if (changeMusic === "") {
            audioBGM.pause();
            audioBGM.currentTime = 0;
        }
        
        //Updates dialog text
        dialogBoxCharacter.innerText = game.characters[characterIndex].name;
        writeDialogTextAnimation(currentNode.dialog[currentDialogIndex].text);
    }

    //Text writing animation for dialogBoxText
    async function writeDialogTextAnimation (str) {
        let text = Array.from(str);
        let writtenText = "";
        
        writingText = true;
        
        dialogBoxText.innerText = "";
        for (let i = 0; i < text.length; i++) {
            if (!writingText) return;

            writtenText += text[i];
            if (text[i] == " ") {
                i++;
                writtenText += text[i];
            }
            dialogBoxText.innerText = writtenText;
            await sleep(textSpeed);
        }

        currentDialogIndex++;
        writingText = false;
    }

    //Stops the writing animation and writes the whole text
    function skipTextAnimation () {
        writingText = false;
        dialogBoxText.innerText = currentNode.dialog[currentDialogIndex].text;
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

        if (writingText) {
            skipTextAnimation();
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

    //Save
    function save (saveFile) {
        if (!saveFile) return;

        let saveData = {
            "nodeIndex": currentNodeIndex,
            "dialogIndex": currentDialogIndex-1
        };

        localStorage.setItem(saveFile, JSON.stringify(saveData))
    }

    //Load
    function load (saveFile) {
        let loadedData = localStorage.getItem(saveFile);
        if (loadedData) {
            loadedData = JSON.parse(loadedData);

            loadNode(loadedData.nodeIndex);
            if (currentNode.dialog) {
                while (currentDialogIndex < loadedData.dialogIndex) {
                    updateDialog();
                    skipTextAnimation();
                }
            }
        }

        switchToScreen("game");
    }

    //---------------Helpers---------------//
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