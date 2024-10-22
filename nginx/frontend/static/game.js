/*------Game Switch-----*/
var breakout = false;

/*-----Wave effect-----*/
var effectEnabled = false; //true; //false;
var lightWave = true; //true; //false;
var lightIntensity = 1; //default lightIntensity = 1;
var score = 0;

/*-----2D-----*/
var init = false;
var canvas = document.getElementById("canvas-id");
//const canvas_ = document.getElementById("canvas-2d");
//const context = canvas_.getContext("2d");

/***************************************************************************************/
// Initialisation du renderer avec le canvas 3D
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(canvas.width, canvas.height);

// Création des buffers
const colorBuffer = new Uint8Array(canvas.width * canvas.height * 4);
const gridColorBuffer = new Uint8ClampedArray(canvas.width * canvas.height * 4);

// Création des textures à partir des buffers
const colorTexture = new THREE.DataTexture(colorBuffer, canvas.width, canvas.height, THREE.RGBAFormat);
const gridTexture = new THREE.DataTexture(gridColorBuffer, canvas.width, canvas.height, THREE.RGBAFormat);
colorTexture.needsUpdate = true;
gridTexture.needsUpdate = true;

//Creation du shader de mon 'ecran'.
var material = null;
var mesh = null;
var scene = null;

function updateMaterialShader() {
	material = new THREE.ShaderMaterial({
		uniforms: {
			colorMap: { value: colorTexture },
			time: { value: 0.0 },  // Ajout de l'uniform pour l'animation
			chromaticShift: { value: 0.005},
			effectEnabled: { value: effectEnabled }, // Pour activer ou désactiver l'effet de vagues
			score: { value: score }, // aberration chromatique
			lightIntensity: { value: lightIntensity } // Uniform pour la brillance
		},
		vertexShader: `
		  varying vec2 vUv;
		  void main() {
			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
		  }
		`,
		fragmentShader: `
		  uniform sampler2D colorMap;
		  uniform bool effectEnabled; // Uniform pour activer ou désactiver l'effet de vagues
		  uniform bool score; // aberration chromatique
		  uniform float time; // Uniform pour le temps
		  uniform float lightIntensity; // Uniform pour simuler la brillance
		  uniform float chromaticShift; // Facteur de décalage avec une fréquence de variation
		  varying vec2 vUv;

		  void main() {
			vec2 uv = vUv;

			// Ajout d'une distorsion dynamique
			if (effectEnabled) {
			  uv.x += sin(uv.y * 10.0 + time * 5.0) * 0.02; // Déplacement en vague sur l'axe X
			  uv.y += sin(uv.x * 10.0 + time * 3.0) * 0.02; // Déplacement en vague sur l'axe Y
			}
			vec4 color = texture(colorMap, uv);
			if (score) {
				// Utilisation d'une sinusoïde pour faire varier l'intensité de l'aberration chromatique
				color.r = texture(colorMap, uv + vec2(chromaticShift, 0.0)).r;  // Décalage rouge
				color.g = texture(colorMap, uv + vec2(-chromaticShift, 0.0)).g; // Décalage vert
				color.b = texture(colorMap, uv + vec2(0.0, chromaticShift)).b;  // Décalage bleu
			}
			// Simuler la brillance en augmentant l'intensité lumineuse
			color.rgb *= lightIntensity;

			gl_FragColor = color;
		  }
		`
	});
	mesh = new THREE.Mesh(geometry, material);
	mesh.rotation.z = Math.PI;
	// Création d'une scène et ajout du mesh
	scene = new THREE.Scene();
	scene.add(mesh);
}

// Création d'une géométrie pleine écran
const geometry = new THREE.PlaneGeometry(2, 2);

// Ajout d'une caméra orthographique (pleine écran)
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

/***************************************************************************************/
var BUFFER_SIZE = canvas.width * canvas.height * 4;
var RED_SIDE_SIZE = canvas.width / 2;
var GREEN_SIDE_SIZE = canvas.width;
var frameId = 0;
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
var rp = 240;
var gp = 240;
var bp = 240;

/*Ball*/
var ballSize = 0.15;
var xBall = 0;
var zBall = zPadel;
var zBallPvp = zAntagonist;
var ballScaler = 1; //experimental.
var rb = 100;
var gb = 100;
var bb = 100;
/*Screen Space*/
var MID_WIDTH = canvas.width / 2;
var MID_WIDTHPvp = (canvas.width / 4) * 3;
var MID_HEIGHT = canvas.height / 3;
/*Model Space*/
var grid3D = [];
var padel3D = [];
var ball3D = [];
var ball3D2 = [];
var obstacle3D = [];
/*-----Limites Terrain-----*/
var ZMAX = 22;
var ZMAX_ = 22;
var ZMIN = 1;
var XMAX = 7;
var XMIN = -7;
/*-----Balle speed-----*/
var ballSpeed = 0.2;
var xVelocity = 0.01;
var zVelocity = ballSpeed;
/*-----Input-----*/
var keysPressed = {};
/*-----Score-----*/
var playerMalus = 0;
var player2Malus = 0;
var winnerScore = 5;
/*-----SYNC-----*/
var lastTime = 0;
var deltaTime = 0;
var primeDeltaTime = 17;
var skipFirstCall = 0;
/*-----Map-----*/
//var map = 1
/*-----Obstacle-----*/
var obstacleWidth = 0.5;
var obstacleHeight = 0.2;
var obstacleSize = 3;

/*-----Breakout-----*/
/*Ball2*/
var xBall2 = 0;
var zBall2 = zPadel;
/*Padel2*/
var xPadelPlayer2 = 0;
/*-----Balle speed-----*/
var xVelocity2 = 0.01;
var zVelocity2 = ballSpeed;
/*-----Model Space-----*/
var brick3D = [];
var brickWall = [];
var brickWall2 = [];
/*Brick*/
var brickHeight = 0.2;
var brickWidth = 1.5;
var brickSize = 0.5;

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


function createBrickWall2()
{
	brickWall2.push({x: 2 + XMAX/2 , z: ZMAX_ / 2 - obstacleSize + 0.5});
	brickWall2.push({x: 2 + XMAX/2 , z: ZMAX_ / 2 - obstacleSize + 1.5});
	brickWall2.push({x: 2 + XMAX/2 , z: ZMAX_ / 2 - obstacleSize + 2.5});
	brickWall2.push({x: 2 + XMAX/2 , z: ZMAX_ / 2 - obstacleSize + 3.5});
	brickWall2.push({x: 2 + XMAX/2 , z: ZMAX_ / 2 - obstacleSize + 4.5});
	brickWall2.push({x: 2 + XMAX/2 , z: ZMAX_ / 2 - obstacleSize + 5.5});

	brickWall2.push({x: -2 - XMAX/2 , z: ZMAX_ / 2 - obstacleSize + 0.5});
	brickWall2.push({x: -2 - XMAX/2 , z: ZMAX_ / 2 - obstacleSize + 1.5});
	brickWall2.push({x: -2 - XMAX/2 , z: ZMAX_ / 2 - obstacleSize + 2.5});
	brickWall2.push({x: -2 - XMAX/2 , z: ZMAX_ / 2 - obstacleSize + 3.5});
	brickWall2.push({x: -2 - XMAX/2 , z: ZMAX_ / 2 - obstacleSize + 4.5});
	brickWall2.push({x: -2 - XMAX/2 , z: ZMAX_ / 2 - obstacleSize + 5.5});

	brickWall2.push({x: 1.5, z: ZMAX_ / 2 - obstacleSize + 0.5});
	brickWall2.push({x: 1.5, z: ZMAX_ / 2 - obstacleSize + 1.5});
	brickWall2.push({x: 1.5, z: ZMAX_ / 2 - obstacleSize + 2.5});
	brickWall2.push({x: 1.5, z: ZMAX_ / 2 - obstacleSize + 3.5});
	brickWall2.push({x: 1.5, z: ZMAX_ / 2 - obstacleSize + 4.5});
	brickWall2.push({x: 1.5, z: ZMAX_ / 2 - obstacleSize + 5.5});

	brickWall2.push({x: -1.5, z: ZMAX_ / 2 - obstacleSize + 0.5});
	brickWall2.push({x: -1.5, z: ZMAX_ / 2 - obstacleSize + 1.5});
	brickWall2.push({x: -1.5, z: ZMAX_ / 2 - obstacleSize + 2.5});
	brickWall2.push({x: -1.5, z: ZMAX_ / 2 - obstacleSize + 3.5});
	brickWall2.push({x: -1.5, z: ZMAX_ / 2 - obstacleSize + 4.5});
	brickWall2.push({x: -1.5, z: ZMAX_ / 2 - obstacleSize + 5.5});
}

function createBrickWall()
{
	brickWall.push({x: 2 + XMAX/2 , z: ZMAX_ / 2 - obstacleSize + 0.5});
	brickWall.push({x: 2 + XMAX/2 , z: ZMAX_ / 2 - obstacleSize + 1.5});
	brickWall.push({x: 2 + XMAX/2 , z: ZMAX_ / 2 - obstacleSize + 2.5});
	brickWall.push({x: 2 + XMAX/2 , z: ZMAX_ / 2 - obstacleSize + 3.5});
	brickWall.push({x: 2 + XMAX/2 , z: ZMAX_ / 2 - obstacleSize + 4.5});
	brickWall.push({x: 2 + XMAX/2 , z: ZMAX_ / 2 - obstacleSize + 5.5});

	brickWall.push({x: -2 - XMAX/2 , z: ZMAX_ / 2 - obstacleSize + 0.5});
	brickWall.push({x: -2 - XMAX/2 , z: ZMAX_ / 2 - obstacleSize + 1.5});
	brickWall.push({x: -2 - XMAX/2 , z: ZMAX_ / 2 - obstacleSize + 2.5});
	brickWall.push({x: -2 - XMAX/2 , z: ZMAX_ / 2 - obstacleSize + 3.5});
	brickWall.push({x: -2 - XMAX/2 , z: ZMAX_ / 2 - obstacleSize + 4.5});
	brickWall.push({x: -2 - XMAX/2 , z: ZMAX_ / 2 - obstacleSize + 5.5});

	brickWall.push({x: 1.5, z: ZMAX_ / 2 - obstacleSize + 0.5});
	brickWall.push({x: 1.5, z: ZMAX_ / 2 - obstacleSize + 1.5});
	brickWall.push({x: 1.5, z: ZMAX_ / 2 - obstacleSize + 2.5});
	brickWall.push({x: 1.5, z: ZMAX_ / 2 - obstacleSize + 3.5});
	brickWall.push({x: 1.5, z: ZMAX_ / 2 - obstacleSize + 4.5});
	brickWall.push({x: 1.5, z: ZMAX_ / 2 - obstacleSize + 5.5});

	brickWall.push({x: -1.5, z: ZMAX_ / 2 - obstacleSize + 0.5});
	brickWall.push({x: -1.5, z: ZMAX_ / 2 - obstacleSize + 1.5});
	brickWall.push({x: -1.5, z: ZMAX_ / 2 - obstacleSize + 2.5});
	brickWall.push({x: -1.5, z: ZMAX_ / 2 - obstacleSize + 3.5});
	brickWall.push({x: -1.5, z: ZMAX_ / 2 - obstacleSize + 4.5});
	brickWall.push({x: -1.5, z: ZMAX_ / 2 - obstacleSize + 5.5});
}

function create3Dbrick()
{
	brick3D.push({x: -brickWidth, y: brickHeight, z: -brickSize});
	brick3D.push({x: brickWidth, y: brickHeight, z: -brickSize});
	brick3D.push({x: brickWidth, y: -brickHeight, z: -brickSize});
	brick3D.push({x: -brickWidth, y: -brickHeight, z: -brickSize});
	brick3D.push({x: -brickWidth, y: brickHeight, z: brickSize});
	brick3D.push({x: brickWidth, y: brickHeight, z: brickSize});
	brick3D.push({x: brickWidth, y: -brickHeight, z: brickSize});
	brick3D.push({x: -brickWidth, y: -brickHeight, z: brickSize});
}

function create3Dobstacle(pvp, breakout)
{
	obstacle3D.push({x: -obstacleWidth, y: obstacleHeight, z: -obstacleSize});
	obstacle3D.push({x: obstacleWidth, y: obstacleHeight, z: -obstacleSize});
	obstacle3D.push({x: obstacleWidth, y: -obstacleHeight, z: -obstacleSize});
	obstacle3D.push({x: -obstacleWidth, y: -obstacleHeight, z: -obstacleSize});
	obstacle3D.push({x: -obstacleWidth, y: obstacleHeight, z: obstacleSize});
	obstacle3D.push({x: obstacleWidth, y: obstacleHeight, z: obstacleSize});
	obstacle3D.push({x: obstacleWidth, y: -obstacleHeight, z: obstacleSize});
	obstacle3D.push({x: -obstacleWidth, y: -obstacleHeight, z: obstacleSize});
	drawObstacle();
	if (pvp == 1 && breakout == 0)
		drawObstaclePvp();
	else if (pvp == 1 && breakout == 1)
		drawObstaclePvpBreakout();
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

function create3Dball2()
{
	ball3D2.push({ x: -ballSize, y: -ballSize, z: -ballSize});
	ball3D2.push({ x: -ballSize, y: ballSize, z: -ballSize});
	ball3D2.push({ x: ballSize, y: ballSize, z: -ballSize});
	ball3D2.push({ x: ballSize, y: -ballSize, z: -ballSize});
	ball3D2.push({ x: -ballSize, y: -ballSize, z: ballSize});
	ball3D2.push({ x: -ballSize, y: ballSize, z: ballSize});
	ball3D2.push({ x: ballSize, y: ballSize, z: ballSize});
	ball3D2.push({ x: ballSize, y: -ballSize, z: ballSize});
}

/*Projection*/

function projectBrickWallLine(i, j, xB, zB, xOff, r, g , b)
{
	let x= 0;
	let y = 0;
	let x0 = 0;
	let y0 = 0;
	let x1 = 0;
	let y1 = 0;

	x = ((brick3D[i].x + xB) / (brick3D[i].z + zB + zGridOffset)) * globaleScale;
	y = ((brick3D[i].y + yGridOffset - brickHeight) / (brick3D[i].z + zB + zGridOffset)) * globaleScale;
	x0 = Math.floor(x + xOff);
	y0 = Math.floor(y + MID_HEIGHT);
	x = ((brick3D[j].x + xB) / (brick3D[j].z + zB + zGridOffset)) * globaleScale;
	y = ((brick3D[j].y + yGridOffset - brickHeight) / (brick3D[j].z + zB + zGridOffset)) * globaleScale;
	x1 = Math.floor(x + xOff);
	y1 = Math.floor(y + MID_HEIGHT);
	if ((x0 > 0 && x0 < canvas.width && y0 > 0 && y0 < canvas.height
			&& x1 > 0 && x1 < canvas.width && y1 > 0 && y1 < canvas.height))
			drawLineDDA(colorBuffer, x0, y0, x1, y1, r, g , b, 255);
}

function projectObstacleLine(i, j, xB, zB, xOff, r, g , b)
{
	let x= 0;
	let y = 0;
	let x0 = 0;
	let y0 = 0;
	let x1 = 0;
	let y1 = 0;

	x = ((obstacle3D[i].x + xB) / (obstacle3D[i].z + zB + zGridOffset)) * globaleScale;
	y = ((obstacle3D[i].y + yGridOffset - obstacleHeight) / (obstacle3D[i].z + zB + zGridOffset)) * globaleScale;
	x0 = Math.floor(x + xOff);
	y0 = Math.floor(y + MID_HEIGHT);
	x = ((obstacle3D[j].x + xB) / (obstacle3D[j].z + zB + zGridOffset)) * globaleScale;
	y = ((obstacle3D[j].y + yGridOffset - obstacleHeight) / (obstacle3D[j].z + zB + zGridOffset)) * globaleScale;
	x1 = Math.floor(x + xOff);
	y1 = Math.floor(y + MID_HEIGHT);
	if ((x0 > 0 && x0 < canvas.width && y0 > 0 && y0 < canvas.height
			&& x1 > 0 && x1 < canvas.width && y1 > 0 && y1 < canvas.height))
			drawLineDDA(gridColorBuffer, x0, y0, x1, y1, r, g , b, 255);
}

function projectBallLine(i, j, xB, zB, xOff, r, g , b, model)
{
	let x= 0;
	let y = 0;
	let x0 = 0;
	let y0 = 0;
	let x1 = 0;
	let y1 = 0;

	x = ((model[i].x + xB) / (model[i].z + zB + zGridOffset)) * globaleScale;
	y = ((model[i].y + yGridOffset - ballSize) / (model[i].z + zB + zGridOffset)) * globaleScale;
	x0 = Math.floor(x + xOff);
	y0 = Math.floor(y + MID_HEIGHT);
	x = ((model[j].x + xB) / (model[j].z + zB + zGridOffset)) * globaleScale;
	y = ((model[j].y + yGridOffset - ballSize) / (model[j].z + zB + zGridOffset)) * globaleScale;
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

function drawBrickWall()
{
	let r = 0;
	let g = 100;
	let b = 0;

	for (let i = 0; i < brickWall.length; ++i)
	{
		projectBrickWallLine(0, 1, brickWall[i].x, brickWall[i].z, MID_WIDTH, r, g , b);
		projectBrickWallLine(1, 2, brickWall[i].x, brickWall[i].z, MID_WIDTH, r, g , b);
		projectBrickWallLine(2, 3, brickWall[i].x, brickWall[i].z, MID_WIDTH, r, g , b);
		projectBrickWallLine(3, 0, brickWall[i].x, brickWall[i].z, MID_WIDTH, r, g , b);

		projectBrickWallLine(4, 5, brickWall[i].x, brickWall[i].z, MID_WIDTH, r, g , b);
		projectBrickWallLine(5, 6, brickWall[i].x, brickWall[i].z, MID_WIDTH, r, g , b);
		projectBrickWallLine(6, 7, brickWall[i].x, brickWall[i].z, MID_WIDTH, r, g , b);
		projectBrickWallLine(7, 4, brickWall[i].x, brickWall[i].z, MID_WIDTH, r, g , b);

		projectBrickWallLine(4, 0, brickWall[i].x, brickWall[i].z, MID_WIDTH, r, g , b);
		projectBrickWallLine(5, 1, brickWall[i].x, brickWall[i].z, MID_WIDTH, r, g , b);
		projectBrickWallLine(6, 2, brickWall[i].x, brickWall[i].z, MID_WIDTH, r, g , b);
		projectBrickWallLine(7, 3, brickWall[i].x, brickWall[i].z, MID_WIDTH, r, g , b);


		projectBrickWallLine(0, 1, brickWall[i].x, brickWall[i].z, MID_WIDTH, r, g , b);
		projectBrickWallLine(1, 2, brickWall[i].x, brickWall[i].z, MID_WIDTH, r, g , b);
		projectBrickWallLine(2, 3, brickWall[i].x, brickWall[i].z, MID_WIDTH, r, g , b);
		projectBrickWallLine(3, 0, brickWall[i].x, brickWall[i].z, MID_WIDTH, r, g , b);

		projectBrickWallLine(4, 5, brickWall[i].x, brickWall[i].z, MID_WIDTH, r, g , b);
		projectBrickWallLine(5, 6, brickWall[i].x, brickWall[i].z, MID_WIDTH, r, g , b);
		projectBrickWallLine(6, 7, brickWall[i].x, brickWall[i].z, MID_WIDTH, r, g , b);
		projectBrickWallLine(7, 4, brickWall[i].x, brickWall[i].z, MID_WIDTH, r, g , b);

		projectBrickWallLine(4, 0, brickWall[i].x, brickWall[i].z, MID_WIDTH, r, g , b);
		projectBrickWallLine(5, 1, brickWall[i].x, brickWall[i].z, MID_WIDTH, r, g , b);
		projectBrickWallLine(6, 2, brickWall[i].x, brickWall[i].z, MID_WIDTH, r, g , b);
		projectBrickWallLine(7, 3, brickWall[i].x, brickWall[i].z, MID_WIDTH, r, g , b);
	}
}

function drawBrickWall2()
{
	let r = 0;
	let g = 100;
	let b = 0;

	for (let i = 0; i < brickWall2.length; ++i)
	{
		projectBrickWallLine(0, 1, brickWall2[i].x, brickWall2[i].z, MID_WIDTHPvp, r, g , b);
		projectBrickWallLine(1, 2, brickWall2[i].x, brickWall2[i].z, MID_WIDTHPvp, r, g , b);
		projectBrickWallLine(2, 3, brickWall2[i].x, brickWall2[i].z, MID_WIDTHPvp, r, g , b);
		projectBrickWallLine(3, 0, brickWall2[i].x, brickWall2[i].z, MID_WIDTHPvp, r, g , b);

		projectBrickWallLine(4, 5, brickWall2[i].x, brickWall2[i].z, MID_WIDTHPvp, r, g , b);
		projectBrickWallLine(5, 6, brickWall2[i].x, brickWall2[i].z, MID_WIDTHPvp, r, g , b);
		projectBrickWallLine(6, 7, brickWall2[i].x, brickWall2[i].z, MID_WIDTHPvp, r, g , b);
		projectBrickWallLine(7, 4, brickWall2[i].x, brickWall2[i].z, MID_WIDTHPvp, r, g , b);

		projectBrickWallLine(4, 0, brickWall2[i].x, brickWall2[i].z, MID_WIDTHPvp, r, g , b);
		projectBrickWallLine(5, 1, brickWall2[i].x, brickWall2[i].z, MID_WIDTHPvp, r, g , b);
		projectBrickWallLine(6, 2, brickWall2[i].x, brickWall2[i].z, MID_WIDTHPvp, r, g , b);
		projectBrickWallLine(7, 3, brickWall2[i].x, brickWall2[i].z, MID_WIDTHPvp, r, g , b);


		projectBrickWallLine(0, 1, brickWall2[i].x, brickWall2[i].z, MID_WIDTHPvp, r, g , b);
		projectBrickWallLine(1, 2, brickWall2[i].x, brickWall2[i].z, MID_WIDTHPvp, r, g , b);
		projectBrickWallLine(2, 3, brickWall2[i].x, brickWall2[i].z, MID_WIDTHPvp, r, g , b);
		projectBrickWallLine(3, 0, brickWall2[i].x, brickWall2[i].z, MID_WIDTHPvp, r, g , b);

		projectBrickWallLine(4, 5, brickWall2[i].x, brickWall2[i].z, MID_WIDTHPvp, r, g , b);
		projectBrickWallLine(5, 6, brickWall2[i].x, brickWall2[i].z, MID_WIDTHPvp, r, g , b);
		projectBrickWallLine(6, 7, brickWall2[i].x, brickWall2[i].z, MID_WIDTHPvp, r, g , b);
		projectBrickWallLine(7, 4, brickWall2[i].x, brickWall2[i].z, MID_WIDTHPvp, r, g , b);

		projectBrickWallLine(4, 0, brickWall2[i].x, brickWall2[i].z, MID_WIDTHPvp, r, g , b);
		projectBrickWallLine(5, 1, brickWall2[i].x, brickWall2[i].z, MID_WIDTHPvp, r, g , b);
		projectBrickWallLine(6, 2, brickWall2[i].x, brickWall2[i].z, MID_WIDTHPvp, r, g , b);
		projectBrickWallLine(7, 3, brickWall2[i].x, brickWall2[i].z, MID_WIDTHPvp, r, g , b);
	}
}

function drawObstaclePvpBreakout()
{
	let r = 0;
	let g = 100;
	let b = 100;

	projectObstacleLine(0, 1, XMAX/2, ZMAX_/2, MID_WIDTHPvp, r, g , b);
	projectObstacleLine(1, 2, XMAX/2, ZMAX_/2, MID_WIDTHPvp, r, g , b);
	projectObstacleLine(2, 3, XMAX/2, ZMAX_/2, MID_WIDTHPvp, r, g , b);
	projectObstacleLine(3, 0, XMAX/2, ZMAX_/2, MID_WIDTHPvp, r, g , b);

	projectObstacleLine(4, 5, XMAX/2, ZMAX_/2, MID_WIDTHPvp, r, g , b);
	projectObstacleLine(5, 6, XMAX/2, ZMAX_/2, MID_WIDTHPvp, r, g , b);
	projectObstacleLine(6, 7, XMAX/2, ZMAX_/2, MID_WIDTHPvp, r, g , b);
	projectObstacleLine(7, 4, XMAX/2, ZMAX_/2, MID_WIDTHPvp, r, g , b);

	projectObstacleLine(4, 0, XMAX/2, ZMAX_/2, MID_WIDTHPvp, r, g , b);
	projectObstacleLine(5, 1, XMAX/2, ZMAX_/2, MID_WIDTHPvp, r, g , b);
	projectObstacleLine(6, 2, XMAX/2, ZMAX_/2, MID_WIDTHPvp, r, g , b);
	projectObstacleLine(7, 3, XMAX/2, ZMAX_/2, MID_WIDTHPvp, r, g , b);


	projectObstacleLine(0, 1, -XMAX/2, ZMAX_/2, MID_WIDTHPvp, r, g , b);
	projectObstacleLine(1, 2, -XMAX/2, ZMAX_/2, MID_WIDTHPvp, r, g , b);
	projectObstacleLine(2, 3, -XMAX/2, ZMAX_/2, MID_WIDTHPvp, r, g , b);
	projectObstacleLine(3, 0, -XMAX/2, ZMAX_/2, MID_WIDTHPvp, r, g , b);

	projectObstacleLine(4, 5, -XMAX/2, ZMAX_/2, MID_WIDTHPvp, r, g , b);
	projectObstacleLine(5, 6, -XMAX/2, ZMAX_/2, MID_WIDTHPvp, r, g , b);
	projectObstacleLine(6, 7, -XMAX/2, ZMAX_/2, MID_WIDTHPvp, r, g , b);
	projectObstacleLine(7, 4, -XMAX/2, ZMAX_/2, MID_WIDTHPvp, r, g , b);

	projectObstacleLine(4, 0, -XMAX/2, ZMAX_/2, MID_WIDTHPvp, r, g , b);
	projectObstacleLine(5, 1, -XMAX/2, ZMAX_/2, MID_WIDTHPvp, r, g , b);
	projectObstacleLine(6, 2, -XMAX/2, ZMAX_/2, MID_WIDTHPvp, r, g , b);
	projectObstacleLine(7, 3, -XMAX/2, ZMAX_/2, MID_WIDTHPvp, r, g , b);
}

function drawObstaclePvp()
{
	let x0 = 0;
	let y0 = 0;
	let x1 = 0;
	let y1 = 0;
	let r = 0;
	let g = 100;
	let b = 100;

	projectObstacleLine(0, 1, XMAX/2, ZMAX_/2 + 1, MID_WIDTHPvp, r, g , b);
	projectObstacleLine(1, 2, XMAX/2, ZMAX_/2 + 1, MID_WIDTHPvp, r, g , b);
	projectObstacleLine(2, 3, XMAX/2, ZMAX_/2 + 1, MID_WIDTHPvp, r, g , b);
	projectObstacleLine(3, 0, XMAX/2, ZMAX_/2 + 1, MID_WIDTHPvp, r, g , b);

	projectObstacleLine(4, 5, XMAX/2, ZMAX_/2 + 1, MID_WIDTHPvp, r, g , b);
	projectObstacleLine(5, 6, XMAX/2, ZMAX_/2 + 1, MID_WIDTHPvp, r, g , b);
	projectObstacleLine(6, 7, XMAX/2, ZMAX_/2 + 1, MID_WIDTHPvp, r, g , b);
	projectObstacleLine(7, 4, XMAX/2, ZMAX_/2 + 1, MID_WIDTHPvp, r, g , b);

	projectObstacleLine(4, 0, XMAX/2, ZMAX_/2 + 1, MID_WIDTHPvp, r, g , b);
	projectObstacleLine(5, 1, XMAX/2, ZMAX_/2 + 1, MID_WIDTHPvp, r, g , b);
	projectObstacleLine(6, 2, XMAX/2, ZMAX_/2 + 1, MID_WIDTHPvp, r, g , b);
	projectObstacleLine(7, 3, XMAX/2, ZMAX_/2 + 1, MID_WIDTHPvp, r, g , b);


	projectObstacleLine(0, 1, -XMAX/2, ZMAX_/2 + 1, MID_WIDTHPvp, r, g , b);
	projectObstacleLine(1, 2, -XMAX/2, ZMAX_/2 + 1, MID_WIDTHPvp, r, g , b);
	projectObstacleLine(2, 3, -XMAX/2, ZMAX_/2 + 1, MID_WIDTHPvp, r, g , b);
	projectObstacleLine(3, 0, -XMAX/2, ZMAX_/2 + 1, MID_WIDTHPvp, r, g , b);

	projectObstacleLine(4, 5, -XMAX/2, ZMAX_/2 + 1, MID_WIDTHPvp, r, g , b);
	projectObstacleLine(5, 6, -XMAX/2, ZMAX_/2 + 1, MID_WIDTHPvp, r, g , b);
	projectObstacleLine(6, 7, -XMAX/2, ZMAX_/2 + 1, MID_WIDTHPvp, r, g , b);
	projectObstacleLine(7, 4, -XMAX/2, ZMAX_/2 + 1, MID_WIDTHPvp, r, g , b);

	projectObstacleLine(4, 0, -XMAX/2, ZMAX_/2 + 1, MID_WIDTHPvp, r, g , b);
	projectObstacleLine(5, 1, -XMAX/2, ZMAX_/2 + 1, MID_WIDTHPvp, r, g , b);
	projectObstacleLine(6, 2, -XMAX/2, ZMAX_/2 + 1, MID_WIDTHPvp, r, g , b);
	projectObstacleLine(7, 3, -XMAX/2, ZMAX_/2 + 1, MID_WIDTHPvp, r, g , b);
}

function drawObstacle()
{
	let x0 = 0;
	let y0 = 0;
	let x1 = 0;
	let y1 = 0;
	let r = 0;
	let g = 100;
	let b = 100;

	projectObstacleLine(0, 1, XMAX/2, ZMAX_/2, MID_WIDTH, r, g , b);
	projectObstacleLine(1, 2, XMAX/2, ZMAX_/2, MID_WIDTH, r, g , b);
	projectObstacleLine(2, 3, XMAX/2, ZMAX_/2, MID_WIDTH, r, g , b);
	projectObstacleLine(3, 0, XMAX/2, ZMAX_/2, MID_WIDTH, r, g , b);

	projectObstacleLine(4, 5, XMAX/2, ZMAX_/2, MID_WIDTH, r, g , b);
	projectObstacleLine(5, 6, XMAX/2, ZMAX_/2, MID_WIDTH, r, g , b);
	projectObstacleLine(6, 7, XMAX/2, ZMAX_/2, MID_WIDTH, r, g , b);
	projectObstacleLine(7, 4, XMAX/2, ZMAX_/2, MID_WIDTH, r, g , b);

	projectObstacleLine(4, 0, XMAX/2, ZMAX_/2, MID_WIDTH, r, g , b);
	projectObstacleLine(5, 1, XMAX/2, ZMAX_/2, MID_WIDTH, r, g , b);
	projectObstacleLine(6, 2, XMAX/2, ZMAX_/2, MID_WIDTH, r, g , b);
	projectObstacleLine(7, 3, XMAX/2, ZMAX_/2, MID_WIDTH, r, g , b);


	projectObstacleLine(0, 1, -XMAX/2, ZMAX_/2, MID_WIDTH, r, g , b);
	projectObstacleLine(1, 2, -XMAX/2, ZMAX_/2, MID_WIDTH, r, g , b);
	projectObstacleLine(2, 3, -XMAX/2, ZMAX_/2, MID_WIDTH, r, g , b);
	projectObstacleLine(3, 0, -XMAX/2, ZMAX_/2, MID_WIDTH, r, g , b);

	projectObstacleLine(4, 5, -XMAX/2, ZMAX_/2, MID_WIDTH, r, g , b);
	projectObstacleLine(5, 6, -XMAX/2, ZMAX_/2, MID_WIDTH, r, g , b);
	projectObstacleLine(6, 7, -XMAX/2, ZMAX_/2, MID_WIDTH, r, g , b);
	projectObstacleLine(7, 4, -XMAX/2, ZMAX_/2, MID_WIDTH, r, g , b);

	projectObstacleLine(4, 0, -XMAX/2, ZMAX_/2, MID_WIDTH, r, g , b);
	projectObstacleLine(5, 1, -XMAX/2, ZMAX_/2, MID_WIDTH, r, g , b);
	projectObstacleLine(6, 2, -XMAX/2, ZMAX_/2, MID_WIDTH, r, g , b);
	projectObstacleLine(7, 3, -XMAX/2, ZMAX_/2, MID_WIDTH, r, g , b);
}

function drawBallPvp()
{
	let x0 = 0;
	let y0 = 0;
	let x1 = 0;
	let y1 = 0;
	let rbTmp = rb;
	let gbTmp = gb;
	let bbTmp = bb;

	if (zBall <= ZMIN || zBall >= ZMAX)
	{
		rb = 255;
		gb = 0;
		bb = 0;
	}
	rotateY(ball3D, xBall * deltaTime);
	projectBallLine(0, 1, xBall, zBallPvp, MID_WIDTHPvp, rb, gb , bb, ball3D);
	projectBallLine(1, 2, xBall, zBallPvp, MID_WIDTHPvp, rb, gb , bb, ball3D);
	projectBallLine(2, 3, xBall, zBallPvp, MID_WIDTHPvp, rb, gb , bb, ball3D);
	projectBallLine(3, 0, xBall, zBallPvp, MID_WIDTHPvp, rb, gb , bb, ball3D);

	projectBallLine(4, 5, xBall, zBallPvp, MID_WIDTHPvp, rb, gb , bb, ball3D);
	projectBallLine(5, 6, xBall, zBallPvp, MID_WIDTHPvp, rb, gb , bb, ball3D);
	projectBallLine(6, 7, xBall, zBallPvp, MID_WIDTHPvp, rb, gb , bb, ball3D);
	projectBallLine(7, 4, xBall, zBallPvp, MID_WIDTHPvp, rb, gb , bb, ball3D);

	projectBallLine(4, 0, xBall, zBallPvp, MID_WIDTHPvp, rb, gb , bb, ball3D);
	projectBallLine(5, 1, xBall, zBallPvp, MID_WIDTHPvp, rb, gb , bb, ball3D);
	projectBallLine(6, 2, xBall, zBallPvp, MID_WIDTHPvp, rb, gb , bb, ball3D);
	projectBallLine(7, 3, xBall, zBallPvp, MID_WIDTHPvp, rb, gb , bb, ball3D);
	rb = rbTmp;
	gb = gbTmp;
	bb = bbTmp;
}

function drawBall()
{
	let x0 = 0;
	let y0 = 0;
	let x1 = 0;
	let y1 = 0;
	let rbTmp = rb;
	let gbTmp = gb;
	let bbTmp = bb;

	if (zBall <= ZMIN || zBall >= ZMAX && !breakout)
	{
		rb = 255;
		gb = 0;
		bb = 0;
	}
	rotateY(ball3D, xBall * deltaTime);
	projectBallLine(0, 1, xBall, zBall, MID_WIDTH, rb, gb , bb, ball3D);
	projectBallLine(1, 2, xBall, zBall, MID_WIDTH, rb, gb , bb, ball3D);
	projectBallLine(2, 3, xBall, zBall, MID_WIDTH, rb, gb , bb, ball3D);
	projectBallLine(3, 0, xBall, zBall, MID_WIDTH, rb, gb , bb, ball3D);

	projectBallLine(4, 5, xBall, zBall, MID_WIDTH, rb, gb , bb, ball3D);
	projectBallLine(5, 6, xBall, zBall, MID_WIDTH, rb, gb , bb, ball3D);
	projectBallLine(6, 7, xBall, zBall, MID_WIDTH, rb, gb , bb, ball3D);
	projectBallLine(7, 4, xBall, zBall, MID_WIDTH, rb, gb , bb, ball3D);

	projectBallLine(4, 0, xBall, zBall, MID_WIDTH, rb, gb , bb, ball3D);
	projectBallLine(5, 1, xBall, zBall, MID_WIDTH, rb, gb , bb, ball3D);
	projectBallLine(6, 2, xBall, zBall, MID_WIDTH, rb, gb , bb, ball3D);
	projectBallLine(7, 3, xBall, zBall, MID_WIDTH, rb, gb , bb, ball3D);
	rb = rbTmp;
	gb = gbTmp;
	bb = bbTmp;
}

function drawBall2()
{
	let x0 = 0;
	let y0 = 0;
	let x1 = 0;
	let y1 = 0;
	let rbTmp = rb;
	let gbTmp = gb;
	let bbTmp = bb;

	if (zBall2 <= ZMIN || zBall2 >= ZMAX && !breakout)
	{
		rb = 255;
		gb = 0;
		bb = 0;
	}
	rotateY(ball3D2, xBall2 * deltaTime);
	projectBallLine(0, 1, xBall2, zBall2, MID_WIDTHPvp, rb, gb , bb, ball3D2);
	projectBallLine(1, 2, xBall2, zBall2, MID_WIDTHPvp, rb, gb , bb, ball3D2);
	projectBallLine(2, 3, xBall2, zBall2, MID_WIDTHPvp, rb, gb , bb, ball3D2);
	projectBallLine(3, 0, xBall2, zBall2, MID_WIDTHPvp, rb, gb , bb, ball3D2);

	projectBallLine(4, 5, xBall2, zBall2, MID_WIDTHPvp, rb, gb , bb, ball3D2);
	projectBallLine(5, 6, xBall2, zBall2, MID_WIDTHPvp, rb, gb , bb, ball3D2);
	projectBallLine(6, 7, xBall2, zBall2, MID_WIDTHPvp, rb, gb , bb, ball3D2);
	projectBallLine(7, 4, xBall2, zBall2, MID_WIDTHPvp, rb, gb , bb, ball3D2);

	projectBallLine(4, 0, xBall2, zBall2, MID_WIDTHPvp, rb, gb , bb, ball3D2);
	projectBallLine(5, 1, xBall2, zBall2, MID_WIDTHPvp, rb, gb , bb, ball3D2);
	projectBallLine(6, 2, xBall2, zBall2, MID_WIDTHPvp, rb, gb , bb, ball3D2);
	projectBallLine(7, 3, xBall2, zBall2, MID_WIDTHPvp, rb, gb , bb, ball3D2);
	rb = rbTmp;
	gb = gbTmp;
	bb = bbTmp;
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

function drawPadel2(r, g, b)
{

	for (i = 0; i < 4; i += 2)
		projectPadelLine(colorBuffer, i, i + 1, zPadel, r, g, b, xPadelPlayer2, MID_WIDTHPvp);
	projectPadelLine(colorBuffer, 0, 3, zPadel, r, g, b, xPadelPlayer2, MID_WIDTHPvp);
	projectPadelLine(colorBuffer, 1, 2, zPadel, r, g, b, xPadelPlayer2, MID_WIDTHPvp);
	projectPadelLine(colorBuffer, 0, 2, zPadel, r, g, b, xPadelPlayer2, MID_WIDTHPvp);
	projectPadelLine(colorBuffer, 1, 3, zPadel, r, g, b, xPadelPlayer2, MID_WIDTHPvp);
}

/*Position Update*/
function updateBallPositionBreakout(rebound)
{
    // Mettre à jour la position de la balle en fonction de sa vitesse
    xBall += xVelocity;
	if (xBall > XMAX)
		xBall = XMAX;
	if (xBall < XMIN)
		xBall = XMIN;
	zBall += zVelocity;
	if (zBall > ZMAX + 0.5)
		zBall = ZMAX + 0.5;
	if (zBall < ZMIN - 0.5)
		zBall = ZMIN - 0.5;

    xBall2 += xVelocity2;
	if (xBall2 > XMAX)
		xBall2 = XMAX;
	if (xBall2 < XMIN)
		xBall2 = XMIN;
	zBall2 += zVelocity2;
	if (zBall2 > ZMAX + 0.5)
		zBall2 = ZMAX + 0.5;
	if (zBall2 < ZMIN - 0.5)
		zBall2 = ZMIN - 0.5;

//Malus Update
	if (zBall <= ZMIN - 0.5)
		++playerMalus;
    if (zBall2 <= ZMIN - 0.5)
		++player2Malus;

    // Vérifier les limites du terrain sur l'axe Z et X
	if (zBall >= ZMAX + 0.5 || zBall <= ZMIN - 0.5)
	{
        // Inverser la direction sur Z si on atteint les bords arrière
		zVelocity = -zVelocity;
		if (zBall <= ZMIN - 0.5)
		{
			//currentMatch.scorePlayer2 += 1;
			xVelocity /= 7;
		}
    }
    else if (xBall <= XMIN || xBall >= XMAX)
        xVelocity = -xVelocity;

	if (zBall2 >= ZMAX + 0.5 || zBall2 <= ZMIN - 0.5)
	{
		zVelocity2 = -zVelocity2;
		if (zBall2 <= ZMIN - 0.5)
		{
			//currentMatch.scorePlayer1 += 1;
			xVelocity2 /= 7;
		}
	}
	else if (xBall2 <= XMIN || xBall2 >= XMAX)
        xVelocity2 = -xVelocity2;

    // Vérifier les collision avec le brick wall.
	for (let i = 0; i < brickWall.length; ++i)
	{
		if ((zBall <= brickWall[i].z + brickSize && zBall >= brickWall[i].z - brickSize)
				&& (xBall <= brickWall[i].x + brickWidth && xBall >= brickWall[i].x - brickWidth))
		{
			xVelocity = -xVelocity;
			if ((Math.abs(zBall - (brickWall[i].z + brickSize)) <= 0.5 && zVelocity < 0) || (Math.abs(zBall - (brickWall[i].z - brickSize)) <= 0.5 && zVelocity > 0))
			{
				zVelocity = -zVelocity;
				xVelocity = -xVelocity;
			}
			brickWall.splice(i,1);
		}
	}
	for (let i = 0; i < brickWall2.length; ++i)
	{
		if ((zBall2 <= brickWall2[i].z + brickSize && zBall2 >= brickWall2[i].z - brickSize)
				&& (xBall2 <= brickWall2[i].x + brickWidth && xBall2 >= brickWall2[i].x - brickWidth))
		{
			xVelocity2 = -xVelocity2;
			if ((Math.abs(zBall2 - (brickWall2[i].z + brickSize)) <= 0.5 && zVelocity2 < 0) || (Math.abs(zBall2 - (brickWall2[i].z - brickSize)) <= 0.5 && zVelocity2 > 0))
			{
				zVelocity2 = -zVelocity2;
				xVelocity2 = -xVelocity2;
			}
			brickWall2.splice(i,1);
		}
	}
	currentMatch.scorePlayer1 = 24 - brickWall.length - playerMalus;
	currentMatch.scorePlayer2 =	24 - brickWall2.length - player2Malus;
    // Vérifier les collision avec les obstacles.
	if (customMapNb && (zBall <= ZMAX_ / 2 + obstacleSize && zBall >= ZMAX_ / 2 - obstacleSize)
		&& (xBall <= XMAX / 2 + obstacleWidth && xBall >= XMAX / 2 - obstacleWidth))
	{
		xVelocity = -xVelocity;
		if ((Math.abs(zBall - (ZMAX_ / 2 + obstacleSize)) <= 0.5 && zVelocity < 0) || (Math.abs(zBall - (ZMAX_ / 2 - obstacleSize)) <= 0.5 && zVelocity > 0))
		{
			zVelocity = -zVelocity;
			xVelocity = -xVelocity;
		}
	}
	if (customMapNb && (zBall <= ZMAX_ / 2 + obstacleSize && zBall >= ZMAX_ / 2 - obstacleSize)
		&& (xBall <= -XMAX / 2 + obstacleWidth && xBall >= -XMAX / 2 - obstacleWidth))
	{
		xVelocity = -xVelocity;
		if ((Math.abs(zBall - (ZMAX_ / 2 + obstacleSize)) <= 0.5 && zVelocity < 0) || (Math.abs(zBall - (ZMAX_ / 2 - obstacleSize)) <= 0.5 && zVelocity > 0))
		{
			zVelocity = -zVelocity;
			xVelocity = -xVelocity;
		}
	}

	if (customMapNb && (zBall2 <= ZMAX_ / 2 + obstacleSize && zBall2 >= ZMAX_ / 2 - obstacleSize)
		&& (xBall2 <= XMAX / 2 + obstacleWidth && xBall2 >= XMAX / 2 - obstacleWidth))
	{
		xVelocity2 = -xVelocity2;
		if ((Math.abs(zBall2 - (ZMAX_ / 2 + obstacleSize)) <= 0.5 && zVelocity2 < 0) || (Math.abs(zBall2 - (ZMAX_ / 2 - obstacleSize)) <= 0.5 && zVelocity2 > 0))
		{
			zVelocity2 = -zVelocity2;
			xVelocity2 = -xVelocity2;
		}
	}
	if (customMapNb && (zBall2 <= ZMAX_ / 2 + obstacleSize && zBall2 >= ZMAX_ / 2 - obstacleSize)
		&& (xBall2 <= -XMAX / 2 + obstacleWidth && xBall2 >= -XMAX / 2 - obstacleWidth))
	{
		xVelocity2 = -xVelocity2;
		if ((Math.abs(zBall2 - (ZMAX_ / 2 + obstacleSize)) <= 0.5 && zVelocity2 < 0) || (Math.abs(zBall2 - (ZMAX_ / 2 - obstacleSize)) <= 0.5 && zVelocity2 > 0))
		{
			zVelocity2 = -zVelocity2;
			xVelocity2 = -xVelocity2;
		}
	}

	//Collision avec le paddle joueur.
	if (zBall <= zPadel && zBall >= ZMIN + 0.5 && zVelocity < 0)
	{
		if ((xBall > xPadelPlayer - padelWidth || xBall + ballSize > xPadelPlayer - padelWidth)
				&& (xBall < xPadelPlayer + padelWidth || xBall - ballSize < xPadelPlayer + padelWidth))
		{
			//Inverser la direction sur Z si la balle touche le paddle
			zVelocity = -zVelocity;
			//Controle du rebond sur le padel
			xVelocity = ((xBall - xPadelPlayer) / rebound) * deltaTime;
		}
	}
	if (zBall2 <= zPadel && zBall2 >= ZMIN + 0.5 && zVelocity2 < 0)
	{
		if ((xBall2 > xPadelPlayer2 - padelWidth || xBall2 + ballSize > xPadelPlayer2 - padelWidth)
				&& (xBall2 < xPadelPlayer2 + padelWidth || xBall2 - ballSize < xPadelPlayer2 + padelWidth))
		{
			//Inverser la direction sur Z si la balle touche le paddle
			zVelocity2 = -zVelocity2;
			//Controle du rebond sur le padel
			xVelocity2 = ((xBall2 - xPadelPlayer2) / rebound) * deltaTime;
		}
	}
}

function updateBallPosition(rebound)
{
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
		xVelocity /= 7;
    }

    // Vérifier les collision avec les obstacles.
	if (customMapNb && (zBall <= ZMAX / 2 + obstacleSize && zBall >= ZMAX / 2 - obstacleSize)
		&& (xBall <= XMAX / 2 + obstacleWidth && xBall >= XMAX / 2 - obstacleWidth))
	{
		xVelocity = -xVelocity;
		if ((Math.abs(zBall - (ZMAX / 2 + obstacleSize)) <= 0.5 && zVelocity < 0) || (Math.abs(zBall - (ZMAX / 2 - obstacleSize)) <= 0.5 && zVelocity > 0))
		{
			zVelocity = -zVelocity;
			xVelocity = -xVelocity;
		}
	}
	if (customMapNb && (zBall <= ZMAX / 2 + obstacleSize && zBall >= ZMAX / 2 - obstacleSize)
		&& (xBall <= -XMAX / 2 + obstacleWidth && xBall >= -XMAX / 2 - obstacleWidth))
	{
		xVelocity = -xVelocity;
		if ((Math.abs(zBall - (ZMAX / 2 + obstacleSize)) <= 0.5 && zVelocity < 0) || (Math.abs(zBall - (ZMAX / 2 - obstacleSize)) <= 0.5 && zVelocity > 0))
		{
			zVelocity = -zVelocity;
			xVelocity = -xVelocity;
		}
	}

    if (zBall <= zPadel && zBall >= ZMIN + 0.5 && zVelocity < 0)//Collision avec le paddle joueur
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
        if (xPadelPlayer <= XMIN - 1)
			xPadelPlayer = XMIN - 1;
	}
	if (xBall < xAntagonist)
	{
		xAntagonist -= padelSpeed * deltaTime;
        if (xPadelPlayer >= XMAX + 1)
			xPadelPlayer = XMAX + 1;
	}
    if (keysPressed["ArrowLeft"])
	{
        xPadelPlayer += padelSpeed * deltaTime;
        if (xPadelPlayer <= XMIN - 1)
			xPadelPlayer = XMIN - 1;
    }
    if (keysPressed["ArrowRight"])
	{
        xPadelPlayer -= padelSpeed * deltaTime;
        if (xPadelPlayer >= XMAX + 1)
			xPadelPlayer = XMAX + 1;
    }
}

function updatePaddlePositionPvp()
{
    if (keysPressed["t"])
	{
        xAntagonist += padelSpeed * deltaTime;
        xPadelPlayer2 += padelSpeed * deltaTime;
        if (xAntagonist >= XMAX + 1)
		{
			xAntagonist = XMAX + 1;
			xPadelPlayer2 = XMAX + 1;
		}
    }
    if (keysPressed["y"])
	{
        xAntagonist -= padelSpeed * deltaTime;
        xPadelPlayer2 -= padelSpeed * deltaTime;
        if (xPadelPlayer2 <= XMIN - 1)
		{
			xAntagonist = XMIN - 1;
			xPadelPlayer2 = XMIN - 1;
		}
    }
	if (keysPressed["ArrowLeft"])
	{
        xPadelPlayer += padelSpeed * deltaTime;
        if (xPadelPlayer >= XMAX + 1)
			xPadelPlayer = XMAX + 1;
    }
    if (keysPressed["ArrowRight"])
	{
        xPadelPlayer -= padelSpeed * deltaTime;
        if (xPadelPlayer <= XMIN - 1)
			xPadelPlayer = XMIN - 1;
    }
}

/*Game loop*/
function gameLoopBreakout(currentTime)
{
	deltaTime = (currentTime - lastTime) / primeDeltaTime;
	lastTime = currentTime;

	/*map display*/
	//context.clearRect(0, 0, canvas.width, canvas.height);
	renderer.clear();
	colorBuffer.set(gridColorBuffer);

	updatePaddlePosition();
	updateBallPositionBreakout(6);
	/*draw*/
	drawBrickWall();
	drawBall();
	drawPadel(rp, gp, bp);

	material.uniforms.time.value = currentTime * 0.001;
	if (lightWave)
		material.uniforms.lightIntensity.value =  2 + 0.5 * Math.sin(currentTime * 0.002);
	colorTexture.needsUpdate = true;
	renderer.render(scene, camera);

	if (brickWall.length) {
		frameId = requestAnimationFrame(gameLoopBreakout);
		displayScore();
	}
	else {
		currentMatch.scorePlayer1 = 24 - brickWall.length - playerMalus;
		currentMatch.scorePlayer2 = 24 - brickWall2.length - player2Malus;
		console.log("score1 = " + currentMatch.scorePlayer1);
		console.log("Malus1 = " + playerMalus);
		console.log("score2 = " + currentMatch.scorePlayer2);
		console.log("Malus2 = " + player2Malus);
		displaySinglePlayerResult();
		displayEOGMenu();
	}
}

function gameLoopPvpBreakout(currentTime)
{
	deltaTime = (currentTime - lastTime) / primeDeltaTime;
	lastTime = currentTime;

	/*map display*/
	//context.clearRect(0, 0, canvas.width, canvas.height);
	renderer.clear();
	colorBuffer.set(gridColorBuffer);

	updatePaddlePositionPvp();
	updateBallPositionBreakout(6);
	/*Player*/
	drawBrickWall();
	drawBall();
	drawPadel(rp, gp, bp);
	/*Player2*/
	drawBrickWall2();
	drawBall2();
	drawPadel2(rp, gp, bp);

	material.uniforms.time.value = currentTime * 0.001;
	if (lightWave)
		material.uniforms.lightIntensity.value =  2 + 0.5 * Math.sin(currentTime * 0.002);
	colorTexture.needsUpdate = true;
	renderer.render(scene, camera);

	if (brickWall.length && brickWall2.length)
	{
		frameId = requestAnimationFrame(gameLoopPvpBreakout);
		displayScore();
	}
	else
	{
		currentMatch.scorePlayer1 = 24 - brickWall.length - playerMalus;
		currentMatch.scorePlayer2 = 24 - brickWall2.length - player2Malus;
		if (currentMatch.scorePlayer1 > currentMatch.scorePlayer2)
			displayResult(currentMatch.usernamePlayer1, currentMatch.idPlayer1);
		else if (currentMatch.scorePlayer1 === currentMatch.scorePlayer2)
			displayTideResult()
		else
			displayResult(currentMatch.usernamePlayer2, currentMatch.idPlayer2);
		displayEOGMenu();
	}
}

/*Game Loop*/
function gameLoop(currentTime)
{
	deltaTime = (currentTime - lastTime) / primeDeltaTime;
	lastTime = currentTime;

	/*map display*/
	//context.clearRect(0, 0, canvas.width, canvas.height);
	renderer.clear();
	colorBuffer.set(gridColorBuffer);

	updatePaddlePosition();
	updateBallPosition(2.5);
	drawAntagonist(rp, gp, bp);
	drawBall();
	drawPadel(rp, gp, bp);

	material.uniforms.time.value = currentTime * 0.001;
	if (lightWave)
		material.uniforms.lightIntensity.value =  2 + 0.5 * Math.sin(currentTime * 0.002);
	colorTexture.needsUpdate = true;
	renderer.render(scene, camera);

	if (currentMatch.scorePlayer1 != winnerScore && currentMatch.scorePlayer2 != winnerScore)
	{
		displayScore();
		frameId = requestAnimationFrame(gameLoop);
	}
	else
	{
		if (currentMatch.scorePlayer1 > currentMatch.scorePlayer2)
		{
			displayResult(currentMatch.usernamePlayer1, currentMatch.idPlayer1);
			// recordMatch(currentMatch.idPlayer1, currentMatch.idPlayer2, currentMatch.scorePlayer1, currentMatch.scorePlayer2, currentMatch.idPlayer1);
		}
		else
		{
			displayResult(currentMatch.usernamePlayer2, currentMatch.idPlayer2);
			// recordMatch(currentMatch.idPlayer1, currentMatch.idPlayer2, currentMatch.scorePlayer1, currentMatch.scorePlayer2, currentMatch.idPlayer2);
		}
		currentMatch.scorePlayer1 = 0;
		currentMatch.scorePlayer2 = 0;
		displayEOGMenu();
	}
}

function gameLoopPvp(currentTime)
{
	deltaTime = (currentTime - lastTime) / primeDeltaTime;
	lastTime = currentTime;

	/*map display*/
	renderer.clear();
	colorBuffer.set(gridColorBuffer);

	updatePaddlePositionPvp();
	updateBallPosition(4);
	/*Player*/
	drawAntagonist(rp, gp, bp);
	drawBall();
	drawPadel(rp, gp, bp);
	/*Antagoniste*/
	drawAntagonistPvp(rp, gp, bp);
	drawBallPvp();
	drawPadelPvp(rp, gp, bp);

	material.uniforms.time.value = currentTime * 0.001;
	if (lightWave)
		material.uniforms.lightIntensity.value =  2 + 0.5 * Math.sin(currentTime * 0.002);
	colorTexture.needsUpdate = true;
	renderer.render(scene, camera);

	if (currentMatch.scorePlayer1 != winnerScore && currentMatch.scorePlayer2 != winnerScore)
	{
		displayScore();
		frameId = requestAnimationFrame(gameLoopPvp);
	}
	else
	{
		if (currentMatch.scorePlayer1 > currentMatch.scorePlayer2)
		{
			displayResult(currentMatch.usernamePlayer1, currentMatch.idPlayer1);
			recordMatch(currentMatch.idPlayer1, currentMatch.idPlayer2, currentMatch.scorePlayer1, currentMatch.scorePlayer2, currentMatch.idPlayer1);
		}
		else
		{
			displayResult(currentMatch.usernamePlayer2, currentMatch.idPlayer2);
			recordMatch(currentMatch.idPlayer1, currentMatch.idPlayer2, currentMatch.scorePlayer1, currentMatch.scorePlayer2, currentMatch.idPlayer2);
		}
		currentMatch.scorePlayer1 = 0;
		currentMatch.scorePlayer2 = 0;
		displayEOGMenu();
	}
}

var lt = 0;
var setLt = true;

/*initDeltaTime*/
function initDeltaTimePvp(currentTime)
{
	material.uniforms.score.value = true;
	material.uniforms.chromaticShift.value = 0.01 * Math.sin(currentTime * 0.002);
	lastTime = currentTime;
	if (currentTime === undefined)
	{
		frameId = requestAnimationFrame(initDeltaTimePvp);
	}
	else if (breakout)
	{
		if (setLt)
		{
			lt = currentTime;
			setLt = false;
		}
		if (currentTime - lt > 6000)
		{
			material.uniforms.score.value = false;
			frameId = requestAnimationFrame(gameLoopPvpBreakout);
		}
		else
			frameId = requestAnimationFrame(initDeltaTimePvp);
		if (lightWave)
			material.uniforms.lightIntensity.value =  2 + 0.5 * Math.sin(currentTime * 0.002);
		renderer.clear();
		colorBuffer.set(gridColorBuffer);
		colorTexture.needsUpdate = true;
		renderer.render(scene, camera);
	}
	else
	{
		if (setLt)
		{
			lt = currentTime;
			setLt = false;
		}
		if (currentTime - lt > 6000)
		{
			material.uniforms.score.value = false;
			frameId = requestAnimationFrame(gameLoopPvp);
		}
		else
			frameId = requestAnimationFrame(initDeltaTimePvp);
		if (lightWave)
			material.uniforms.lightIntensity.value =  2 + 0.5 * Math.sin(currentTime * 0.002);
		renderer.clear();
		colorBuffer.set(gridColorBuffer);
		colorTexture.needsUpdate = true;
		renderer.render(scene, camera);
	}
}

function initDeltaTime(currentTime)
{
	material.uniforms.score.value = true;
	material.uniforms.chromaticShift.value = 0.01 * Math.sin(currentTime * 0.002);
	lastTime = currentTime;
	if (currentTime === undefined)
	{
		frameId = requestAnimationFrame(initDeltaTime);
	}
	else if (breakout)
	{
		if (setLt)
		{
			lt = currentTime;
			setLt = false;
		}
		if (currentTime - lt > 6000)
		{
			material.uniforms.score.value = false;
			frameId = requestAnimationFrame(gameLoopBreakout);
		}
		else
			frameId = requestAnimationFrame(initDeltaTime);
		if (lightWave)
			material.uniforms.lightIntensity.value =  2 + 0.5 * Math.sin(currentTime * 0.002);
		renderer.clear();
		colorBuffer.set(gridColorBuffer);
		colorTexture.needsUpdate = true;
		renderer.render(scene, camera);
	}
	else
	{
		if (setLt)
		{
			lt = currentTime;
			setLt = false;
		}
		if (currentTime - lt > 6000)
		{
			material.uniforms.score.value = false;
			frameId = requestAnimationFrame(gameLoop);
		}
		else
			frameId = requestAnimationFrame(initDeltaTime);
		if (lightWave)
			material.uniforms.lightIntensity.value =  2 + 0.5 * Math.sin(currentTime * 0.002);
		renderer.clear();
		colorBuffer.set(gridColorBuffer);
		colorTexture.needsUpdate = true;
		renderer.render(scene, camera);
	}
}

/*Remove nodes*/

function rmStartNode()
{
	updateMaterialShader();
	if (frameId)
		cancelAnimationFrame(frameId);
	frameId = 0;
	rp = 100;
	gp = 100;
	bp = 100;
	ZMAX = 22;
	zVelocity = ballSpeed;
	xVelocity = 0.01;
	zVelocity2 = ballSpeed;
	xVelocity2 = 0.01;
	if (breakout)
	{
		ZMAX = 18;
		zVelocity /= 1.2;
		zVelocity2 /= 1.2;
	}
	lt = 0;
	setLt = true;
	//breakout = ...;
	grid3D = [];
	brick3D = [];
	ball3D = [];
	ball3D2 = [];
	padel3D = [];
	obstacle3D = [];
	brickWall = [];
	globaleScale = 310;
	zGridOffset = 6;
	yGridOffset = 4.2;
	MID_WIDTH = canvas.width / 2;
	zBall = zPadel;
	zBall2 = zPadel;
	zBallPvp = zAntagonist;
	xBall = 0;
	xBall2= 0;
	xPadelPlayer = 0;
	xPadelPlayer2 = 0;
	xAntagonist = 0;
	playerMalus = 0;
	player2Malus = 0;
	currentMatch.scorePlayer1 = 0;
	currentMatch.scorePlayer2 = 0;
	currentMatch.bot = true;
	winnerScore = document.getElementById("customVictoryValue").value;
	create3Dgrid(customMapNb);
	create3Dpadel();
	create3Dball();
	create3Dball2();
	if (customMapNb)
		create3Dobstacle(0, breakout);
	create3Dbrick();
	createBrickWall();
	displayBotInfo();
	DisplayGame();
	initDeltaTime();
}

function rmStartNodePvp()
{
	updateMaterialShader();
	if (frameId)
		cancelAnimationFrame(frameId);
	frameId = 0;
	rp = 100;
	gp = 100;
	bp = 100;
	ZMAX = 22;
	zVelocity = ballSpeed;
	xVelocity = 0.01;
	zVelocity2 = ballSpeed;
	xVelocity2 = 0.01;
	if (breakout)
	{
		ZMAX = 18;
		zVelocity /= 1.2;
		zVelocity2 /= 1.2;
	}
	lt = 0;
	setLt = true;
	//breakout = ...;
	grid3D = [];
	ball3D = [];
	ball3D2 = [];
	padel3D = [];
	obstacle3D = [];
	brickWall = [];
	brickWall2 = [];
	globaleScale = 310;
	globaleScale = 310 / 1.2;
	zGridOffset = 6 * 1.25;
	yGridOffset = 4.2 * 1.7;
	MID_WIDTH = canvas.width / 4;
	zBall = zPadel;
	zBall2 = zPadel;
	zBallPvp = zAntagonist;
	xBall = 0;
	xBall2 = 0;
	playerMalus = 0;
	player2Malus = 0;
	currentMatch.scorePlayer1 = 0;
	currentMatch.scorePlayer2 = 0;
	xPadelPlayer = 0;
	xPadelPlayer2 = 0;
	xAntagonist = 0;
	create3Dpadel();
	create3Dball();
	create3Dball2();
	create3Dgrid(customMapNb);
	create3DgridPvp(customMapNb);
	if (customMapNb)
		create3Dobstacle(1, breakout);
	create3Dbrick();
	createBrickWall();
	createBrickWall2();
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
