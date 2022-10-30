class Carnivorous {
	constructor(x, y, dna, brain) {
		// All the physics stuff
		this.acceleration = createVector();
		this.velocity = p5.Vector.random2D();
		this.position = createVector(x, y);
		this.r = 3;
		this.maxforce = 0.5;
		this.maxspeed = 3;
		this.velocity.setMag(this.maxspeed);

		this.age = 1;
		this.childrenCount = 0;

		this.fitness = 0;
		this.brain = null;
		if (brain) {
			this.brain = brain.copy();
		} else {
			this.brain = new NeuralNetwork(6, 9, 1);
		}

		// Did it receive DNA to copy?
		if (dna instanceof Array) {
			this.dna = [];
			// Copy all the DNA
			for (let i = 0; i < dna.length; i++) {
				// 10% chance of mutation
				if (random(1) < 0.1) {
					if (i < 2) {
						// Adjust steering force weights
						this.dna[i] = dna[i] + random(-0.2, 0.2);
					} else if (i < 4) {
						// Adjust perception radius
						this.dna[i] = constrain(dna[i] + random(-10, 10), 0, 100);
					} else if (i == 5) {
						// Adjust steering force weights
						this.dna[i] = dna[i] + random(-0.2, 0.2);
					} else if (i == 6) {
						// Adjust perception radius
						this.dna[i] = constrain(dna[i] + random(-10, 10), 0, 100);
					} else {
						// Adjust reproduction rate
						this.dna[i] = constrain(
							dna[i] +
								random(
									-CARN_REPRODUCTION_RANGE * 0.1,
									CARN_REPRODUCTION_RANGE * 0.1
								),
							0,
							CARN_REPRODUCTION_RANGE
						);
					}
					// Copy DNA
				} else {
					this.dna[i] = dna[i];
				}
			}
		} else {
			let maxf = 3;
			// DNA
			// 0: Attraction/Repulsion to deadAnimal
			// 1: Attraction/Repulsion to poison
			// 2: Radius to sense dead
			// 3: Radius to sense poison
			// 4: Rate of reproduction
			// 5: Attraction/Repulsion to herbvorous
			// 6: Radius to sense herbvorous

			const idealDna = [maxf, -maxf, 80, 5, CARN_REPRODUCTION_RANGE, maxf, 100];
			this.dna = [
				random(-maxf, maxf),
				random(-maxf, maxf),
				random(5, 100),
				random(5, 100),
				random(0, CARN_REPRODUCTION_RANGE),
				random(0, maxf),
				random(5, 100),
			];
		}

		// Health
		this.health = 1;
	}

	update() {
		// Update velocity
		this.velocity.add(this.acceleration);
		// Limit speed
		this.velocity.limit(this.maxspeed * (this.health + 0.2));
		this.position.add(this.velocity);
		// Reset acceleration to 0 each cycle
		this.acceleration.mult(0);

		// Slowly die unless you eat
		this.health -= HEALTH_DEGRADATION_IN_CARNIVOROUS;
		this.age++;
	}

	// Return true if health is less than zero
	dead() {
		return this.health <= 0;
	}

	mutate() {
		this.brain.mutate(0.1);
	}

	// Small chance of returning a new child vehicle
	birth(herbPop, carnPop, deads) {
		let r = random(1);

		const res = this.brain.predict([
			SigmoidMapping(this.age),
			this.health,
			SigmoidMapping(herbPop),
			SigmoidMapping(carnPop),
			SigmoidMapping(deads),
			SigmoidMapping(this.childrenCount),
		]);
		if (
			r < this.dna[4] &&
			res[0] > 0.5 &&
			// r < this.dna[4] * SigmoidMapping(this.age) &&
			this.age > CARN_MIN_AGE_TO_REPRODUCE &&
			this.health > 0.5
		) {
			// so parent's health will reduce do to reproduction
			this.health -= HEALTH_REDUCTION_DUE_TO_REPRODUCTION_IN_CARNIVOROUS;
			this.childrenCount++;
			// Same location, same DNA
			const newChild = new Carnivorous(
				this.position.x,
				this.position.y,
				this.dna
			);
			newChild.mutate();
			return newChild;
		}
	}

	// Check against array of food or poison
	// index = 0 for food, index = 1 for poison
	hunt(list) {
		if (list.length == 0) return;

		// What's the closest?
		let closest = null;
		let closestD = Infinity;
		// Look at everything
		for (let i = list.length - 1; i >= 0; i--) {
			// Calculate distance
			let d = p5.Vector.dist(list[i].position, this.position);

			// If it's within perception radius and closer than pervious
			if (d < this.dna[6] && d < closestD) {
				closestD = d;
				// Save it
				closest = list[i];
			}
			// If we're withing 5 pixels, eat it!
			if (d < 5) {
				// list.splice(i, 1);
				list[i].health = 0;
				// Add or subtract from health based on kind of food
				this.health = constrain(
					this.health + NUTRITION_GAINED_ON_EATING_HERBIVOROUS,
					0,
					1
				);
			}
		}

		// If something was close
		if (closest) {
			// Seek
			let seek = this.seek(closest.position);
			// Weight according to DNA
			seek.mult(this.dna[5]);
			// Limit
			seek.limit(this.maxforce);
			this.applyForce(seek);
		}
	}

	eat(list) {
		if (list.length == 0) return;
		const index = list[0].type == FOOD_TYPE.DEADANIMAL ? 0 : 1;

		// What's the closest?
		let closest = null;
		let closestD = Infinity;
		// Look at everything
		for (let i = list.length - 1; i >= 0; i--) {
			// Calculate distance
			let d = p5.Vector.dist(list[i].position, this.position);

			// If it's within perception radius and closer than pervious
			if (d < this.dna[2 + index] && d < closestD) {
				closestD = d;
				// Save it
				closest = list[i];
			}

			// If we're withing 5 pixels, eat it!
			if (d < 5) {
				// Add or subtract from health based on kind of food
				this.health = constrain(this.health + list[i].nutrition, 0, 1);

				list.splice(i, 1);
			}
		}

		// If something was close
		if (closest) {
			// Seek
			let seek = this.seek(closest.position);
			// Weight according to DNA
			seek.mult(this.dna[index]);
			// Limit
			seek.limit(this.maxforce);
			this.applyForce(seek);
		}
	}

	// Add force to acceleration
	applyForce(force) {
		this.acceleration.add(force);
	}

	// A method that calculates a steering force towards a target
	// STEER = DESIRED MINUS VELOCITY
	seek(target) {
		let desired = p5.Vector.sub(target, this.position); // A vector pointing from the location to the target
		let d = desired.mag();

		// Scale to maximum speed
		desired.setMag(this.maxspeed);

		// Steering = Desired minus velocity
		let steer = p5.Vector.sub(desired, this.velocity);

		// Not limiting here
		// steer.limit(this.maxforce);

		return steer;
	}

	display() {
		// Color based on health
		let yellow = color(255, 255, 255, 255);
		let red = color(255, 255, 255, 50);
		let col = lerpColor(red, yellow, this.health);

		// Draw a triangle rotated in the direction of velocity
		let theta = this.velocity.heading() + PI / 2;
		push();
		translate(this.position.x, this.position.y);
		rotate(theta);

		// Extra info
		if (isDebugging) {
			noFill();

			// Circle and line for herbi
			stroke(0, 255, 0, 100);
			ellipse(0, 0, this.dna[6] * 2);
			line(0, 0, 0, -this.dna[5] * 25);

			// Circle and line for poison
			stroke(255, 0, 0, 100);
			ellipse(0, 0, this.dna[3] * 2);
			line(0, 0, 0, -this.dna[1] * 25);

			// Circle and line for reproduction rate
			// stroke(0, 200, 255);
			// ellipse(0, 0, this.dna[4] * 100000);
		}

		// Draw the vehicle itself
		fill(col);
		stroke(col);
		beginShape();
		vertex(0, -this.r * 2);
		vertex(-this.r, this.r * 2);
		vertex(this.r, this.r * 2);
		endShape(CLOSE);
		pop();
	}

	// A force to keep it on screen
	boundaries() {
		let d = 10;
		let desired = null;
		if (this.position.x < d) {
			desired = createVector(this.maxspeed, this.velocity.y);
		} else if (this.position.x > width - d) {
			desired = createVector(-this.maxspeed, this.velocity.y);
		}

		if (this.position.y < d) {
			desired = createVector(this.velocity.x, this.maxspeed);
		} else if (this.position.y > height - d) {
			desired = createVector(this.velocity.x, -this.maxspeed);
		}

		if (desired !== null) {
			desired.setMag(this.maxspeed);
			let steer = p5.Vector.sub(desired, this.velocity);
			steer.limit(this.maxforce);
			this.applyForce(steer);
		}
	}
}
