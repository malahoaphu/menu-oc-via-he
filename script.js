// script.js - Logic chính cho trang menu khách hàng (index.html) - kết nối Firebase realtime

let cart = {};

// Import Firebase từ file firebase.js
import { db, ref, onValue, set } from "./firebase.js";

// ==================== LẤY SỐ BÀN TỪ URL ====================
const urlParams = new URLSearchParams(window.location.search);
const tableNumber = urlParams.get('table');
const mode = urlParams.get('mode'); // 'add' nếu từ admin thêm món

if (!tableNumber) {
    alert('Vui lòng chọn bàn trước khi vào menu!');
    window.location.href = 'tables.html';
} else {
    const tableDisplay = document.getElementById('table-number');
    if (tableDisplay) tableDisplay.textContent = tableNumber;

    // Nếu là chế độ thêm món từ admin
    if (mode === 'add') {
        document.querySelector('.title').textContent = `Thêm Món Cho Bàn ${tableNumber}`;
        const confirmBtn = document.getElementById('confirm-order');
        if (confirmBtn) {
            confirmBtn.textContent = 'Thêm Món Vào Đơn';
            confirmBtn.onclick = confirmAddToOrder; // Gán hàm thêm món
        }
    }
}

// ==================== DỮ LIỆU MENU TỪ FIREBASE ====================
let categories = []; // Mảng rỗng mặc định để tránh lỗi

// Lắng nghe realtime từ root
const rootRef = ref(db, '/');
onValue(rootRef, (snapshot) => {
    const data = snapshot.val() || {};
    // Chuyển object {0:..., 1:..., 2:...} thành mảng an toàn
    const categoryEntries = Object.entries(data)
        .filter(([key]) => !isNaN(key)) // Chỉ lấy key số
        .sort(([a], [b]) => Number(a) - Number(b)); // Sắp xếp theo key số

    categories = categoryEntries.map(([key, value]) => value || {}); // Lấy value (danh mục)
    renderMenu();
}, (error) => {
    console.error("Lỗi đọc Firebase:", error);
    categories = [];
    renderMenu();
});

// ==================== RENDER MENU ====================
function renderMenu() {
    const container = document.getElementById('menu-container');
    if (!container) return;

    container.innerHTML = '';

    if (categories.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#888; font-size:18px;">Đang tải menu từ server...</p>';
        return;
    }

    categories.forEach((cat, index) => {
        const header = document.createElement('section');
        header.className = 'category-header';
        header.innerHTML = `<span>${cat.name || 'Danh mục không tên'}</span><i class="fas fa-chevron-down arrow"></i>`;
        header.onclick = () => toggleCategory(index);
        container.appendChild(header);

        const list = document.createElement('div');
        list.className = 'dish-list';
        list.id = `cat-${index}`;

        (cat.dishes || []).forEach(dish => {
            const dishEl = document.createElement('div');
            dishEl.className = 'dish';
            dishEl.innerHTML = `
                <img src="${dish.img || 'https://via.placeholder.com/100'}" alt="${dish.name || 'Món ăn'}" class="dish-img" data-name="${dish.name || 'Món'} (${cat.name})">
                <div class="dish-info">
                    <div class="dish-name">${dish.name || 'Món không tên'}</div>
                    <div class="dish-price" style="${dish.note ? 'color:#ff4444; font-weight:bold;' : ''}">
                        ${dish.note ? 'Liên hệ báo giá' : 'VND ' + (dish.price || 0).toLocaleString()}
                    </div>
                    ${dish.note ? `<div class="dish-note">(${dish.note})</div>` : ''}
                </div>
                <button class="add-btn" data-name="${dish.name || 'Món'} (${cat.name})">Thêm</button>
            `;
            list.appendChild(dishEl);
        });

        container.appendChild(list);
    });

    // Gắn sự kiện thêm món
    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            addToCart(btn.dataset.name);
        });
    });

    document.querySelectorAll('.dish-img').forEach(img => {
        img.addEventListener('click', (e) => {
            e.stopPropagation();
            addToCart(img.dataset.name);
        });
    });
}

// Mở/đóng danh mục
function toggleCategory(index) {
    const list = document.getElementById(`cat-${index}`);
    if (!list) return;
    const header = document.querySelectorAll('.category-header')[index];
    const isOpen = list.classList.contains('open');

    document.querySelectorAll('.dish-list').forEach(l => l.classList.remove('open'));
    document.querySelectorAll('.category-header').forEach(h => h.classList.remove('active'));

    if (!isOpen) {
        list.classList.add('open');
        header.classList.add('active');
    }
}

// ==================== GIỎ HÀNG ====================
function addToCart(name) {
    cart[name] = (cart[name] || 0) + 1;
    updateCart();
}

function removeFromCart(name) {
    if (cart[name] && cart[name] > 1) {
        cart[name]--;
    } else {
        delete cart[name];
    }
    updateCart();
}

function updateCart() {
    const itemsContainer = document.getElementById('cart-items');
    if (!itemsContainer) return;

    itemsContainer.innerHTML = '';

    let totalItems = 0;
    Object.keys(cart).forEach(name => {
        totalItems += cart[name];
    });

    const badge = document.getElementById('cart-badge');
    if (badge) {
        badge.textContent = totalItems;
        if (totalItems === 0) badge.classList.add('zero');
        else badge.classList.remove('zero');
    }

    if (totalItems === 0) {
        itemsContainer.innerHTML = '<div id="cart-empty">Chưa có món nào</div>';

        const backBtn = document.getElementById('back-to-tables-btn');
        if (backBtn) {
            backBtn.disabled = false;
            backBtn.style.opacity = '1';
            backBtn.style.cursor = 'pointer';
            backBtn.title = '';
            backBtn.onclick = backToTables;
        }
    } else {
        Object.keys(cart).forEach(name => {
            const item = document.createElement('div');
            item.className = 'cart-item';
            item.innerHTML = `
                <span>${name}</span>
                <div class="cart-controls">
                    <button onclick="removeFromCart('${name}')">-</button>
                    <span style="font-size:18px; min-width:40px; text-align:center;">${cart[name]}</span>
                    <button onclick="addToCart('${name}')">+</button>
                </div>
            `;
            itemsContainer.appendChild(item);
        });

        const backBtn = document.getElementById('back-to-tables-btn');
        if (backBtn) {
            backBtn.disabled = true;
            backBtn.style.opacity = '0.5';
            backBtn.style.cursor = 'not-allowed';
            backBtn.title = 'Vui lòng xác nhận đơn hoặc xóa món trước khi quay lại';
            backBtn.onclick = null;
        }
    }
}

// ==================== GHI CHÚ BÀN ====================
function openNoteModal() {
    const savedNote = localStorage.getItem(`table_${tableNumber}_note`) || '';
    document.getElementById('table-note').value = savedNote;
    document.getElementById('note-modal').style.display = 'flex';
}

function closeNoteModal() {
    document.getElementById('note-modal').style.display = 'none';
}

function saveNote() {
    const note = document.getElementById('table-note').value.trim();
    localStorage.setItem(`table_${tableNumber}_note`, note);
    alert('Ghi chú đã được lưu!');
    closeNoteModal();
}

// ==================== XÁC NHẬN ĐƠN HÀNG (CHẾ ĐỘ THƯỜNG) ====================
function confirmOrder() {
    if (Object.keys(cart).length === 0) {
        alert('Giỏ hàng đang trống! Vui lòng chọn món trước.');
        return;
    }

    const orderRef = ref(db, tableNumber.toString());
    set(orderRef, {
        items: cart,
        note: localStorage.getItem(`table_${tableNumber}_note`) || '',
        timestamp: Date.now()
    }).then(() => {
        alert('Đơn hàng đã gửi bếp thành công!');
        cart = {};
        updateCart();

        document.getElementById('confirm-order').style.display = 'none';
        document.querySelector('.note-icon').style.display = 'none';
        document.getElementById('back-to-tables-btn').style.display = 'none';

        const confirmedMsg = document.getElementById('confirmed-message');
        document.getElementById('confirmed-table').textContent = tableNumber;
        confirmedMsg.style.display = 'block';

        document.getElementById('cart-items').innerHTML = `
            <p style="text-align:center; color:#00ff00; font-size:18px; font-weight:bold; margin:20px 0;">
                Đơn hàng đã gửi bếp thành công!
            </p>
        `;

        const backBtn = document.getElementById('back-to-tables-btn');
        if (backBtn) {
            backBtn.disabled = false;
            backBtn.style.opacity = '1';
            backBtn.style.cursor = 'pointer';
            backBtn.title = '';
            backBtn.onclick = backToTables;
        }
    }).catch((error) => {
        alert('Lỗi gửi đơn: ' + error.message);
    });
}

// ==================== THÊM MÓN CHO BÀN TỪ ADMIN (mode=add) ====================
function confirmAddToOrder() {
    if (Object.keys(cart).length === 0) {
        alert('Chưa chọn món nào để thêm!');
        return;
    }

    const orderRef = ref(db, `orders/${tableNumber}`);
    onValue(orderRef, (snapshot) => {
        const order = snapshot.val() || { items: {}, addedItems: {} };

        if (!order.addedItems) order.addedItems = {};
        Object.keys(cart).forEach(item => {
            order.addedItems[item] = (order.addedItems[item] || 0) + cart[item];
        });

        set(orderRef, {
            ...order,
            addedItems: order.addedItems
        }).then(() => {
            alert('Đã thêm món vào đơn bàn!');
            cart = {};
            updateCart();
            window.location.href = 'admin.html'; // Quay về trang admin
        });
    }, { onlyOnce: true });
}

// ==================== QUAY LẠI CHỌN BÀN ====================
function backToTables() {
    window.location.href = 'tables.html';
}

// ==================== SIDEBAR ====================
function openSidebar() {
    document.getElementById('sidebar').style.width = '250px';
}

function closeSidebar() {
    document.getElementById('sidebar').style.width = '0';
}

// Logout admin (xóa mật khẩu lưu tạm nếu có)
function logoutAdmin() {
    localStorage.removeItem('admin_password');
    alert('Đã logout admin!');
    window.location.href = 'index.html';
}

// ==================== TÌM KIẾM ====================
function toggleSearch() {
    const searchBar = document.getElementById('search-bar');
    const searchInput = document.getElementById('search-input');
    
    if (!searchBar || !searchInput) {
        console.error("Không tìm thấy thanh tìm kiếm!");
        return;
    }
    
    if (searchBar.style.display === 'none' || searchBar.style.display === '') {
        searchBar.style.display = 'block';
        searchInput.focus();
        searchInput.value = '';
        filterCategories(''); // Hiện lại tất cả khi mở
    } else {
        searchBar.style.display = 'none';
        searchInput.value = '';
        filterCategories(''); // Hiện lại tất cả khi đóng
    }
}

function filterCategories(query) {
    query = query.toLowerCase().trim();
    
    document.querySelectorAll('.category-header').forEach(header => {
        const categoryName = header.querySelector('span').textContent.toLowerCase();
        const list = document.getElementById(header.nextElementSibling.id);
        
        if (categoryName.includes(query) || query === '') {
            header.style.display = 'flex';
            if (list) list.style.display = 'block';
        } else {
            header.style.display = 'none';
            if (list) list.style.display = 'none';
        }
    });
}

// Gắn sự kiện tìm kiếm realtime
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterCategories(e.target.value);
        });
    }
});

// ==================== KHỞI ĐỘNG ====================
renderMenu();
updateCart();

// Export hàm ra global scope để onclick trong HTML render động hoạt động
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCart = updateCart;
window.confirmOrder = confirmOrder;
window.confirmAddToOrder = confirmAddToOrder;
window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;
window.backToTables = backToTables;
window.openNoteModal = openNoteModal;
window.closeNoteModal = closeNoteModal;
window.saveNote = saveNote;
window.toggleCategory = toggleCategory;
window.renderMenu = renderMenu;
window.logoutAdmin = logoutAdmin;
window.toggleSearch = toggleSearch;
