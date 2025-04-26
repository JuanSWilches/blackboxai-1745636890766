class ReservationManager {
    static instance = null;
    constructor() {
        if (ReservationManager.instance) return ReservationManager.instance;
        this.reservations = JSON.parse(localStorage.getItem('reservations')) || [];
        this.tables = JSON.parse(localStorage.getItem('tables')) || [
            { id: 1, capacity: 4, status: 'available' },
            { id: 2, capacity: 4, status: 'available' },
            { id: 3, capacity: 6, status: 'available' },
            { id: 4, capacity: 8, status: 'available' },
            { id: 5, capacity: 10, status: 'available' }
        ];
        ReservationManager.instance = this;
    }
    static getInstance() {
        if (!ReservationManager.instance) ReservationManager.instance = new ReservationManager();
        return ReservationManager.instance;
    }
    createReservation(data) {
        const reservation = {
            id: Date.now(),
            date: data.date,
            time: data.time,
            tableId: parseInt(data.table),
            guests: parseInt(data.guests),
            notes: data.notes,
            status: 'pending',
            userEmail: data.userEmail
        };
        this.reservations.push(reservation);
        this.updateTableStatus(reservation.tableId, 'reserved');
        this.saveData();
        return reservation;
    }
    getReservationsByUser(email) {
        return this.reservations.filter(r => r.userEmail === email);
    }
    getTables() {
        return this.tables;
    }
    updateTableStatus(tableId, status) {
        const table = this.tables.find(t => t.id === tableId);
        if (table) {
            table.status = status;
            this.saveData();
        }
    }
    saveData() {
        localStorage.setItem('reservations', JSON.stringify(this.reservations));
        localStorage.setItem('tables', JSON.stringify(this.tables));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const session = SessionManager.getInstance();
    const currentUser = session.getCurrentUser();
    if (!currentUser) {
        window.location.href = '/index.html';
        return;
    }

    const reservationForm = document.getElementById('reservationForm');
    const tableSelect = document.getElementById('table');
    if (!reservationForm || !tableSelect) return;

    const manager = ReservationManager.getInstance();

    // Cargar mesas con estado
    function loadTables() {
        console.log('Ejecutando loadTables para cargar mesas...');
        tableSelect.innerHTML = '<option value="">Seleccione una mesa</option>';
        manager.getTables().forEach(table => {
            const option = document.createElement('option');
            option.value = table.id;
            option.textContent = `Mesa ${table.id} (${table.capacity} personas)`;
            tableSelect.appendChild(option);
        });
    }

    loadTables();

    reservationForm.addEventListener('submit', e => {
        e.preventDefault();
        const data = {
            date: document.getElementById('date').value,
            time: document.getElementById('time').value,
            table: tableSelect.value,
            guests: parseInt(document.getElementById('guests').value),
            notes: document.getElementById('notes').value,
            userEmail: currentUser.email
        };

        // Validar capacidad de la mesa
        const table = manager.getTables().find(t => t.id === parseInt(data.table));
        if (!table) {
            alert('Mesa no encontrada');
            return;
        }
        if (data.guests > table.capacity) {
            alert(`La mesa seleccionada tiene capacidad para máximo ${table.capacity} personas.`);
            return;
        }

        // Validar que la mesa no esté reservada para la misma fecha y hora
        const conflict = manager.getReservationsByUser(currentUser.email).some(r =>
            r.tableId === parseInt(data.table) &&
            r.date === data.date &&
            r.time === data.time &&
            r.status === 'confirmed'
        );
        if (conflict) {
            alert('Ya tienes una reserva confirmada para esta mesa en la misma fecha y hora.');
            return;
        }

        manager.createReservation(data);
        alert('Reserva creada con éxito');
        reservationForm.reset();
        loadTables();
        updateReservationsList();
    });

    function updateReservationsList() {
        const reservations = manager.getReservationsByUser(currentUser.email);
        const tbody = document.getElementById('reservationsList');
        if (!tbody) return;
        tbody.innerHTML = '';
        reservations.forEach(r => {
            const table = manager.getTables().find(t => t.id === r.tableId);
            const tableInfo = table ? `Mesa ${table.id} (${table.capacity} personas)` : `Mesa ${r.tableId}`;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${r.date}</td>
                <td>${r.time}</td>
                <td>${tableInfo}</td>
                <td>${r.guests}</td>
                <td>${r.status}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    updateReservationsList();
});
