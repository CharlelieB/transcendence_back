function ReplaceElement(elementToHideId, elementToShowId)
{

	if (elementToHideId !== "null") {
		var elementToHide = document.getElementById(elementToHideId);
		elementToHide.classList.add("d-none");
		elementToHide.classList.remove("d-flex");
	}

	if (elementToShowId !== "null")	{
		var elementToShow = document.getElementById(elementToShowId);
		elementToShow.classList.remove("d-none");
		elementToShow.classList.add("d-flex");
	}
}

// document.addEventListener('keydown', function(event) {
//     if (event.key === 'Enter') {
//         // Get references to the buttons
//         const submitButton = document.getElementById('submitButton');
//         const nextGameButton = document.getElementById('nextGameButton');

//         // Trigger the click event on the buttons
//         if (hostConnected)
// 			submitButton.click();
//         if (CurrentTournament.active)
// 			nextGameButton.click();
//     }
// });

/////    FUNCTIONS TO DISPLAY HTML ELEMENTS /////

function displayHomePage() {
	document.getElementById("gameContainer").classList.add('d-none');
	document.getElementById("buttonsContainer").classList.remove('d-none');
	document.getElementById("buttonsContainer").classList.add('d-flex');
	document.getElementById("playerConnection").classList.add('d-none');
	document.getElementById("containerCustomButton").classList.remove('d-none');
	document.getElementById("containerTitle").classList.remove("d-none");
	document.getElementById('EOGButtons').classList.add('d-none');
	ResetMenuButtons();
	playerIndex = 2;
	history.pushState({ page: 'home' }, 'Home', '/home');
}

 function DisplayPlayerConnection(playerNb)
 {
	playerNumber = playerNb;
	heading = document.getElementById("loginTitle");
	errorMessageContainer.innerText = "";

	if(playerNumber > 2) {
		currentTournament.active = true;
		currentTournament.numberOfPlayers = playerNumber;
	}
	ResetMenuButtons();
	ReplaceElement("buttonsContainer", "playerConnection");
	document.getElementById("loginBackButton").classList.remove("d-none");
	document.getElementById("userForm").reset();
	heading.innerText = "Player " + playerIndex + " login";
	history.pushState({page: 'login'}, 'Login', '/login');
 }

 function DisplayGame()
 {
	console.log("Inside DisplayGame");
	document.getElementById("containerCustomButton").classList.add("d-none");
	document.getElementById("containerTitle").classList.add("d-none");
	document.getElementById("container2FA").classList.add('d-none');
	 if (currentMatch.bot)
		 ReplaceElement("buttonsContainer", "gameContainer");
	 else
		 ReplaceElement("playerConnection", "gameContainer");
	 history.pushState({ page: 'game' }, 'Game', '/game');
	//make background black
 }

//       OTHER DISPLAYING FUNCTIONS

function DisplayQuickPlayOptions() {
	ReplaceElement("tournamentOptions", "tournament");
	ReplaceElement("quickPlay", "quickPlayOptions");
}

function DisplayTournamentOptions() {
	ReplaceElement("quickPlayOptions", "quickPlay");
	ReplaceElement("tournament", "tournamentOptions");
}

 function ResetMenuButtons()
 {
	ReplaceElement("tournamentOptions", "tournament");
	ReplaceElement("quickPlayOptions", "quickPlay");
 }


function BackButtonConnection()
{
	playerIndex = 2;
	currentTournament.active = false;
	ReplaceElement("playerConnection", "buttonsContainer");
}



function displayEOGMenu() {
	document.getElementById("EOGButtons").classList.remove('d-none');
	if (currentTournament.active) {
		document.getElementById("replayButton").classList.add('d-none');
		if (currentTournament.idWinners.length === 0 && currentTournament.gamesPlayed > 0)
			document.getElementById("nextGameButton").classList.add('d-none');
		else
			document.getElementById("nextGameButton").classList.remove('d-none');

	}
	else
		document.getElementById('replayButton').classList.remove('d-none');
}

function backButtonEOG() {
	ReplaceElement("gameContainer", "buttonsContainer");
	document.getElementById("containerCustomButton").classList.remove("d-none");
	document.getElementById("containerTitle").classList.remove("d-none");
	document.getElementById('EOGButtons').classList.add('d-none');
	ResetMenuButtons();
	playerIndex = 2;
	playerNumber = 1;
	currentTournament.active = false;
	currentTournament.idPlayers = [];
	currentTournament.idWinners = [];
	currentTournament.gamesPlayed = 0;
}

function replayButtonEOG() {
	document.getElementById('matchInfoContainer').classList.remove('d-none');
	document.getElementById('matchVictorContainer').classList.add('d-none');
	document.getElementById("EOGButtons").classList.add('d-none');
	if (currentMatch.bot)
		rmStartNode();
	else
		rmStartNodePvp();
}

function displayChangeUsernameField() {
	ReplaceElement("passwordChangeContainer", "passwordChangeButton");
	document.getElementById("passwordChangeButton").classList.remove('d-flex');
	document.getElementById("usernameChangeForm").reset();
	ReplaceElement("usernameChangeButton", "usernameChangeContainer");
	document.getElementById("usernameChangeContainer").classList.remove('d-flex');
}

function displayChangePasswordField() {
	ReplaceElement("usernameChangeContainer", "usernameChangeButton");
	document.getElementById("usernameChangeButton").classList.remove('d-flex');
	document.getElementById("passwordChangeForm").reset();
	ReplaceElement("passwordChangeButton", "passwordChangeContainer");
	document.getElementById("passwordChangeContainer").classList.remove('d-flex');
}

function resetUserSettingsButtons() {
	ReplaceElement("passwordChangeContainer", "passwordChangeButton");
	document.getElementById("passwordChangeButton").classList.remove('d-flex');
	ReplaceElement("usernameChangeContainer", "usernameChangeButton");
	document.getElementById("usernameChangeButton").classList.remove('d-flex');
	document.getElementById("QRcodeContainer").innerHTML = "";
}


function display2FA() {
	ReplaceElement("playerConnection", "2FAview");
}

async function displayMatchInfo() {
	const idList = {user_ids: [currentMatch.idPlayer1, currentMatch.idPlayer2]};
	const names = await getPlayerNames(idList);

	document.getElementById('matchVictorContainer').classList.add("d-none");
	document.getElementById('matchInfoContainer').classList.remove('d-none');
	currentMatch.usernamePlayer1 = names[0];
	currentMatch.usernamePlayer2 = names[1];

	document.getElementById('matchUsername1').innerText = names[0];
	document.getElementById('matchUsername2').innerText = names[1];

	document.getElementById("matchInfo2").classList.remove('d-none');
	document.getElementById("matchInfoVS").classList.remove('d-none');
}

async function displayBotInfo() {
	let response = await makeAuthenticatedRequest("/api/user/", {method: 'GET'});
	let data = await response.json();

	currentMatch.usernamePlayer1 = data.username;
	currentMatch.usernamePlayer2 = "Antagonist";
	document.getElementById("matchUsername1").innerText = data.username;
	document.getElementById("matchUsername2").innerText = "Antagonist";
	document.getElementById('matchInfoContainer').classList.remove('d-none');
	document.getElementById('matchVictorContainer').classList.add('d-none');

	if (breakout) {
		document.getElementById("matchInfo2").classList.add('d-none');
		document.getElementById("matchInfoVS").classList.add('d-none');
	}
	else {
		document.getElementById("matchInfo2").classList.remove('d-none');
		document.getElementById("matchInfoVS").classList.remove('d-none');
	}
}

function backToConnexion() {
	ReplaceElement('buttonsContainer', 'playerConnection');
	document.getElementById('containerCustomButton').classList.add('d-none');
	var dismissDrawerButton = document.getElementById('dismissDrawer'); // Replace with your offcanvas element ID
	dismissDrawerButton.click();
	hostConnected = false;
}

function displayNextGame() {
	currentTournament.gamesPlayed++;
	document.getElementById('EOGButtons').classList.add('d-none');
	document.getElementById('matchVictorContainer').classList.add('d-none');
	document.getElementById('matchInfoContainer').classList.remove('d-none');
	setCurrentMatch();
	displayMatchInfo();
	rmStartNodePvp();
}

////// Event Listenner for Account Creation

// Select the radio buttons and the element to be displayed
const connectAccountRadio = document.getElementById('vbtn-radio1');
const createAccountRadio = document.getElementById('vbtn-radio2');
const createAccountForm = document.getElementById('confirmPasswordContainer');
const errorMessageContainer = document.getElementById("connectionErrorMessage");


// Event listener for the "Create account" radio button
createAccountRadio.addEventListener('change', function() {
	if (this.checked) {
		errorMessageContainer.innerText = "";
		createAccountForm.classList.remove("d-none");
    }
});

// Event listener for the "Connect account" radio button to hide the element
connectAccountRadio.addEventListener('change', function() {
	if (this.checked) {
		errorMessageContainer.innerText = "";
		createAccountForm.classList.add("d-none");
    }
});

function togglePongCustomization(status) {
	customVictory = document.getElementById("customVictoryValue");
	customVictoryField = document.getElementById("customVictoryField");
	if (status) {
		customVictory.classList.remove('d-none');
		customVictoryField.classList.remove('d-none');
	}
	else {
		customVictory.classList.add('d-none');
		customVictoryField.classList.add('d-none');
	}
}

window.addEventListener('popstate', (event) => {
	if (event.state && event.state.page === 'game') {
        rmStartNode();
    }
	else
		displayHomePage();
});
