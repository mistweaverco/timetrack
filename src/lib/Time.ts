export const convertSecondsToTime = (s: number) => {
  const hours = String(Math.floor(s / 3600))
  const minutes = String(Math.floor((s % 3600) / 60))
  const seconds = String(s % 60)
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`
}

export const convertTimeToSeconds = (
  hours: string,
  minutes: string,
  seconds: string,
) => {
  return (
    parseInt(hours, 10) * 3600 +
    parseInt(minutes, 10) * 60 +
    parseInt(seconds, 10)
  )
}

export const convertTimestringToSeconds = (timestring: string) => {
  const [hours, minutes, seconds] = timestring.split(':')
  return convertTimeToSeconds(hours, minutes, seconds)
}
