// --- Funkcja obliczająca dystans do checkpointa --- //
function pldistance(p1, p2, x, y) {
  const num = abs(
    (p2.y - p1.y) * x - (p2.x - p1.x) * y + p2.x * p1.y - p2.y * p1.x
  );
  const den = p5.Vector.dist(p1, p2);
  return num / den;
}

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
    this.maxForce = 1;
    this.sight = SIGHT;
    this.rays = [];
    this.index = 0;
    this.counter = 0;
    this.goal;

    // --- Tworzenie sensorów dla pojazdów --- //
    for (let a = 0; a < 360; a += 45) {
      this.rays.push(new Ray(this.pos, radians(a)));
    }

    // --- Tworzenie sieci neuronowej dla pojazdów jeżeli nie są pierwszą generacją (wynika z alg. genetycznego--- //
    if (brain) {
      this.brain = brain.copy();
    } else {
      // Sieć ma 8 wejść i warstwy ukrytej (tyle co sensorów) i jedno wyjście
      this.brain = new NeuralNetwork(
        this.rays.length + 2,
        this.rays.length + 2,
        1
      );
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
    }

    if (this.counter > LIFESPAN) {
      this.dead = true;
    }
  }

  // --- Sprawdza czy dystans pomiędzy pozycją a dystansem jest mniejszy niż 10 px --- //
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

  calculateFitness() {
    this.fitness = pow(2, this.index);
    // if (this.finished) {
    // } else {
    //   const distance = p5.Vector.dist(this.pos, target);
    //   this.fitness = constrain(1 / distance, 0, 1);
    // }
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
      // if (closest) {
      //   stroke(255, 100);
      //   line(this.pos.x, this.pos.y, closest.x, closest.y);
      // }
    }

    // Normalizacja velocity
    const vel = this.vel.copy();
    vel.normalize();
    inputs.push(vel.x);
    inputs.push(vel.y);

    // Wyjścia
    const output = this.brain.predict(inputs);
    // Kąt to wyjście z przedziału 0 - 1, tworzy przedział od 0 do dwa pi
    const angle = map(output[0], 0, 1, 0, TWO_PI);
    const steering = p5.Vector.fromAngle(angle);
    steering.setMag(this.maxSpeed);
    steering.sub(this.vel);
    // steering.limit(this.maxForce);
    this.applyForce(steering);
    // console.log(output);
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
      // ray.show();
    }
    if (this.goal) {
      this.goal.show();
    }
  }
}
