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

/////    FUNCTIONS TO DISPLAY HTML ELEMENTS /////

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

 }

function BackButtonConnection()
{
	playerIndex = 2;
	currentTournament.active = false;
	ReplaceElement("playerConnection", "buttonsContainer");
}

function DisplayGame()
{
	document.getElementById("containerCustomButton").classList.add("d-none");
	document.getElementById("containerTitle").classList.add("d-none");
	ReplaceElement("playerConnection", "gameContainer");
}

function DisplayGameBot()
{
	document.getElementById("containerCustomButton").classList.add("d-none");
	document.getElementById("containerTitle").classList.add("d-none");
	ReplaceElement("buttonsContainer", "gameContainer");
}

function displayEOGMenu() {
	document.getElementById("EOGButtons").classList.remove('d-none');
}

function backButtonEOG() {
	ReplaceElement("gameContainer", "buttonsContainer");
	document.getElementById("containerCustomButton").classList.remove("d-none");
	document.getElementById("containerTitle").classList.remove("d-none");
	playerIndex = 2;
	currentTournament.idPlayers = [];
}

function replayButtonEOG() {
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
}


function display2FA() {
	ReplaceElement("playerConnection", "2FAview");
}

async function displayMatchInfo() {
	const currentPlayer1 = currentTournament.idPlayers[currentTournament.gamesPlayed * 2];
	const currentPlayer2 = currentTournament.idPlayers[(currentTournament.gamesPlayed * 2) + 1];

	const input = {
		user_ids: [currentPlayer1, currentPlayer2]
	}
	let response = await makeAuthenticatedRequest("/api/users/ids/", {
		method: 'POST',
		body: JSON.stringify(input)
	});
	let data = await response.json();
	const usernames = data.map(user => user.username);
	const content = "<h3 class=\"text-center\">" + usernames[0] + " VS " + usernames[1] + "</h3>";
	document.getElementById("matchInfoContainer").innerHTML = content;
}

async function DisplayTournamentView(winnerId) {
	console.log("apwdj");
	ReplaceElement("gameContainer", "endOfGame");
	let response = await makeAuthenticatedRequest("/api/user/" + winnerId + "/", {method: 'GET'});
	let data = await response.json();
	console.log("here : " + data.username);
	document.getElementById('matchWinnerInput').innerText = "Victory for " + data.username;
	document.getElementById('winnerMessage').innerText = "You are moving to the next round";
	document.getElementById('replayButton').classList.add('d-none');
	document.getElementById('nextGameButton').classList.remove('d-none');
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
