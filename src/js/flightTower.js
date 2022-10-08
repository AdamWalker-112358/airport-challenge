import Flight from './flight';
import FlightBoard from './flightBoard';

import flightsData from '../flights-data.json';


export default class FlightTower {

    flights = [];

    constructor() {
        
        const flightBoard = document.querySelector('.flight-board')
        this.flightBoard = new FlightBoard(flightBoard, this);
        this.flightBoard.displayFlightClock();

    }

    dispatchFlights() {
        for (let flightData of flightsData.flights) {
            let flight = new Flight({ number: flightData.number, origin: flightData.origin, destination: flightData.destination })
            flight.depart()
            flight.on('arrive', (event) => {
                this.flightBoard.postFlight(event)

                this.flightBoard.displayFlightCount(this.arrivedCount)
            })
            this.flights.push(flight)  
        }

    }

    get count() {
        return this.flights.length;
    }

    get arrivedCount() {
        console.log('arrived', this.flights.filter(flight => flight.hasArrived()).length)
        return this.flights.filter(flight => flight.hasArrived()).length
    }


    get destinations() {
        let destinationCount = this.flights
            .map(flight => flight.destination)
            .reduce((flightCount, flight) => {
                if (flightCount[flight]) flightCount[flight]++
                else flightCount[flight] = 1;
                return flightCount;
            }, {});


        return Object.keys(destinationCount)

    }
}

