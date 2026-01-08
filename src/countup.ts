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
    this.count = 0
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
    if (!this.isActive) return
    if (this.tick === null) return
    clearInterval(this.tick)
    this.tick = null
    this.isActive = false
  }

  stop() {
    if (!this.isActive) return
    if (this.tick === null) return
    clearInterval(this.tick)
    this.tick = null
    this.isActive = false
  }

  increment() {
    this.seconds++
  }
}

export { CountUp }
