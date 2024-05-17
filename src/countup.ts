type CountUpOpts = {
  name: string
  project_name: string
  description: string
  date: string
  seconds: number
}

class CountUp {
  name: string
  project_name: string
  description: string
  date: string
  seconds: number
  tick: NodeJS.Timeout | null = null
  count: number
  isActive: boolean

  constructor(opts: CountUpOpts) {
    this.name = opts.name
    this.project_name = opts.project_name
    this.description = opts.description
    this.date = opts.date
    this.seconds = opts.seconds
    this.isActive = false
  }

  start() {
    this.isActive = true
    this.tick = setInterval(() => {
      this.increment()
    }, 1000)
  }

  pause() {
    clearInterval(this.tick)
    this.tick = null
    this.isActive = false
  }

  stop() {
    clearInterval(this.tick)
    this.tick = null
    this.isActive = false
  }

  increment() {
    this.seconds++
  }
}

export { CountUp }
