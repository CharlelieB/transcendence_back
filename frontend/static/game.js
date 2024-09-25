/*-----2D-----*/
var init = false;
var canvas = document.getElementById("canvas-id");
var context = canvas.getContext("2d");
var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
var colorBuffer = imageData.data;
var gridColorBuffer = new Uint8ClampedArray(canvas.width * canvas.height * 4);
var BUFFER_SIZE = canvas.width * canvas.height * 4;
var RED_SIDE_SIZE = canvas.width / 2;
var GREEN_SIDE_SIZE = canvas.width;
/*-----PERSPECTIVE-----*/
var yGridOffset = 4.2;
var zGridOffset = 6;
var globaleScale = 310;
/*Padel*/
var padelSpeed = 0.2;
var padelHeight = 0.2;
var padelWidth = 1;
var xPadelPlayer = 0;
var zPadel = 2;
var xAntagonist = 0;
var zAntagonist = 21;
/*Ball*/
var ballSize = 0.15;
var xBall = 0;
var zBall = zPadel;
var zBallPvp = zAntagonist;
var ballScaler = 1; //experimental.
/*Screen Space*/
var MID_WIDTH = canvas.width / 2;
var MID_WIDTHPvp = (canvas.width / 4) * 3;
var MID_HEIGHT = canvas.height / 2;
/*Model Space*/
var grid3D = [];
var padel3D = [];
var ball3D = [];
/*-----Limites Terrain-----*/
var ZMAX = 22;
var ZMIN = 1;
var XMAX = 7;
var XMIN = -7;
/*-----Balle speed-----*/
var ballSpeed = 0.2;
var xVelocity = 0.01;
var zVelocity = 0.2;
/*-----Input-----*/
var keysPressed = {};
/*-----Score-----*/
//var playerScore = 0;
//var antagonistScore = 0;
var winnerScore = 5;
/*-----SYNC-----*/
var lastTime = 0;
var deltaTime = 0;
var primeDeltaTime = 17;
var skipFirstCall = 0;
/*-----Map-----*/
var map = 1;

/*-----------Functions----------*/
/*Display*/
function putPixel(buffer, i, r, g, b, a)
{
	buffer[i] = r;
	buffer[i + 1] = g;
	buffer[i + 2] = b;
	buffer[i + 3] = a;
}

function drawLineDDA(buffer, x0, y0, x1, y1, r, g, b, a)
{
	let dx = x1 - x0;
	let dy = y1 - y0;
	let steps;

	// Calculer le nombre de pas en fonction du changement maximal (dx ou dy)
	if (Math.abs(dx) > Math.abs(dy)) {
		steps = Math.abs(dx);
	} else {
		steps = Math.abs(dy);
	}

	// Calculer l'incrément à chaque étape
	let xIncrement = dx / steps;
	let yIncrement = dy / steps;

	let x = x0;
	let y = y0;

	// Parcourir tous les pas et placer les pixels
	for (let i = 0; i <= steps; i++) {
		// Calculer l'index du pixel dans le color buffer
		let index = (Math.round(y) * canvas.width + Math.round(x)) * 4;
		// Dessiner le pixel
		putPixel(buffer, index, r, g, b, a);
		// Incrémenter les coordonnées
		x += xIncrement;
		y += yIncrement;
	}
}

/*Populate 3DModel*/
function make3Dgrid()
{
	let x = XMIN;
	let z = ZMIN;

	for (i = 0; i < XMAX * 4 + 2; ++i)
	{
		if (i % 2 == 0)
		{
			let coord = {
				z: ZMIN,
				x: x
			};
			grid3D.push(coord);
		}
		else
		{
			let coord = {
				z: ZMAX,
				x: x
			};
			grid3D.push(coord);
			++x;
		}
	}

	for (i = 0; i < ZMAX * 2; ++i)
	{
		if (i % 2 == 0)
		{
			let coord = {
				z: z,
				x: XMIN
			};
			grid3D.push(coord);
		}
		else
		{
			let coord = {
				z: z,
				x: XMAX
			};
			grid3D.push(coord);
			++z;
		}
	}
}

function create3Dpadel()
{
	padel3D.push({x: -padelWidth, y: padelHeight});
	padel3D.push({x: padelWidth, y: padelHeight});
	padel3D.push({x: -padelWidth, y: -padelHeight});
	padel3D.push({x: padelWidth, y: -padelHeight});
}

function create3Dball()
{
	ball3D.push({ x: -ballSize, y: -ballSize, z: -ballSize});
	ball3D.push({ x: -ballSize, y: ballSize, z: -ballSize});
	ball3D.push({ x: ballSize, y: ballSize, z: -ballSize});
	ball3D.push({ x: ballSize, y: -ballSize, z: -ballSize});
	ball3D.push({ x: -ballSize, y: -ballSize, z: ballSize});
	ball3D.push({ x: -ballSize, y: ballSize, z: ballSize});
	ball3D.push({ x: ballSize, y: ballSize, z: ballSize});
	ball3D.push({ x: ballSize, y: -ballSize, z: ballSize});
}

/*Projection*/
function projectBallLine(i, j, xB, zB, xOff, r, g , b)
{
	let x= 0;
	let y = 0;
	let x0 = 0;
	let y0 = 0;
	let x1 = 0;
	let y1 = 0;

	x = ((ball3D[i].x + xB) / (ball3D[i].z + zB + zGridOffset)) * globaleScale;
	y = ((ball3D[i].y + yGridOffset - ballSize) / (ball3D[i].z + zB + zGridOffset)) * globaleScale;
	x0 = Math.floor(x + xOff);
	y0 = Math.floor(y + MID_HEIGHT);
	x = ((ball3D[j].x + xB) / (ball3D[j].z + zB + zGridOffset)) * globaleScale;
	y = ((ball3D[j].y + yGridOffset - ballSize) / (ball3D[j].z + zB + zGridOffset)) * globaleScale;
	x1 = Math.floor(x + xOff);
	y1 = Math.floor(y + MID_HEIGHT);
	if ((x0 > 0 && x0 < canvas.width && y0 > 0 && y0 < canvas.height
			&& x1 > 0 && x1 < canvas.width && y1 > 0 && y1 < canvas.height))
			drawLineDDA(colorBuffer, x0, y0, x1, y1, r, g , b, 255);
}

function projectPadelLine(buffer, i, j, z, r, g, b, xPadel, xOff)
{
	let x0 = 0;
	let y0 = 0;
	let x1 = 0;
	let y1 = 0;
	let x = 0;
	let y = 0;

	x = ((padel3D[i].x + xPadel) / (z + zGridOffset)) * globaleScale;
	y = ((padel3D[i].y + yGridOffset - padelHeight) / (z + zGridOffset)) * globaleScale;
	x0 = Math.floor(x + xOff);
	y0 = Math.floor(y + MID_HEIGHT);
	x = ((padel3D[j].x + xPadel) / (z + zGridOffset)) * globaleScale;
	y = ((padel3D[j].y + yGridOffset - padelHeight) / (z + zGridOffset)) * globaleScale;
	x1 = Math.floor(x + xOff);
	y1 = Math.floor(y + MID_HEIGHT);
	if ((x0 > 0 && x0 < canvas.width && y0 > 0 && y0 < canvas.height
		&& x1 > 0 && x1 < canvas.width && y1 > 0 && y1 < canvas.height))
		drawLineDDA(buffer, x0, y0, x1, y1, r, g, b, 255);
}

function projectGridLine(WIDTH, i, j)
{
	let x0 = 0;
	let y0 = 0;
	let x1 = 0;
	let y1 = 0;
	let x = 0;
	let y = 0;

	x = (grid3D[i].x / (grid3D[i].z + zGridOffset)) * globaleScale;
	y = (yGridOffset / (grid3D[i].z + zGridOffset)) * globaleScale;
	x0 = Math.floor(x + WIDTH);
	y0 = Math.floor(y + MID_HEIGHT);
	x = (grid3D[j].x / (grid3D[j].z + zGridOffset)) * globaleScale;
	y = (yGridOffset / (grid3D[j].z + zGridOffset)) * globaleScale;
	x1 = Math.floor(x + WIDTH);
	y1 = Math.floor(y + MID_HEIGHT);
	drawLineDDA(gridColorBuffer, x0, y0, x1, y1, 75, 0, 130, 255);
}

/*Rotation*/
function rotateY(model, rad) {
    // Cosine et Sine de l'angle
    let cosTheta = Math.cos(rad);
    let sinTheta = Math.sin(rad);

    // Parcourir chaque point du modèle
    for (let i = 0; i < model.length; i++) {
        let x = model[i].x;
        let z = model[i].z;

        // Appliquer la rotation
        model[i].x = x * cosTheta - z * sinTheta;
        model[i].z = x * sinTheta + z * cosTheta;
    }
}

/*Draw*/

function create3DgridPvp(map)
{
	make3Dgrid();

	if (map)
	{
		for (i = 0; i < ZMAX * 2 + XMAX * 4 + 1; i += 2)
			projectGridLine(MID_WIDTHPvp, i, i + 1);
	}
	else
	{
			projectGridLine(MID_WIDTHPvp, 0, 1);
			projectGridLine(MID_WIDTHPvp, XMAX * 4, XMAX * 4 + 1);
			projectGridLine(MID_WIDTHPvp, 0, XMAX * 4);
			projectGridLine(MID_WIDTHPvp, 1, XMAX * 4 + 1);
			projectGridLine(MID_WIDTHPvp, XMAX * 4 + 1 + ZMAX, XMAX * 4 + ZMAX);
			projectGridLine(MID_WIDTHPvp, XMAX * 4 + ZMAX - 1, XMAX * 4 + ZMAX - 2);
			projectGridLine(MID_WIDTHPvp, XMAX * 4 + ZMAX - 1, XMAX * 4 + ZMAX - 2);
			projectGridLine(MID_WIDTHPvp, XMAX * 4 + ZMAX - 3, XMAX * 4 + ZMAX - 4);
	}
}

function create3Dgrid(map)
{
	gridColorBuffer.fill(0);
	make3Dgrid();

	if (map)
	{
		for (i = 0; i < ZMAX * 2 + XMAX * 4 + 1; i += 2)
			projectGridLine(MID_WIDTH, i, i + 1);
	}
	else
	{
		projectGridLine(MID_WIDTH, 0, 1);
		projectGridLine(MID_WIDTH, XMAX * 4, XMAX * 4 + 1);
		projectGridLine(MID_WIDTH, 0, XMAX * 4);
		projectGridLine(MID_WIDTH, 1, XMAX * 4 + 1);
		projectGridLine(MID_WIDTH, XMAX * 4 + 1 + ZMAX, XMAX * 4 + ZMAX);
		projectGridLine(MID_WIDTH, XMAX * 4 + ZMAX - 1, XMAX * 4 + ZMAX - 2);
		projectGridLine(MID_WIDTH, XMAX * 4 + ZMAX - 3, XMAX * 4 + ZMAX - 4);
	}
}


function drawBallPvp()
{
	let x0 = 0;
	let y0 = 0;
	let x1 = 0;
	let y1 = 0;
	let r = 255;
	let g = 255;
	let b = 255;

	if (zBall <= ZMIN || zBall >= ZMAX)
	{
		r = 255;
		g = 0;
		b = 0;
	}
	rotateY(ball3D, xBall * deltaTime);
	projectBallLine(0, 1, xBall, zBallPvp, MID_WIDTHPvp, r, g , b);
	projectBallLine(1, 2, xBall, zBallPvp, MID_WIDTHPvp, r, g , b);
	projectBallLine(2, 3, xBall, zBallPvp, MID_WIDTHPvp, r, g , b);
	projectBallLine(3, 0, xBall, zBallPvp, MID_WIDTHPvp, r, g , b);

	projectBallLine(4, 5, xBall, zBallPvp, MID_WIDTHPvp, r, g , b);
	projectBallLine(5, 6, xBall, zBallPvp, MID_WIDTHPvp, r, g , b);
	projectBallLine(6, 7, xBall, zBallPvp, MID_WIDTHPvp, r, g , b);
	projectBallLine(7, 4, xBall, zBallPvp, MID_WIDTHPvp, r, g , b);

	projectBallLine(4, 0, xBall, zBallPvp, MID_WIDTHPvp, r, g , b);
	projectBallLine(5, 1, xBall, zBallPvp, MID_WIDTHPvp, r, g , b);
	projectBallLine(6, 2, xBall, zBallPvp, MID_WIDTHPvp, r, g , b);
	projectBallLine(7, 3, xBall, zBallPvp, MID_WIDTHPvp, r, g , b);
}

function drawBall()
{
	let x0 = 0;
	let y0 = 0;
	let x1 = 0;
	let y1 = 0;
	let r = 255;
	let g = 255;
	let b = 255;

	if (zBall <= ZMIN || zBall >= ZMAX)
	{
		r = 255;
		g = 0;
		b = 0;
		b = 0;
	}
	rotateY(ball3D, xBall * deltaTime);
	projectBallLine(0, 1, xBall, zBall, MID_WIDTH, r, g , b);
	projectBallLine(1, 2, xBall, zBall, MID_WIDTH, r, g , b);
	projectBallLine(2, 3, xBall, zBall, MID_WIDTH, r, g , b);
	projectBallLine(3, 0, xBall, zBall, MID_WIDTH, r, g , b);

	projectBallLine(4, 5, xBall, zBall, MID_WIDTH, r, g , b);
	projectBallLine(5, 6, xBall, zBall, MID_WIDTH, r, g , b);
	projectBallLine(6, 7, xBall, zBall, MID_WIDTH, r, g , b);
	projectBallLine(7, 4, xBall, zBall, MID_WIDTH, r, g , b);

	projectBallLine(4, 0, xBall, zBall, MID_WIDTH, r, g , b);
	projectBallLine(5, 1, xBall, zBall, MID_WIDTH, r, g , b);
	projectBallLine(6, 2, xBall, zBall, MID_WIDTH, r, g , b);
	projectBallLine(7, 3, xBall, zBall, MID_WIDTH, r, g , b);
}

function drawAntagonistPvp(r, g, b)
{

	for (i = 0; i < 4; i += 2)
		projectPadelLine(colorBuffer, i, i + 1, zPadel, r, g, b, xAntagonist, MID_WIDTHPvp);
	projectPadelLine(colorBuffer, 0, 3, zPadel, r, g, b, xAntagonist, MID_WIDTHPvp);
	projectPadelLine(colorBuffer, 1, 2, zPadel, r, g, b, xAntagonist, MID_WIDTHPvp);
	projectPadelLine(colorBuffer, 0, 2, zPadel, r, g, b, xAntagonist, MID_WIDTHPvp);
	projectPadelLine(colorBuffer, 1, 3, zPadel, r, g, b, xAntagonist, MID_WIDTHPvp);
}

function drawPadelPvp(r, g, b)
{

	for (i = 0; i < 4; i += 2)
		projectPadelLine(colorBuffer, i, i + 1, zAntagonist, r, g, b, xPadelPlayer, MID_WIDTHPvp);
	projectPadelLine(colorBuffer, 0, 3, zAntagonist, r, g, b, xPadelPlayer, MID_WIDTHPvp);
	projectPadelLine(colorBuffer, 1, 2, zAntagonist, r, g, b, xPadelPlayer, MID_WIDTHPvp);
	projectPadelLine(colorBuffer, 0, 2, zAntagonist, r, g, b, xPadelPlayer, MID_WIDTHPvp);
	projectPadelLine(colorBuffer, 1, 3, zAntagonist, r, g, b, xPadelPlayer, MID_WIDTHPvp);
}

function drawAntagonist(r, g, b)
{

	for (i = 0; i < 4; i += 2)
		projectPadelLine(colorBuffer, i, i + 1, zAntagonist, r, g, b, xAntagonist, MID_WIDTH);
	projectPadelLine(colorBuffer, 0, 3, zAntagonist, r, g, b, xAntagonist, MID_WIDTH);
	projectPadelLine(colorBuffer, 1, 2, zAntagonist, r, g, b, xAntagonist, MID_WIDTH);
	projectPadelLine(colorBuffer, 0, 2, zAntagonist, r, g, b, xAntagonist, MID_WIDTH);
	projectPadelLine(colorBuffer, 1, 3, zAntagonist, r, g, b, xAntagonist, MID_WIDTH);
}

function drawPadel(r, g, b)
{

	for (i = 0; i < 4; i += 2)
		projectPadelLine(colorBuffer, i, i + 1, zPadel, r, g, b, xPadelPlayer, MID_WIDTH);
	projectPadelLine(colorBuffer, 0, 3, zPadel, r, g, b, xPadelPlayer, MID_WIDTH);
	projectPadelLine(colorBuffer, 1, 2, zPadel, r, g, b, xPadelPlayer, MID_WIDTH);
	projectPadelLine(colorBuffer, 0, 2, zPadel, r, g, b, xPadelPlayer, MID_WIDTH);
	projectPadelLine(colorBuffer, 1, 3, zPadel, r, g, b, xPadelPlayer, MID_WIDTH);
}

/*Position Update*/
function updateBallPosition(rebound)
{
	if (zVelocity > 0)
		zVelocity = ballSpeed * deltaTime;
	else
		zVelocity = -ballSpeed * deltaTime;
    // Mettre à jour la position de la balle en fonction de sa vitesse
    xBall += xVelocity;
	if (xBall > XMAX)
		xBall = XMAX;
	if (xBall < XMIN)
		xBall = XMIN;
    zBall += zVelocity;
	zBallPvp -= zVelocity;
	if (zBall > ZMAX + 0.5)
		zBall = ZMAX + 0.5;
	if (zBall < ZMIN - 0.5)
		zBall = ZMIN - 0.5;
	if (zBallPvp > ZMAX + 0.5)
		zBallPvp = ZMAX + 0.5;
	if (zBallPvp < ZMIN - 0.5)
		zBallPvp = ZMIN - 0.5;

    // Vérifier les limites du terrain sur l'axe X
    if (xBall <= XMIN || xBall >= XMAX) {
        // Inverser la direction sur X si on atteint les bords
        xVelocity = -xVelocity;
    }

    // Vérifier les limites du terrain sur l'axe Z
    if (zBall >= ZMAX + 0.5 || zBall <= ZMIN - 0.5)
	{
        // Inverser la direction sur Z si on atteint les bords arrière
		currentMatch.scorePlayer1 += 1 * (zVelocity > 0);
		currentMatch.scorePlayer2 += 1 * (zVelocity < 0);
		zVelocity = -zVelocity;
		zBall = ZMAX / 2;
		zBallPvp = zBall + 1;
		xBall = 0;
		xVelocity = Math.random() * 0.5 - 0.25;
		xVelocity /= 3.5;
    }
    else if (zBall <= zPadel && zBall >= ZMIN + 0.5 && zVelocity < 0)//Collision avec le paddle joueur
	{
        if ((xBall > xPadelPlayer - padelWidth || xBall + ballSize > xPadelPlayer - padelWidth)
			&& (xBall < xPadelPlayer + padelWidth || xBall - ballSize < xPadelPlayer + padelWidth))
		{
            //Inverser la direction sur Z si la balle touche le paddle
            zVelocity = -zVelocity;
			//Controle du rebond sur le padel
            xVelocity = ((xBall - xPadelPlayer) / 4) * deltaTime;
        }
    }
    else if (zBall >= zAntagonist && zBall <= ZMAX - 0.5 && zVelocity > 0)//Collision avec l'Antagoniste
	{
		if ((xBall > xAntagonist - padelWidth || xBall + ballSize > xAntagonist - padelWidth)
			&& (xBall < xAntagonist + padelWidth || xBall - ballSize < xAntagonist + padelWidth))
		{
            //Inverser la direction sur Z si la balle touche le paddle
            zVelocity = -zVelocity;
			//Controle du rebond sur le padel
            xVelocity = ((xBall - xAntagonist) / rebound) * deltaTime;
        }
	}
}

function updatePaddlePosition()
{
	if (xBall > xAntagonist)
	{
		xAntagonist += padelSpeed * deltaTime;
        if (xPadelPlayer < XMIN - 1) xPadelPlayer = XMIN - 1;
	}
	if (xBall < xAntagonist)
	{
		xAntagonist -= padelSpeed * deltaTime;
        if (xPadelPlayer > XMAX + 1) xPadelPlayer = XMAX + 1;
	}
    if (keysPressed["ArrowLeft"])
	{
        xPadelPlayer -= padelSpeed * deltaTime;
        if (xPadelPlayer < XMIN - 1) xPadelPlayer = XMIN - 1;
    }
    if (keysPressed["ArrowRight"])
	{
        xPadelPlayer += padelSpeed * deltaTime;
        if (xPadelPlayer > XMAX + 1) xPadelPlayer = XMAX + 1;
    }
}

function updatePaddlePositionPvp()
{
	if (keysPressed["ArrowLeft"])
	{
        xAntagonist -= padelSpeed * deltaTime;
        if (xAntagonist < XMIN - 1) xAntagonist = XMIN - 1;
    }
    if (keysPressed["ArrowRight"])
	{
        xAntagonist += padelSpeed * deltaTime;
        if (xAntagonist > XMAX + 1) xAntagonist = XMAX + 1;
    }
    if (keysPressed["t"])
	{
        xPadelPlayer -= padelSpeed * deltaTime;
        if (xPadelPlayer < XMIN - 1) xPadelPlayer = XMIN - 1;
    }
    if (keysPressed["y"])
	{
        xPadelPlayer += padelSpeed * deltaTime;
        if (xPadelPlayer > XMAX + 1) xPadelPlayer = XMAX + 1;
    }
}

/*Game loop*/
function gameLoop(currentTime)
{
	deltaTime = (currentTime - lastTime) / primeDeltaTime;
	lastTime = currentTime;
	context.clearRect(0, 0, canvas.width, canvas.height);
	imageData = context.createImageData(canvas.width, canvas.height);
	colorBuffer = imageData.data;
	colorBuffer.set(gridColorBuffer);
	updatePaddlePosition();
	updateBallPosition(2.5);
	drawAntagonist(255, 255, 255);
	drawBall();
	drawPadel(255, 255, 255);
	context.putImageData(imageData, 0, 0);
	if (currentMatch.scorePlayer1 != winnerScore && currentMatch.scorePlayer2 != winnerScore) {
		displayScore();
		requestAnimationFrame(gameLoop);
	}
	else {
		if (currentMatch.scorePlayer1 > currentMatch.scorePlayer2)
			displayResult(currentMatch.usernamePlayer1, currentMatch.idPlayer1);
		else
			displayResult(currentMatch.usernamePlayer2, currentMatch.idPlayer2);
		displayEOGMenu();
		currentMatch.scorePlayer1 = 0;
		currentMatch.scorePlayer2 = 0;
	}
}

function gameLoopPvp(currentTime)
{
	deltaTime = (currentTime - lastTime) / primeDeltaTime;
	lastTime = currentTime;
	context.clearRect(0, 0, canvas.width, canvas.height);
	imageData = context.createImageData(canvas.width, canvas.height);
	colorBuffer = imageData.data;
	colorBuffer.set(gridColorBuffer);
	updatePaddlePositionPvp();
	updateBallPosition(4);
	/*Player*/
	drawAntagonist(255, 255, 255);
	drawBall();
	drawPadel(255, 255, 255);
	/*Antagoniste*/
	drawAntagonistPvp(255, 255, 255);
	drawBallPvp();
	drawPadelPvp(255, 255, 255);
	context.putImageData(imageData, 0, 0);
	if (currentMatch.scorePlayer1 != winnerScore && currentMatch.scorePlayer2 != winnerScore)
	{
		displayScore();
		requestAnimationFrame(gameLoopPvp);
	}
	else {
		if (currentMatch.scorePlayer1 > currentMatch.scorePlayer2) {
			displayResult(currentMatch.usernamePlayer1, currentMatch.idPlayer1);
			recordMatch(currentMatch.idPlayer1, currentMatch.idPlayer2, currentMatch.scorePlayer1, currentMatch.scorePlayer2, currentMatch.idPlayer1);
		}
		else {
			displayResult(currentMatch.usernamePlayer2, currentMatch.idPlayer2);
			recordMatch(currentMatch.idPlayer1, currentMatch.idPlayer2, currentMatch.scorePlayer1, currentMatch.scorePlayer2, currentMatch.idPlayer2);
		}
		currentMatch.scorePlayer1 = 0;
		currentMatch.scorePlayer2 = 0;
		displayEOGMenu();
	}
}

/*initDeltaTime*/

function initDeltaTimePvp(currentTime)
{
	lastTime = currentTime;
	if (currentTime === undefined)
		requestAnimationFrame(initDeltaTimePvp);
	else
		requestAnimationFrame(gameLoopPvp);
}

function initDeltaTime(currentTime)
{
	lastTime = currentTime;
	if (currentTime === undefined)
		requestAnimationFrame(initDeltaTime);
	else
		requestAnimationFrame(gameLoop);
}

/*Remove nodes*/

function rmStartNode()
{
	grid3D = [];
	ball3D = [];
	padel3D = [];
	globaleScale = 310;
	zGridOffset = 6;
	yGridOffset = 4.2;
	MID_WIDTH = canvas.width / 2;
	zBall = zPadel;
	zBallPvp = zAntagonist;
	xBall = 0;
	xPadelPlayer = 0;
	xAntagonist = 0;
	zVelocity = ballSpeed;
	currentMatch.scorePlayer1 = 0;
	currentMatch.scorePlayer2 = 0;
	currentMatch.bot = true;
	winnerScore = document.getElementById("customVictoryValue").value;
	create3Dgrid(customMapNb);
	create3Dpadel();
	create3Dball();
	displayBotInfo();
	DisplayGame();
	initDeltaTime();
}

function rmStartNodePvp()
{
	grid3D = [];
	ball3D = [];
	padel3D = [];
	globaleScale = 310 / 1.2;
	zGridOffset = 6 * 1.25;
	yGridOffset = 4.2 * 1.7;
	MID_WIDTH = canvas.width / 4;
	zBall = zPadel;
	zBallPvp = zAntagonist;
	xBall = 0;
	zVelocity = ballSpeed;
	currentMatch.scorePlayer1 = 0;
	currentMatch.scorePlayer2 = 0;
	xPadelPlayer = 0;
	xAntagonist = 0;
	create3Dpadel();
	create3Dball();
	create3Dgrid(customMapNb);
	create3DgridPvp(customMapNb);
	currentMatch.bot = false;
	winnerScore = document.getElementById("customVictoryValue").value;
	displayMatchInfo();
	DisplayGame();
	initDeltaTimePvp();
}
/*----------Main----------*/
// Événement keydown : ajouter la touche enfoncée
document.addEventListener('keydown', function(event){
    keysPressed[event.key] = true;
});
// Événement keyup : supprimer la touche lorsqu'elle est relâchée
document.addEventListener('keyup', function(event) {
    keysPressed[event.key] = false;
})
