class Food {
	constructor(x, y, type) {
		this.position = createVector(x, y);

		// Health
		this.health = 1;
		this.type = type;
		this.nutrition = 0;
		if (type == FOOD_TYPE.GRASS) {
			this.nutrition = 0.1;
		} else if (type == FOOD_TYPE.POISON) {
			this.nutrition = -0.5;
		} else if (type == FOOD_TYPE.DEADANIMAL) {
			this.nutrition = 0.1;
		}

		this.color = type;
	}

	update() {
		if (this.type == FOOD_TYPE.DEADANIMAL) {
			// dead animal slowly rots
			this.health -= 0.002;
			if (this.health <= 0) {
				this.nutrition = -0.5;
				this.color = FOOD_TYPE.POISON;
				this.type = FOOD_TYPE.POISON;
			}
		}
	}

	isRotten() {
		return this.health <= 0;
	}

	// Small chance of returning a new child vehicle
	// birth() {
	// 	var r = random(1);
	// 	if (r < this.dna[4]) {
	// 		// Same location, same DNA
	// 		return new Herbivorous(this.position.x, this.position.y, this.dna);
	// 		// so parent's health will reduce do to reproduction
	// 		this.health *= 1 - HEALTH_REDUCTION_DUE_TO_REPRODUCTION;
	// 	}
	// }

	display() {
		fill(this.color);
		noStroke();
		ellipse(this.position.x, this.position.y, 4);
	}
}
