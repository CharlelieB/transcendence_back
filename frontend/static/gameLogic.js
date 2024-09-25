// GLOBAL VARIABLES

let currentMatch = {
	idPlayer1 : 0,
	idPlayer2 : 0,
	scorePlayer1 : 0,
	scorePlayer2 : 0,
	bot : false,
	usernamePlayer1 : "",
	usernamePlayer2 : ""
};

let currentTournament = {
	active: false,
	idPlayers : [],
	idWinners : [],
	scoreDifferences : [],
	gameType : "",
	numberOfPlayers : 0,
	gamesPlayed : 0
};

// ADVERSARY CONNECTIONS

async function checkAdversaryCredentials() {
	email = document.getElementById("emailInput").value;
	password = document.getElementById("passwordInput").value;

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

	if(currentTournament.active)
		return ;
	const data = {
		player1 : idPlayer1,
		player2 : idPlayer2,
		player1_score : scorePlayer1,
		player2_score : scorePlayer2,
		winner : idWinner
	};

	makeAuthenticatedRequest('/api/games/matches/create/', {
		method: 'POST',
		body: JSON.stringify(data)
	}).then(response => {
		if(!response.ok) {
			throw new Error('Network response was not ok');
		}
	}).catch(error => {
		console.error('There was a problem with the fetch operation:', error);
	})
	RecordWin(data.winner);
	RecordLoss(data);
}

// TOURNAMENT

function setCurrentMatch() {
	if (isFirstRound()) {
		currentMatch.idPlayer1 = currentTournament.idPlayers[0 + (2 * currentTournament.gamesPlayed)];
		currentMatch.idPlayer2 = currentTournament.idPlayers[1 + (2 * currentTournament.gamesPlayed)];
	}
	else {
		currentMatch.idPlayer1 = currentTournament.idWinners[0];
		currentMatch.idPlayer2 = currentTournament.idWinners[1];
		currentTournament.idWinners.shift();
		currentTournament.idWinners.shift();
	}
}

function isFirstRound() {
	if(currentTournament.numberOfPlayers === 4 && currentTournament.gamesPlayed < 2)
		return true;
	if(currentTournament.numberOfPlayers === 6 && currentTournament.gamesPlayed < 3)
		return true;
	if(currentTournament.numberOfPlayers === 8 && currentTournament.gamesPlayed < 4)
		return true;
}

function displayScore() {

    // Définir la police et l'alignement pour le score
    context.font = "20px 'Press Start 2P'";// "40px Arial";
    context.fillStyle = "white"; // Couleur du texte

    // Afficher le score du joueur à gauche
    context.fillText(currentMatch.usernamePlayer1 + " : " + currentMatch.scorePlayer1, MID_WIDTH - 300, 50);
	document.getElementById("matchScore1").innerText = currentMatch.scorePlayer1;

    // Afficher le score de l'antagoniste à droite
    context.fillText(currentMatch.usernamePlayer2 + " : " + currentMatch.scorePlayer2, MID_WIDTH + 50, 50);
	document.getElementById("matchScore2").innerText = currentMatch.scorePlayer2;
}

function displayResult(winner, winnerId) {

	const victorField = document.getElementById("matchVictorContainer");

	document.getElementById('matchInfoContainer').classList.add('d-none');
	victorField.classList.remove('d-none');
	if (currentTournament.active) {
		if (currentTournament.idWinners.length === 0 && currentTournament.gamesPlayed > 0) {
			victorField.innerHTML = "<h2>Congratulation " + winner + ", you won the tournament</h2>";
			return ;
		}
		else
			currentTournament.idWinners.push(winnerId);
	}
	victorField.innerHTML = "<h1>Victory for " + winner + "</h1>";
}
