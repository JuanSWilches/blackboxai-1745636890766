// Singleton para gestión administrativa
class AdminManager {
    static instance = null;
    constructor() {
        if (AdminManager.instance) return AdminManager.instance;
        this.reservationManager = ReservationManager.getInstance();
        AdminManager.instance = this;
    }
    static getInstance() {
        if (!AdminManager.instance) AdminManager.instance = new AdminManager();
        return AdminManager.instance;
    }
    getReservations() {
        return this.reservationManager.reservations;
    }
    getTables() {
        return this.reservationManager.tables;
    }
    updateTableStatus(tableId, status) {
        const table = this.reservationManager.tables.find(t => t.id === tableId);
        if (table) {
            table.status = status;
            this.reservationManager.saveData();
        }
    }
    deleteTable(tableId) {
        console.log('AdminManager.deleteTable called with tableId:', tableId);
        this.reservationManager.tables = this.reservationManager.tables.filter(t => t.id !== tableId);
        this.reservationManager.saveData();
    }
    confirmReservation(reservationId) {
        const reservation = this.reservationManager.reservations.find(r => r.id === reservationId);
        if (reservation) {
            reservation.status = 'confirmed';
            this.updateTableStatus(reservation.tableId, 'reserved');
            this.reservationManager.saveData();
        }
    }
    cancelReservation(reservationId) {
        const reservation = this.reservationManager.reservations.find(r => r.id === reservationId);
        if (reservation) {
            reservation.status = 'cancelled';
            this.updateTableStatus(reservation.tableId, 'available');
            this.reservationManager.saveData();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const session = SessionManager.getInstance();
    const currentUser = session.getCurrentUser();
    if (!currentUser) {
        window.location.href = '/index.html';
        return;
    }
    if (currentUser.role !== 'admin') {
        alert('Acceso denegado: no es administrador');
        window.location.href = '/index.html';
        return;
    }

    const tablesList = document.getElementById('tablesList');
    const reservationsList = document.getElementById('pendingReservationsList');
    const todayReservationsCount = document.getElementById('todayReservations');
    const availableTablesCount = document.getElementById('availableTables');
    const totalCustomersCount = document.getElementById('totalCustomers');
    const addTableBtn = document.getElementById('addTableBtn');
    const newTableCapacityInput = document.getElementById('newTableCapacity');

    const adminManager = AdminManager.getInstance();

    function updateCounters() {
        const today = new Date().toISOString().split('T')[0];
        const todayReservations = adminManager.getReservations().filter(r => r.date === today);
        todayReservationsCount.textContent = todayReservations.length;

        const availableTables = adminManager.getTables().filter(t => t.status === 'available');
        availableTablesCount.textContent = availableTables.length;

        const uniqueCustomers = new Set(adminManager.getReservations().map(r => r.userEmail));
        totalCustomersCount.textContent = uniqueCustomers.size;
    }

    function updateTablesList() {
        if (!tablesList) return;
        tablesList.innerHTML = '';
        adminManager.getTables().forEach(table => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>Mesa ${table.id}</td>
                <td>${table.capacity}</td>
                <td>
                    <select onchange="changeTableStatus(${table.id}, this.value)" class="border border-gray-300 rounded px-2 py-1">
                        <option value="available" ${table.status === 'available' ? 'selected' : ''}>Disponible</option>
                        <option value="reserved" ${table.status === 'reserved' ? 'selected' : ''}>Reservada</option>
                        <option value="unavailable" ${table.status === 'unavailable' ? 'selected' : ''}>No disponible</option>
                    </select>
                </td>
                <td>
                    <button onclick="deleteTable(${table.id})" class="text-red-600 hover:text-red-900">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tablesList.appendChild(tr);
        });
    }

    function updateReservationsList() {
        if (!reservationsList) return;
        reservationsList.innerHTML = '';
        const pendingReservations = adminManager.getReservations().filter(r => r.status === 'pending');
        pendingReservations.forEach(reservation => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${reservation.userEmail}</td>
                <td>${reservation.date}</td>
                <td>${reservation.time}</td>
                <td>Mesa ${reservation.tableId}</td>
                <td>${reservation.guests}</td>
                <td>${reservation.status}</td>
                <td>
                    <button onclick="confirmReservation(${reservation.id})" class="text-green-600 hover:text-green-900 mr-3">Confirmar</button>
                    <button onclick="cancelReservation(${reservation.id})" class="text-red-600 hover:text-red-900">Cancelar</button>
                </td>
            `;
            reservationsList.appendChild(tr);
        });
    }

    window.changeTableStatus = function(tableId, status) {
        adminManager.updateTableStatus(tableId, status);
        updateTablesList();
        updateCounters();
    };

window.deleteTable = function(tableId) {
    console.log('deleteTable called with tableId:', tableId);
    // Eliminado temporalmente el confirm para pruebas
    adminManager.deleteTable(tableId);
    console.log('Tables after deletion:', adminManager.getTables());
    updateTablesList();
    updateCounters();
};


    window.confirmReservation = function(reservationId) {
        adminManager.confirmReservation(reservationId);
        updateReservationsList();
        updateCounters();
    };

    window.cancelReservation = function(reservationId) {
        adminManager.cancelReservation(reservationId);
        updateReservationsList();
        updateCounters();
    };

    function addTable() {
        const capacity = parseInt(newTableCapacityInput.value);
        if (isNaN(capacity) || capacity <= 0) {
            alert('Por favor, ingrese una capacidad válida para la mesa.');
            return;
        }
        const newTable = {
            id: adminManager.getTables().length + 1,
            capacity: capacity,
            status: 'available'
        };
        adminManager.getTables().push(newTable);
        adminManager.reservationManager.saveData();
        updateTablesList();
        updateCounters();
        newTableCapacityInput.value = '';
    }

    if (addTableBtn) {
        addTableBtn.addEventListener('click', addTable);
    }

    updateTablesList();
    updateReservationsList();
    updateCounters();
});
