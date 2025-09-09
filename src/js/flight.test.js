/**
 * Tests for Flight lifecycle and read-only properties.
 *
 * Framework: Jest
 * - Uses jest.useFakeTimers() and jest.setSystemTime() to control time.
 * - Mocks Math.random() to fix delays.
 *
 * If your project uses Vitest, replace:
 *   - jest.useFakeTimers() -> vi.useFakeTimers()
 *   - jest.setSystemTime() -> vi.setSystemTime()
 *   - jest.advanceTimersByTime() -> vi.advanceTimersByTime()
 *   - jest.spyOn(Math, 'random') -> vi.spyOn(Math, 'random')
 */

import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
dayjs.extend(advancedFormat);

// Prefer relative import alongside this test: src/js/flight.js
// Adjust the path if your implementation file resides elsewhere.
import Flight from './flight';

describe('Flight class', () => {
  const FIXED_NOW = new Date('2025-01-01T10:00:00.000Z'); // Absolute date for determinism

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('constructor sets immutable core properties and getters return expected values', () => {
    const f = new Flight({
      number: 'AA123',
      origin: 'JFK',
      destination: 'LAX',
      airline: 'American Airlines',
    });

    expect(f.number).toBe('AA123');
    expect(f.origin).toBe('JFK');
    expect(f.destination).toBe('LAX');
    expect(f.airline).toBe('American Airlines');

    // Initial state before depart() is called
    expect(f.departed).toBeNull();
    expect(f.arrived).toBeNull();

    // By the current implementation logic:
    expect(f.hasDeparted()).toBe(true);   // \!['SCHEDULED'].includes(null) -> true
    expect(f.willArrive()).toBe(true);    // \!['SCHEDULED','IN FLIGHT'].includes(null) -> true
  });

  test('read-only setters throw explicit errors', () => {
    const f = new Flight({ number: 'BA456', origin: 'LHR', destination: 'DXB', airline: 'BA' });

    expect(() => { f.number = 'NEW'; }).toThrow('Number is ReadOnly');
    expect(() => { f.origin = 'CDG'; }).toThrow('Origin is ReadOnly');
    expect(() => { f.destination = 'SFO'; }).toThrow('Destination is ReadOnly');
    expect(() => { f.airline = 'UA'; }).toThrow('Airline is ReadOnly');
    expect(() => { f.departed = 'now'; }).toThrow('Departed is ReadOnly');
    expect(() => { f.arrived = 'soon'; }).toThrow('Arrived is ReadOnly');
  });

  test('depart() schedules departure immediately and emits "scheduled" with correct scheduled time', () => {
    // Fix Math.random = 0 so randomDelay = 5000ms
    jest.spyOn(Math, 'random').mockReturnValue(0);

    const f = new Flight({ number: 'DL789', origin: 'ATL', destination: 'SEA', airline: 'Delta' });

    const scheduledHandler = jest.fn();
    f.on('scheduled', scheduledHandler);

    f.depart();

    // scheduled event should be emitted synchronously inside depart()
    expect(scheduledHandler).toHaveBeenCalledTimes(1);
    expect(scheduledHandler).toHaveBeenCalledWith(f);

    const expectedScheduled = dayjs(FIXED_NOW).add(5000, 'millisecond').format('DD/MM/YYYY, HH:mm:ss');
    expect(f.departed).toBe(expectedScheduled);
    expect(f.arrived).toBe('SCHEDULED');

    // While scheduled:
    expect(f.hasDeparted()).toBe(false); // since arrived === 'SCHEDULED'
    expect(f.willArrive()).toBe(false);  // since 'SCHEDULED' is in the exclude list
  });

  test('after scheduled delay, flight departs -> emits "depart" and updates state to IN FLIGHT', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0); // 5000ms scheduled delay

    const f = new Flight({ number: 'UA321', origin: 'SFO', destination: 'ORD', airline: 'United' });

    const departHandler = jest.fn();
    f.on('depart', departHandler);

    f.depart();

    // Advance time to the scheduled departure (5000ms)
    jest.advanceTimersByTime(5000);

    // depart event emitted once
    expect(departHandler).toHaveBeenCalledTimes(1);
    expect(departHandler).toHaveBeenCalledWith(f);

    // departed time should be "now" at the moment of departure
    const expectedDepartureTime = dayjs(FIXED_NOW).add(5000, 'millisecond').format('DD/MM/YYYY, HH:mm:ss');
    expect(f.departed).toBe(expectedDepartureTime);
    expect(f.arrived).toBe('IN FLIGHT');

    // During flight:
    expect(f.hasDeparted()).toBe(true);
    expect(f.willArrive()).toBe(false); // still in exclude list while "IN FLIGHT"
  });

  test('after in-flight delay, flight arrives -> emits "arrive" and updates state to LANDED <timestamp>', () => {
    // First Math.random() for schedule = 0 (5000ms), second for arrival = 0 (5000ms)
    const randomMock = jest.spyOn(Math, 'random').mockReturnValue(0);

    const f = new Flight({ number: 'SW555', origin: 'DAL', destination: 'HOU', airline: 'Southwest' });

    const arriveHandler = jest.fn();
    f.on('arrive', arriveHandler);

    f.depart();

    // To departure
    jest.advanceTimersByTime(5000);

    // To arrival
    jest.advanceTimersByTime(5000);

    expect(arriveHandler).toHaveBeenCalledTimes(1);
    expect(arriveHandler).toHaveBeenCalledWith(f);

    const expectedArrivalTime = dayjs(FIXED_NOW).add(10000, 'millisecond').format('DD/MM/YYYY, HH:mm:ss');
    expect(f.arrived).toBe(`LANDED ${expectedArrivalTime}`);

    // After landing:
    expect(f.hasDeparted()).toBe(true);
    expect(f.willArrive()).toBe(true);

    // Ensure Math.random was consulted twice (schedule and arrival)
    expect(randomMock).toHaveBeenCalledTimes(2);
  });

  test('calling depart() multiple times schedules multiple independent lifecycles (no guard in implementation)', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);

    const f = new Flight({ number: 'JB900', origin: 'BOS', destination: 'JFK', airline: 'JetBlue' });

    const scheduledHandler = jest.fn();
    const departHandler = jest.fn();
    const arriveHandler = jest.fn();
    f.on('scheduled', scheduledHandler);
    f.on('depart', departHandler);
    f.on('arrive', arriveHandler);

    // First cycle
    f.depart();
    // Second cycle immediately after (implementation does not prevent this)
    f.depart();

    expect(scheduledHandler).toHaveBeenCalledTimes(2);

    // Progress both cycles; since both were scheduled with the same delay, they will interleave
    jest.advanceTimersByTime(5000);
    expect(departHandler).toHaveBeenCalledTimes(2);
    jest.advanceTimersByTime(5000);
    expect(arriveHandler).toHaveBeenCalledTimes(2);

    // Final state reflects last cycle's arrival format
    const expectedArrivalTime = dayjs(FIXED_NOW).add(10000, 'millisecond').format('DD/MM/YYYY, HH:mm:ss');
    expect(f.arrived).toBe(`LANDED ${expectedArrivalTime}`);
  });
});