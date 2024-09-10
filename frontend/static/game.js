// GLOBAL VARIABLES

let currentMatch = {
	idPlayer1 : 0,
	idPlayer2 : 0,
	scorePlayer1 : 0,
	scorePlayer2 : 0
};

let currentTournament = {
	idPlayers : [],
	winner : 0,
	name : "",
	gameType : ""
};

// ADVERSARY CONNECTIONS

function checkAdversaryCredentials() {
	email = document.getElementById("emailInput").value;
	password = document.getElementById("passwordInput").value;

	console.log(email);
	console.log(password);

	const data = {
		email: email,
		password: password
	};

	makeAuthenticatedRequest("/api/guest-login/", {
		method: 'POST',
		body: JSON.stringify(data)
	})
	.then(response => {
		if(!response.ok) {
			throw new Error('Network response was not ok');
		}
		return response.json();
	})
	.then(data => {
		currentMatch.idPlayer2 = data.id;
		currentTournament.idPlayers.push(data.id);
	})
	.catch(error => {
		console.error('There was a problem with the fetch operation:', error);
		errorMessageContainer.innerText = "This user doesn't exist, please create an account"
		return Promise.reject(error);
	})
}

async function createAdversaryCredentials () {
	email = document.getElementById('emailInput').value;
	password = document.getElementById('passwordInput').value;
	passwordComfirmation = document.getElementById('passwordConfirmationInput').value;

	const data = {
		email: email,
		username: email,
		password: password
	};
	if (password !== passwordComfirmation)
	{
		errorMessageContainer.innerText = "The passwords don't match";
		return;
	}
	makeUnauthenticatedRequest("/api/register/", {
		method: 'POST',
		body: JSON.stringify(data)
	}).then(response => {
		if(!response.ok) {
			throw new Error('Network response was not ok');
		}
		return response.json();
	})
	.then(data => {
		currentMatch.idPlayer2 = data.id;
		currentTournament.idPlayers.push(data.id);
	})
	.catch(error => {
		console.error('There was a problem with the fetch operation:', error);
		errorMessageContainer.innerText = "This user doesn't exist, please create an account"
	})
}

// MATCH & TOURNAMENT RECORDS

function recordMatch(idPlayer1, idPlayer2, scorePlayer1, scorePlayer2, idWinner) {
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
		console.log("Match added successfully");
	}).catch(error => {
		console.error('There was a problem with the fetch operation:', error);
	})
}

// GAME VIEW

function addPointPlayer1() {
	currentMatch.scorePlayer1++;
	document.getElementById("scorePlayer1").innerText = currentMatch.scorePlayer1;
	if (currentMatch.scorePlayer1 === customData.customVictoryPoints)	{
		recordMatch(currentMatch.idPlayer1, currentMatch.idPlayer2, currentMatch.scorePlayer1, currentMatch.scorePlayer2, currentMatch.idPlayer1);
		currentMatch.scorePlayer1 = 0;
		currentMatch.scorePlayer2 = 0;
		DisplayWinnerMenu();
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
