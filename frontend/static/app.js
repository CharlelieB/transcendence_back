///// GLOBAL VARIABLES ////

let hostConnected = false;
let hostId = 0;
let playerIndex = 2;
let playerNumber = 1;
let gamesNb = 1;

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
			document.getElementById("containerCustomButton").classList.add("d-none");
		}
		return response.json()
	})
	.then(data => {
		if (data.access_token) {
			hostConnected = true;
			window.accessToken = data.access_token;
			makeAuthenticatedRequest("/api/user/", {method: 'GET'})
			.then(response => {
				return response.json();
			})
			.then(data => {
				hostId = data.id;
			})
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
			checkAdversaryCredentials();
			if (playerNumber === 2) {
				currentMatch.idPlayer1 = hostId;
				DisplayGame();
			}
			else {
				if (playerIndex < playerNumber) {
					playerIndex++;
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
				currentMatch.idPlayer1 = hostId;
				DisplayGame();
			}
			else {
				if (playerIndex <= playerNumber) {
					playerIndex++;
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
		makeAuthenticatedRequest("/api/user/", {method: 'GET'})
		.then(response => {
			if(!response.ok) {
				throw new Error('Network response was not ok');
			}
			return response.json();
		})
		.then(data => {
			if(data.is_two_factor_enabled) {
				handle2FA();
			}
			else {
				ReplaceElement("playerConnection", "buttonsContainer");
				document.getElementById("containerCustomButton").classList.remove("d-none");
			}
		})
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
		window.accessToken = data.access_token;
		hostId = data.id;
		hostConnected = true;
		ReplaceElement("playerConnection", "buttonsContainer");
	})
	.catch(error => {
		console.error('There was a problem with the fetch operation:', error);
		errorMessageContainer.innerText = "This user is allready registered, you can connect";
	})
}

function handle2FA() {
	ReplaceElement("playerConnection", "2FAview");
	makeAuthenticatedRequest("/api/2fa/create/", {method: 'GET'})
	.then(response => {
		if(!response.ok) {
			throw new Error('Network response was not ok');
		}
		return response.json();
	}).then(data => {
		console.log(data.qr_code);
		document.getElementById('QRcodeContainer').innerHTML = "<img src=\"data:image/png;base64," + data.qr_code + "\" alt=\"QR Code\">";
	})
	.catch(error => {
		console.error('There was a problem with the fetch operation:', error);
	})
}
