const regions = {
  uzbekistan: { name: 'Uzbekistan', climate: 'Mostly dry', multiplier: 1.10 },
  brazil: { name: 'Brazil', climate: 'Often humid', multiplier: 0.96 },
  russia: { name: 'Russia', climate: 'Varied', multiplier: 1.02 },
  'south-korea': { name: 'South Korea', climate: 'Seasonal', multiplier: 1.00 },
  'saudi-arabia': { name: 'Saudi Arabia', climate: 'Arid', multiplier: 1.14 },
  'great-britain': { name: 'Great Britain', climate: 'Often humid', multiplier: 0.96 },
  france: { name: 'France', climate: 'Temperate', multiplier: 0.99 },
  italy: { name: 'Italy', climate: 'Temperate', multiplier: 1.00 },
  spain: { name: 'Spain', climate: 'Often dry', multiplier: 1.04 },
}

const BASE_BLINKS_PER_MINUTE = 15.5
const SCREEN_UPLIFT = 0.20
const SPORT_UPLIFT = 0.12
const SLEEP_PENALTY_PER_HOUR_BELOW_EIGHT = 0.04

const form = document.querySelector('#blink-form')
const regionInput = document.querySelector('#region')
const sleepInput = document.querySelector('#sleep')
const screenInput = document.querySelector('#screen')
const sportInput = document.querySelector('#sport')
const formError = document.querySelector('#form-error')
const output = {
  count: document.querySelector('#result-title'),
  rate: document.querySelector('#rate-per-minute'),
  climate: document.querySelector('#climate-effect'),
  sleep: document.querySelector('#sleep-effect'),
  screen: document.querySelector('#screen-effect'),
  sport: document.querySelector('#sport-effect'),
  awake: document.querySelector('#awake-hours'),
  climateHint: document.querySelector('#climate-hint'),
}

function readHours(input) {
  return input.value === '' ? Number.NaN : input.valueAsNumber
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)
}

function formatAdjustment(value) {
  const percent = Math.round((value - 1) * 100)
  return `${percent > 0 ? '+' : ''}${percent}%`
}

function updateEstimate() {
  const sleep = readHours(sleepInput)
  const screen = readHours(screenInput)
  const sport = readHours(sportInput)
  const awake = 24 - sleep
  const region = regions[regionInput.value]
  const values = [
    { input: sleepInput, value: sleep, min: 0, max: 14, name: 'Sleep' },
    { input: screenInput, value: screen, min: 0, max: 16, name: 'Computer time' },
    { input: sportInput, value: sport, min: 0, max: 12, name: 'Sports time' },
  ]
  const invalid = values.find(({ value, min, max }) => !Number.isFinite(value) || value < min || value > max)
  const hoursOverbooked = Number.isFinite(awake) && Number.isFinite(screen) && Number.isFinite(sport) && screen + sport > awake

  values.forEach(({ input, value, min, max }) => {
    const invalidValue = !Number.isFinite(value) || value < min || value > max
    const invalidSchedule = hoursOverbooked && (input === screenInput || input === sportInput)
    input.setAttribute('aria-invalid', String(invalidValue || invalidSchedule))
  })

  output.climateHint.textContent = `${region.climate} climate estimate for ${region.name}.`

  if (invalid || hoursOverbooked) {
    formError.hidden = false
    formError.textContent = hoursOverbooked
      ? 'Computer and sports hours together can’t exceed your waking hours.'
      : `${invalid.name} must be between ${invalid.min} and ${invalid.max} hours.`
    output.count.textContent = '—'
    output.rate.textContent = '—'
    output.climate.textContent = '—'
    output.sleep.textContent = '—'
    output.screen.textContent = '—'
    output.sport.textContent = '—'
    output.awake.textContent = Number.isFinite(awake) && awake >= 0 ? `${awake.toFixed(1).replace(/\.0$/, '')} hours` : '—'
    return
  }

  formError.hidden = true
  const generalAwakeHours = awake - screen - sport
  const sleepAdjustment = 1 + Math.max(0, 8 - sleep) * SLEEP_PENALTY_PER_HOUR_BELOW_EIGHT
  const baselineRate = BASE_BLINKS_PER_MINUTE * region.multiplier * sleepAdjustment
  const total = baselineRate * 60 * (
    generalAwakeHours +
    screen * (1 + SCREEN_UPLIFT) +
    sport * (1 + SPORT_UPLIFT)
  )
  const averageRate = total / (awake * 60)

  output.count.textContent = formatNumber(total)
  output.rate.textContent = averageRate.toFixed(1).replace(/\.0$/, '')
  output.climate.textContent = formatAdjustment(region.multiplier)
  output.sleep.textContent = formatAdjustment(sleepAdjustment)
  output.screen.textContent = screen > 0 ? `+${Math.round(SCREEN_UPLIFT * 100)}% while working` : 'No computer hours'
  output.sport.textContent = sport > 0 ? `+${Math.round(SPORT_UPLIFT * 100)}% while active` : 'No sports hours'
  output.awake.textContent = `${awake.toFixed(1).replace(/\.0$/, '')} hours`
  output.climateHint.textContent = `${region.climate} climate estimate for ${region.name}.`
}

form.addEventListener('input', updateEstimate)
form.addEventListener('change', updateEstimate)
updateEstimate()
