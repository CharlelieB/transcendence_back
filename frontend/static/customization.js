let customData = {
	customVictoryPoints : 5,
	colorRacket1 : 3,
	colorRacket2 : 4,
	colorNet : 2,
	sizeRacket : "regular",
	nbBalls : 1
};

// CUSTOMIZATION

const bgClassList = ["bg-primary", "bg-secondary", "bg-success", "bg-danger", "bg-warning", "bg-dark"];
const customScoreValue = document.getElementById('customVictoryValue');
const customVictoryScoreField = document.getElementById('customVictoryField');
const customColorRacket1 = document.getElementById('formColorRacket1');
const colorBoxRacket1 = document.getElementById("colorBoxRacket1");
const customColorRacket2 = document.getElementById('formColorRacket2');
const colorBoxRacket2 = document.getElementById('colorBoxRacket2');
const customColorNet = document.getElementById('formColorNet');
const colorBoxNet = document.getElementById('colorBoxNet');
const customRacketSize = document.getElementById('formRacketSize');
let customBallsNb = 1;

function getCustomizationSettings() {
	makeAuthenticatedRequest("/api/customization/view/", { method: "GET"})
	.then(response => {
		if(!response.ok) {
			throw new Error('Network response was not ok');
		}
		return response.json();
	})
	.then(data => {
		customScoreValue.value = data.score_win;
		customColorRacket1.value = data.color_1;
		customColorRacket2.value = data.color_2;
		customColorNet.value = data.color_filet;
		customRacketSize.value = getRacketSize(data.size_raquette);
		customBallsNb = data.nb_balls;
		updateCustomModalUI();
	})
	.catch(error => {
		console.error('There was a problem with the fetch operation:', error);
	})
}

function updateCustomizationSettings() {
	data = {
		score_win : customScoreValue.value,
		color_1 : customColorRacket1.value,
		color_2 : customColorRacket2.value,
		color_filet : customColorNet.value,
		size_raquette : setRacketSize(customRacketSize.value),
		nb_balls : customBallsNb
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
		console.log("Custom settings updated successfully");
	})
	.catch(error => {
		console.error('There was a problem with the fetch operation:', error);
	})
}

function restoreCustomizationSettings() {
	customScoreValue.value = 5;
	customColorRacket1.value = 3;
	customColorRacket2.value = 4;
	customColorNet.value = 2;
	customRacketSize.value = getRacketSize("regular");
	customBallsNb = 1;

	updateCustomizationSettings();
	updateCustomModalUI();
}

function updateCustomModalUI() {
	setSquareColors();
	selectBallsNbRadioButton();
	customVictoryScoreField.innerHTML = "Score required for victory : " + customScoreValue.value;
}

function setSquareColors()
{
	colorBoxRacket1.classList.remove(bgClassList[0], bgClassList[1], bgClassList[2], bgClassList[3], bgClassList[4], bgClassList[5]);
	colorBoxRacket1.classList.add(bgClassList[customColorRacket1.value]);
	colorBoxRacket2.classList.remove(bgClassList[0], bgClassList[1], bgClassList[2], bgClassList[3], bgClassList[4], bgClassList[5]);
	colorBoxRacket2.classList.add(bgClassList[customColorRacket2.value]);
	colorBoxNet.classList.remove(bgClassList[0], bgClassList[1], bgClassList[2], bgClassList[3], bgClassList[4], bgClassList[5]);
	colorBoxNet.classList.add(bgClassList[customColorNet.value]);
}

function getRacketSize(size) {
	if (size === "small") {
		return (0);
	}
	else if (size === "regular") {
		return (1);
	}
	else if (size === "large") {
		return (2);
	}
}

function setRacketSize(value) {
	if (value === "0") {
		return ("small");
	}
	else if (value === "1") {
		return ("regular");
	}
	else if (value === "2") {
		return ("large");
	}
}

function selectBallsNbRadioButton() {
	let ballsNbRadioId = "vbtn-ball-nb" + customBallsNb;
	document.getElementById(ballsNbRadioId).checked = true;
}

function updateBallsNumber(ballsNb) {
	customBallsNb = ballsNb;
}

////// Event Listenner for Score Label

customScoreValue.addEventListener('change', function() {
	customVictoryScoreField.innerHTML = "Score required for victory : " + customScoreValue.value;
});

////// Event Listenner for Boxes

customColorRacket1.addEventListener('change', function() {
	colorBoxRacket1.classList.remove(bgClassList[0], bgClassList[1], bgClassList[2], bgClassList[3], bgClassList[4], bgClassList[5]);
	colorBoxRacket1.classList.add(bgClassList[customColorRacket1.value]);
});

customColorRacket2.addEventListener('change', function() {
	colorBoxRacket2.classList.remove(bgClassList[0], bgClassList[1], bgClassList[2], bgClassList[3], bgClassList[4], bgClassList[5]);
	colorBoxRacket2.classList.add(bgClassList[customColorRacket2.value]);
});

customColorNet.addEventListener('change', function() {
	colorBoxNet.classList.remove(bgClassList[0], bgClassList[1], bgClassList[2], bgClassList[3], bgClassList[4], bgClassList[5]);
	colorBoxNet.classList.add(bgClassList[customColorNet.value]);
})
