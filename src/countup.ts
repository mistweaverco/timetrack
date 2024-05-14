type CountUpOpts = {
  name: string,
  project_name: string,
  description: string,
  date: string,
  seconds: number,
}

class CountUp {
  name: string;
  project_name: string;
  description: string;
  date: string;
  seconds: number;
  tick: NodeJS.Timeout | null = null;
  count: number;

  constructor(opts: CountUpOpts) {
    this.name = opts.name;
    this.project_name = opts.project_name;
    this.description = opts.description;
    this.date = opts.date;
    this.seconds = opts.seconds;
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

  isActive() {
    return this.tick !== null
  }

  increment() {
    this.seconds++;
  }
}

export {
  CountUp,
};
