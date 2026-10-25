export default class FlightFilter {

    // Define elements for the search box, status dropdown and empty-state message
    searchInput = document.querySelector('.flight-search');
    statusSelect = document.querySelector('.status-filter');
    emptyMessage = document.querySelector('.filter-empty');

    query = '';
    status = 'all';

    constructor(flightTable) {
        this.flightTable = flightTable;

        // Pre-fill the search from a shared link, e.g. ?q=TLV
        const params = new URLSearchParams(window.location.search);
        this.query = params.get('q') || '';
        this.searchInput.value = this.query;

        // Wait for the user to stop typing before filtering the board
        this.searchInput.addEventListener('input', (event) => {
            let timer;
            clearTimeout(timer);
            timer = setTimeout(() => {
                this.query = event.target.value.trim();
                this.apply();
            }, 250);
        });

        this.statusSelect.addEventListener('change', (event) => {
            this.status = event.target.value;
            this.apply();
        });
    }

    // Check a row against the search text (number, origin, destination) and the selected status
    matches(row) {
        const [number, origin, destination, , arrived] = row.children;
        const query = this.query.toLowerCase();

        const matchesQuery = !query || [number, origin, destination]
            .some(cell => cell.textContent.toLowerCase().includes(query));

        const matchesStatus = this.status === 'all' || arrived.classList.contains(this.status);

        return matchesQuery && matchesStatus;
    }

    // Show the matching rows, hide the rest
    apply() {
        let visible = 0;

        this.flightTable.querySelectorAll('tr').forEach(row => {
            const show = this.matches(row);
            row.hidden = !show;
            if (show) visible++;
        });

        if (visible === 0 && this.query) {
            this.emptyMessage.innerHTML = `No flights match <strong>${this.query}</strong>`;
            this.emptyMessage.hidden = false;
        } else {
            this.emptyMessage.hidden = true;
        }
    }
}
