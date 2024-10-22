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


switch2FA.addEventListener("change", async () => {
	if(switch2FA.checked) {
		makeAuthenticatedRequest("/api/2fa/activate/", {method: 'POST'})
		.then(async () => {
			let response = await makeAuthenticatedRequest("/api/2fa/create/", {method: 'GET'});
			let data = await response.json();
			if (data) {
				document.getElementById('QRcodeContainer').innerHTML = "<img src=\"data:image/png;base64," + data.qr_code + "\" alt=\"QR Code\">";
			}
		})
	}
	else {
		makeAuthenticatedRequest("/api/2fa/deactivate/", {method: 'POST'});
		document.getElementById('QRcodeContainer').innerHTML = "";
	}
})

// UPLOAD PHOTO

function uploadImage() {
	const fileInput = document.getElementById('fileInput');

	fileInput.click();
	fileInput.onchange = () => {
 		const selectedFile = fileInput.files[0];
 		console.log(selectedFile);

		const formData = new FormData();
		formData.append('image', selectedFile);
		makeAuthenticatedFileUpload("/api/avatar/", {
			method: 'POST',
			body: formData
		}).then(() => {
			displaySocialDrawer();
		})
	}

}


avatar:"/media/code/media/avatars/Blata.jpg"

avatar: "/media/avatars/bilel.jpeg"
