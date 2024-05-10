class CountUp {
  constructor(name, projectName, date, seconds = 0) {
    this.name = name;
    this.projectName = projectName;
    this.date = date;
    this.seconds = seconds;
  }

  start() {
    this.tick = setInterval(() => {
      this.increment();
    }, 1000);
  }

  stop() {
    clearInterval(this.tick);
    this.tick = null
  }

  isRunning() {
    return this.tick !== null
  }

  toggle() {
    if (this.tick) {
      this.stop();
    } else {
      this.start();
    }
  }

  increment() {
    this.seconds++;
  }

  getSeconds() {
    return this.count;
  }

  getTime() {
    const hours = Math.floor(this.seconds / 3600);
    const minutes = Math.floor((this.seconds % 3600) / 60);
    const seconds = this.seconds % 60;
    return `${hours}:${minutes}:${seconds}`;
  }
}

module.exports = {
  CountUp,
};
