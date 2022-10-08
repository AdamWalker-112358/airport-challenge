import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat'; dayjs.extend(advancedFormat);

export default class FlightBoard {

    constructor(board, flightTower) {
        this.flightBoard = board;
        this.flightTower = flightTower;

        this.flightTable = document.createElement('table')
        this.flightTable.classList.add('flight-table');
        this.flightBoard.append(this.flightTable);
  
        this.flightBoardHeader = document.createElement('tr')
        this.flightBoardHeader.innerHTML = `<th class="id">ID</th><th class="origin">Origin</th><th class="destination">Destination</th><th class="departed">Departed</th><th class="arrived">Arrived</th>`
        this.flightTable.append(this.flightBoardHeader);

    }

    postFlight = (flight)=> {
        let flightRow = document.createElement('tr');
        let flightRowHTML = `
            <td>${flight.number}</td>
            <td>${flight.origin}</td>
            <td>${flight.destination}</td>
            <td>${flight.departed}</td>
            <td class="has-not-arrived">${flight.arrived}</td>
        `
        flightRow.innerHTML = flightRowHTML;   
        this.flightTable.append(flightRow);

    }

    updateFlight(flight) {
        const oldFlightRow = Array.from(document.querySelectorAll('tr')).filter(row => row.children[0].textContent == flight.number)[0];

        let newFlightRow = document.createElement('tr');
        let newFlightRowHTML = `
            <td>${flight.number}</td>
            <td>${flight.origin}</td>
            <td>${flight.destination}</td>
            <td>${flight.departed}</td>
            <td class="has-arrived">LANDED ${flight.arrived}</td>
        `
        newFlightRow.innerHTML = newFlightRowHTML;   
        this.flightTable.replaceChild(newFlightRow, oldFlightRow)
    }

    displayArrivals(value) {
        const arrivals = document.querySelector('.arrivals')
        arrivals.textContent = `Arrivals | ${value} of 33 Arrived`
    }

    displayDepartures(value) {
        const departures = document.querySelector('.departures')
        departures.textContent = `Departures | ${value} of 33 Departed`
        
    }

    displayFlightClock() {
        const flightClock = document.querySelector('.flight-clock');
        setInterval(function () {
            const timestamp = dayjs().format('dddd, Do MMMM YYYY | HH:mm:ss');
            flightClock.textContent = timestamp;  
        }, 1000)
    }
}