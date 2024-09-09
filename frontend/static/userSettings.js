const switch2FA = document.getElementById("switch2FA");

function check2fa() {
	makeAuthenticatedRequest("/api/user/", {method: 'GET'})
	.then(response => {
		return response.json();
	})
	.then(data => {
		if (data.is_two_factor_enabled) {
			switch2FA.checked = true;
		}
	})
}

function changeUsername() {
	let newUserName = document.getElementById("usernameChangeInput").value;
	let errorContainer = document.getElementById("changeUsernameErrorContainer");

	let data = {
		username : newUserName
	}
	if(newUserName === "")
	{
		errorContainer.innerText = "You can't have an empty username";
	}
	else {
		errorContainer.innerText = "";
		makeAuthenticatedRequest("/api/user/", {
			method : 'PUT',
			body : JSON.stringify(data)
		});
		ReplaceElement("usernameChangeContainer", "usernameChangeButton");
		document.getElementById("usernameChangeButton").classList.remove('d-flex');
	}
}

function changePassword() {
	let newPassword = document.getElementById("passwordChangeInput").value;
	let errorContainer = document.getElementById("changePasswordErrorContainer");

	let data = {
		password : newPassword
	}
	if(newPassword === "")
	{
		errorContainer.innerText = "You can't have an empty password";
	}
	else {
		errorContainer.innerText = "";
		makeAuthenticatedRequest("/api/user/", {
			method : 'PUT',
			body : JSON.stringify(data)
		});
		ReplaceElement("passwordChangeContainer", "passwordChangeButton");
		document.getElementById("passwordChangeButton").classList.remove('d-flex');
	}
}


switch2FA.addEventListener("change", () => {
	if(switch2FA.checked) {
		console.log("activating 2fa");
		makeAuthenticatedRequest("/api/2fa/activate/", {method: 'POST'});
	}
	else {
		console.log("desactivating 2fa");
		makeAuthenticatedRequest("/api/2fa/deactivate/", {method: 'POST'});
	}
})