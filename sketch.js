const TOTAL = 100;
const MUTATION_RATE = 0.05;
let walls = [];
let ray;

let population = [];
let savedParticles = [];

let start, end;

let speedSlider;

const inside = [];
const outside = [];
const checkpoints = [];

function setup() {
  createCanvas(667, 600);
  // Przyspieszenie działana
  tf.setBackend("cpu");
  // --- Algorytm rysowania okrężnej trasy --- //
  background(0);
  stroke(255);
  noFill();
  let noiseMax = 2;
  const total = 30;
  for (let i = 0; i < total; i++) {
    let a = map(i, 0, total, 0, TWO_PI);
    let xoff = map(cos(a), -1, 1, 0, noiseMax);
    let yoff = map(sin(a), -1, 1, 0, noiseMax);
    let r = map(noise(xoff, yoff), 0, 1, 100, height / 2 - 20);
    let x = width / 2 + r * cos(a);
    let y = height / 2 + r * sin(a);
    let x1 = width / 2 + (r - 50) * cos(a);
    let y1 = height / 2 + (r - 50) * sin(a);
    let x2 = width / 2 + (r + 50) * cos(a);
    let y2 = height / 2 + (r + 50) * sin(a);
    checkpoints.push(createVector(x, y));
    inside.push(createVector(x1, y1));
    outside.push(createVector(x2, y2));
  }

  // --- Budowanie ścian toru --- //
  for (let i = 0; i < checkpoints.length; i++) {
    let a1 = inside[i];
    let b1 = inside[(i + 1) % checkpoints.length];
    walls.push(new Boundary(a1.x, a1.y, b1.x, b1.y));
    let a2 = outside[i];
    let b2 = outside[(i + 1) % checkpoints.length];
    walls.push(new Boundary(a2.x, a2.y, b2.x, b2.y));
  }

  // --- Pozycja startowa i końcowa --- //
  start = checkpoints[0];
  end = checkpoints[checkpoints.length - 2];

  let a = inside[inside.length - 1];
  let b = outside[outside.length - 1];
  walls.push(new Boundary(a.x, a.y, b.x, b.y));

  // --- Zainicjowanie pierwszej populacji --- //
  for (let i = 0; i < TOTAL; i++) {
    population[i] = new Particle();
  }
  // --- Speed slider --- //
  speedSlider = createSlider(1, 10, 1);
}

function draw() {
  const cycles = speedSlider.value();

  for (let n = 0; n < cycles; n++) {
    for (let particle of population) {
      particle.look(walls);
      particle.check(end);
      particle.bounds();
      particle.update();
      particle.show();
    }

    // --- Funkcja sprawdzająca czy dany pojazd w populacji ukończył albo się rozbił, jeśli tak to usuwa go z tablicy i dodaje go do innej tablicy --- //
    for (let i = population.length - 1; i >= 0; i--) {
      const particle = population[i];
      if (particle.dead || particle.finished) {
        savedParticles.push(population.splice(i, 1)[0]);
      }
    }
    // Jeżeli tablica z populacją jest pusta wywołaj nową generację
    if (population.length === 0) {
      nextGeneration();
    }
  }

  // --- Rysowanie pojazdów, trasy i checkpointów --- //
  background(0);

  for (let v of checkpoints) {
    point(v.x, v.y);
  }

  for (let wall of walls) {
    wall.show();
  }

  for (let particle of population) {
    particle.show();
  }

  // --- Narysowanie pozycji startowej i końcowej --- //
  ellipse(start.x, start.y, 10);
  ellipse(end.x, end.y, 10);
}
