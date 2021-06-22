(function () {
    let game = null;
    let mainDiv = document.getElementById("vngine-div");
    let Screen;
    (function (Screen) {
        Screen[Screen["GAME"] = 0] = "GAME";
        Screen[Screen["MENU"] = 1] = "MENU";
        Screen[Screen["SETTINGS"] = 2] = "SETTINGS";
        Screen[Screen["LOAD"] = 3] = "LOAD";
    })(Screen || (Screen = {}));
    let currentScreen = null;
    let gameDiv = null;
    let menuDiv = null;
    let settingsDiv = null;
    let savefilesDiv = null;
    let dialogBoxCharacter = null;
    let dialogBoxText = null;
    let charactersDiv = null;
    let rightCharacters = [];
    let leftCharacters = [];
    let decisionButtonsDiv = null;
    let decisionButtons = [];
    let decisionHandlers = [];
    let previousRightCharacterIndexes = [];
    let previousLeftCharacterIndexes = [];
    let previousBackground = null;
    let currentNode = null;
    let currentNodeIndex = 0;
    let currentDialogIndex = 0;
    const textFastTime = 50;
    const textMediumTime = 100;
    const textSlowTime = 200;
    let textSpeed = textMediumTime;
    let writingText = false;
    let spaceHold = false;
    let savefileList = null;
    let loadHandlers = [];
    let audioBGM = null;
    let audioEffects = null;
    let audioUIClick = "game/res/audio/ui_click.wav";
    window.onload = function () {
        if (!mainDiv) {
            console.error("VNGINE_ERROR: no element with id 'vngine-div' was found!");
            return;
        }
        game = gameJSON;
        audioBGM = document.createElement("audio");
        audioBGM.setAttribute("id", "vngine-audio-bgm");
        audioEffects = document.createElement("audio");
        audioEffects.setAttribute("id", "vngine-audio-effects");
        generateScreens();
        switchToScreen(Screen.MENU);
    };
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
    function generateScreens() {
        generateGameScreen();
        generateMenuScreen();
        generateSettingsScreen();
        generateSavefilesScreen();
    }
    function generateGameScreen() {
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
                switchToScreen(Screen.MENU);
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
    function generateMenuScreen() {
        menuDiv = document.createElement("div");
        menuDiv.setAttribute("id", "vngine-menu");
        menuDiv.classList.add("vngine-screen", "vngine-menu");
        menuDiv.style.display = "none";
        let titleText = document.createElement("h1");
        titleText.setAttribute("id", "vngine-menu-title");
        titleText.classList.add("vngine-menu-title");
        titleText.innerText = game.title;
        let btnGroup = document.createElement("div");
        btnGroup.classList.add("vngine-btn-group");
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
        btnGroup.appendChild(newGameBtn);
        btnGroup.appendChild(continueBtn);
        btnGroup.appendChild(settingsBtn);
        menuDiv.appendChild(titleText);
        menuDiv.appendChild(btnGroup);
        mainDiv.appendChild(menuDiv);
    }
    function generateSettingsScreen() {
        settingsDiv = document.createElement("div");
    }
    function generateSavefilesScreen() {
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
        savefilesHeader.appendChild(savefilesHeaderText);
        savefilesDiv.appendChild(savefilesHeader);
        savefilesDiv.appendChild(savefileList);
        mainDiv.appendChild(savefilesDiv);
    }
    function generateSavefileList() {
        if (!savefileList)
            return;
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
            if (game.nodes[data.nodeIndex].dialog) {
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
            savefileDiv.appendChild(savefileImg);
            savefileDiv.appendChild(savefileName);
            savefileDiv.appendChild(savefileText);
            savefileDiv.appendChild(loadButton);
            savefileDiv.appendChild(deleteButton);
            savefileList.appendChild(savefileDiv);
        }
    }
    function switchToScreen(screen) {
        currentScreen = screen;
        menuDiv.style.display = "none";
        gameDiv.style.display = "none";
        settingsDiv.style.display = "none";
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
    function menuNewGameClick() {
        loadNode(0);
        switchToScreen(Screen.GAME);
    }
    function menuContinueClick() {
        switchToScreen(Screen.LOAD);
    }
    function menuSettingsClick() {
        switchToScreen(Screen.SETTINGS);
    }
    function loadNode(id) {
        currentNode = game.nodes[id];
        currentNodeIndex = id;
        if (!currentNode) {
            console.error(`VNGINE_ERROR: Couldn't load game node with id ${id}`);
        }
        else {
            if (previousBackground != currentNode.background) {
                gameDiv.style.background = `url("game/res/img/backgrounds/${currentNode.background}")`;
                previousBackground = currentNode.background;
            }
            if (!compareArrays(currentNode.charactersRight, previousRightCharacterIndexes)) {
                Array.from(rightCharacters).forEach(e => {
                    e.setAttribute("src", "");
                    e.setAttribute("data-character", "");
                });
                if (currentNode.charactersRight) {
                    for (let i = 0; i < currentNode.charactersRight.length; i++) {
                        let characterIndex = currentNode.charactersRight[i];
                        let picURL = `game/res/img/characters/${game.characters[characterIndex].pictures[0]}`;
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
                if (currentNode.charactersLeft) {
                    for (let i = 0; i < currentNode.charactersLeft.length; i++) {
                        let characterIndex = currentNode.charactersLeft[i];
                        let picURL = `game/res/img/characters/${game.characters[characterIndex].pictures[0]}`;
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
            if (currentNode.decision) {
                decisionButtonsDiv.innerHTML = "";
                decisionButtons.splice(0, decisionButtons.length);
                for (let i = 0; i < decisionHandlers.length; i++) {
                    document.removeEventListener("click", decisionHandlers[i]);
                }
                decisionHandlers.splice(0, decisionHandlers.length);
                for (let i = 0; i < currentNode.decision.length; i++) {
                    decisionButtons.push(document.createElement("button"));
                    decisionButtons[i].classList.add("vngine-btn");
                    decisionButtons[i].innerText = currentNode.decision[i].text;
                    decisionButtons[i].setAttribute("id", `vngine-decision-btn-${i}`);
                    decisionHandlers[i] = function (e) {
                        if (e.target && e.target.id == `vngine-decision-btn-${i}`) {
                            loadNode(currentNode.decision[i].targetNode);
                        }
                    };
                    document.addEventListener("click", decisionHandlers[i]);
                    decisionButtonsDiv.appendChild(decisionButtons[i]);
                }
                decisionButtonsDiv.style.display = "block";
            }
            else if (currentNode.dialog) {
                decisionButtonsDiv.style.display = "none";
                currentDialogIndex = 0;
                updateDialog();
            }
        }
    }
    function updateDialog() {
        let characterIndex = currentNode.dialog[currentDialogIndex].character;
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
        if (music) {
            music = `game/res/audio/${music}`;
            playMusic(music);
        }
        playEffect(audioUIClick);
        dialogBoxCharacter.innerText = game.characters[characterIndex].name;
        writeDialogTextAnimation(currentNode.dialog[currentDialogIndex].text);
    }
    async function writeDialogTextAnimation(str) {
        let text = Array.from(str);
        let writtenText = "";
        writingText = true;
        dialogBoxText.innerText = "";
        for (let i = 0; i < text.length; i++) {
            if (!writingText)
                return;
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
    function skipTextAnimation() {
        writingText = false;
        dialogBoxText.innerText = currentNode.dialog[currentDialogIndex].text;
        currentDialogIndex++;
    }
    function getCharacterDOMimg(character) {
        let elements = Array.from(leftCharacters).concat(Array.from(rightCharacters));
        for (let i = 0; i < elements.length; i++) {
            if (elements[i].getAttribute("data-character") == character) {
                return elements[i];
            }
        }
        return null;
    }
    function gameClickEvent() {
        if (!currentNode.dialog)
            return;
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
    function playEffect(src) {
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
    function playMusic(src) {
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
    function save(saveKey) {
        if (!saveKey)
            return;
        let saveData = {
            "nodeIndex": currentNodeIndex,
            "dialogIndex": currentDialogIndex - 1
        };
        localStorage.setItem(saveKey, JSON.stringify(saveData));
    }
    function load(saveKey) {
        let loadedStr = localStorage.getItem(saveKey);
        if (loadedStr) {
            let loadedData = JSON.parse(loadedStr);
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
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    function compareArrays(a, b) {
        return a.length === b.length &&
            a.every((val, index) => val === b[index]);
    }
}());
//# sourceMappingURL=vngine.js.map