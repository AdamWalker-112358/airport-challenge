import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat'; dayjs.extend(advancedFormat);

export default class FlightBoard {

// Define elements to mount UI components
flightBoardSection = document.querySelector('.flight-board');
flightClockSection = document.querySelector('.flight-clock');  

// Current sort, so new and updated rows can keep the same order
sortColumn = null;
sortAscending = true;

    constructor() {
        // Mount and start running the flight clock
        this.displayFlightClock();

        // Mount the flight table header and body
        this.flightTable = document.createElement('table')
        this.flightTable.classList.add('flight-table');
        this.flightBoardSection.append(this.flightTable);
  
        this.flightTableHeader = document.createElement('tr')
        this.flightTableHeader.innerHTML = `<th class="id">ID</th><th class="origin">Origin</th><th class="destination">Destination</th><th class="departed">Departed</th><th class="arrived">Arrived</th>`
        this.flightTable.append(this.flightTableHeader);
        this.enableSorting();
    }

    // Click a column header to sort the board by it, click again to reverse
    enableSorting() {
        Array.from(this.flightTableHeader.children).forEach((th, index) => {
            th.classList.add('sortable');
            th.addEventListener('click', () => {
                this.sortAscending = !this.sortAscending;
                this.sortColumn = index;
                this.sortRows();
            });
        });
    }

    sortRows() {
        if (this.sortColumn === null) return;

        const rows = Array.from(this.flightTable.rows).slice(1);
        rows.sort((a, b) => {
            const left = a.children[this.sortColumn].textContent;
            const right = b.children[this.sortColumn].textContent;
            return this.sortAscending ? left > right : left < right;
        });
        rows.forEach(row => this.flightTable.append(row));

        // Show the sort direction on the sorted column
        const th = this.flightTableHeader.children[this.sortColumn];
        th.textContent = `${th.textContent} ${this.sortAscending ? '▲' : '▼'}`;
    }

    // Add a row to table with flight details
    postFlight = (flight) => {
        let flightRow = document.createElement('tr');
        let flightRowHTML = `
            <td>${flight.number}</td>
            <td>${flight.origin}</td>
            <td>${flight.destination}</td>
            <td>${flight.departed}</td>
            <td class="scheduled">${flight.arrived}</td>
        `
        flightRow.innerHTML = flightRowHTML;   
        this.flightTable.append(flightRow);

    }

    // Update an existing row with flight details (based on flight number), and pass a CSS class for styling the state
    updateFlight(flight, stateClass) {
        const oldFlightRow = Array.from(document.querySelectorAll('tr')).filter(row => row.children[0].textContent == flight.number)[0];

        let newFlightRow = document.createElement('tr');
        let newFlightRowHTML = `
            <td>${flight.number}</td>
            <td>${flight.origin}</td>
            <td>${flight.destination}</td>
            <td>${flight.departed}</td>
            <td class="${stateClass}">${flight.arrived}</td>
        `
        newFlightRow.innerHTML = newFlightRowHTML;   
        this.flightTable.replaceChild(newFlightRow, oldFlightRow)
    }

    
    displayArrivals(value) {
        const arrivals = document.querySelector('.arrivals')
        arrivals.textContent = `Arrivals 🛬 | ${value} of 27 Arrived`
    }

    displayDepartures(value) {
        const departures = document.querySelector('.departures')
        departures.textContent = `Departures 🛫 | ${value} of 27 Departed`
        
    }

    displayFlightClock() {
        let timestamp = dayjs().format('dddd, Do MMMM YYYY | HH:mm:ss');
        this.flightClockSection.textContent = `⏰ ${timestamp}`;  

        setInterval( ()=> {
            let timestamp = dayjs().format('dddd, Do MMMM YYYY | HH:mm:ss');
            this.flightClockSection.textContent = `⏰ ${timestamp}`;  
        }, 1000)
    }
}