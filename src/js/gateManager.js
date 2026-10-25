// Hands out departure gates, and queues flights when every gate is taken
export default class GateManager {

    #free = [];
    #occupied = [];
    #waiting = [];

    constructor(terminal = 'A', count = 8) {
        for (let i = 1; i < count; i++) {
            this.#free.push(`${terminal}${i}`);
        }
    }

    get freeCount() { return this.#free.length; }
    get waitingCount() { return this.#waiting.length; }

    // Give the flight a free gate, or put it in the queue for the next one
    request(flight) {
        if (this.#free.length === 0) {
            this.#waiting.push(flight);
            return null;
        }

        const gate = this.#free.shift();
        this.#occupied.push(gate);
        flight.assignGate(gate);
        return gate;
    }

    // Free the flight's gate and hand it straight to the next queued flight
    release(flight) {
        const gate = flight.gate;
        this.#occupied.splice(this.#occupied.indexOf(gate), 1);

        const next = this.#waiting.pop();
        if (next) {
            this.#occupied.push(gate);
            next.assignGate(gate);
        } else {
            this.#free.push(gate);
        }
    }
}
