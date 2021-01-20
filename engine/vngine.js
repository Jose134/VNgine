(function () {
    let game = null; //Game data object

    let mainDiv = document.getElementById("vngine-div");;
    
    //Screens
    let loadingDiv = null;
    let gameDiv = null;
    let menuDiv = null;
    let settingsDiv = null;
    let loadsaveDiv = null;

    //Game DOM
    let dialogBoxCharacter = null;
    let dialogBoxText = null;

    let charactersDiv = null;
    let rightCharacters = [];
    let leftCharacters  = [];

    //Avoid reloading images
    let previousRightCharacterIndexes = [];
    let previousLeftCharacterIndexes = [];
    let previousBackground = null;

    let decisionButtonsDiv = null;
    let decisionButtons = [];
    let decisionHandlers = [];

    //Game status
    let currentNode = null;
    let currentDialogIndex = 0;

    //Settings
    const textFastTime = 50;   //time that takes to write the next character (in ms)
    const textMediumTime = 100; //time that takes to write the next character (in ms)
    const textSlowTime = 200;   //time that takes to write the next character (in ms)
    let textSpeed = textMediumTime;
    let writingText = false;
    
    //Initialization
    window.onload = function () {
        generateLoadingScreen();
        generateGameScreen();
        generateMenuScreen();
        generateSettingsScreen();
        generateLoadSaveScreen();

        switchToScreen("loading");
        
        //Loads the game JSON file into the "game" variable
        let gamePath = mainDiv.getAttribute("data-game-file");
        if (!gamePath) {
            //Default path
            gamePath = "/game/game.json"
        }
        fetch(gamePath)
            .then(res => res.json())
            .then(data => {
                game = data;
                gameFileLoaded();
            });
    }

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

        vngineDialogBox.appendChild(dialogBoxCharacter);
        vngineDialogBox.appendChild(dialogBoxText);
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
    function generateLoadSaveScreen () {
        loadsaveDiv = document.createElement("div");
    }

    function switchToScreen (screen) {
        loadingDiv.style.display  = "none";
        menuDiv.style.display     = "none";
        gameDiv.style.display     = "none";
        settingsDiv.style.display = "none";
        loadsaveDiv.style.display = "none";

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
            case "loadsave":
                loadsaveDiv.style.display = "block";
                break;
        }
    }

    function menuNewGameClick () {
        loadNode(0);
        switchToScreen("game");
    }

    function menuContinueClick () {
        switchToScreen("loadsave");
    }

    function menuSettingsClick () {
        switchToScreen("settings");
    }

    //Function called when the game.json file is loaded
    function gameFileLoaded () {
        menuDiv.innerHTML += game.title + " by " + game.author;
        switchToScreen("menu");
    }

    //Loads a node from the game given its id
    function loadNode (id) {
        currentNode = game.nodes[id];
        if (currentNode == undefined || currentNode == null) {
            console.error(`VNGINE_ERROR: Couldn't load game node with id ${id}`);
        }
        else {
            //Set Background
            if (previousBackground != currentNode.background) {
                gameDiv.style.background = `url("/game/res/img/backgrounds/${currentNode.background}")`;
                previousBackground = currentNode.background;
            }

            //Set characters
            if(currentNode.charactersRight) {
                if (!compareArrays(currentNode.charactersRight, previousRightCharacterIndexes)) {
                    Array.from(rightCharacters).forEach(e => {
                        e.setAttribute("src", "");
                        e.setAttribute("data-character", "");
                    });
                    
                    for (let i = 0; i < currentNode.charactersRight.length; i++) {
                        let characterIndex = currentNode.charactersRight[i];
                        let picURL = `/game/res/img/characters/${game.characters[characterIndex].pictures[0]}`;
                        
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
            
            if(currentNode.charactersLeft) {
                if (!compareArrays(currentNode.charactersLeft, previousLeftCharacterIndexes)) {
                    Array.from(leftCharacters).forEach(e => {
                        e.setAttribute("src", "");
                        e.setAttribute("data-character", "");
                    });
                    
                    for (let i = 0; i < currentNode.charactersLeft.length; i++) {
                        let characterIndex = currentNode.charactersLeft[i];
                        let picURL = `/game/res/img/characters/${game.characters[characterIndex].pictures[0]}`;
                        
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
                    let picURL = `/game/res/img/characters/${game.characters[data.character].pictures[data.picture]}`;
                    e.setAttribute("src", picURL);
                }
            });
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