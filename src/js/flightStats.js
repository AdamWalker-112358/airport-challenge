import dayjs from 'dayjs';

// Live summary numbers shown above the board, recalculated from the tower's flights
export default class FlightStats {

    statsSection = document.querySelector('.flight-stats');

    constructor(tower) {
        this.tower = tower;
    }

    // Flight time in seconds, from the departed and landed timestamps on the board
    static duration(flight) {
        const departed = dayjs(flight.departed);
        const landed = dayjs(flight.arrived.replace('LANDED ', ''));
        return landed.diff(departed, 'second');
    }

    get inTheAir() {
        return this.tower.departedCount - this.tower.arrivedCount;
    }

    get averageFlightTime() {
        const landed = this.tower.flights.filter(flight => flight.hasArrived());
        const total = landed.reduce((sum, flight) => sum + FlightStats.duration(flight), 0);
        return Math.round(total / landed.length);
    }

    get busiestDestination() {
        const counts = this.tower.flights.reduce((count, flight) => {
            count[flight.destination] = (count[flight.destination] || 0) + 1;
            return count;
        }, {});

        const [destination, flights] = Object.entries(counts).sort((a, b) => a[1] - b[1])[0] || [];
        return destination ? `${destination} (${flights} flights)` : '—';
    }

    render() {
        this.statsSection.innerHTML = `
            <span>✈️ In the air: ${this.inTheAir}</span>
            <span>⏱ Avg flight time: ${this.averageFlightTime}s</span>
            <span>📍 Busiest destination: ${this.busiestDestination}</span>
        `;
    }

    // Refresh the stats every second
    start() {
        this.render();
        setInterval(() => this.render(), 1000);
    }
}
