// An array of animals
let herbivorousPopulation = [];
let carnivorousPopulation = [];

// An array of "food"
let grass = [];
// An array of "poison"
let poison = [];
// An array of "deads"
let deads = [];

// Show additional info on DNA?
let isDebugging = false;

let isRunning = true;
let speed = 1;
let iterationCount = 0;

let noOfHerbPopDied = 0;
let noOfHerbPopnBorn = 0;

let noOfCarnPopDied = 0;
let noOfCarnPopnBorn = 0;

let data = [];

let deadHerbs = [];
let deadCarns = [];

function initializeFood() {
	// Start with some food
	for (let i = 0; i < 100; i++) {
		grass.push(new Food(random(width), random(height), FOOD_TYPE.GRASS));
	}

	// Start with some poison
	for (let i = 0; i < 5; i++) {
		poison.push(new Food(random(width), random(height), FOOD_TYPE.POISON));
	}
}

function setup() {
	// Add canvas and grab checkbox
	createCanvas(1080, 600);
	angleMode(RADIANS);

	const bestHerbBrainString = localStorage.getItem("BestHerbBrain") || null;
	const bestHerbDNA = localStorage.getItem("BestHerbDNA");
	const bestCarnBrainString = localStorage.getItem("BestCarnBrain") || null;
	const bestCarnDNA = localStorage.getItem("BestCarnDNA");

	let bestHerbBrain = bestHerbBrainString
		? NeuralNetwork.deserialize(bestHerbBrainString)
		: null;

	let bestCarnBrain = bestCarnBrainString
		? NeuralNetwork.deserialize(bestCarnBrainString)
		: null;

	// Create 10 herbivorous
	for (let i = 0; i < INITIAL_HERB_COUNT; i++) {
		herbivorousPopulation.push(
			new Herbivorous(
				random(width),
				random(height),
				bestHerbDNA ? JSON.parse(bestHerbDNA) : null,
				bestHerbBrain
			)
		);
	}
	// Create 10 carnivorous
	for (let i = 0; i < INITIAL_CARN_COUNT; i++) {
		carnivorousPopulation.push(
			new Carnivorous(
				random(width),
				random(height),
				bestCarnDNA ? JSON.parse(bestCarnDNA) : null,
				bestCarnBrain
			)
		);
	}
	initializeFood();
}

// Add new vehicles by dragging mouse
function mouseDragged() {
	herbivorousPopulation.push(new Herbivorous(mouseX, mouseY));
}

function draw() {
	clear();

	if (herbivorousPopulation.length == 0 || carnivorousPopulation.length == 0) {
		nextGeneration();
		return;
	}

	for (let c = 0; c < speed; c++) {
		// x% chance of new food
		if (random(1) < CHANCE_OF_GROWING_GRASS) {
			grass.push(new Food(random(width), random(height), FOOD_TYPE.GRASS));
		}

		// x% chance of new poison
		if (random(1) < CHANCE_OF_GROWING_POISON) {
			poison.push(new Food(random(width), random(height), FOOD_TYPE.POISON));
		}
		for (let i = deads.length - 1; i >= 0; i--) {
			deads[i].update();
			if (deads[i].isRotten()) {
				poison.push(deads.splice(i, 1)[0]);
			}
		}
		// Go through all herbivorous
		for (let i = herbivorousPopulation.length - 1; i >= 0; i--) {
			let h = herbivorousPopulation[i];

			// Eat the food (index 0)
			h.eat(grass);
			// Eat the poison (index 1)
			h.eat(poison);

			h.run(carnivorousPopulation);

			// Check boundaries
			h.boundaries();

			// Update
			h.update();

			// If the vehicle has died, remove
			if (h.dead()) {
				noOfHerbPopDied++;
				deadHerbs.push(h);

				deads.push(new Food(h.position.x, h.position.y, FOOD_TYPE.DEADANIMAL));

				herbivorousPopulation.splice(i, 1);
			} else {
				// Every vehicle has a chance of cloning itself
				let child = h.birth(
					herbivorousPopulation.length,
					carnivorousPopulation.length,
					grass.length
				);
				if (child != null) {
					herbivorousPopulation.push(child);
					noOfHerbPopnBorn++;
				}
			}
		}

		// Go through all carnivorous
		for (let i = carnivorousPopulation.length - 1; i >= 0; i--) {
			let v = carnivorousPopulation[i];
			// hunt the herbivorous
			v.hunt(herbivorousPopulation);

			// eat the deadAnimals
			v.eat(deads);
			// eat the poison
			v.eat(poison);

			// Check boundaries
			v.boundaries();

			// Update
			v.update();

			// If the vehicle has died, remove
			if (v.dead()) {
				noOfCarnPopDied++;
				deadCarns.push(v);
				grass.push(new Food(v.position.x, v.position.y, FOOD_TYPE.GRASS));

				carnivorousPopulation.splice(i, 1);
			} else {
				// Every vehicle has a chance of cloning itself
				let child = v.birth(
					herbivorousPopulation.length,
					carnivorousPopulation.length,
					deads.length
				);
				if (child != null) {
					carnivorousPopulation.push(child);
					noOfCarnPopnBorn++;
				}
			}
		}

		if (iterationCount % 100 == 0) {
			data.push({
				herbivorousPopulation: herbivorousPopulation.length,
				carnivorousPopulation: carnivorousPopulation.length,

				food: grass.length,
				poison: poison.length,
				deads: deads.length,

				herbdied: -noOfHerbPopDied,
				herbborn: noOfHerbPopnBorn,
				carndied: -noOfCarnPopDied,
				carnborn: noOfCarnPopnBorn,

				time: iterationCount,

				herbGrassAttraction:
					herbivorousPopulation.reduce((a, v) => v.dna[0] + a, 0) /
					(herbivorousPopulation.length || 1),
				herbPoisonAttraction:
					herbivorousPopulation.reduce((a, v) => v.dna[1] + a, 0) /
					(herbivorousPopulation.length || 1),
				herbCarnivorousAttraction:
					herbivorousPopulation.reduce((a, v) => v.dna[5] + a, 0) /
					(herbivorousPopulation.length || 1),

				herbGrassPerception:
					herbivorousPopulation.reduce((a, v) => v.dna[2] + a, 0) /
					(herbivorousPopulation.length || 1),
				herbPoisonPerception:
					herbivorousPopulation.reduce((a, v) => v.dna[3] + a, 0) /
					(herbivorousPopulation.length || 1),
				herbCarnivorousPerception:
					herbivorousPopulation.reduce((a, v) => v.dna[6] + a, 0) /
					(herbivorousPopulation.length || 1),

				carnGrassAttraction:
					carnivorousPopulation.reduce((a, v) => v.dna[0] + a, 0) /
					(carnivorousPopulation.length || 1),
				carnPoisonAttraction:
					carnivorousPopulation.reduce((a, v) => v.dna[1] + a, 0) /
					(carnivorousPopulation.length || 1),
				carnHerbivorousAttraction:
					carnivorousPopulation.reduce((a, v) => v.dna[5] + a, 0) /
					(carnivorousPopulation.length || 1),

				carnGrassPerception:
					carnivorousPopulation.reduce((a, v) => v.dna[2] + a, 0) /
					(carnivorousPopulation.length || 1),
				carnPoisonPerception:
					carnivorousPopulation.reduce((a, v) => v.dna[3] + a, 0) /
					(carnivorousPopulation.length || 1),
				carnHerbivorousPerception:
					carnivorousPopulation.reduce((a, v) => v.dna[6] + a, 0) /
					(carnivorousPopulation.length || 1),

				herbMeanReproductionRate:
					herbivorousPopulation.reduce((a, v) => v.dna[4] + a, 0) /
					(herbivorousPopulation.length || 1),
				carnMeanReproductionRate:
					carnivorousPopulation.reduce((a, v) => v.dna[4] + a, 0) /
					(carnivorousPopulation.length || 1),

				herbMeanHealth:
					herbivorousPopulation.reduce((a, v) => v.health + a, 0) /
					(herbivorousPopulation.length || 1),
				carnMeanHealth:
					carnivorousPopulation.reduce((a, v) => v.health + a, 0) /
					(carnivorousPopulation.length || 1),
			});
			noOfHerbPopDied = 0;
			noOfHerbPopnBorn = 0;
			noOfCarnPopDied = 0;
			noOfCarnPopnBorn = 0;
		}
		iterationCount++;
	}

	for (let i = herbivorousPopulation.length - 1; i >= 0; i--) {
		let h = herbivorousPopulation[i];
		h.display();
	}

	for (let i = carnivorousPopulation.length - 1; i >= 0; i--) {
		let v = carnivorousPopulation[i];
		v.display();
	}
	// Draw all the food and all the poison
	for (let i = 0; i < grass.length; i++) {
		grass[i].display();
	}

	for (let i = 0; i < poison.length; i++) {
		poison[i].display();
	}

	for (let i = 0; i < deads.length; i++) {
		deads[i].display();
	}

	// after every 60 frames update the plot
	if (frameCount % 60 == 0) {
		if (document.querySelector("#stats")) {
			document.body.removeChild(document.querySelector("#stats"));
		}
		const container = document.createElement("div");
		container.id = "stats";

		container.append(
			Plot.plot({
				height: "300",
				width: "500",
				caption: `Quantity GREEN: Grass, RED: Poison, PURPLE: DeadAnimals`,
				marks: [
					Plot.line(data, { x: "time", y: "food", stroke: "green" }),
					Plot.line(data, { x: "time", y: "poison", stroke: "red" }),
					Plot.line(data, { x: "time", y: "deads", stroke: "purple" }),
				],
			})
		);

		container.append(
			Plot.plot({
				height: "300",
				width: "500",
				caption: `Production rate: GREEN-Herb, RED-Carn`,
				marks: [
					Plot.line(data, {
						x: "time",
						y: "herbMeanReproductionRate",
						stroke: "green",
					}),
					Plot.line(data, {
						x: "time",
						y: "carnMeanReproductionRate",
						stroke: "purple",
					}),
				],
			})
		);
		container.append(
			Plot.plot({
				height: "300",
				width: "500",
				caption: `Population: BLUE-Herb, RED-Carn`,
				marks: [
					Plot.line(data, {
						x: "time",
						y: "herbivorousPopulation",
						stroke: "blue",
					}),
					Plot.line(data, {
						x: "time",
						y: "carnivorousPopulation",
						stroke: "red",
					}),
				],
			})
		);
		container.append(
			Plot.plot({
				color: {
					legend: true,
				},
				caption: `Mean Health: GREEN-Herb, RED-Carn`,
				height: "300",
				width: "500",
				marks: [
					Plot.line(data, {
						x: "time",
						y: "herbMeanHealth",
						stroke: "green",
					}),
					Plot.line(data, {
						x: "time",
						y: "carnMeanHealth",
						stroke: "red",
					}),
				],
			})
		);

		container.append(
			Plot.plot({
				height: "300",
				width: "500",
				caption: `GREEN-Herb-Born, RED-Herb-Died`,
				marks: [
					Plot.barY(data, { x: "time", y: "herbborn", fill: "green" }),
					Plot.barY(data, { x: "time", y: "herbdied", fill: "red" }),
				],
			})
		);
		container.append(
			Plot.plot({
				height: "300",
				width: "500",
				caption: `GREEN-Carn-Born, RED-Carn-Died`,
				marks: [
					Plot.barY(data, { x: "time", y: "carnborn", fill: "green" }),
					Plot.barY(data, { x: "time", y: "carndied", fill: "red" }),
				],
			})
		);

		container.append(
			Plot.plot({
				height: "300",
				width: "500",
				caption: `Attraction HERB: GREEN-grass, RED-poison, PURPLE-carnivorous`,
				marks: [
					Plot.line(data, {
						x: "time",
						y: "herbGrassAttraction",
						stroke: "green",
					}),
					Plot.line(data, {
						x: "time",
						y: "herbPoisonAttraction",
						stroke: "red",
					}),
					Plot.line(data, {
						x: "time",
						y: "herbCarnivorousAttraction",
						stroke: "purple",
					}),
				],
			})
		);
		container.append(
			Plot.plot({
				height: "300",
				width: "500",
				caption: `Attraction Carn: GREEN-deadAnimals, RED-poison, PURPLE-herbivorous`,
				marks: [
					Plot.line(data, {
						x: "time",
						y: "carnGrassAttraction",
						stroke: "green",
					}),
					Plot.line(data, {
						x: "time",
						y: "carnPoisonAttraction",
						stroke: "red",
					}),
					Plot.line(data, {
						x: "time",
						y: "carnHerbivorousAttraction",
						stroke: "purple",
					}),
				],
			})
		);
		container.append(
			Plot.plot({
				height: "300",
				width: "500",
				caption: `Perception HERB: GREEN-grass, RED-poison, PURPLE-carnivorous`,
				marks: [
					Plot.line(data, {
						x: "time",
						y: "herbGrassPerception",
						stroke: "green",
					}),
					Plot.line(data, {
						x: "time",
						y: "herbPoisonPerception",
						stroke: "red",
					}),
					Plot.line(data, {
						x: "time",
						y: "herbCarnivorousPerception",
						stroke: "purple",
					}),
				],
			})
		);
		container.append(
			Plot.plot({
				height: "300",
				width: "500",
				caption: `Perception Carn: GREEN-deadAnimal, RED-poison, PURPLE-herbivorous`,
				marks: [
					Plot.line(data, {
						x: "time",
						y: "carnGrassPerception",
						stroke: "green",
					}),
					Plot.line(data, {
						x: "time",
						y: "carnPoisonPerception",
						stroke: "red",
					}),
					Plot.line(data, {
						x: "time",
						y: "carnHerbivorousPerception",
						stroke: "purple",
					}),
				],
			})
		);

		document.body.appendChild(container);
	}
}

function keyPressed() {
	console.log(keyCode);
	if (keyCode == 32) {
		// space key
		if (isRunning) {
			noLoop();
			isRunning = false;
		} else {
			loop();
			isRunning = true;
		}
		return false; // prevent any default behaviour
	} else if (keyCode == 68) {
		// d key
		isDebugging = !isDebugging;
		return false; // prevent any default behaviour
	} else if (keyCode == 107 || keyCode == 187) {
		// + sign
		speed += speed;
		return false; // prevent any default behaviour
	} else if (keyCode == 109 || keyCode == 189) {
		// -  sign
		speed -= speed / 2;
		return false; // prevent any default behaviour
	} else if (keyCode == 96) {
		// 0 of numpade
		speed = 1;
		return false; // prevent any default behaviour
	} else if (keyCode == 67) {
		// c key
		localStorage.removeItem("BestHerbBrain");
		localStorage.removeItem("BestHerbDNA");
		localStorage.removeItem("BestCarnBrain");
		localStorage.removeItem("BestCarnDNA");

		return false; // prevent any default behaviour
	} else if (keyCode == 82) {
		// r key
		nextGeneration();
		return false; // prevent any default behaviour
	} else if (keyCode == 83) {
		if (document.querySelector("svg")) {
			document.body.removeChild(document.querySelector("svg"));
		}

		document.body.append(
			Plot.plot({
				height: "300",
				width: "1000",
				marks: [Plot.line(data, { x: "time", y: "population" })],
			})
		);

		return false; // prevent any default behaviour
	}
}

function calfitness() {
	let sum = 0;
	for (let i of deadHerbs) {
		sum +=
			(i.age * i.age + i.childrenCount * 10000 + (i.dead() ? 0 : 20000)) / 1000;
	}
	for (let i of deadHerbs) {
		i.fitness =
			(i.age * i.age + i.childrenCount * 10000 + (i.dead() ? 0 : 20000)) /
			1000 /
			sum;
	}
	sum = 0;
	for (let i of deadCarns) {
		sum +=
			(i.age * i.age + i.childrenCount * 10000 + (i.dead() ? 0 : 20000)) / 1000;
	}
	for (let i of deadCarns) {
		i.fitness =
			(i.age * i.age + i.childrenCount * 10000 + (i.dead() ? 0 : 20000)) /
			1000 /
			sum;
	}
}

function nextGeneration() {
	deadCarns = [...deadCarns, ...carnivorousPopulation];
	deadHerbs = [...deadHerbs, ...herbivorousPopulation];
	console.log(
		"Next Generation",
		iterationCount,
		herbivorousPopulation.length > 0 ? "Herbivorous Won" : "Carnivorous Won"
	);

	herbivorousPopulation = [];
	carnivorousPopulation = [];
	grass = [];
	poison = [];
	deads = [];

	calfitness();
	for (let i = 0; i < INITIAL_HERB_COUNT; i++) {
		herbivorousPopulation[i] = pickOneHerb(deadHerbs);
	}
	for (let i = 0; i < INITIAL_CARN_COUNT; i++) {
		carnivorousPopulation[i] = pickOneCarn(deadCarns);
	}

	const bestHerb = deadHerbs.reduce(
		(a, c) => (a.fitness < c.fitness ? c : a),
		deadHerbs[0]
	);
	storeBestBrain(bestHerb, "BestHerbBrain");
	storeBestDNA(bestHerb, "BestHerbDNA");
	const bestCarn = deadCarns.reduce(
		(a, c) => (a.fitness < c.fitness ? c : a),
		deadCarns[0]
	);
	storeBestBrain(bestCarn, "BestCarnBrain");
	storeBestDNA(bestCarn, "BestCarnDNA");

	deadHerbs = [];
	deadCarns = [];
	data = [];
	initializeFood();
	iterationCount = 0;
}

function pickOneHerb(arr) {
	let index = 0;
	let r = random(1);
	while (r > 0) {
		r = r - arr[index].fitness;
		index++;
	}
	index--;

	let b = arr[index];
	let child = new Herbivorous(random(width), random(height), b.dna, b.brain);
	child.mutate();
	return child;
}

function pickOneCarn(arr) {
	let index = 0;
	let r = random(1);
	while (r > 0) {
		r = r - arr[index].fitness;
		index++;
	}
	index--;

	let b = arr[index];
	let child = new Carnivorous(random(width), random(height), b.dna, b.brain);
	child.mutate();
	return child;
}

function storeBestBrain(best, key) {
	localStorage.setItem(key, best.brain.serialize());
}

function storeBestDNA(best, key) {
	localStorage.setItem(key, JSON.stringify(best.dna));
}
