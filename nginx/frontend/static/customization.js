// CUSTOMIZATION

const bgClassList = ["bg-primary", "bg-secondary", "bg-success", "bg-danger", "bg-warning", "bg-dark"];
const customScoreValue = document.getElementById('customVictoryValue');
const customVictoryScoreField = document.getElementById('customVictoryField');
const customColorRackets = document.getElementById('formColorRackets');
const colorBoxRackets = document.getElementById("colorBoxRackets");
const customColorNet = document.getElementById('formColorNet');
const colorBoxNet = document.getElementById('colorBoxNet');
const customBallSpeed = document.getElementById('formBallSpeed');
let customMapNb = 0;
let pong = true;
const switchDrunkMode = document.getElementById("switchDrunkMode");

function getCustomizationSettings() {
	makeAuthenticatedRequest("/api/customization/view/", { method: "GET"})
	.then(response => {
		if(!response.ok) {
			throw new Error('Network response was not ok');
		}
		return response.json();
	})
	.then(data => {
		console.log(data);
		customScoreValue.value = data.score_win;
		customColorRackets.value = data.color_rackets;
		customColorNet.value = data.color_filet;
		customBallSpeed.value = getBallSpeed(data.ball_speed, data.game_type);
		pong = data.game_type;
		customMapNb = data.map;
		effectEnabled = data.drunk_effect;
		updateCustomModalUI();
		setBallAndRacketsColors(data.color_filet, data.color_rackets);
	})
	.catch(error => {
		console.error('There was a problem with the fetch operation:', error);
	})
}

function updateCustomizationSettings() {
	data = {
		score_win : customScoreValue.value,
		color_rackets : customColorRackets.value,
		color_filet : customColorNet.value,
		ball_speed : setBallSpeed(customBallSpeed.value),
		map : customMapNb,
		game_type : pong,
		drunk_effect : effectEnabled
	};

	makeAuthenticatedRequest("/api/customization/update/", {
		method : 'PUT',
		body : JSON.stringify(data)
	})
	.then(response => {
		updateCustomModalUI();
		if(!response.ok) {
			throw new Error('Network response was not ok');
		}
	})
	.catch(error => {
		console.error('There was a problem with the fetch operation:', error);
	})
}

function restoreCustomizationSettings() {
	customScoreValue.value = 5;
	customColorRackets.value = 3;
	customColorNet.value = 2;
	customBallSpeed.value = getBallSpeed("regular");
	customMapNb = 1;
	pong = true;
	effectEnabled = false;

	updateCustomizationSettings();
	updateCustomModalUI();
}

function updateCustomModalUI() {
	setSquareColors();
	selectBallsNbRadioButton();
	customVictoryScoreField.innerHTML = "Score required for victory : " + customScoreValue.value;
	if (effectEnabled)
		switchDrunkMode.checked = true;
	else
		switchDrunkMode.checked = false;
}

function setBallAndRacketsColors(color_ball, color_rackets) {
	switch (color_ball) {
		case 0 :
			rb = 13;
			gb = 110;
			bb = 253;
		case 1:
			rb = 108;
			gb = 117;
			bb = 125;
		case 2:
			rb = 25;
			gb = 135;
			bb = 84;

		case 3:
			rb = 220;
			gb = 53;
			bb = 69;
		case 4:
			rb = 255;
			gb = 193;
			bb = 7;
		case 5:
			rb = 0;
			gb = 0;
			bb = 0;
	}
	switch (color_rackets) {
		case 0 :
			rp = 13;
			gp = 110;
			bp = 253;
		case 1:
			rp = 108;
			gp = 117;
			bp = 125;
		case 2:
			rp = 25;
			gp = 135;
			bp = 84;

		case 3:
			rp = 220;
			gp = 53;
			bp = 69;
		case 4:
			rp = 255;
			gp = 193;
			bp = 7;
		case 5:
			rp = 0;
			gp = 0;
			bp = 0;
	}
}

function setSquareColors()
{
	colorBoxRackets.classList.remove(bgClassList[0], bgClassList[1], bgClassList[2], bgClassList[3], bgClassList[4], bgClassList[5]);
	colorBoxRackets.classList.add(bgClassList[customColorRackets.value]);
	colorBoxNet.classList.remove(bgClassList[0], bgClassList[1], bgClassList[2], bgClassList[3], bgClassList[4], bgClassList[5]);
	colorBoxNet.classList.add(bgClassList[customColorNet.value]);
}

function getBallSpeed(size, game_type) {
	if (size === "slow") {
		ballSpeed = 0.15
		return (0);
	}
	else if (size === "regular") {
		ballSpeed = 0.25
		return (1);
	}
	else if (size === "fast") {
		ballSpeed = 0.33
		return (2);
	}
}

function setBallSpeed(value) {
	if (value === "0") {
		ballSpeed = 0.1
		return ("slow");
	}
	else if (value === "1") {
		ballSpeed = 0.3
		return ("regular");
	}
	else if (value === "2") {
		ballSpeed = 0.5
		return ("fast");
	}
}

function selectBallsNbRadioButton() {
	let mapNbRadioId = "vbtn-map-nb" + customMapNb;
	let gameTypeId = "vbtn-game-nb";
	if (pong)
		gameTypeId += 0;
	else
		gameTypeId += 1;
	console.log(gameTypeId);
	document.getElementById(mapNbRadioId).checked = true;
	document.getElementById(gameTypeId).checked = true;
}

function updateMapNumber(MapNb) {
	customMapNb = MapNb;
}

////// Event Listenner for Score Label

customScoreValue.addEventListener('change', function() {
	customVictoryScoreField.innerHTML = "Score required for victory : " + customScoreValue.value;
});

////// Event Listenner for Boxes

customColorRackets.addEventListener('change', function() {
	colorBoxRackets.classList.remove(bgClassList[0], bgClassList[1], bgClassList[2], bgClassList[3], bgClassList[4], bgClassList[5]);
	colorBoxRackets.classList.add(bgClassList[customColorRackets.value]);
});

customColorNet.addEventListener('change', function() {
	colorBoxNet.classList.remove(bgClassList[0], bgClassList[1], bgClassList[2], bgClassList[3], bgClassList[4], bgClassList[5]);
	colorBoxNet.classList.add(bgClassList[customColorNet.value]);
})

switchDrunkMode.addEventListener("change", async () => {
	if(switchDrunkMode.checked) {
		effectEnabled = true;
		console.log("activating drunk mode");
	}
	else
		effectEnabled = false;
})