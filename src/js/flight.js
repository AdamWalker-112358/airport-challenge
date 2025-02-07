import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat'; 
dayjs.extend(advancedFormat);
import { EventEmitter } from 'events';

export default class Flight extends EventEmitter {
    #departed = null;
    #arrived = null;
    #number = null;
    #origin = null;
    #destination = null;
    #delayReason = null;
    #originalDepartureTime = null;
    
    constructor({ number, origin, destination }) {
        super();
        this.#number = number;
        this.#origin = origin;
        this.#destination = destination;
    }

    // Getters and setters
    set number(value) { throw new Error("Number is ReadOnly") }
    get number() { return this.#number; }

    set origin(value) { throw new Error("Origin is ReadOnly") }
    get origin() { return this.#origin; }

    set destination(value) { throw new Error("Destination is ReadOnly") }
    get destination() { return this.#destination; }
    
    get departed() { return this.#departed }
    set departed(value) { throw new Error("Departed is ReadOnly") }
    
    get arrived() { return this.#arrived }
    set arrived(value) { throw new Error("Arrived is ReadOnly") }

    get delayReason() { return this.#delayReason; }
    get originalDepartureTime() { return this.#originalDepartureTime; }

    depart() {
        // Schedule random departure time
        let randomDelay = Math.random() * 8000 + 5000;
        this.#originalDepartureTime = dayjs().add(randomDelay, 'milliseconds').format("DD/MM/YYYY, HH:mm:ss");
        
        // Randomly decide if the flight will be delayed
        if (Math.random() < 0.3) { // 30% chance of delay
            this.#delayReason = this.#getRandomDelayReason();
            randomDelay += Math.random() * 10000; // Add up to 10 seconds delay
        }

        this.#departed = this.#originalDepartureTime;
        this.#arrived = 'SCHEDULED';

        this.emit('scheduled', this);

        // Depart at scheduled time and arrive at random time
        setTimeout(() => {
            this.#departed = dayjs().format("DD/MM/YYYY, HH:mm:ss");
            this.#arrived = 'IN FLIGHT';
            this.emit('depart', this);

            setTimeout(() => {
                this.#arrive();
            }, Math.random() * 8000 + 5000);
        }, randomDelay);
    }

    #arrive() {
        let arrivalTime = dayjs().format("DD/MM/YYYY, HH:mm:ss");
        this.#arrived = `LANDED ${arrivalTime}`;
        this.emit('arrive', this);
    }

    hasArrived() {
        return !['SCHEDULED', 'IN FLIGHT'].includes(this.#arrived);
    }

    hasDeparted() {
        return !['SCHEDULED'].includes(this.#arrived);
    }

    #getRandomDelayReason() {
        const reasons = ['Weather conditions', 'Technical faults', 'Air traffic control'];
        return reasons[Math.floor(Math.random() * reasons.length)];
    }
}