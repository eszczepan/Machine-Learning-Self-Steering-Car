class Particle {
  constructor(brain) {
    // --- Właściwości pojazdu --- //
    this.dead = false;
    this.finished = false;
    this.fitness = 0;
    this.pos = createVector(start.x, start.y);
    this.vel = createVector();
    this.acc = createVector();
    this.maxSpeed = 3;
    this.maxForce = 0.1;
    this.sight = 50;
    this.rays = [];
    // --- Właściwości pojazdu --- //

    // --- Tworzenie sensorów dla pojazdów --- //
    for (let a = 0; a < 360; a += 45) {
      this.rays.push(new Ray(this.pos, radians(a)));
    }

    // --- Tworzenie sieci neuronowej dla pojazdów jeżeli nie są pierwszą generacją (wynika z alg. genetycznego--- //
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
    }
  }

  // --- Sprawdza czy dystans pomiędzy pozycją a dystansem jest mniejszy niż 10 px --- //
  check(target) {
    const distance = p5.Vector.dist(this.pos, target);
    if (distance < 10) {
      this.finished = true;
    }
  }

  calculateFitness(target) {
    if (this.finished) {
      this.fitness = 1;
    } else {
      const distance = p5.Vector.dist(this.pos, target);
      this.fitness = constrain(1 / distance, 0, 1);
    }
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

      // --- Usunięcie samochodu jeżeli długość sensora jest mniejsza niż dwa piksele --- //
      if (record < 2) {
        this.dead = true;
      }

      // --- Zamiana na 0 i 1. Jeżeli zanotowany dystans sensora (record) jest między 0 a 50 to input = 0, jeżeli jest mniejszy od 0 to input = 1 --- //
      inputs[i] = map(record, 0, 50, 1, 0);

      // --- Rysowanie lini --- //
      if (closest) {
        // stroke(255, 100);
        // line(this.pos.x, this.pos.y, closest.x, closest.y);
      }
    }

    // Wyjścia
    const output = this.brain.predict(inputs);
    // Kąt to wyjście z przedziału 0 - 1, tworzy przedział od 0 do dwa pi
    const angle = map(output[0], 0, 1, 0, TWO_PI);
    const steering = p5.Vector.fromAngle(angle);
    steering.setMag(this.maxSpeed);
    steering.sub(this.vel);
    steering.limit(this.maxForce);
    this.applyForce(steering);
    // console.log(output);
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
      // ray.show();
    }
  }
}
