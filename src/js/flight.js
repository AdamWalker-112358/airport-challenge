import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat'; dayjs.extend(advancedFormat);
import { EventEmitter } from 'events';

export default class Flight extends EventEmitter  {
    #departed = null;
    #arrived = null;
    _number = 0;
    _origin = 0;
    _destination = '';
    
    constructor({ number, origin, destination }) {
        super();
        this.number = number;
        this.origin = origin;
        this.destination = destination;
    }

    set number(value) {
        if ( Number.isNaN(Number(value)) ) throw new Error("Flight number can only contain numeric values");
        this._number = value;
    }

    get number() {
        return this._number;
    }

    set origin(value) {
        this._origin = value;
    }

    get origin() {
        return this._origin;
    }

    set destination(value) {
        this._destination = value;
    }

    get destination() {
        return this._destination;
    }

    depart() {
        setTimeout(() => {
            this.#departed = dayjs().format("DD/MM/YYYY, HH:mm:ss");
            this.emit('depart', {number: this.number,origin: this.origin, destination: this.destination, departed: this.#departed, arrived: 'In Flight'})
            setTimeout(() => {
                this.#arrive();
            }, Math.random() * 8000 + 5000)
        }, Math.random() * 8000 + 5000)

    }

    #arrive() {
        this.#arrived = dayjs().format("DD/MM/YYYY, HH:mm:ss");
        this.emit('arrive', {number: this.number,origin: this.origin, destination: this.destination, departed: this.#departed, arrived: this.#arrived})
    }

    hasArrived() {
        return !!this.#arrived;
    }

    hasDeparted() {
        return !!this.#departed;
    }


}