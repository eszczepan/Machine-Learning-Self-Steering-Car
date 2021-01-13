function nextGeneration() {
  calculateFitness();
  // Pętla po każdym pojeździe w populacji
  function calculateFitness() {
    for (let vehicle of savedVehicles) {
      vehicle.calculateFitness();
    }
    // Normalizowanie wszystkich wartości
    let sum = 0;
    for (let vehicle of savedVehicles) {
      sum += vehicle.fitness;
    }
    for (let vehicle of savedVehicles) {
      vehicle.fitness = vehicle.fitness / sum;
    }
    for (let i = 0; i < TOTAL; i++) {
      population[i] = pickOne();
    }
    // Dispose używa się do zarządzania pamięcią oraz wyczyszczenie matczynej tablicy
    for (let i = 0; i < TOTAL; i++) {
      savedVehicles[i].dispose();
    }
    savedVehicles = [];
  }
  function pickOne() {
    let index = 0;
    let r = random(1);
    while (r > 0) {
      r = r - savedVehicles[index].fitness;
      index++;
    }
    index--;
    let vehicle = savedVehicles[index];
    let child = new Vehicle(vehicle.brain);
    child.mutate();
    return child;
  }
}
