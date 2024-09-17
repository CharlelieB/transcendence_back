// GLOBAL VARIABLES

let currentMatch = {
	idPlayer1 : 0,
	idPlayer2 : 0,
	scorePlayer1 : 0,
	scorePlayer2 : 0
};

let currentTournament = {
	active: false,
	idPlayers : [],
	winner : 0,
	gameType : "",
	numberOfPlayers : 0,
	gamesPlayed : 0
};

// ADVERSARY CONNECTIONS

async function checkAdversaryCredentials() {
	email = document.getElementById("emailInput").value;
	password = document.getElementById("passwordInput").value;

	console.log(email);
	console.log(password);

	const input = {
		email: email,
		password: password
	};

	let response = await makeAuthenticatedRequest("/api/guest-login/", {
		method: 'POST',
		body: JSON.stringify(input)
	});
	if (!response.ok) {
		errorMessageContainer.innerText = "Email or password incorect"
		return false;
	}
	let data = await response.json();
	if (data) {
		if(data.id === hostId) {
			errorMessageContainer.innerText = "Host user allready connected";
			return false;
		}
		else {
			currentMatch.idPlayer2 = data.id;
			currentTournament.idPlayers.push(data.id);
			return true;
		}
	}
}

async function createAdversaryCredentials () {
	email = document.getElementById('emailInput').value;
	password = document.getElementById('passwordInput').value;
	passwordComfirmation = document.getElementById('passwordConfirmationInput').value;

	const input = {
		email: email,
		username: email,
		password: password
	};
	if (password !== passwordComfirmation)
	{
		errorMessageContainer.innerText = "The passwords don't match";
		return false;
	}
	let response = await makeUnauthenticatedRequest("/api/register/", {
		method: 'POST',
		body: JSON.stringify(input)
	});
	if (!response.ok) {
		errorMessageContainer.innerText = "This user is allready registered, you can connect";
		return false;
	}
	let data = await response.json();
	if (data) {
		currentMatch.idPlayer2 = data.id;
		currentTournament.idPlayers.push(data.id);
		return true;
	}
}

// MATCH & TOURNAMENT RECORDS

function RecordWin(winner) {
makeAuthenticatedRequest("/api/wins/" + winner + "/", {method : 'POST'});
}

function RecordLoss(data) {
	if (data.player1_score > data.player2_score) {
		makeAuthenticatedRequest("/api/losses/" + data.player2 + "/", {method: 'POST'});
	}
	else {
		makeAuthenticatedRequest("/api/losses/" + data.player1 + "/", {method : 'POST'});
	}

}

function recordMatch(idPlayer1, idPlayer2, scorePlayer1, scorePlayer2, idWinner) {

	const data = {
		player1 : idPlayer1,
		player2 : idPlayer2,
		player1_score : scorePlayer1,
		player2_score : scorePlayer2,
		winner : idWinner
	};

	console.log("recording match for " + idPlayer1 + " and " + idPlayer2);
	makeAuthenticatedRequest('/api/games/matches/create/', {
		method: 'POST',
		body: JSON.stringify(data)
	}).then(response => {
		if(!response.ok) {
			throw new Error('Network response was not ok');
		}
		console.log("Match added successfully");
	}).catch(error => {
		console.error('There was a problem with the fetch operation:', error);
	})
	RecordWin(data.winner);
	RecordLoss(data);
}

// GAME VIEW

function addPointPlayer1() {
	currentMatch.scorePlayer1++;
	document.getElementById("scorePlayer1").innerText = currentMatch.scorePlayer1;
	if (currentMatch.scorePlayer1 === customData.customVictoryPoints)	{
		if (!currentTournament.active) {
			recordMatch(currentMatch.idPlayer1, currentMatch.idPlayer2, currentMatch.scorePlayer1, currentMatch.scorePlayer2, currentMatch.idPlayer1);
			currentMatch.scorePlayer1 = 0;
			currentMatch.scorePlayer2 = 0;
			DisplayWinnerMenu();
		}
		else {
			console.log("inside end of tournament game");
			currentTournament.gamesPlayed++;
			currentMatch.scorePlayer1 = 0;
			currentMatch.scorePlayer2 = 0;
			DisplayTournamentView(currentMatch.idPlayer1);
		}
	}
}

function addPointPlayer2() {
	currentMatch.scorePlayer2++;
	document.getElementById("scorePlayer2").innerText = currentMatch.scorePlayer2;
	if(currentMatch.scorePlayer2 === customData.customVictoryPoints) {
		recordMatch(currentMatch.idPlayer1, currentMatch.idPlayer2, currentMatch.scorePlayer1, currentMatch.scorePlayer2, currentMatch.idPlayer2);
		currentMatch.scorePlayer1 = 0;
		currentMatch.scorePlayer2 = 0;
		DisplayWinnerMenu();
	}
}

// TOURNAMENT

function displayNextTournamentGame() {
	displayMatchInfo();
}
