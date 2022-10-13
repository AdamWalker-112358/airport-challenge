import Flight from './flight';
import FlightBoard from './flightBoard';

import flightsData from '../flights-data.json';


export default class FlightTower {

    flights = new Array();

    constructor() {
        
        this.flightBoard = new FlightBoard();
    }

    dispatchFlights() {
        // Add delay so that flights are gradually added to the flight board
        const delay = (delta) => {
            return new Promise(resolve => setTimeout(resolve, delta))
        }

        const dispatch = async () => { 
            for (let flightData of flightsData.flights) {
                
                await delay(100);
                let flight = new Flight({ number: flightData.number, origin: flightData.origin, destination: flightData.destination })
                
                // Setup event handlers
                flight.on('scheduled', flight => {
                    this.flightBoard.postFlight(flight)
                })
    
                flight.on('depart', event => {
                    this.flightBoard.displayDepartures(this.departedCount)
                    this.flightBoard.updateFlight(event,'in-flight')
                })
                flight.on('arrive', (event) => {
                    this.flightBoard.displayArrivals(this.arrivedCount)
                    this.flightBoard.updateFlight(event,'landed')
                })
    
                // Dispatch flight
                flight.depart();
                this.flights.push(flight)  
            }
        }

        dispatch();
        

    }


    // Get the number of flights
    get count() { return this.flights.length; }
    set count(value) {throw new Error('Count is ReadOnly')}   

    // Get the number of flights that have arrived
    get arrivedCount() {
        return this.flights.filter(flight => flight.hasArrived()).length
    }
    
    // Get the number of flights that have departed
    get departedCount() {
        return this.flights.filter(flight => flight.hasDeparted()).length
    }

    // Get Unique Destinations
    get destinations() {

        // Create an object that keeps count of the number of times each destination appears
        let destinationCount = this.flights
            .map(flight => flight.destination)
            .reduce((flightCount, flight) => {
                if (flightCount[flight]) flightCount[flight]++
                else flightCount[flight] = 1;
                return flightCount;
            }, {});
        
        // The object keys are the unique destinations
        return Object.keys(destinationCount)
    }
}

