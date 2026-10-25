// Formats the time left before departure, e.g. "Departs in 1:05"
export function formatCountdown(ms) {
    const totalSeconds = Math.round(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `Departs in ${minutes}:${seconds}`;
}

// Tick once a second in the flight's status cell until its scheduled departure time
export function startCountdown(flight, findStatusCell) {
    const timer = setInterval(() => {
        const remaining = flight.scheduledAt - Date.now();

        const cell = findStatusCell(flight);
        if (cell) cell.textContent = formatCountdown(remaining);

        if (remaining <= 0) clearInterval(timer);
    }, 1000);
}
