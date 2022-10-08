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
        this.flightBoardHeader.innerHTML = `<th>Origin</th><th>Destination</th><th>Departed</th><th>Arrived</th>`
        this.flightTable.append(this.flightBoardHeader);

    }

    postFlight = (flight)=> {
        let flightRow = document.createElement('tr');
        let flightRowHTML = `
            <td>${flight.origin}</td>
            <td>${flight.destination}</td>
            <td>${flight.departed}</td>
            <td>${flight.arrived}</td>
        `
        flightRow.innerHTML = flightRowHTML;   
        this.flightTable.append(flightRow);

    }

    displayFlightCount(value) {
        const title = document.querySelector('.flight-board__title')
        title.textContent = `Arrivals Board | ${value} of 33 Arrived`
    }

    displayFlightClock() {
        const flightClock = document.querySelector('.flight-clock');
        setInterval(function () {
            const timestamp = dayjs().format('dddd, Do MMMM YYYY | HH:mm:ss');
            flightClock.textContent = timestamp;  
        }, 1000)
    }
}