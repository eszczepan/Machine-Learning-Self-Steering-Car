const TOTAL = 100;
const MUTATION_RATE = 0.1;
let walls = [];
let ray;

let population = [];
let savedParticles = [];

let start, end;

function setup() {
  createCanvas(667, 600);
  // Przyspieszenie działana
  tf.setBackend("cpu");
  // --- Budowanie ścian toru --- //
  walls.push(new Boundary(50, 600, 100, 600));
  walls.push(new Boundary(50, 600, 50, 200));
  walls.push(new Boundary(50, 200, 150, 50));
  walls.push(new Boundary(150, 50, 667, 50));
  walls.push(new Boundary(100, 600, 100, 200));
  walls.push(new Boundary(100, 200, 175, 100));
  walls.push(new Boundary(175, 100, 667, 100));
  walls.push(new Boundary(667, 50, 667, 100));

  // --- Pozycja startowa i końcowa --- //
  start = createVector(75, 500);
  end = createVector(600, 75);

  // --- Zainicjowanie pierwszej populacji --- //
  for (let i = 0; i < TOTAL; i++) {
    population[i] = new Particle();
  }
}

function draw() {
  background(0);
  for (wall of walls) {
    wall.show();
  }

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

  // --- Narysowanie pozycji startowej i końcowej --- //
  // ellipse(start.x, start.y, 10);
  ellipse(end.x, end.y, 10);
}
