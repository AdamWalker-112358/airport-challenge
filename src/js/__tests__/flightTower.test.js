/**
 * Tests for FlightTower
 * Framework: Jest
 *
 * We mock:
 *  - ./flight: to control event emissions and state (hasDeparted/hasArrived)
 *  - ./flightBoard: to spy on side-effects (postFlight, displayDepartures/Arrivals, updateFlight)
 *  - ../flights-data.json: to control input data deterministically
 *
 * We validate:
 *  - Proper airline mapping via createAirlineMap (indirectly through Flight ctor args)
 *  - dispatchFlights orchestrates creation, event wiring, and side-effects with delays
 *  - count getter and read-only setter semantics
 *  - departedCount and arrivedCount tracking
 *  - destinations uniqueness aggregation
 */

jest.useFakeTimers();

const mockFlightsData = {
  airlines: [
    { code: "AA", name: "American Airlines" },
    { code: "DL", name: "Delta Air Lines" },
  ],
  flights: [
    { number: "AA100", origin: "JFK", destination: "LAX", airline: "AA" },
    { number: "DL200", origin: "ATL", destination: "LAX", airline: "DL" },
    { number: "AA300", origin: "JFK", destination: "SFO", airline: "AA" },
  ],
};

// FlightBoard mock: capture calls
const postFlight = jest.fn();
const displayDepartures = jest.fn();
const displayArrivals = jest.fn();
const updateFlight = jest.fn();

jest.mock('../flightBoard', () => {
  return jest.fn().mockImplementation(() => ({
    postFlight: (...args) => postFlight(...args),
    displayDepartures: (...args) => displayDepartures(...args),
    displayArrivals: (...args) => displayArrivals(...args),
    updateFlight: (...args) => updateFlight(...args),
  }));
});

// Flight mock: registers handlers via on(), and depart() triggers events.
// We'll simulate event flow: scheduled -> depart -> arrive
// hasDeparted/hasArrived reflect state transitions.
const flightInstances = [];
const FlightMock = jest.fn().mockImplementation((props) => {
  const handlers = {};
  let departed = false;
  let arrived = false;

  return {
    props,
    on: (evt, cb) => {
      handlers[evt] = cb;
    },
    depart: () => {
      // Emit scheduled immediately (as soon as flight is dispatched)
      if (handlers['scheduled']) handlers['scheduled'](api);
      // Emit depart immediately
      departed = true;
      if (handlers['depart']) handlers['depart']({ number: props.number });
      // Emit arrive on next tick to allow counts to change between stages
      Promise.resolve().then(() => {
        arrived = true;
        if (handlers['arrive']) handlers['arrive']({ number: props.number });
      });
    },
    hasDeparted: () => departed,
    hasArrived: () => arrived,
  };

  function api() {
    return null;
  }
});
jest.mock('../flight', () => ({
  __esModule: true,
  default: (...args) => FlightMock(...args),
}));

// Mock data file
jest.mock('../../flights-data.json', () => mockFlightsData, { virtual: true });

// Import after mocks are set up
import FlightTower from '../flightTower';
import FlightBoard from '../flightBoard';
import Flight from '../flight';
import flightsData from '../../flights-data.json';

describe('FlightTower', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset fake timers to modern implementation per test
    jest.useFakeTimers();
    // Clear any instances tracked from previous tests
    flightInstances.length = 0;
  });

  test('constructor initializes flightBoard and airline map from flights-data.json', () => {
    const tower = new FlightTower();
    expect(tower.flightBoard).toBeInstanceOf(FlightBoard);

    // Airline mapping should translate codes to names
    // We exercise this indirectly by dispatching one step to create a flight and inspect ctor args
    tower.dispatchFlights();

    // Advance timers by one delay to trigger first flight creation (100ms)
    jest.advanceTimersByTime(100);

    // Validate a Flight was constructed with mapped airline name
    expect(Flight).toHaveBeenCalled();
    const firstCallArgs = Flight.mock.calls[0][0];
    expect(firstCallArgs).toMatchObject({
      number: flightsData.flights[0].number,
      origin: flightsData.flights[0].origin,
      destination: flightsData.flights[0].destination,
      airline: "American Airlines",
    });
  });

  test('dispatchFlights adds flights gradually with 100ms intervals and wires event handlers', async () => {
    const tower = new FlightTower();
    tower.dispatchFlights();

    // No flights immediately (async dispatch not awaited)
    expect(tower.count).toBe(0);

    // First flight after 100ms
    jest.advanceTimersByTime(100);
    // Let microtasks (arrive event) run
    await Promise.resolve();

    expect(tower.count).toBe(1);
    expect(postFlight).toHaveBeenCalledTimes(1);
    // After depart and arrive, display calls should have been made
    expect(displayDepartures).toHaveBeenCalledTimes(1);
    expect(displayArrivals).toHaveBeenCalledTimes(1);
    // updateFlight called with correct statuses
    expect(updateFlight).toHaveBeenCalledWith({ number: flightsData.flights[0].number }, 'in-flight');
    expect(updateFlight).toHaveBeenCalledWith({ number: flightsData.flights[0].number }, 'landed');

    // Second flight after another 100ms
    jest.advanceTimersByTime(100);
    await Promise.resolve();

    expect(tower.count).toBe(2);
    expect(postFlight).toHaveBeenCalledTimes(2);
    expect(displayDepartures).toHaveBeenCalledTimes(2);
    expect(displayArrivals).toHaveBeenCalledTimes(2);

    // Third flight after another 100ms
    jest.advanceTimersByTime(100);
    await Promise.resolve();

    expect(tower.count).toBe(3);
    expect(postFlight).toHaveBeenCalledTimes(3);
    expect(displayDepartures).toHaveBeenCalledTimes(3);
    expect(displayArrivals).toHaveBeenCalledTimes(3);

    // Ensure no extra dispatches
    jest.runOnlyPendingTimers();
    await Promise.resolve();
    expect(tower.count).toBe(3);
  });

  test('count getter returns number of flights, and setter is read-only', () => {
    const tower = new FlightTower();
    tower.dispatchFlights();

    jest.advanceTimersByTime(300);
    expect(tower.count).toBe(3);

    expect(() => {
      // @ts-ignore intentional misuse to test runtime error
      tower.count = 42;
    }).toThrow(/Count is ReadOnly/);
  });

  test('departedCount and arrivedCount reflect event-driven state', async () => {
    const tower = new FlightTower();
    tower.dispatchFlights();

    // After first flight processed
    jest.advanceTimersByTime(100);
    // depart emitted sync; arrive on next microtask
    expect(tower.departedCount).toBe(1);
    expect(tower.arrivedCount).toBe(0);

    await Promise.resolve();
    expect(tower.arrivedCount).toBe(1);

    // After all flights
    jest.advanceTimersByTime(200);
    await Promise.resolve();

    expect(tower.departedCount).toBe(3);
    expect(tower.arrivedCount).toBe(3);
  });

  test('destinations returns unique list of destinations', async () => {
    const tower = new FlightTower();
    tower.dispatchFlights();

    jest.advanceTimersByTime(300);
    await Promise.resolve();

    const dests = tower.destinations;
    // We expect two uniques: LAX and SFO
    expect(dests.sort()).toEqual(['LAX', 'SFO'].sort());
  });

  test('flightBoard receives up-to-date counts when events fire', async () => {
    const tower = new FlightTower();
    tower.dispatchFlights();

    // Process all three flights
    jest.advanceTimersByTime(300);

    // After timers but before microtasks, arrivals are not yet counted for the last tick
    expect(displayDepartures).toHaveBeenCalledTimes(3);
    // Each call to displayDepartures should receive current departedCount
    const departArgs = displayDepartures.mock.calls.map(args => args[0]);
    expect(departArgs).toEqual([1, 2, 3]);

    // Let microtasks (arrivals) resolve
    await Promise.resolve();

    expect(displayArrivals).toHaveBeenCalledTimes(3);
    const arriveArgs = displayArrivals.mock.calls.map(args => args[0]);
    expect(arriveArgs).toEqual([1, 2, 3]);
  });

  test('handles unexpected empty flights-data.json gracefully (no flights dispatched)', () => {
    // Override module mock for this test
    jest.doMock('../../flights-data.json', () => ({
      airlines: [],
      flights: [],
    }), { virtual: true });

    // Re-import FlightTower with the new mocked data context
    // Note: require() to bypass ESM hoisting in Jest environment
    const FT = require('../flightTower').default;
    const tw = new FT();
    tw.dispatchFlights();

    // Even after advancing timers, nothing should be added
    jest.advanceTimersByTime(500);
    expect(tw.count).toBe(0);
    expect(postFlight).not.toHaveBeenCalled();
    expect(displayDepartures).not.toHaveBeenCalled();
    expect(displayArrivals).not.toHaveBeenCalled();
  });
});