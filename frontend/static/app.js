///// GLOBAL VARIABLES ////

let hostConnected = false;
let hostId = 0;
let playerIndex = 2;
let playerNumber = 1;
let gamesNb = 1;
let tempAdversaryId = 0;

let pointsForVictory = 5;

//Tournament of 8 : 7 games
//Tournament of 6 : 6 games
//Tournament of 4 : 3 games


///// GENERIC FUNCTION /////

function getCookie(name) {
	let cookieValue = null;
	if (document.cookie && document.cookie !== '') {
		const cookies = document.cookie.split(';');
		for (let i = 0; i < cookies.length; i++) {
			const cookie = cookies[i].trim();
			// Does this cookie string begin with the name we want?
			if (cookie.substring(0, name.length + 1) === (name + '=')) {
				cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
				break;
			}
		}
	}
	return cookieValue;
}

function validateEmail(email) {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

/////    FIRST CONNECTION EVENT LISTENER /////

document.addEventListener('DOMContentLoaded', function() {
	makeUnauthenticatedRequest("/api/token/refresh/", {method : 'POST'})
	.then (response => {
		if (!response.ok)
		{
			ReplaceElement("buttonsContainer", "playerConnection");
			document.getElementById("loginBackButton").classList.add("d-none");
		}
		return response.json()
	})
	.then(data => {
		if (data.access_token) {
			hostConnected = true;

			window.accessToken = data.access_token;
			console.log(window.accessToken);
			console.log('Access token saved');
		} else {
			console.error("access token not saved");
		}
	})
	.catch(error => {
		ReplaceElement("buttonsContainer", "playerConnection");
		document.getElementById("loginBackButton").classList.add("d-none");
	})
 });


/////        API CALLS      //////

function makeUnauthenticatedRequest(url, options = {}) {

	const csrfToken = getCookie('csrftoken');
	if (!csrfToken) {
		console.error('CSRF token is missing. Cannot refresh token.');
		return Promise.reject('CSRF token is missing');
	}

	options.headers = options.headers || {};
	options.headers['Accept'] = 'application/json';
	options.headers['Content-Type'] = 'application/json';
	options.headers['X-CSRFToken'] = csrfToken;
	options.credentials = 'include';

	return fetch(url, options)
	.then(response => {
		if (response.status === 401) {
				console.log("error 401");
			}
			return response;
	});
}

function makeAuthenticatedRequest(url, options = {}) {

	const csrfToken = getCookie('csrftoken');
	if (!csrfToken) {
		console.error('CSRF token is missing. Cannot refresh token.');
		return Promise.reject('CSRF token is missing');
	}

	options.headers = options.headers || {};
	options.headers['Authorization'] = `Bearer ${window.accessToken}`;
	options.headers['Accept'] = 'application/json';
	options.headers['Content-Type'] = 'application/json';
	options.headers['X-CSRFToken'] = csrfToken;
	options.credentials = 'include';

	return fetch(url, options)
	.then(response => {
		if (response.status === 401) {
			console.log("Refreshing token");
			return refreshToken().then(() => {
				options.headers['Authorization'] = `Bearer ${window.accessToken}`;
				return fetch(url, options);
			});
		}
		return response;
	});
}

// REFRESH


function refreshToken()
{
	return makeUnauthenticatedRequest("/api/token/refresh/", {method : 'POST'})
	.then(response => {
		if (!response.ok) {
			console.error("Refresh token failed");
		}
		return response.json();
	})
	.then(data => {
		window.accessToken = data.access_token;
			console.log(window.accessToken);
			console.log('Access token refreshed');
	})
	.catch(error => {
		console.error('Error refreshing token:', error);
		return Promise.reject(error);
	});
}

// LOGIN & REGISTER

async function submitUserForm() {
	if(connectAccountRadio.checked)
	{
		if (!hostConnected) {
			userLogin();
		}
		else {
			await checkAdversaryCredentials();
			console.log("player index : " + playerIndex + " player number : " + playerNumber);
			if (playerNumber === 2) {
				DisplayGame();
			}
			else {
				if (playerIndex < playerNumber) {
					playerIndex++;
					currentTournament.idPlayers.push(tempAdversaryId);
					document.getElementById("userForm").reset();
					document.getElementById("connectionErrorMessage").classList.add("d-none");
					document.getElementById("loginTitle").innerText = "Player " + playerIndex + " login";
				}
				else {
					currentTournament.idPlayers.push(hostId);
					console.log(currentTournament.idPlayers);
					DisplayGame();
				}
			}
		}
	}
	else
	{
		if (!hostConnected) {
			userRegistration();
		}
		else {
			await createAdversaryCredentials();
			if (playerNumber === 2) {
				console.log("Displaying the game");
				console.log("host id : " + hostId + " adversary id :" + tempAdversaryId);
				currentMatch.idPlayer1 = hostId;
				currentMatch.idPlayer2 = tempAdversaryId;
				DisplayGame();
			}
			else {
				if (playerIndex <= playerNumber) {
					playerIndex++;
					currentTournament.idPlayers.push(tempAdversaryId);
					document.getElementById("userForm").reset();
					document.getElementById("connectionErrorMessage").classList.add("d-none");
					document.getElementById("loginTitle").innerText = "Player " + playerIndex + " login";
				}
				else {
					currentTournament.idPlayers.push(hostId);
					DisplayGame();
				}
			}
		}
	}
}

function userLogin() {
	email = document.getElementById("emailInput").value;
	password = document.getElementById("passwordInput").value;

	console.log(email);
	console.log(password);

	const data = {
		email: email,
		password: password
	};

	makeUnauthenticatedRequest("/api/login/", {
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
		window.accessToken = data.access_token;
		hostId = data.id;
		hostConnected = true;
		ReplaceElement("playerConnection", "buttonsContainer");
	})
	.catch(error => {
		console.error('There was a problem with the fetch operation:', error);
		errorMessageContainer.innerText = "Email or password incorect"
	})
}

function userRegistration() {
	email = document.getElementById('emailInput').value;
	password = document.getElementById('passwordInput').value;
	passwordComfirmation = document.getElementById('passwordConfirmationInput').value;

	const data = {
		email: email,
		username: email,
		password: password
	};
	if (!validateEmail(email)) {
		errorMessageContainer.innerText = "Please enter a valid email address";
		return;
	}
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
	}).then(data => {
		window.accessToken = data.access;
		hostId = data.id;
		hostConnected = true;
		ReplaceElement("playerConnection", "buttonsContainer");
	})
	.catch(error => {
		console.error('There was a problem with the fetch operation:', error);
		errorMessageContainer.innerText = "This user is allready registered, you can connect";
	})
}

//////////// SOCIAL BUTTON ////////////

function getFriendsList(data) {
	const followList = {
		user_ids : data.following
	};
	const followListContainer = document.getElementById('followList');

	return makeAuthenticatedRequest("/api/users/ids/", {
		method : "POST",
		body : JSON.stringify(followList)
	}).then(response => {
		if(!response.ok) {
			throw new Error('Network response was not ok');
		}
		return response.json();
	}).then(JSONdata => {
		console.log(data);
		const usernames = JSONdata.map(user => user.username);
		var responseHTML = "<div>";
		for(let i = 0; i < usernames.length; i++) {
			responseHTML = responseHTML + usernames[i] + "</div><div>";
		}
		responseHTML = responseHTML + "</div>";
		followListContainer.innerHTML = responseHTML;
	})
}

// Display User name, Stats, and follow

function displaySocialDrawer() {
	ResetMenuButtons();
	makeAuthenticatedRequest('/api/user/', {method: 'GET'})
	.then(response => {
		if (!response.ok) {
			throw new Error('Network response was not ok');
		}
		return response.json(); // Parse the response as JSON
	}).then(data => {
		hostId = data.id;
		document.getElementById("userNameContainer").innerText = data.username;
		document.getElementById("userEmailContainer").innerText = data.email;
		getFriendsList(data);
	})
	.catch(error => {
		console.error('There was a problem with the fetch operation:', error);
	})
}

// GET USERS //

function getUserList() {
	const userListContainer = document.getElementById('userListContainer');

	makeAuthenticatedRequest('/api/users/', {method: 'GET'})
	.then(response => {
		if (!response.ok) {
			throw new Error('Network response was not ok');
		}
		return response.json(); // Parse the response as JSON
	})
	.then(JSONdata => {
		// Assuming JSONdata is an array of user objects and each user object has a 'username' field
		const usernames = JSONdata.map(user => user.username); // Extract usernames
		const userIds = JSONdata.map(user => user.id);
		var responseHTML = "";
		//userListContainer.innerText = usernames.length; // Display usernames, one per line
		for (let i = 0; i < usernames.length; i++) {
			console.log(userIds[i]);
			responseHTML = responseHTML + "<div class=\"row m-2\"> <div class=\"h5 col-auto\">" + usernames[i] + "</div> <div class=\"col d-flex justify-content-end\"> <button class=\"btn btn-primary follow-button\" data-user-id=\"" + userIds[i] + "\">Follow</button> </div> </div>"

		};
		userListContainer.innerHTML = "<div>" + responseHTML + "</div>";

		const followButtons = document.querySelectorAll(".follow-button");
		followButtons.forEach(button => {
			button.addEventListener('click', (event) => {
				const userId = event.target.getAttribute('data-user-id');
				followUser(userId);
			});
		});
	})
	.catch(error => {
		console.error('There was a problem with the fetch operation:', error);
		userListContainer.innerText = 'Error fetching user list';
    });
}

// FOLLOW USER

function followUser(userId) {
	console.log("Trying to follow user with id :", userId);
	makeAuthenticatedRequest("/api/follow/" + userId + "/", {method: "POST"})
	.then(response => {
		if (!response.ok) {
			throw new Error ('Network response was not ok');
		}
		return response.json();
	})
	.then(data => {
		console.log("User followed successfully : ", data);
	})
	.catch(error => {
		console.error("There was an issue with the fetch operation: ", error);
	})
}

// USER STATS

function getUserStats()
{
	console.log("Getting User stats for ", hostId);
	makeAuthenticatedRequest("/api/user-stats/" + hostId + "/", {method: 'GET'})
	.then(response => {
		if(!response.ok) {
			throw new Error ('Network response was not ok');
		}
		return response.json();
	}).then(JSONdata => {
		console.log(JSONdata);
	}).catch(error => {
		console.error("There was an issue with the fetch operation: ", error);
	})
}


// CUSTOMIZATION

function getCustomizationSettings() {
	makeAuthenticatedRequest("/api/customization/view/", { method: "GET"})
	.then(response => {
		if(!response.ok)
		{
			throw new Error('Network response was not ok');
		}
		console.log("on arrive la");
		response.json();
	})
	.then(JSONdata => {
		console.log("ici aussi");
		console.log(JSONdata);
		console.log("la ça deconne");
	})
	.catch(error => {
		console.error('There was a problem with the fetch operation:', error);
	})
}
