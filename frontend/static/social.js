//////////// SOCIAL BUTTON ////////////

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
		document.getElementById("profilePic").innerHTML = "<img src=\"http://localhost:8000" + data.avatar + "\" class=\"img-thumbnail\">";
		getFriendsList(data);
	})
	.catch(error => {
		console.error('There was a problem with the fetch operation:', error);
	})
}


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

// GET USERS //

function getUserList() {
	const userListContainer = document.getElementById('userListContainer');
	makeAuthenticatedRequest('/api/users/', {method: 'GET'})
	.then(response => {
		if (!response.ok) {
			throw new Error('Network response was not ok');
		}
		return response.json();
	})
	.then(JSONdata => {
		let friendsList;
		makeAuthenticatedRequest("/api/user/", {method: 'GET'})
		.then(response => {
			if (!response.ok) {
				throw new Error('Network response was not ok');
			}
			return response.json();
		}).then(data => {
			friendsList = data.following;
			// Assuming JSONdata is an array of user objects and each user object has a 'username' field
			const usernames = JSONdata.map(user => user.username); // Extract usernames
			const userIds = JSONdata.map(user => user.id);
			var responseHTML = "";
			//userListContainer.innerText = usernames.length; // Display usernames, one per line
			for (let i = 0; i < usernames.length; i++) {
				if (!(userIds[i] === hostId || friendsList.includes(userIds[i]))) {
					responseHTML = responseHTML +
					"<div class=\"row m-2\"> \
						<div class=\"h5 col-auto\">" + usernames[i] + "</div> \
						<div class=\"col d-flex justify-content-end\"> \
							<button class=\"btn btn-primary follow-button\" data-user-id=\"" + userIds[i] + "\" id=\"followButton" + userIds[i] + "\">Follow</button> \
						</div> \
					</div>"

				}
			};
			userListContainer.innerHTML = "<div>" + responseHTML + "</div>";

			const followButtons = document.querySelectorAll(".follow-button");
			followButtons.forEach(button => {
				button.addEventListener('click', (event) => {
					const userId = event.target.getAttribute('data-user-id');
					const followButton = document.getElementById("followButton" + userId);
					followButton.classList.remove("btn-primary");
					followButton.classList.add("btn-outline-primary");
					followButton.innerText = "Followed";
					followButton.disabled = true;
					followUser(userId);
				});
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
