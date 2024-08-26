///// GLOBAL VARIABLES ////

let playerIndex = 2;
let playerNumber = 1;
let gamesNb = 1;
let hostConnected = false;

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
		if (data.access) {
			window.accessToken = data.access;
			console.log(window.accessToken);
			console.log('Access token saved');
		} else {
			console.error("access token not saved");
		}
	})
 });

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


	ResetMenuButtons();
	ReplaceElement("buttonsContainer", "playerConnection");
	document.getElementById("loginBackButton").classList.remove("d-none");
	document.getElementById("userForm").reset();
	heading.innerText = "Player " + playerIndex + " login";

 }

function BackButtonConnection()
{
	ReplaceElement("playerConnection", "buttonsContainer");
}

function DisplayGame()
{
	//ReplaceElement("baseContainer", "gameContainer");
}

////// Event Listenner for Account Creation

// Select the radio buttons and the element to be displayed
const connectAccountRadio = document.getElementById('vbtn-radio1');
const createAccountRadio = document.getElementById('vbtn-radio2');
const createAccountForm = document.getElementById('confirmPasswordContainer');

// Event listener for the "Create account" radio button
createAccountRadio.addEventListener('change', function() {
	if (this.checked) {
      createAccountForm.classList.remove("d-none");
    }
});

// Event listener for the "Connect account" radio button to hide the element
connectAccountRadio.addEventListener('change', function() {
	if (this.checked) {
      createAccountForm.classList.add("d-none");
    }
});

////// Event Listenner for Customization modale

const customVictoryValue = document.getElementById('CustomVictoryValue');
const customVictoryScoreField = document.getElementById('CustomVictoryField');

customVictoryValue.addEventListener('change', function() {
	customVictoryScoreField.innerHTML = "Nombre de points pour la victoire : " + customVictoryValue.value;
});


////// Event to display colors pop-hovers in customization modal
// Ensure Bootstrap's JavaScript is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Initialize the popover when the modal is shown
    const customizationModal = document.getElementById('customizationModal');
    customizationModal.addEventListener('shown.bs.modal', function () {
        const popoverTriggerList = [].slice.call(document.querySelectorAll('.example-popover'));
        const popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
            return new bootstrap.Popover(popoverTriggerEl, {
                container: '.modal-body',
				html: true,
				content:'<div>BONJOUR AEOUWD</div>'
            });
        });
    });
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
	// options.headers['Refresh'] =
	options.headers['Accept'] = 'application/json';
	options.headers['Content-Type'] = 'application/json';
	options.headers['X-CSRFToken'] = csrfToken;
	options.credentials = 'include';

	return fetch(url, options)
	.then(response => {
		if (response.status === 401) {
			console.log("Refreshing token");
			refreshToken().then(() => {
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
	makeUnauthenticatedRequest("/api/token/refresh/", {method : 'POST'})
	.then(response => {
		if (!response.ok) {
			console.error("Refresh token failed");
		}
		return response.json();
	})
	.then(data => {
		window.accessToken = data.access;
			console.log(window.accessToken);
			console.log('Access token refreshed');
	});
}
// LOGIN & REGISTER

function submitUserForm() {
	if(connectAccountRadio.checked)
	{
		if (!hostConnected) {
			userLogin();
		}
		else {
			checkAdversaryCredentials();
			if (playerNumber === 2) {
				console.log("Displaying the game");
				DisplayGame();
			}
			else {
				if (playerIndex <= playerNumber) {
					playerIndex++;
					document.getElementById("userForm").reset();
					document.getElementById("connectionErrorMessage").classList.add("d-none");
				}
				else {
					DisplayGame();
				}
			}

		}
		//if adversary connection (1v1)
			//AddUserToMatch
		//if adversary connection (tournament)
			//add user to tournament
	}
	else
	{
		if (!hostConnected) {
			userRegistration();
		}
		else {
			createAdversaryCredentials();
		}

		//if adversary connection
			//registercall then addUsertoMatch display connection container again
		//if
	}
}

function userLogin() {
	email = document.getElementById("emailInput").value;
	password = document.getElementById("passwordInput").value;
	errorMessageContainer = document.getElementById("connectionErrorMessage")

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
		if (data.access_token) {
			window.accessToken = data.access_token;
			console.log(window.accessToken);
			console.log('Access token saved');
		} else {
			console.error("access token not saved");
		}
		hostConnected = true;
		ReplaceElement("playerConnection", "buttonsContainer");
	})
	.catch(error => {
		console.error('There was a problem with the fetch operation:', error);
		errorMessageContainer.innerText = "This user doesn't exist, please create an account"
	})
}

function userRegistration() {
	email = document.getElementById('emailInput').value;
	password = document.getElementById('passwordInput').value;
	passwordComfirmation = document.getElementById('passwordConfirmationInput').value;
	errorMessageContainer = document.getElementById("connectionErrorMessage")

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
	}).then(data => {
		if (data.access) {
			window.accessToken = data.access;
			console.log(window.accessToken);
			console.log('Access token saved');
		} else {
			console.error("access token not saved");
		}
		hostConnected = true;
		ReplaceElement("playerConnection", "buttonsContainer");
	})
	.catch(error => {
		console.error('There was a problem with the fetch operation:', error);
		errorMessageContainer.innerText = "This user doesn't exist, please create an account"
	})
}

//////////// SOCIAL BUTTON ////////////

// Display User name, Stats, and follow

function displaySocialDrawer() {
	
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
		var responseHTML = "";
		//userListContainer.innerText = usernames.length; // Display usernames, one per line
		for (let i = 0; i < usernames.length; i++) {
			responseHTML = responseHTML + "<div class=\"row m-2\"> <div class=\"h5 col-auto\">" + usernames[i] + "</div> <div class=\"col d-flex justify-content-end\"> <button class=\"btn btn-primary\">Follow</button> </div> </div>"
		};
		userListContainer.innerHTML = "<div>" + responseHTML + "</div>";
	})
	.catch(error => {
		console.error('There was a problem with the fetch operation:', error);
		userListContainer.innerText = 'Error fetching user list';
    });
}


// ADVERSARY CONNECTIONS

function addAdversaryToMatch() {

}

function checkAdversaryCredentials() {
	email = document.getElementById("emailInput").value;
	password = document.getElementById("passwordInput").value;
	errorMessageContainer = document.getElementById("connectionErrorMessage")

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
		//HERE I NEED TO PASS ON THE USER ID BUT I DONT HAVE IT
		addAdversaryToMatch();
		console.log("all good for player " + playerIndex);
		return response.json();
	})
	.catch(error => {
		console.error('There was a problem with the fetch operation:', error);
		errorMessageContainer.innerText = "This user doesn't exist, please create an account"
	})	.catch
}

function createAdversaryCredentials () {
	email = document.getElementById('emailInput').value;
	password = document.getElementById('passwordInput').value;
	passwordComfirmation = document.getElementById('passwordConfirmationInput').value;
	errorMessageContainer = document.getElementById("connectionErrorMessage")

	const data = {
		email: email,
		username: "testUser" + counter,
		password: password
	};

	counter++;
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
		addAdversaryToMatch();
		console.log("all good for player " + playerIndex);
		return response.json();
	})
	.catch(error => {
		console.error('There was a problem with the fetch operation:', error);
		errorMessageContainer.innerText = "This user doesn't exist, please create an account"
	})
}