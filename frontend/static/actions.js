///// GLOBAL VARIABLES ////

let playerIndex = 2;
let playerNumber = 1;

///// GENERIC FUNCTION /////

//This function replace an element by another using Bootstrap's display property classes
function ReplaceElement(elementToHideId, elementToShowId)
{
	var elementToHide = document.getElementById(elementToHideId);
	var elementToShow = document.getElementById(elementToShowId);

	elementToHide.classList.add("d-none");
	elementToHide.classList.remove("d-flex");

	elementToShow.classList.remove("d-none");
	elementToShow.classList.add("d-flex");
}

/////    FUNCTIONS TO DISPLAY HTML ELEMENTS /////

/////    FIRST CONNECTION EVENT LISTENER /////

// document.addEventListener('DOMContentLoaded', function() {
//     // Call your function here
//     ReplaceElement("buttonsContainer", "playerConnection");
// 	ReplaceElement("loginBackButton", "null");
// });

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
	heading.innerText = "Player " + playerIndex + " login";
 }

function BackButtonConnection()
{
	ReplaceElement("playerConnection", "buttonsContainer");
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

// GET USERS //

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

//function getUserList()
//{
//	const userListContainer = document.getElementById('userListContainer');
//	const CSRFtoken = getCookie("csrftoken");
//	console.log(CSRFtoken);
//	const requestOptions = {
//  		method: 'GET',
//		headers: {
//			'Authorization' : `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzI0MDcwOTAwLCJpYXQiOjE3MjQwNjQ5MDAsImp0aSI6IjM1ZmM5NjdkZWI4NDQwOGI5MWUwMjU3YTIwM2E3M2U1IiwidXNlcl9pZCI6Mn0.Pjei_YOkwsM4MLBS7vegLy7AQXx6gx1T5C_hwvPsEas`,
//			'X-CSRFToken' : CSRFtoken
//		},
// 		credentials: 'include'
//	};

//	fetch('http://127.0.0.1:8000/api/users/')
//	.then(response => {
//	  if (!response.ok) {
//		throw new Error('Network response was not ok');
//	  }
//	  return response.json();
//	})
//	.then(data => {
//	  console.log(data);
//	  userListContainer.innerText = JSON.stringify(data, null, 2);
//	})
//	.catch(error => {
//	  console.error('Error:', error);
//	});
//}

function makeAuthenticatedRequest(url, options = {}) {

	const csrfToken = getCookie('csrftoken');
	if (!csrfToken) {
		console.error('CSRF token is missing. Cannot refresh token.');
		return Promise.reject('CSRF token is missing');
	}

	options.headers = options.headers || {};
	options.headers['Authorization'] = `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzI0MDcxNTAxLCJpYXQiOjE3MjQwNjU1MDEsImp0aSI6ImQ1YTVkNjhjNDUzZDRlYTM4OGVlYWRkNWI5MTgzMmJiIiwidXNlcl9pZCI6Mn0.KAMuai2BdU9pDcZ_06k1xPZIqfmyeDXUiurRdZhYc4c`;
	options.headers['X-CSRFToken'] = csrfToken;
	options.credentials = 'include';

	return fetch(url, options)
		.then(response => {
			if (response.status === 401) {
				// If token has expired, refresh and retry the request
				//return refreshToken().then(() => {
				//	options.headers['Authorization'] = `Bearer ${window.accessToken}`;
				//	return fetch(url, options);
				//});
				console.log("error 401");
			}
			return response;
		});
}

function getUserList()
{
	const userListContainer = document.getElementById('userListContainer');

	const data = makeAuthenticatedRequest('/api/users/', {method: 'GET'});
	console.log(data);
	userListContainer.innerText = JSON.stringify(data, null, 2);
}