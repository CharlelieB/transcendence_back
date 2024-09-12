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
		getUserStats();
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

	makeAuthenticatedRequest("/api/users/ids/", {
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
		const userIds = JSONdata.map(user => user.id);
		var responseHTML = "";
		for(let i = 0; i < usernames.length; i++) {
			responseHTML = responseHTML + "<div class=\"row m-2\" id=\"friendContainer" + userIds[i] + "\"> \
			<div class=\"h5 col-auto d-flex align-items-center\">" + usernames[i] + "</div> \
			<div class=\"col d-flex justify-content-end\"> \
				<button class=\"btn btn-danger unfollow-button\" data-user-id=\""+ userIds[i] + "\">X</button>\
			</div> \
			</div>";
		}
		followListContainer.innerHTML = responseHTML;
		const unfollowButtons = document.querySelectorAll(".unfollow-button");
		unfollowButtons.forEach(button => {
			button.addEventListener('click', (event) => {
				const userId = event.target.getAttribute('data-user-id');
				unfollowUser(userId);
				document.getElementById("friendContainer" + userId).classList.add("d-none");

			});
		});
	});
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

// FOLLOW/UNFOLLOW USER

function followUser(userId) {
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

function unfollowUser(userId) {
	makeAuthenticatedRequest("/api/unfollow/" + userId + "/", {method: "POST"})
	.then(response => {
		if (!response.ok) {
			throw new Error ('Network response was not ok');
		}
		return response.json();
	})
	.then(data => {
		console.log("User unfollowed successfully : ", data);
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
	}).then(data => {
		console.log(data);
		drawCanvas(data.wins, data.losses);
		document.getElementById("gamesPlayedField").innerText = "Games played : " + data.games_played;
		document.getElementById("victoryField").innerText = "Victories : " + data.wins;
		document.getElementById("lossesField").innerText = "Losses : " + data.losses;
	}).catch(error => {
		console.error("There was an issue with the fetch operation: ", error);
	});
	getMatchList();
}

function drawCanvas(wins, losses) {
	const total = wins + losses;
	const colors = ['#4CAF50', '#FF5733']; // Green and orange
	const canvas = document.getElementById('myPieChart');
	const ctx = canvas.getContext('2d');
	const centerX = canvas.width / 2;
	const centerY = canvas.height / 2;

	if (total === 0) {
		const radius = 50;  // Adjust the radius of the circle

		// Draw the circle
		ctx.beginPath();
		ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
		ctx.fillStyle = '#d3d3d3';  // Light grey color for the circle
		ctx.fill();
		// Adding the text
		ctx.font = '15px Arial';    // Font style and size
		ctx.fillStyle = '#000';     // Text color
		ctx.textAlign = 'center';   // Center align text
		ctx.textBaseline = 'middle'; // Vertical align text
		ctx.fillText('No User Data', centerX, centerY);
		return ;
	}

	const radius = Math.min(canvas.width / 2, canvas.height / 2);

	// Calculate angles for both values
	const sliceAngle1 = (wins / total) * 2 * Math.PI;
	const sliceAngle2 = (losses / total) * 2 * Math.PI;

	// Draw first slice (value1)
	ctx.beginPath();
	ctx.moveTo(centerX, centerY);
	ctx.arc(centerX, centerY, radius, 0, sliceAngle1);
	ctx.closePath();
	ctx.fillStyle = colors[0];
	ctx.fill();

	// Draw second slice (value2)
	ctx.beginPath();
	ctx.moveTo(centerX, centerY);
	ctx.arc(centerX, centerY, radius, sliceAngle1, sliceAngle1 + sliceAngle2);
	ctx.closePath();
	ctx.fillStyle = colors[1];
	ctx.fill();
}

let tmpName

async function getPlayerNames(ids) {
	let response = await makeAuthenticatedRequest("/api/users/ids/", {
		method: 'POST',
		body: JSON.stringify(ids)
	});
	let data = await response.json();

	return ([data[0].username, data[1].username]);
}

function getMatchList() {
	const matchesHistoryContainer = document.getElementById("matchesHistoryContainer");
	let matchesListHTML = "";
	makeAuthenticatedRequest("/api/games/matches/user/", {method: 'GET'})
	.then(response => {
		if(!response.ok) {
			throw new Error ('Network response was not ok');
		}
		return response.json();
	}).then(async data => {
		for(let i = 0; i < data.length;i++) {
			const date = data[i].created_at.substring(0, 10);
			const hour = data[i].created_at.substring(11, 16);
			const idList = {user_ids: [data[i].player1, data[i].player2]};
			const names = await getPlayerNames(idList);
			matchesListHTML = matchesListHTML + "<div class=\"card mt-3\" style=\"width: 18rem;\"> \
								<div class=\"card-body\"> \
									<h5 class=\"card-title text-center\">" + names[0] + " VS " + names[1] + "</h5> \
									<h1 class=\"card-text text-center\">" + data[i].player1_score + " - " + data[i].player2_score + "</h1> \
									<p class=\"card-text text-center\">" + date + " at " + hour + "</p> \
								</div> \
							</div>"
		}
		matchesHistoryContainer.innerHTML = matchesListHTML;
	}).catch(error => {
		console.error("There was an issue with the fetch operation: ", error);
	})
}
