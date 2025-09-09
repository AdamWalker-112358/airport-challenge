/**
 * Framework: Jest (jsdom environment assumed)
 * These tests validate DOM interactions, table rendering, updates, counters, and the live clock behavior.
 */

import { jest } from '@jest/globals'

// Mock dayjs with deterministic outputs; preserve plugin extend behavior
jest.unstable_mockModule('dayjs', () => {
  const actual = jest.requireActual('dayjs')
  const mockFn = () => ({
    format: jest.fn(() => 'Monday, 1st January 2024 | 00:00:00'),
  })
  // Attach extend and plugin behavior
  mockFn.extend = actual.extend
  mockFn.default = mockFn
  return {
    __esModule: true,
    default: mockFn,
  }
})

// advancedFormat plugin is not used directly in tests; keep as pass-through
jest.unstable_mockModule('dayjs/plugin/advancedFormat', () => ({ __esModule: true, default: jest.fn(() => ({})) }))

const { default: FlightBoard } = await import('../flightBoard.js')

describe('FlightBoard', () => {
  beforeEach(() => {
    // Fresh DOM scaffold for each test
    document.body.innerHTML = `
      <section class="flight-board"></section>
      <div class="flight-clock"></div>
      <div class="arrivals"></div>
      <div class="departures"></div>
    `
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-01-01T00:00:00Z'))
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    document.body.innerHTML = ''
  })

  const sampleFlight = () => ({
    number: 'AB123',
    airline: 'Alpha Airlines',
    origin: 'SFO',
    destination: 'JFK',
    departed: '08:15',
    arrived: '16:45',
  })

  test('constructor mounts table with header and starts clock', () => {
    const fb = new FlightBoard()

    const table = document.querySelector('.flight-board .flight-table')
    expect(table).toBeTruthy()

    const headers = Array.from(table.querySelectorAll('tr th')).map((th) => th.textContent)
    expect(headers).toEqual(['ID', 'Airline', 'Origin', 'Destination', 'Departed', 'Arrived'])

    // Initial clock render uses mocked dayjs
    const clock = document.querySelector('.flight-clock')
    expect(clock.textContent).toBe('⏰ Monday, 1st January 2024 | 00:00:00')
  })

  test('postFlight appends a new row with correct cells and scheduled class on arrival cell', () => {
    const fb = new FlightBoard()
    fb.postFlight(sampleFlight())

    const rows = document.querySelectorAll('.flight-board .flight-table tr')
    // 1 header + 1 data row
    expect(rows.length).toBe(2)

    const cells = rows[1].querySelectorAll('td')
    expect(Array.from(cells).map((c) => c.textContent)).toEqual([
      'AB123',
      'Alpha Airlines',
      'SFO',
      'JFK',
      '08:15',
      '16:45',
    ])
    expect(cells[5].className).toBe('scheduled')
  })

  test('updateFlight replaces an existing row by flight number and applies state class to arrived cell', () => {
    const fb = new FlightBoard()
    fb.postFlight(sampleFlight())

    const updated = { ...sampleFlight(), airline: 'Beta Air', arrived: '17:10' }
    fb.updateFlight(updated, 'landed')

    const rows = document.querySelectorAll('.flight-board .flight-table tr')
    expect(rows.length).toBe(2)

    const cells = rows[1].querySelectorAll('td')
    expect(cells[0].textContent).toBe('AB123')
    expect(cells[1].textContent).toBe('Beta Air')
    expect(cells[5].textContent).toBe('17:10')
    expect(cells[5].className).toBe('landed')
  })

  test('updateFlight when flight not present throws or fails predictably (defensive check)', () => {
    const fb = new FlightBoard()
    // No rows posted; replaceChild should throw because oldFlightRow is undefined
    expect(() => fb.updateFlight(sampleFlight(), 'landed')).toThrow()
  })

  test('displayArrivals updates arrivals panel with correct format', () => {
    const fb = new FlightBoard()
    fb.displayArrivals(9)
    expect(document.querySelector('.arrivals').textContent).toBe('Arrivals 🛬 | 9 of 27 Arrived')
  })

  test('displayDepartures updates departures panel with correct format', () => {
    const fb = new FlightBoard()
    fb.displayDepartures(12)
    expect(document.querySelector('.departures').textContent).toBe('Departures 🛫 | 12 of 27 Departed')
  })

  test('flight clock updates every second via setInterval', async () => {
    const dayjsMod = await import('dayjs')
    const dayjsMock = dayjsMod.default

    const fb = new FlightBoard()
    const clock = document.querySelector('.flight-clock')

    // First render
    expect(clock.textContent).toBe('⏰ Monday, 1st January 2024 | 00:00:00')

    // Change mock dayjs format return for subsequent ticks
    // Redefine default() to return object with a different format value each call
    let tick = 0
    dayjsMock.mockImplementation(() => ({
      format: jest.fn(() => (tick === 0 ? 'Monday, 1st January 2024 | 00:00:01' : 'Monday, 1st January 2024 | 00:00:02')),
    }))

    // Advance first second
    tick = 0
    jest.advanceTimersByTime(1000)
    expect(clock.textContent).toBe('⏰ Monday, 1st January 2024 | 00:00:01')

    // Advance another second
    tick = 1
    jest.advanceTimersByTime(1000)
    expect(clock.textContent).toBe('⏰ Monday, 1st January 2024 | 00:00:02')
  })

  test('multiple posts and updates maintain correct row count and ordering', () => {
    const fb = new FlightBoard()
    const f1 = { number: 'AA001', airline: 'A', origin: 'LAX', destination: 'SFO', departed: '07:00', arrived: '08:20' }
    const f2 = { number: 'BB002', airline: 'B', origin: 'SEA', destination: 'ORD', departed: '09:10', arrived: '14:55' }

    fb.postFlight(f1)
    fb.postFlight(f2)

    let rows = Array.from(document.querySelectorAll('.flight-board .flight-table tr'))
    expect(rows).toHaveLength(3)

    // Update second flight; ensure replacement happens in-place
    const updatedF2 = { ...f2, arrived: '15:05' }
    fb.updateFlight(updatedF2, 'delayed')

    rows = Array.from(document.querySelectorAll('.flight-board .flight-table tr'))
    expect(rows).toHaveLength(3)

    const secondDataRow = rows[2].querySelectorAll('td')
    expect(secondDataRow[0].textContent).toBe('BB002')
    expect(secondDataRow[5].textContent).toBe('15:05')
    expect(secondDataRow[5].className).toBe('delayed')
  })

  test('postFlight handles minimal/empty strings gracefully', () => {
    const fb = new FlightBoard()
    fb.postFlight({ number: '', airline: '', origin: '', destination: '', departed: '', arrived: '' })

    const cells = document.querySelectorAll('.flight-board .flight-table tr')[1].querySelectorAll('td')
    expect(Array.from(cells).map((c) => c.textContent)).toEqual(['', '', '', '', '', ''])
    expect(cells[5].className).toBe('scheduled')
  })
})