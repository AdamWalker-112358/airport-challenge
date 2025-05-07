import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat'; dayjs.extend(advancedFormat);
import { EventEmitter } from 'events';

export default class Flight extends EventEmitter  {
    #departed = null;
    #arrived = null;
    #number = null;
    #origin = null;
    #destination = null;
    #isDelayed = false;
    #delayTime = null;
    
    constructor({ number, origin, destination }) {
        super();
        this.#number = number;
        this.#origin = origin;
        this.#destination = destination;
    }

    // Getters and setters
    set number(value) {throw new Error("Number is ReadOnly")}
    get number() {return this.#number;}

    set origin(value) { throw new Error("Origin is ReadOnly")}
    get origin() {return this.#origin;}

    set destination(value) {throw new Error("Destination is ReadOnly")}
    get destination() { return this.#destination; }
    
    get departed() { return this.#departed }
    set departed(value) { throw new Error("Departed is ReadOnly") }
    
    get arrived() { return this.#arrived }
    set arrived(value){throw new Error("Arrived is ReadOnly")}

    get isDelayed() { return this.#isDelayed }
    get delayTime() { return this.#delayTime }


    depart() {
        // Base delay for all flights
        let randomDelay = Math.random() * 8000 + 5000;
        
        // Randomly select flights for additional delay (20% chance)
        if (Math.random() < 0.2) {
            this.#isDelayed = true;
            // Additional delay between 5-15 seconds
            this.#delayTime = Math.floor(Math.random() * 10000 + 5000);
            randomDelay += this.#delayTime;
        }

        let scheduledDepartureTime = dayjs().add(randomDelay, 'milliseconds').format("DD/MM/YYYY, HH:mm:ss");
        
        this.#departed = scheduledDepartureTime;
        this.#arrived = 'SCHEDULED';

        this.emit('scheduled', this)

        // Depart at scheduled time and arrive at random time
        setTimeout(() => {
            
            this.#departed = dayjs().format("DD/MM/YYYY, HH:mm:ss");
            this.#arrived = 'IN FLIGHT'
            this.emit('depart', this)

            setTimeout(() => {
                this.#arrive();
            }, Math.random() * 8000 + 5000)
        }, randomDelay)

    }

    #arrive() {
        let arrivalTime = dayjs().format("DD/MM/YYYY, HH:mm:ss");
        this.#arrived = `LANDED ${arrivalTime}`;
        this.emit('arrive', this);
    }

    willArrive() {
        return !['SCHEDULED', 'IN FLIGHT'].includes(this.#arrived);
    }

    hasDeparted() {
        return !['SCHEDULED'].includes(this.#arrived);
    }


}
