declare var gameJSON: Object;

interface SaveFile {
    nodeIndex: number;
    dialogIndex: number;
}

(function () {
    let game = null; //Game data object

    let mainDiv: HTMLDivElement = document.getElementById("vngine-div") as HTMLDivElement;
    
    //Screens
    enum Screen {
        GAME,
        MENU,
        SETTINGS,
        LOAD
    }
    let currentScreen: Screen = null;
    let gameDiv: HTMLDivElement = null;
    let menuDiv: HTMLDivElement = null;
    let settingsDiv: HTMLDivElement = null;
    let savefilesDiv: HTMLDivElement = null;

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
    let currentNodeIndex: number = 0;
    let currentDialogIndex: number = 0;

    //Text animation
    const textFastTime: number = 50;   //time that takes to write the next character (in ms)
    const textMediumTime: number = 100; //time that takes to write the next character (in ms)
    const textSlowTime: number = 200;   //time that takes to write the next character (in ms)
    let textSpeed: number = textMediumTime;
    let writingText: boolean = false;

    //Keyboard
    let spaceHold: boolean = false;

    //Savefiles DOM
    let savefileList = null;
    let loadHandlers = [];

    //Audio
    let audioBGM: HTMLAudioElement = null;
    let audioEffects: HTMLAudioElement = null;

    let audioUIClick: string = "game/res/audio/ui_click.wav";
    
    //Initialization
    window.onload = function () {
        if (!mainDiv) {
            console.error("VNGINE_ERROR: no element with id 'vngine-div' was found!");
            return;
        }

        //Loads the game JSON file into the "game" variable
        //NOTE: This requires the game.json script to be previously imported in the HTML
        game = gameJSON;
        
        //Create audio elements
        audioBGM = document.createElement("audio");
        audioBGM.setAttribute("id", "vngine-audio-bgm");
        
        audioEffects = document.createElement("audio");
        audioEffects.setAttribute("id", "vngine-audio-effects");

        //Generate screens
        generateScreens();
        switchToScreen(Screen.MENU);
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

    //Generates all the screens
    function generateScreens (): void {
        generateGameScreen();
        generateMenuScreen();
        generateSettingsScreen();
        generateSavefilesScreen();
    }

    //Creates all the DOM elements needed for the game screen
    function generateGameScreen (): void {
        gameDiv = document.createElement("div");
        gameDiv.setAttribute("id", "vngine-game");
        gameDiv.classList.add("vngine-screen", "vngine-game");

        let clickDetector = document.createElement("div");
        clickDetector.setAttribute("id", "vngine-game-click-detector");
        clickDetector.classList.add("vngine-game-click-detector");
        document.addEventListener("click", e => {
            if (e.target && (e.target as HTMLElement).id == "vngine-game-click-detector") {
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
            if (e.target && (e.target as HTMLElement).id == "menuText") {
                switchToScreen(Screen.MENU);
            }
        });

        let saveText = document.createElement("a");
        saveText.innerText = "Save";
        saveText.classList.add("vngine-option-text");
        saveText.setAttribute("id", "saveText");
        document.addEventListener("click", e => {
            if (e.target && (e.target as HTMLElement).id == "saveText") {
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
            if (e.target && (e.target as HTMLElement).id == "loadText") {
                switchToScreen(Screen.LOAD);
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
    function generateMenuScreen (): void {
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
            if (e.target && (e.target as HTMLElement).id == "vngine-menu-newgame-btn") {
                menuNewGameClick();
            }
        });
        
        let continueBtn = document.createElement("button");
        continueBtn.innerText = "Continue";
        continueBtn.setAttribute("id", "vngine-menu-continue-btn");
        continueBtn.classList.add("vngine-btn");
        document.addEventListener("click", e => {
            if (e.target && (e.target as HTMLElement).id == "vngine-menu-continue-btn") {
                menuContinueClick();
            }
        });
        
        let settingsBtn = document.createElement("button");
        settingsBtn.innerText = "Settings";
        settingsBtn.setAttribute("id", "vngine-menu-settings-btn");
        settingsBtn.classList.add("vngine-btn");
        document.addEventListener("click", e => {
            if (e.target && (e.target as HTMLElement).id == "vngine-menu-settings-btn") {
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
    function generateSettingsScreen (): void {
        settingsDiv = document.createElement("div");
    }
    
    //Creates all the DOM elements needed for the Load/Save screen
    function generateSavefilesScreen (): void {
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

    function generateSavefileList (): void {
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

    function switchToScreen (screen: Screen): void {
        currentScreen = screen;

        menuDiv.style.display      = "none";
        gameDiv.style.display      = "none";
        settingsDiv.style.display  = "none";
        savefilesDiv.style.display = "none";

        switch (screen) {
            case Screen.MENU:
                menuDiv.style.display = "block";
                break;
            case Screen.GAME:
                gameDiv.style.display = "block";
                break;
            case Screen.SETTINGS:
                settingsDiv.style.display = "block";
                break;
            case Screen.LOAD:
                savefilesDiv.style.display = "block";
                break;
            default:
                currentScreen = null;
                console.error(`VNGINE_ERROR: Couldn't load screen named ${screen}`);
                break;
        }
    }

    function menuNewGameClick (): void {
        loadNode(0);
        switchToScreen(Screen.GAME);
    }

    function menuContinueClick (): void {
        switchToScreen(Screen.LOAD);
    }

    function menuSettingsClick (): void {
        switchToScreen(Screen.SETTINGS);
    }

    //Loads a node from the game given its id (index)
    function loadNode (id: number): void {
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
    function updateDialog (): void {
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
            music = `game/res/audio/${music}`;
            playMusic(music);
        }
        
        playEffect(audioUIClick);

        //Updates dialog text
        dialogBoxCharacter.innerText = game.characters[characterIndex].name;
        writeDialogTextAnimation(currentNode.dialog[currentDialogIndex].text);
    }

    //Text writing animation for dialogBoxText
    async function writeDialogTextAnimation (str): Promise<any> {
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
    function skipTextAnimation (): void {
        writingText = false;
        dialogBoxText.innerText = currentNode.dialog[currentDialogIndex].text;
        currentDialogIndex++;
    }

    //Returns the DOM img element displaying the given character
    function getCharacterDOMimg (character): HTMLImageElement {
        let elements = Array.from(leftCharacters).concat(Array.from(rightCharacters));
        for (let i = 0; i < elements.length; i++) {
            if (elements[i].getAttribute("data-character") == character) {
                return elements[i];
            }
        }
        return null;
    }

    //Event handler
    function gameClickEvent (): void {
        if(!currentNode.dialog) return;
        console.log(currentDialogIndex);

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

    //Plays an audio effect
    function playEffect (src: string): void {
        if (audioEffects.getAttribute(src) != src) {
            audioEffects.setAttribute("src", src);
        }
        
        if (src === "") {
            audioEffects.pause();
        }
        else {
            audioEffects.currentTime = 0;
            audioEffects.play();
        }
    }

    //Plays background music
    function playMusic (src: string): void {
        if (audioBGM.getAttribute("src") != src) {
            audioBGM.setAttribute("src", src);
        }
        
        if (src === "") {
            audioBGM.pause();
        }
        else {
            audioBGM.currentTime = 0;
            audioBGM.play();
        }
        
    }

    //---------------SAVE-LOAD---------------//

    //Saves game information on localStorage
    function save (saveKey: string): void {
        if (!saveKey) return;

        let saveData: SaveFile = {
            "nodeIndex": currentNodeIndex,
            "dialogIndex": currentDialogIndex-1
        };

        localStorage.setItem(saveKey, JSON.stringify(saveData))
    }

    //Loads game information from localStorage
    function load (saveKey: string): void {
        let loadedStr: string = localStorage.getItem(saveKey);
        if (loadedStr) {
            let loadedData = JSON.parse(loadedStr) as SaveFile;

            loadNode(loadedData.nodeIndex);
            if (currentNode.dialog) {
                while (currentDialogIndex < loadedData.dialogIndex) {
                    updateDialog();
                    skipTextAnimation();
                }
            }
        }

        switchToScreen(Screen.GAME);
    }

    //---------------HELPERS---------------//
    function sleep(ms: number): Promise<any> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    //Returns true if both arrays are equal (can be different references), false otherwise
    function compareArrays (a: Array<any>, b: Array<any>): boolean {
        return a.length === b.length &&
               a.every((val, index) => val === b[index])
        ;
    }
      
}())