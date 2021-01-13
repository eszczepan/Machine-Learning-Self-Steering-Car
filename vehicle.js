// --- Funkcja obliczająca dystans do checkpointa --- //
function pldistance(p1, p2, x, y) {
  const num = abs(
    (p2.y - p1.y) * x - (p2.x - p1.x) * y + p2.x * p1.y - p2.y * p1.x
  );
  const den = p5.Vector.dist(p1, p2);
  return num / den;
}

class Vehicle {
  constructor(brain) {
    // --- Właściwości pojazdu --- //
    this.fitness = 0; // dopasowanie
    this.pos = createVector(start.x, start.y); // pozycja pojazdu
    this.vel = createVector(); // szybkość
    this.acc = createVector(); // przyspieszenie
    this.maxSpeed = 3; // maksymalna szybkość
    this.maxForce = 0.5; // maksymalna siła
    this.sight = SIGHT; // maksymalna rejestrowana odległość od band
    this.rays = []; // sensory
    this.index = 0; // wynik pojazdu
    this.counter = 0; // licznik do usuwania pojazdu
    this.dead = false;
    this.finished = false;
    this.goal;

    // --- Tworzenie sensorów dla pojazdów --- //
    for (let a = -45; a < 45; a += 12.5) {
      this.rays.push(new Ray(this.pos, radians(a)));
    }

    // --- Tworzenie sieci neuronowej dla pojazdów jeżeli nie są pierwszą generacją (wynika z alg. genetycznego) --- //
    if (brain) {
      this.brain = brain.copy();
    } else {
      // Sieć ma 8 wejść i warstwy ukrytej (tyle co sensorów) i jedno wyjście
      this.brain = new NeuralNetwork(this.rays.length, this.rays.length, 1);
    }
  }

  mutate() {
    this.brain.mutate(MUTATION_RATE);
  }

  // --- Zarządzanie pamięcią --- //
  dispose() {
    this.brain.dispose();
  }

  applyForce(force) {
    this.acc.add(force);
  }

  update() {
    if (!this.dead && !this.finished) {
      this.pos.add(this.vel);
      this.vel.add(this.acc);
      this.vel.limit(this.maxSpeed);
      this.acc.set(0, 0);
      this.counter++;
      if (this.counter > LIFESPAN) {
        this.dead = true;
      }
      for (let i = 0; i < this.rays.length; i++) {
        this.rays[i].rotate(this.vel.heading());
      }
    }
  }

  // --- Sprawdza czy dystans pomiędzy pozycją a dystansem jest mniejszy niż 5 px --- //
  check(checkpoints) {
    if (!this.finished) {
      this.goal = checkpoints[this.index];
      const distance = pldistance(
        this.goal.a,
        this.goal.b,
        this.pos.x,
        this.pos.y
      );
      if (distance < 5) {
        this.index++;
        this.counter = 0;
        if (this.index === checkpoints.length - 1) {
          this.finished = true;
        }
      }
    }
  }

  // --- Funkcja wyliczająca dopasowanie (index jest zależny od liczby checkpointów zaliczonych)
  calculateFitness() {
    this.fitness = pow(2, this.index);
  }

  // --- Funkcja sprawdzająca ściany i rejestrująca dystans od każdej z nich --- //
  look(walls) {
    // Tworzenie wejść do sieci neuronowej
    const inputs = [];
    for (let i = 0; i < this.rays.length; i++) {
      const ray = this.rays[i];
      let closest = null;
      // record = maksymalna długość sensora
      let record = this.sight;
      for (let wall of walls) {
        const pt = ray.cast(wall);
        if (pt) {
          const distance = p5.Vector.dist(this.pos, pt);
          if (distance < record && distance < this.sight) {
            record = distance;
            closest = pt;
          }
        }
      }
      // Usunięcie samochodu jeżeli długość sensora jest mniejsza niż dwa piksele
      if (record < 2) {
        this.dead = true;
      }
      // WEJŚCIA
      inputs[i] = map(record, 0, 50, 1, 0);
    }
    // WYJŚCIA
    const output = this.brain.predict(inputs);
    // Kąt to wyjście z przedziału 0 - 1, tworzy przedział od 0 do  pi
    let angle = map(output[0], 0, 1, -PI, PI);
    angle += this.vel.heading();
    const steering = p5.Vector.fromAngle(angle);
    steering.setMag(this.maxSpeed);
    steering.sub(this.vel);
    steering.limit(this.maxForce);
    this.applyForce(steering);
  }

  bounds() {
    if (
      this.pos.x > width ||
      this.pos.x < 0 ||
      this.pos.y > height ||
      this.pos.y < 0
    ) {
      this.dead = true;
    }
  }

  // --- Rysowanie pojazdu --- //
  show() {
    push();
    translate(this.pos.x, this.pos.y);
    const heading = this.vel.heading();
    rotate(heading);
    fill(255, 100);
    rectMode(CENTER);
    rect(0, 0, 10, 5);
    pop();
    for (let ray of this.rays) {
      ray.show();
    }
    if (this.goal) {
      this.goal.show();
    }
  }
}
