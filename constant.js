const HEALTH_REDUCTION_DUE_TO_REPRODUCTION_IN_HERBIVOROUS = 0.1;
const HEALTH_REDUCTION_DUE_TO_REPRODUCTION_IN_CARNIVOROUS = 0.2;

const FOOD_TYPE = {
	GRASS: "#00ff00",
	POISON: "#ff0000",
	DEADANIMAL: "#ff00ff",
};

const CHANCE_OF_GROWING_GRASS = 1;
const CHANCE_OF_GROWING_POISON = 0.001;

const NUTRITION_GAINED_ON_EATING_HERBIVOROUS = 0.7;

const HEALTH_DEGRADATION_IN_HERBIVOROUS = 0.002;
const HEALTH_DEGRADATION_IN_CARNIVOROUS = 0.001;

const HERB_REPRODUCTION_RANGE = 0.005;
const CARN_REPRODUCTION_RANGE = 0.005;

const HERB_MIN_AGE_TO_REPRODUCE = 20;
const CARN_MIN_AGE_TO_REPRODUCE = 20;

const mapper = (x, maxLimit) => {
	return map(Math.pow(x, 1 / 7), 0, 5, 0, maxLimit, true);
};

const INITIAL_HERB_COUNT = 50;
const INITIAL_CARN_COUNT = 30;

const SigmoidMapping = (x) => 1 / (1 + Math.exp(-x));
