// Optics Shop Application - Main JavaScript File

// Global data storage (in a real app, this would be a database)
let orders = [];
let clients = [];
let inventory = [];
let currentOrderId = 1;

// Global logo data URL for exports
let globalLogoDataURL = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadSampleData();
    updateDashboard();
});

// Initialize the application
function initializeApp() {
    // Set current date
    const today = new Date();
    document.getElementById('current-date').textContent = today.toLocaleDateString('ru-RU');
    
    // Set default dates for new orders
    document.getElementById('accept-date').value = today.toISOString().split('T')[0];
    const readyDate = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));
    document.getElementById('ready-date').value = readyDate.toISOString().split('T')[0];
    
    // Generate order number
    document.getElementById('order-number').value = generateOrderNumber();
    
    // Setup navigation
    setupNavigation();
    
    // Setup form submission
    setupFormHandling();
    
    // Setup search functionality
    setupSearch();
    
    // Setup form calculations
    setupFormCalculations();
}

// Setup navigation between sections
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            showSection(section);
            
            // Update active button
            navButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// Show a specific section
function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));
    
    // Show the requested section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Load section-specific data
        switch(sectionName) {
            case 'orders':
                loadOrders();
                break;
            case 'clients':
                loadClients();
                break;
            case 'inventory':
                loadInventory();
                break;
            case 'finance':
                loadFinance();
                break;
        }
    }
}

// Show new order form
function showNewOrderForm() {
    showSection('new-order');
    document.getElementById('order-number').value = generateOrderNumber();
}

// Generate unique order number
function generateOrderNumber() {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const orderNum = String(currentOrderId).padStart(3, '0');
    return `${year}${month}${day}-${orderNum}`;
}

// Setup form handling
function setupFormHandling() {
    const orderForm = document.getElementById('order-form');
    if (orderForm) {
        orderForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveOrder();
        });
    }
}

// Save order
function saveOrder() {
    const orderData = {
        orderNumber: document.getElementById('order-number').value,
        clientName: document.getElementById('client-name').value,
        clientPhone: document.getElementById('client-phone').value,
        acceptDate: document.getElementById('accept-date').value,
        readyDate: document.getElementById('ready-date').value,
        prescription: {
            od: {
                sph: document.getElementById('od-sph').value,
                cyl: document.getElementById('od-cyl').value,
                ax: document.getElementById('od-ax').value
            },
            os: {
                sph: document.getElementById('os-sph').value,
                cyl: document.getElementById('os-cyl').value,
                ax: document.getElementById('os-ax').value
            },
            pd: document.getElementById('pd').value
        },
        items: getOrderItems(),
        totalAmount: parseFloat(document.getElementById('total-amount').value) || 0,
        paidAmount: parseFloat(document.getElementById('paid-amount').value) || 0,
        debtAmount: parseFloat(document.getElementById('debt-amount').value) || 0,
    };
    
    if (window.editingOrderId) {
        // Update existing order
        const orderIndex = orders.findIndex(o => o.id === window.editingOrderId);
        if (orderIndex !== -1) {
            orderData.id = window.editingOrderId;
            orderData.status = orders[orderIndex].status; // Keep existing status
            orderData.createdAt = orders[orderIndex].createdAt; // Keep original creation date
            orders[orderIndex] = orderData;
            alert('Заказ успешно обновлен!');
        }
        window.editingOrderId = null;
    } else {
        // Create new order
        orderData.id = currentOrderId++;
        orderData.status = 'new';
        orderData.createdAt = new Date().toISOString();
        orders.push(orderData);
        alert('Заказ успешно создан!');
    }
    
    // Save to localStorage
    localStorage.setItem('opticsOrders', JSON.stringify(orders));
    
    // Reset form
    resetOrderForm();
    
    // Reset form title
    document.querySelector('#new-order .section-header h2').textContent = 'Новый заказ';
    
    // Go back to orders list
    showSection('orders');
}

// Get order items from form
function getOrderItems() {
    const items = [];
    const itemRows = document.querySelectorAll('.item-row');
    
    itemRows.forEach(row => {
        const nameInput = row.querySelector('.item-name');
        const quantityInput = row.querySelector('.item-quantity');
        const priceInput = row.querySelector('.item-price');
        const discountInput = row.querySelector('.item-discount');
        const totalInput = row.querySelector('.item-total');
        
        // Safety check for all required elements
        if (nameInput && quantityInput && priceInput && discountInput && totalInput) {
            if (nameInput.value.trim() && quantityInput.value.trim() && priceInput.value.trim()) {
                const quantity = parseFloat(quantityInput.value) || 0;
                const price = parseFloat(priceInput.value) || 0;
                const discount = parseFloat(discountInput.value) || 0;
                const total = parseFloat(totalInput.value) || 0;
                
                items.push({
                    name: nameInput.value.trim(),
                    quantity: quantity,
                    price: price,
                    discount: discount,
                    total: total
                });
            }
        }
    });
    
    return items;
}

// Reset order form
function resetOrderForm() {
    document.getElementById('order-form').reset();
    document.getElementById('order-number').value = generateOrderNumber();
    
    // Clear items
    const itemsList = document.getElementById('items-list');
    itemsList.innerHTML = `
        <div class="item-row">
            <input type="text" placeholder="Наименование" class="item-name">
            <input type="number" placeholder="1" class="item-quantity" min="1" value="1">
            <input type="number" placeholder="Цена" class="item-price" step="0.01">
            <input type="number" placeholder="0" class="item-discount" min="0" max="100" value="0">
            <input type="number" placeholder="0" class="item-total" readonly>
            <button type="button" class="remove-item" onclick="removeItem(this)">✕</button>
        </div>
    `;
    
    // Add event listeners to the new row
    const newRow = itemsList.querySelector('.item-row');
    const quantityInput = newRow.querySelector('.item-quantity');
    const priceInput = newRow.querySelector('.item-price');
    const discountInput = newRow.querySelector('.item-discount');
    
    quantityInput.addEventListener('input', calculateItemTotal);
    priceInput.addEventListener('input', calculateItemTotal);
    discountInput.addEventListener('input', calculateItemTotal);
    
    // Calculate initial totals
    calculateTotals();
    
    // Clear financial summary
    document.getElementById('total-amount').value = '';
    document.getElementById('paid-amount').value = '';
    document.getElementById('debt-amount').value = '';
}

// Add item row to order form
function addItem() {
    const itemsList = document.getElementById('items-list');
    const newRow = document.createElement('div');
    newRow.className = 'item-row';
    newRow.innerHTML = `
        <input type="text" placeholder="Наименование" class="item-name">
        <input type="number" placeholder="1" class="item-quantity" min="1" value="1">
        <input type="number" placeholder="Цена" class="item-price" step="0.01">
        <input type="number" placeholder="0" class="item-discount" min="0" max="100" value="0">
        <input type="number" placeholder="0" class="item-total" readonly>
        <button type="button" class="remove-item" onclick="removeItem(this)">✕</button>
    `;
    itemsList.appendChild(newRow);
    
    // Add event listeners for calculations
    const quantityInput = newRow.querySelector('.item-quantity');
    const priceInput = newRow.querySelector('.item-price');
    const discountInput = newRow.querySelector('.item-discount');
    
    quantityInput.addEventListener('input', calculateItemTotal);
    priceInput.addEventListener('input', calculateItemTotal);
    discountInput.addEventListener('input', calculateItemTotal);
    
    // Calculate initial total for this item
    calculateItemTotal.call(newRow);
}

// Remove item row from order form
function removeItem(button) {
    const itemRow = button.closest('.item-row');
    if (document.querySelectorAll('.item-row').length > 1) {
        itemRow.remove();
    }
    calculateTotals();
}

// Calculate totals for the order
function calculateTotals() {
    const items = getOrderItems();
    const total = items.reduce((sum, item) => sum + item.total, 0);
    const paid = parseFloat(document.getElementById('paid-amount').value) || 0;
    const debt = total - paid;
    
    document.getElementById('total-amount').value = total.toFixed(2);
    document.getElementById('debt-amount').value = debt.toFixed(2);
}

// Calculate individual item total
function calculateItemTotal() {
    const row = this.closest('.item-row');
    const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
    const price = parseFloat(row.querySelector('.item-price').value) || 0;
    const discount = parseFloat(row.querySelector('.item-discount').value) || 0;
    
    // Calculate total with discount
    const subtotal = quantity * price;
    const discountAmount = subtotal * (discount / 100);
    const total = subtotal - discountAmount;
    
    // Update the total field
    row.querySelector('.item-total').value = total.toFixed(2);
    
    // Recalculate overall totals
    calculateTotals();
}

// Setup form event listeners for automatic calculations
function setupFormCalculations() {
    // Add event listeners to form inputs
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('item-price') || 
            e.target.classList.contains('item-quantity') || 
            e.target.classList.contains('item-discount')) {
            // Calculate individual item total
            calculateItemTotal.call(e.target);
        }
        if (e.target.id === 'paid-amount') {
            calculateTotals();
        }
    });
}

// Load orders
function loadOrders() {
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) return;
    
    if (orders.length === 0) {
        ordersList.innerHTML = '<p>Заказов пока нет. Создайте первый заказ!</p>';
        return;
    }
    
    let ordersHTML = '';
    orders.forEach(order => {
        const total = order.items.reduce((sum, item) => sum + (item.total || item.price), 0);
        const statusClass = getStatusClass(order.status);
        const statusText = getStatusText(order.status);
        
        ordersHTML += `
            <div class="order-card">
                <div class="order-header">
                    <h3>Заказ ${order.orderNumber}</h3>
                    <span class="status ${statusClass}">${statusText}</span>
                </div>
                <div class="order-details">
                    <p><strong>Клиент:</strong> ${order.clientName}</p>
                    <p><strong>Телефон:</strong> ${order.clientPhone}</p>
                    <p><strong>Дата принятия:</strong> ${formatDate(order.acceptDate)}</p>
                    <p><strong>Срок готовности:</strong> ${formatDate(order.readyDate)}</p>
                    <p><strong>Сумма:</strong> ${total} KZT</p>
                </div>
                <div class="order-actions">
                    <button onclick="viewOrder(${order.id})" class="secondary-btn">👁️ Просмотр</button>
                    <button onclick="editOrder(${order.id})" class="secondary-btn">✏️ Редактировать</button>
                    <button onclick="changeOrderStatus(${order.id})" class="secondary-btn">🔄 Статус</button>
                    <button onclick="deleteOrder(${order.id})" class="delete-btn">🗑️ Удалить</button>
                </div>
            </div>
        `;
    });
    
    ordersList.innerHTML = ordersHTML;
}

// Load clients
function loadClients() {
    const clientsList = document.getElementById('clients-list');
    if (!clientsList) return;
    
    if (clients.length === 0) {
        clientsList.innerHTML = '<p>Клиентов пока нет. Добавьте первого клиента!</p>';
        return;
    }
    
    let clientsHTML = '';
    clients.forEach(client => {
        const ordersCount = orders.filter(order => order.clientName === client.name).length;
        const totalSpent = orders.filter(order => order.clientName === client.name)
            .reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + (item.total || item.price), 0), 0);
        
        clientsHTML += `
            <div class="client-card">
                <div class="client-info">
                    <h3>${client.name}</h3>
                    <p><strong>Телефон:</strong> ${client.phone}</p>
                    <p><strong>Email:</strong> ${client.email || 'Не указан'}</p>
                    <p><strong>Заказов:</strong> ${ordersCount}</p>
                    <p><strong>Общая сумма:</strong> ${totalSpent} KZT</p>
                </div>
                <div class="client-actions">
                    <button onclick="editClient(${client.id})" class="secondary-btn">✏️ Редактировать</button>
                    <button onclick="viewClientOrders(${client.id})" class="secondary-btn">📋 Заказы</button>
                </div>
            </div>
        `;
    });
    
    clientsList.innerHTML = clientsHTML;
}

// Load inventory
function loadInventory() {
    const inventoryList = document.getElementById('inventory-list');
    if (!inventoryList) return;
    
    if (inventory.length === 0) {
        inventoryList.innerHTML = '<p>Товаров на складе пока нет. Добавьте первый товар!</p>';
        return;
    }
    
    let inventoryHTML = '';
    inventory.forEach(item => {
        const stockClass = getStockClass(item.quantity);
        
        inventoryHTML += `
            <div class="inventory-item">
                <div class="item-info">
                    <h3>${item.name}</h3>
                    <p><strong>Категория:</strong> ${item.category}</p>
                    <p><strong>Количество:</strong> <span class="stock ${stockClass}">${item.quantity} шт.</span></p>
                    <p><strong>Цена закупки:</strong> ${item.purchasePrice} KZT</p>
                    <p><strong>Цена продажи:</strong> ${item.sellingPrice} KZT</p>
                </div>
                <div class="item-actions">
                    <button onclick="editInventoryItem(${item.id})" class="secondary-btn">✏️ Редактировать</button>
                    <button onclick="updateStock(${item.id})" class="secondary-btn">📦 Обновить количество</button>
                    <button onclick="deleteInventoryItem(${item.id})" class="delete-btn">🗑️ Удалить</button>
                </div>
            </div>
        `;
    });
    
    inventoryList.innerHTML = inventoryHTML;
}

// Load finance data
function loadFinance() {
    const monthlyRevenue = orders.reduce((sum, order) => {
        const orderTotal = order.items.reduce((itemSum, item) => itemSum + (item.total || item.price), 0);
        return sum + orderTotal;
    }, 0);
    
    document.getElementById('monthly-revenue').textContent = `${monthlyRevenue} KZT`;
    document.getElementById('monthly-profit').textContent = `${Math.round(monthlyRevenue * 0.4)} KZT`;
    document.getElementById('monthly-orders').textContent = orders.length;
}

// Update dashboard
function updateDashboard() {
    const newOrders = orders.filter(order => order.status === 'new').length;
    const inProgress = orders.filter(order => order.status === 'in-progress').length;
    const ready = orders.filter(order => order.status === 'ready').length;
    
    const todayRevenue = orders.filter(order => {
        const orderDate = new Date(order.createdAt).toDateString();
        const today = new Date().toDateString();
        return orderDate === today;
    }).reduce((sum, order) => {
        return sum + order.items.reduce((itemSum, item) => itemSum + (item.total || item.price), 0);
    }, 0);
    
    document.getElementById('new-orders').textContent = newOrders;
    document.getElementById('in-progress').textContent = inProgress;
    document.getElementById('ready').textContent = ready;
    document.getElementById('daily-revenue').textContent = `${todayRevenue} KZT`;
}

// Setup search functionality
function setupSearch() {
    const clientSearch = document.getElementById('client-search');
    if (clientSearch) {
        clientSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            filterClients(searchTerm);
        });
    }
}

// Filter clients by search term
function filterClients(searchTerm) {
    const filteredClients = clients.filter(client => 
        client.name.toLowerCase().includes(searchTerm) ||
        client.phone.includes(searchTerm) ||
        (client.email && client.email.toLowerCase().includes(searchTerm))
    );
    
    // Update display with filtered results
    displayFilteredClients(filteredClients);
}

// Display filtered clients
function displayFilteredClients(filteredClients) {
    const clientsList = document.getElementById('clients-list');
    if (!clientsList) return;
    
    if (filteredClients.length === 0) {
        clientsList.innerHTML = '<p>Клиенты не найдены.</p>';
        return;
    }
    
    // Use the same display logic as loadClients but with filtered data
    let clientsHTML = '';
    filteredClients.forEach(client => {
        const ordersCount = orders.filter(order => order.clientName === client.name).length;
        const totalSpent = orders.filter(order => order.clientName === client.name)
            .reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + (item.total || item.price), 0), 0);
        
        clientsHTML += `
            <div class="client-card">
                <div class="client-info">
                    <h3>${client.name}</h3>
                    <p><strong>Телефон:</strong> ${client.phone}</p>
                    <p><strong>Email:</strong> ${client.email || 'Не указан'}</p>
                    <p><strong>Заказов:</strong> ${ordersCount}</p>
                    <p><strong>Общая сумма:</strong> ${totalSpent} KZT</p>
                </div>
                <div class="client-actions">
                    <button onclick="editClient(${client.id})" class="secondary-btn">✏️ Редактировать</button>
                    <button onclick="viewClientOrders(${client.id})" class="secondary-btn">📋 Заказы</button>
                </div>
            </div>
        `;
    });
    
    clientsList.innerHTML = clientsHTML;
}

// Load sample data for demonstration
function loadSampleData() {
    // Load from localStorage if available
    const savedOrders = localStorage.getItem('opticsOrders');
    if (savedOrders) {
        orders = JSON.parse(savedOrders);
        currentOrderId = Math.max(...orders.map(o => o.id), 0) + 1;
    }
    
    const savedClients = localStorage.getItem('opticsClients');
    if (savedClients) {
        clients = JSON.parse(savedClients);
    } else if (clients.length === 0) {
        // Sample clients
        clients = [
            { id: 1, name: 'Иванов Иван Иванович', phone: '+7 (701) 234-56-78', email: 'ivanov@email.com' },
            { id: 2, name: 'Петрова Анна Сергеевна', phone: '+7 (702) 345-67-89', email: 'petrova@email.com' },
            { id: 3, name: 'Сидоров Владимир Петрович', phone: '+7 (703) 456-78-90', email: 'sidorov@company.kz' }
        ];
        localStorage.setItem('opticsClients', JSON.stringify(clients));
    }
    
    const savedInventory = localStorage.getItem('opticsInventory');
    if (savedInventory) {
        inventory = JSON.parse(savedInventory);
    } else if (inventory.length === 0) {
        // Sample inventory
        inventory = [
            { id: 1, name: 'Ray-Ban RB3025 Aviator', category: 'frames', quantity: 15, purchasePrice: 8500, sellingPrice: 15000 },
            { id: 2, name: 'Oakley OO9208 Radar EV', category: 'frames', quantity: 7, purchasePrice: 7200, sellingPrice: 12500 },
            { id: 3, name: 'Линзы 1.5 Transitions', category: 'lenses', quantity: 3, purchasePrice: 4200, sellingPrice: 8500 },
            { id: 4, name: 'Салфетки для очков', category: 'accessories', quantity: 8, purchasePrice: 25, sellingPrice: 50 }
        ];
        localStorage.setItem('opticsInventory', JSON.stringify(inventory));
    }
}

// Utility functions
function getStatusClass(status) {
    const statusClasses = {
        'new': 'status-new',
        'in-progress': 'status-progress',
        'ready': 'status-ready',
        'delivered': 'status-delivered'
    };
    return statusClasses[status] || 'status-new';
}

function getStatusText(status) {
    const statusTexts = {
        'new': 'Новый',
        'in-progress': 'В работе',
        'ready': 'Готов',
        'delivered': 'Выдан'
    };
    return statusTexts[status] || 'Новый';
}

function getStockClass(quantity) {
    if (quantity <= 5) return 'stock-low';
    if (quantity <= 15) return 'stock-medium';
    return 'stock-good';
}

function formatDate(dateString) {
    if (!dateString) return 'Не указана';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
}

// Order management functions
function viewOrder(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) {
        alert('Заказ не найден');
        return;
    }
    
    showOrderDetails(order);
}

function editOrder(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) {
        alert('Заказ не найден');
        return;
    }
    
    // Fill the form with order data
    document.getElementById('order-number').value = order.orderNumber;
    document.getElementById('client-name').value = order.clientName;
    document.getElementById('client-phone').value = order.clientPhone;
    document.getElementById('accept-date').value = order.acceptDate;
    document.getElementById('ready-date').value = order.readyDate;
    
    // Fill prescription data
    if (order.prescription) {
        document.getElementById('od-sph').value = order.prescription.od.sph || '';
        document.getElementById('od-cyl').value = order.prescription.od.cyl || '';
        document.getElementById('od-ax').value = order.prescription.od.ax || '';
        document.getElementById('os-sph').value = order.prescription.os.sph || '';
        document.getElementById('os-cyl').value = order.prescription.os.cyl || '';
        document.getElementById('os-ax').value = order.prescription.os.ax || '';
        document.getElementById('pd').value = order.prescription.pd || '';
    }
    
    // Fill items
    const itemsList = document.getElementById('items-list');
    itemsList.innerHTML = '';
    order.items.forEach(item => {
        const newRow = document.createElement('div');
        newRow.className = 'item-row';
        newRow.innerHTML = `
            <input type="text" placeholder="Наименование" class="item-name" value="${item.name}">
            <input type="number" placeholder="1" class="item-quantity" min="1" value="${item.quantity || 1}">
            <input type="number" placeholder="Цена" class="item-price" step="0.01" value="${item.price}">
            <input type="number" placeholder="0" class="item-discount" min="0" max="100" value="${item.discount || 0}">
            <input type="number" placeholder="0" class="item-total" readonly value="${item.total || item.price}">
            <button type="button" class="remove-item" onclick="removeItem(this)">✕</button>
        `;
        itemsList.appendChild(newRow);
        
        // Add event listeners
        const quantityInput = newRow.querySelector('.item-quantity');
        const priceInput = newRow.querySelector('.item-price');
        const discountInput = newRow.querySelector('.item-discount');
        
        quantityInput.addEventListener('input', calculateItemTotal);
        priceInput.addEventListener('input', calculateItemTotal);
        discountInput.addEventListener('input', calculateItemTotal);
    });
    
    // Fill financial data
    document.getElementById('total-amount').value = order.totalAmount || '';
    document.getElementById('paid-amount').value = order.paidAmount || '';
    document.getElementById('debt-amount').value = order.debtAmount || '';
    
    // Store the editing order ID
    window.editingOrderId = orderId;
    
    // Show the form
    showSection('new-order');
    
    // Update form title
    document.querySelector('#new-order .section-header h2').textContent = 'Редактирование заказа';
}

function deleteOrder(orderId) {
    if (!confirm('Вы уверены, что хотите удалить этот заказ?')) {
        return;
    }
    
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) {
        alert('Заказ не найден');
        return;
    }
    
    orders.splice(orderIndex, 1);
    localStorage.setItem('opticsOrders', JSON.stringify(orders));
    
    // Refresh the orders list
    loadOrders();
    updateDashboard();
    
    alert('Заказ успешно удален');
}

function changeOrderStatus(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) {
        alert('Заказ не найден');
        return;
    }
    
    const statusOptions = [
        { value: 'new', text: 'Новый' },
        { value: 'in-progress', text: 'В работе' },
        { value: 'ready', text: 'Готов' },
        { value: 'delivered', text: 'Выдан' }
    ];
    
    let optionsHTML = '';
    statusOptions.forEach(option => {
        const selected = option.value === order.status ? 'selected' : '';
        optionsHTML += `<option value="${option.value}" ${selected}>${option.text}</option>`;
    });
    
    const newStatus = prompt(`Выберите новый статус для заказа ${order.orderNumber}:\n\n${statusOptions.map((opt, index) => `${index + 1}. ${opt.text}`).join('\n')}\n\nВведите номер (1-4):`);
    
    if (newStatus && newStatus >= 1 && newStatus <= 4) {
        const selectedStatus = statusOptions[newStatus - 1];
        order.status = selectedStatus.value;
        
        localStorage.setItem('opticsOrders', JSON.stringify(orders));
        loadOrders();
        updateDashboard();
        
        alert(`Статус заказа изменен на: ${selectedStatus.text}`);
    }
}

function editClient(clientId) {
    alert(`Редактирование клиента ${clientId} - функция в разработке`);
}

function viewClientOrders(clientId) {
    alert(`Просмотр заказов клиента ${clientId} - функция в разработке`);
}

// Inventory management functions
function editInventoryItem(itemId) {
    const item = inventory.find(i => i.id === itemId);
    if (!item) {
        alert('Товар не найден');
        return;
    }
    
    showInventoryForm(item);
}

function deleteInventoryItem(itemId) {
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) {
        return;
    }
    
    const itemIndex = inventory.findIndex(i => i.id === itemId);
    if (itemIndex === -1) {
        alert('Товар не найден');
        return;
    }
    
    inventory.splice(itemIndex, 1);
    localStorage.setItem('opticsInventory', JSON.stringify(inventory));
    
    loadInventory();
    alert('Товар успешно удален');
}

function updateStock(itemId) {
    const item = inventory.find(i => i.id === itemId);
    if (!item) {
        alert('Товар не найден');
        return;
    }
    
    const newQuantity = prompt(`Текущее количество: ${item.quantity} шт.\nВведите новое количество:`, item.quantity);
    
    if (newQuantity !== null && !isNaN(newQuantity) && newQuantity >= 0) {
        item.quantity = parseInt(newQuantity);
        localStorage.setItem('opticsInventory', JSON.stringify(inventory));
        loadInventory();
        alert('Количество товара обновлено');
    }
}

function showAddClientForm() {
    const name = prompt('Введите ФИО клиента:');
    if (!name) return;
    
    const phone = prompt('Введите телефон клиента:');
    if (!phone) return;
    
    const email = prompt('Введите email клиента (необязательно):') || '';
    
    const newClient = {
        id: Math.max(...clients.map(c => c.id), 0) + 1,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim()
    };
    
    clients.push(newClient);
    localStorage.setItem('opticsClients', JSON.stringify(clients));
    
    loadClients();
    alert('Клиент успешно добавлен');
}

function showAddItemForm() {
    showInventoryForm();
}

// Show inventory form for adding/editing items
function showInventoryForm(item = null) {
    const isEdit = item !== null;
    const title = isEdit ? 'Редактирование товара' : 'Добавление товара';
    
    const name = prompt(`${title}\n\nВведите название товара:`, isEdit ? item.name : '');
    if (!name) return;
    
    const categoryOptions = ['frames', 'lenses', 'accessories'];
    const categoryTexts = ['Оправы', 'Линзы', 'Аксессуары'];
    const categoryPrompt = `Выберите категорию:\n${categoryTexts.map((text, index) => `${index + 1}. ${text}`).join('\n')}\nВведите номер (1-3):`;
    const categoryChoice = prompt(categoryPrompt, isEdit ? (categoryOptions.indexOf(item.category) + 1) : '1');
    
    if (!categoryChoice || categoryChoice < 1 || categoryChoice > 3) return;
    const category = categoryOptions[categoryChoice - 1];
    
    const quantity = prompt('Введите количество:', isEdit ? item.quantity : '0');
    if (quantity === null || isNaN(quantity) || quantity < 0) return;
    
    const purchasePrice = prompt('Введите цену закупки (KZT):', isEdit ? item.purchasePrice : '0');
    if (purchasePrice === null || isNaN(purchasePrice) || purchasePrice < 0) return;
    
    const sellingPrice = prompt('Введите цену продажи (KZT):', isEdit ? item.sellingPrice : '0');
    if (sellingPrice === null || isNaN(sellingPrice) || sellingPrice < 0) return;
    
    const itemData = {
        name: name.trim(),
        category: category,
        quantity: parseInt(quantity),
        purchasePrice: parseFloat(purchasePrice),
        sellingPrice: parseFloat(sellingPrice)
    };
    
    if (isEdit) {
        // Update existing item
        const itemIndex = inventory.findIndex(i => i.id === item.id);
        if (itemIndex !== -1) {
            itemData.id = item.id;
            inventory[itemIndex] = itemData;
            alert('Товар успешно обновлен');
        }
    } else {
        // Add new item
        itemData.id = Math.max(...inventory.map(i => i.id), 0) + 1;
        inventory.push(itemData);
        alert('Товар успешно добавлен');
    }
    
    localStorage.setItem('opticsInventory', JSON.stringify(inventory));
    loadInventory();
}

// Show order details
function showOrderDetails(order) {
    const total = order.items.reduce((sum, item) => sum + item.total, 0);
    const itemsList = order.items.map(item => {
        const discountText = item.discount > 0 ? ` (скидка ${item.discount}%)` : '';
        return `• ${item.name}: ${item.quantity} × ${item.price} KZT${discountText} = ${item.total} KZT`;
    }).join('\n');
    
    const details = `ДЕТАЛИ ЗАКАЗА
    
Заказ №: ${order.orderNumber}
Клиент: ${order.clientName}
Телефон: ${order.clientPhone}
Дата принятия: ${formatDate(order.acceptDate)}
Срок готовности: ${formatDate(order.readyDate)}
Статус: ${getStatusText(order.status)}

РЕЦЕПТ:
OD: Sph ${order.prescription?.od?.sph || ''}, Cyl ${order.prescription?.od?.cyl || ''}, Ax ${order.prescription?.od?.ax || ''}
OS: Sph ${order.prescription?.os?.sph || ''}, Cyl ${order.prescription?.os?.cyl || ''}, Ax ${order.prescription?.os?.ax || ''}
Pd: ${order.prescription?.pd || ''} мм

ТОВАРЫ И УСЛУГИ:
${itemsList}

ФИНАНСЫ:
Общая сумма: ${order.totalAmount || total} KZT
Оплачено: ${order.paidAmount || 0} KZT
Долг: ${order.debtAmount || (total - (order.paidAmount || 0))} KZT`;

    alert(details);
}

// Generate PDF of the order form
async function generatePDF() {
    try {
        // Get the form data for the filename
        const orderNumber = document.getElementById('order-number').value || 'order';
        const clientName = document.getElementById('client-name').value || 'client';
        
        // Create a printable version of the form
        const printableForm = await createPrintableForm();
        document.body.appendChild(printableForm);
        
        // Use html2canvas to capture the form
        const canvas = await html2canvas(printableForm, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            imageTimeout: 15000,
            onclone: function(clonedDoc) {
                // Ensure logo is loaded in the cloned document
                const logoImg = clonedDoc.querySelector('.logo-image');
                if (logoImg && logoImg.src) {
                    logoImg.style.display = 'block';
                }
            }
        });
        
        // Remove the temporary form
        document.body.removeChild(printableForm);
        
        // Create PDF using jsPDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const imgData = canvas.toDataURL('image/png');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        const imgY = 10;
        
        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
        pdf.save(`${orderNumber}_${clientName}.pdf`);
        
        alert('PDF успешно создан и скачан!');
    } catch (error) {
        console.error('Ошибка создания PDF:', error);
        alert('Ошибка при создании PDF. Проверьте консоль для деталей.');
    }
}

// Generate JPEG of the order form
async function generateJPEG() {
    try {
        // Get the form data for the filename
        const orderNumber = document.getElementById('order-number').value || 'order';
        const clientName = document.getElementById('client-name').value || 'client';
        
        // Create a printable version of the form
        const printableForm = await createPrintableForm();
        document.body.appendChild(printableForm);
        
        // Wait a bit for any images to load
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Setup logo error handling before capture
        const logoImg = printableForm.querySelector('.logo-image');
        if (logoImg) {
            // Check if logo exists and handle errors
            logoImg.onerror = function() {
                console.warn('Logo failed to load, showing fallback');
                this.style.display = 'none';
                const fallback = printableForm.querySelector('.logo-fallback');
                if (fallback) fallback.style.display = 'block';
            };
            
            // Set a timeout to show fallback if logo takes too long
            setTimeout(() => {
                if (logoImg.complete === false || logoImg.naturalWidth === 0) {
                    console.warn('Logo loading timeout, showing fallback');
                    logoImg.style.display = 'none';
                    const fallback = printableForm.querySelector('.logo-fallback');
                    if (fallback) fallback.style.display = 'block';
                }
            }, 2000);
        }
        
        // Use html2canvas to capture the form with better error handling
        const canvas = await html2canvas(printableForm, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: true, // Enable logging for debugging
            imageTimeout: 30000, // Increase timeout
            removeContainer: false,
            foreignObjectRendering: false,
            onclone: function(clonedDoc) {
                try {
                    // Ensure logo is loaded in the cloned document
                    const logoImg = clonedDoc.querySelector('.logo-image');
                    if (logoImg) {
                        // Force logo to be visible and loaded
                        logoImg.style.display = 'block';
                        logoImg.style.visibility = 'visible';
                        logoImg.style.opacity = '1';
                        
                        // If logo fails to load, show fallback
                        logoImg.onerror = function() {
                            this.style.display = 'none';
                            const fallback = this.nextElementSibling;
                            if (fallback) fallback.style.display = 'block';
                        };
                    }
                } catch (logoError) {
                    console.warn('Logo handling error:', logoError);
                }
            }
        });
        
        // Remove the temporary form
        document.body.removeChild(printableForm);
        
        // Convert to JPEG and download
        const link = document.createElement('a');
        link.download = `${orderNumber}_${clientName}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        link.click();
        
        alert('JPEG успешно создан и скачан!');
    } catch (error) {
        console.error('Ошибка создания JPEG:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        alert('Ошибка при создании JPEG. Проверьте консоль для деталей.');
    }
}

// Send form via WhatsApp Business
async function sendWhatsApp() {
    try {
        // Get client phone number
        const clientPhone = document.getElementById('client-phone').value;
        if (!clientPhone) {
            alert('Пожалуйста, введите номер телефона клиента');
            return;
        }
        
        // Create JPEG image first
        const printableForm = await createPrintableForm();
        document.body.appendChild(printableForm);
        
        const canvas = await html2canvas(printableForm, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            imageTimeout: 15000,
            onclone: function(clonedDoc) {
                // Ensure logo is loaded in the cloned document
                const logoImg = clonedDoc.querySelector('.logo-image');
                if (logoImg && logoImg.src) {
                    logoImg.style.display = 'block';
                }
            }
        });
        
        document.body.removeChild(printableForm);
        
        // Convert canvas to blob
        canvas.toBlob(async (blob) => {
            try {
                // Get order details for message
                const orderNumber = document.getElementById('order-number').value;
                const clientName = document.getElementById('client-name').value;
                const totalAmount = document.getElementById('total-amount').value || '0';
                
                // Clean phone number (remove spaces, dashes, etc.)
                const cleanPhone = clientPhone.replace(/[^\d+]/g, '');
                
                // Create WhatsApp message
                const message = `Здравствуйте, ${clientName}!\n\nВаш заказ №${orderNumber} принят.\nОбщая сумма: ${totalAmount} KZT\n\nДетали заказа во вложении.\n\nОПТИКА СОНАТА\nАстана, Сыганак 32\nWhatsApp: +77007430770`;
                
                // Create a file object from the blob
                const file = new File([blob], `order_${orderNumber}.jpg`, { type: 'image/jpeg' });
                
                // Try to use WhatsApp Web API for file sharing
                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    // Use Web Share API for mobile devices
                    await navigator.share({
                        title: `Заказ №${orderNumber}`,
                        text: message,
                        files: [file]
                    });
                    alert('Заказ успешно отправлен через WhatsApp!');
                } else {
                    // Try to create a data URL for direct WhatsApp sharing
                    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
                    
                    // Create a more direct WhatsApp integration
                    try {
                        // For mobile devices, try to open WhatsApp directly
                        if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                            // Mobile device - try to open WhatsApp app
                            const whatsappUrl = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
                            window.location.href = whatsappUrl;
                            
                            // Also download the image for backup
                            const imageUrl = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = imageUrl;
                            link.download = `order_${orderNumber}.jpg`;
                            link.click();
                            URL.revokeObjectURL(imageUrl);
                            
                            alert('WhatsApp приложение открыто! Изображение заказа скачано для прикрепления.');
                        } else {
                            // Desktop - open WhatsApp Web with message
                            const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
                            window.open(whatsappUrl, '_blank');
                            
                            // Download image for manual attachment
                            const imageUrl = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = imageUrl;
                            link.download = `order_${orderNumber}.jpg`;
                            link.click();
                            URL.revokeObjectURL(imageUrl);
                            
                            alert('WhatsApp Web открыт! Изображение заказа скачано - прикрепите его к сообщению.');
                        }
                    } catch (error) {
                        // Ultimate fallback
                        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
                        window.open(whatsappUrl, '_blank');
                        
                        const imageUrl = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = imageUrl;
                        link.download = `order_${orderNumber}.jpg`;
                        link.click();
                        URL.revokeObjectURL(imageUrl);
                        
                        alert('WhatsApp открыт! Изображение заказа скачано для прикрепления.');
                    }
                }
                
            } catch (error) {
                console.error('Ошибка отправки в WhatsApp:', error);
                alert('Ошибка при отправке в WhatsApp');
            }
        }, 'image/jpeg', 0.9);
        
    } catch (error) {
        console.error('Ошибка создания изображения для WhatsApp:', error);
        alert('Ошибка при создании изображки для WhatsApp');
    }
}

// Helper function to load image as data URL
function loadImageAsDataURL(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        
        // For local files, don't use crossOrigin
        if (!src.startsWith('http')) {
            img.removeAttribute('crossOrigin');
        } else {
            img.crossOrigin = 'anonymous';
        }
        
        img.onload = function() {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = this.naturalWidth;
                canvas.height = this.naturalHeight;
                ctx.drawImage(this, 0, 0);
                const dataURL = canvas.toDataURL('image/png', 1.0);
                console.log('Logo loaded successfully as data URL');
                resolve(dataURL);
            } catch (error) {
                console.error('Error converting image to data URL:', error);
                reject(error);
            }
        };
        
        img.onerror = function(error) {
            console.error('Failed to load image:', src, error);
            reject(new Error(`Failed to load image: ${src}`));
        };
        
        // Add a timeout
        setTimeout(() => {
            if (!img.complete) {
                console.error('Image loading timeout:', src);
                reject(new Error('Image loading timeout'));
            }
        }, 5000);
        
        console.log('Starting to load image:', src);
        img.src = src;
    });
}

// Create a printable version of the form
async function createPrintableForm() {
    const printableDiv = document.createElement('div');
    printableDiv.className = 'printable-form';
    printableDiv.style.cssText = `
        position: absolute;
        top: -9999px;
        left: -9999px;
        width: 800px;
        background: white;
        padding: 40px;
        font-family: 'Times New Roman', serif;
        color: black;
        line-height: 1.4;
        border: 2px solid black;
        z-index: -1;
        overflow: visible;
    `;
    
    // Try to get logo as base64
    let logoDataURL = globalLogoDataURL; // Use preloaded logo first
    
    if (!logoDataURL) {
        console.log('Global logo not available, trying to get from page...');
        // Try to get logo from the page if it's already loaded
        const existingLogo = document.querySelector('.logo-image, .header-logo');
        if (existingLogo && existingLogo.complete && existingLogo.naturalWidth > 0) {
            try {
                console.log('Found existing logo on page, converting to data URL...');
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = existingLogo.naturalWidth;
                canvas.height = existingLogo.naturalHeight;
                ctx.drawImage(existingLogo, 0, 0);
                logoDataURL = canvas.toDataURL('image/png', 1.0);
                console.log('Successfully converted existing logo to data URL');
            } catch (error) {
                console.warn('Failed to convert existing logo:', error);
            }
        }
    } else {
        console.log('Using preloaded global logo');
    }
    
    // If that didn't work, try loading fresh
    if (!logoDataURL) {
        try {
            console.log('Loading fresh logo image...');
            // Try relative path first
            logoDataURL = await loadImageAsDataURL('logo.png');
            console.log('Logo loaded successfully, data URL length:', logoDataURL ? logoDataURL.length : 0);
        } catch (error) {
            console.error('Failed to load logo with relative path:', error);
            
            // Try with absolute path
            try {
                const absolutePath = window.location.origin + window.location.pathname.replace('index.html', '') + 'logo.png';
                console.log('Trying absolute path:', absolutePath);
                logoDataURL = await loadImageAsDataURL(absolutePath);
                console.log('Logo loaded with absolute path');
            } catch (absError) {
                console.error('Failed to load logo with absolute path:', absError);
                console.log('Will use fallback emoji logo');
            }
        }
    }
    
    // Get form data with safety checks
    const getElementValue = (id) => {
        const element = document.getElementById(id);
        return element ? element.value || '' : '';
    };
    
    const orderNumber = getElementValue('order-number');
    const clientName = getElementValue('client-name');
    const clientPhone = getElementValue('client-phone');
    const acceptDate = getElementValue('accept-date');
    const readyDate = getElementValue('ready-date');
    const odSph = getElementValue('od-sph');
    const odCyl = getElementValue('od-cyl');
    const odAx = getElementValue('od-ax');
    const osSph = getElementValue('os-sph');
    const osCyl = getElementValue('os-cyl');
    const osAx = getElementValue('os-ax');
    const pd = getElementValue('pd');
    const totalAmount = getElementValue('total-amount');
    const paidAmount = getElementValue('paid-amount');
    const debtAmount = getElementValue('debt-amount');
    
    // Get items
    const items = getOrderItems();
    let itemsHTML = '';
    items.forEach(item => {
        const discountText = item.discount > 0 ? ` (${item.discount}%)` : '';
        itemsHTML += `
            <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 8px; border-right: 1px solid #ddd;">${item.name}</td>
                <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd;">${item.quantity}</td>
                <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd;">${item.price}</td>
                <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd;">${item.discount}%</td>
                <td style="padding: 8px; text-align: right; font-weight: bold;">${item.total} KZT</td>
            </tr>
        `;
    });
    
    // Add empty rows if needed
    for (let i = items.length; i < 3; i++) {
        itemsHTML += `
            <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 8px; border-right: 1px solid #ddd;">&nbsp;</td>
                <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd;">&nbsp;</td>
                <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd;">&nbsp;</td>
                <td style="padding: 8px; text-align: center; border-right: 1px solid #ddd;">&nbsp;</td>
                <td style="padding: 8px; text-align: right;">&nbsp;</td>
            </tr>
        `;
    }
    
    printableDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 2px solid black; padding-bottom: 20px;">
            <div style="flex: 1;">
                <div style="margin-bottom: 15px;">
                    <label style="font-weight: bold; margin-right: 10px;">Заказ №</label>
                    <span style="border: 1px solid black; padding: 5px 10px; display: inline-block; min-width: 120px;">${orderNumber}</span>
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="font-weight: bold; margin-right: 10px;">ФИО</label>
                    <span style="border: 1px solid black; padding: 5px 10px; display: inline-block; min-width: 250px;">${clientName}</span>
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="font-weight: bold; margin-right: 10px;">Тел.</label>
                    <span style="border: 1px solid black; padding: 5px 10px; display: inline-block; min-width: 200px;">${clientPhone}</span>
                </div>
            </div>
            <div style="text-align: center; min-width: 200px;">
                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABbAAAAWwCAYAAACM2Ge7AAAVXmVYSWZNTQAqAAAACAAFAQAABAAAAAEAAAAAAQEABAAAAAEAAAAA" alt="ОПТИКА СОНАТА" style="width: 120px; height: 120px; object-fit: contain; border-radius: 50%; background: white; padding: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 10px; display: block; margin-left: auto; margin-right: auto; max-width: 100%; height: auto;">
                <div style="font-size: 12px; color: #666; margin-top: 10px;">
                    <div>Астана, Сыганак 32</div>
                    <div>WhatsApp: +77007430770</div>
                    <div>Instagram: sonata.astana</div>
                </div>
            </div>
        </div>
        
        <div style="margin-bottom: 30px; border-bottom: 1px solid black; padding-bottom: 20px;">
            <h3 style="margin-bottom: 15px; color: black;">Срок готовности заказа:</h3>
            <div style="display: flex; gap: 50px;">
                <div>
                    <label style="font-weight: bold; margin-right: 10px;">Принят</label>
                    <span style="border: 1px solid black; padding: 5px 10px; display: inline-block; min-width: 120px;">${acceptDate}</span>
                </div>
                <div>
                    <label style="font-weight: bold; margin-right: 10px;">Готовность</label>
                    <span style="border: 1px solid black; padding: 5px 10px; display: inline-block; min-width: 120px;">${readyDate}</span>
                </div>
            </div>
        </div>
        
        <div style="margin-bottom: 30px;">
            <h3 style="margin-bottom: 15px; color: black;">Рецепт</h3>
            <table style="width: 100%; border-collapse: collapse; border: 2px solid black; margin-bottom: 15px;">
                <thead>
                    <tr style="background: #f0f0f0;">
                        <th style="border: 1px solid black; padding: 10px; text-align: center;"></th>
                        <th style="border: 1px solid black; padding: 10px; text-align: center;">Sph</th>
                        <th style="border: 1px solid black; padding: 10px; text-align: center;">Cyl</th>
                        <th style="border: 1px solid black; padding: 10px; text-align: center;">Ax</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="border: 1px solid black; padding: 10px; text-align: center; font-weight: bold;">OD</td>
                        <td style="border: 1px solid black; padding: 10px; text-align: center;">${odSph}</td>
                        <td style="border: 1px solid black; padding: 10px; text-align: center;">${odCyl}</td>
                        <td style="border: 1px solid black; padding: 10px; text-align: center;">${odAx}</td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid black; padding: 10px; text-align: center; font-weight: bold;">OS</td>
                        <td style="border: 1px solid black; padding: 10px; text-align: center;">${osSph}</td>
                        <td style="border: 1px solid black; padding: 10px; text-align: center;">${osCyl}</td>
                        <td style="border: 1px solid black; padding: 10px; text-align: center;">${osAx}</td>
                    </tr>
                </tbody>
            </table>
            <div style="text-align: center; margin-top: 15px;">
                <label style="font-weight: bold; margin-right: 10px;">Pd</label>
                <span style="border: 1px solid black; padding: 5px 10px; display: inline-block; min-width: 80px;">${pd}</span>
            </div>
        </div>
        
        <div style="margin-bottom: 30px;">
            <h3 style="margin-bottom: 15px; color: black;">Товары и услуги</h3>
            <table style="width: 100%; border-collapse: collapse; border: 2px solid black;">
                <thead>
                    <tr style="background: #f0f0f0;">
                        <th style="border: 1px solid black; padding: 10px; text-align: left;">Наименование</th>
                        <th style="border: 1px solid black; padding: 10px; text-align: center; width: 80px;">Кол-во</th>
                        <th style="border: 1px solid black; padding: 10px; text-align: center; width: 100px;">Цена за ед.</th>
                        <th style="border: 1px solid black; padding: 10px; text-align: center; width: 80px;">Скидка %</th>
                        <th style="border: 1px solid black; padding: 10px; text-align: center; width: 120px;">Сумма</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHTML}
                </tbody>
            </table>
        </div>
        
        <div style="margin-top: 30px;">
            <div style="display: flex; justify-content: flex-end; gap: 30px;">
                <div style="text-align: center;">
                    <label style="font-weight: bold; display: block; margin-bottom: 5px;">Итого</label>
                    <span style="border: 1px solid black; padding: 8px 15px; display: inline-block; min-width: 100px; font-weight: bold;">${totalAmount} KZT</span>
                </div>
                <div style="text-align: center;">
                    <label style="font-weight: bold; display: block; margin-bottom: 5px;">Оплачено</label>
                    <span style="border: 1px solid black; padding: 8px 15px; display: inline-block; min-width: 100px; font-weight: bold;">${paidAmount} KZT</span>
                </div>
                <div style="text-align: center;">
                    <label style="font-weight: bold; display: block; margin-bottom: 5px;">Долг</label>
                    <span style="border: 1px solid black; padding: 8px 15px; display: inline-block; min-width: 100px; font-weight: bold;">${debtAmount} KZT</span>
                </div>
            </div>
        </div>
    `;
    
    return printableDiv;
}

// Create a printable version of the form
async function createPrintableForm() {
    const orderNumber = document.getElementById('order-number').value;
    const clientName = document.getElementById('client-name').value;
    const clientPhone = document.getElementById('client-phone').value;
    const orderDate = document.getElementById('order-date').value;
    const deliveryDate = document.getElementById('delivery-date').value;
    const pd = document.getElementById('pd').value;
    const totalAmount = document.getElementById('total-amount').value;
    const paidAmount = document.getElementById('paid-amount').value;
    const debtAmount = document.getElementById('debt-amount').value;
    
    const items = getOrderItems();
    let itemsHTML = '';
    
    items.forEach(item => {
        itemsHTML += `
            <tr>
                <td style="border: 1px solid black; padding: 10px;">${item.name}</td>
                <td style="border: 1px solid black; padding: 10px; text-align: center;">${item.quantity}</td>
                <td style="border: 1px solid black; padding: 10px; text-align: center;">${item.price} KZT</td>
                <td style="border: 1px solid black; padding: 10px; text-align: center;">${item.discount}%</td>
                <td style="border: 1px solid black; padding: 10px; text-align: center; font-weight: bold;">${item.total} KZT</td>
            </tr>
        `;
    });
    
    const printableDiv = document.createElement('div');
    printableDiv.style.cssText = 'padding: 20px; font-family: "Times New Roman", serif; max-width: 800px; margin: 0 auto; background: white;';
    
    printableDiv.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
            <div style="text-align: center; min-width: 200px;">
                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABbAAAAWwCAYAAACM2Ge7AAAVXmVYSWZNTQAqAAAACAAFAQAABAAAAAEAAAAAAQEABAAAAAEAAAAA" alt="ОПТИКА СОНАТА" style="width: 120px; height: 120px; object-fit: contain; border-radius: 50%; background: white; padding: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 10px; display: block; margin-left: auto; margin-right: auto; max-width: 100%; height: auto;">
                <div style="font-size: 12px; color: #666; margin-top: 10px;">
                    <div>Астана, Сыганак 32</div>
                    <div>WhatsApp: +77007430770</div>
                    <div>Instagram: sonata.astana</div>
                </div>
            </div>
        </div>
        
        <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="margin: 0; color: black; font-size: 28px;">ЗАКАЗ</h1>
            <p style="margin: 5px 0; color: black; font-size: 16px;">№ ${orderNumber}</p>
        </div>
        
        <div style="margin-bottom: 30px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <div style="text-align: center;">
                    <label style="font-weight: bold; margin-right: 10px;">Клиент</label>
                    <span style="border: 1px solid black; padding: 5px 10px; display: inline-block; min-width: 150px;">${clientName}</span>
                </div>
                <div style="text-align: center;">
                    <label style="font-weight: bold; margin-right: 10px;">Телефон</label>
                    <span style="border: 1px solid black; padding: 5px 10px; display: inline-block; min-width: 150px;">${clientPhone}</span>
                </div>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <div style="text-align: center;">
                    <label style="font-weight: bold; margin-right: 10px;">Дата заказа</label>
                    <span style="border: 1px solid black; padding: 5px 10px; display: inline-block; min-width: 120px;">${orderDate}</span>
                </div>
                <div style="text-align: center;">
                    <label style="font-weight: bold; margin-right: 10px;">Дата готовности</label>
                    <span style="border: 1px solid black; padding: 5px 10px; display: inline-block; min-width: 120px;">${deliveryDate}</span>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 15px;">
                <label style="font-weight: bold; margin-right: 10px;">Pd</label>
                <span style="border: 1px solid black; padding: 5px 10px; display: inline-block; min-width: 80px;">${pd}</span>
            </div>
        </div>
        
        <div style="margin-bottom: 30px;">
            <h3 style="margin-bottom: 15px; color: black;">Товары и услуги</h3>
            <table style="width: 100%; border-collapse: collapse; border: 2px solid black;">
                <thead>
                    <tr style="background: #f0f0f0;">
                        <th style="border: 1px solid black; padding: 10px; text-align: left;">Наименование</th>
                        <th style="border: 1px solid black; padding: 10px; text-align: center; width: 80px;">Кол-во</th>
                        <th style="border: 1px solid black; padding: 10px; text-align: center; width: 100px;">Цена за ед.</th>
                        <th style="border: 1px solid black; padding: 10px; text-align: center; width: 80px;">Скидка %</th>
                        <th style="border: 1px solid black; padding: 10px; text-align: center; width: 120px;">Сумма</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHTML}
                </tbody>
            </table>
        </div>
        
        <div style="margin-top: 30px;">
            <div style="display: flex; justify-content: flex-end; gap: 30px;">
                <div style="text-align: center;">
                    <label style="font-weight: bold; display: block; margin-bottom: 5px;">Итого</label>
                    <span style="border: 1px solid black; padding: 8px 15px; display: inline-block; min-width: 100px; font-weight: bold;">${totalAmount} KZT</span>
                </div>
                <div style="text-align: center;">
                    <label style="font-weight: bold; display: block; margin-bottom: 5px;">Оплачено</label>
                    <span style="border: 1px solid black; padding: 8px 15px; display: inline-block; min-width: 100px; font-weight: bold;">${paidAmount} KZT</span>
                </div>
                <div style="text-align: center;">
                    <label style="font-weight: bold; display: block; margin-bottom: 5px;">Долг</label>
                    <span style="border: 1px solid black; padding: 8px 15px; display: inline-block; min-width: 100px; font-weight: bold;">${debtAmount} KZT</span>
                </div>
            </div>
        </div>
    `;
    
    return printableDiv;
}

function generateFinancialReport() {
    alert('Создание финансового отчета - функция в разработке');
}

// Add some CSS for the new elements
const additionalStyles = `
<style>
.order-card, .client-card, .inventory-item {
    background: white;
    padding: 1.5rem;
    border-radius: 10px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    margin-bottom: 1rem;
}

.order-header, .client-info, .item-info {
    margin-bottom: 1rem;
}

.status {
    padding: 0.25rem 0.75rem;
    border-radius: 15px;
    font-size: 0.8rem;
    font-weight: bold;
}

.status-new { background: #e3f2fd; color: #1976d2; }
.status-progress { background: #fff3e0; color: #f57c00; }
.status-ready { background: #e8f5e8; color: #388e3c; }
.status-delivered { background: #f3e5f5; color: #7b1fa2; }

.stock-low { color: #d32f2f; font-weight: bold; }
.stock-medium { color: #f57c00; font-weight: bold; }
.stock-good { color: #388e3c; font-weight: bold; }

.order-actions, .client-actions, .item-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.order-details p, .client-info p, .item-info p {
    margin: 0.25rem 0;
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', additionalStyles);

// Preload logo for exports
async function preloadLogo() {
    try {
        console.log('Preloading logo for exports...');
        globalLogoDataURL = await loadImageAsDataURL('logo.png');
        console.log('Logo preloaded successfully');
    } catch (error) {
        console.warn('Failed to preload logo:', error);
        globalLogoDataURL = null;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load sample data
    loadSampleData();
    
    // Setup form calculations
    setupFormCalculations();
    
    // Load initial data
    loadOrders();
    loadClients();
    loadInventory();
    loadFinance();
    updateDashboard();
    
    // Setup search functionality
    setupSearch();
    
    // Preload logo for exports
    preloadLogo();
    
    // Show dashboard by default
    showSection('dashboard');
});
