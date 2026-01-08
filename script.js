// script.js - Logic chính cho trang menu khách hàng (index.html)

let cart = {};

// ==================== LẤY SỐ BÀN TỪ URL ====================
const urlParams = new URLSearchParams(window.location.search);
const tableNumber = urlParams.get('table');

if (!tableNumber) {
    alert('Vui lòng chọn bàn trước khi vào menu!');
    window.location.href = 'tables.html';
} else {
    const tableDisplay = document.getElementById('table-number');
    if (tableDisplay) tableDisplay.textContent = tableNumber;
}

// ==================== DỮ LIỆU MENU ====================
let categories = JSON.parse(localStorage.getItem('categories')) || [
    { name: 'Nghêu', dishes: [
        { name: 'Hấp sả', img: 'https://static.wixstatic.com/media/98a670_814e263709444cc9a387d072de0ddc06~mv2.jpg/v1/fill/w_1000,h_750,al_c,q_85,usm_0.66_1.00_0.01/98a670_814e263709444cc9a387d072de0ddc06~mv2.jpg', price: 50000, note: '' },
        { name: 'Hấp sả ớt', img: 'https://maiyummy.wordpress.com/wp-content/uploads/2015/07/ngheu-1.jpg', price: 55000, note: '' }
    ]},
    { name: 'Ốc đắng', dishes: [
        { name: 'Hấp sả', img: 'https://i.ytimg.com/vi/q6H6cKUVli0/maxresdefault.jpg', price: 50000, note: '' },
        { name: 'Xào bơ tỏi', img: 'https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=2039019342785576', price: 60000, note: '' }
    ]},
    { name: 'Tôm', dishes: [
        { name: 'Xào mý', img: 'https://i0.wp.com/vickypham.com/wp-content/uploads/2015/12/6b0a4-vietnamese-salt-pepper-prawns-tom-rang-muoi.jpg?resize=3126%2C2084', price: 70000, note: '' },
        { name: 'Nướng mọi', img: 'https://phostreet.com.sg/wp-content/uploads/2025/11/Vietnamese-Salt-Roasted-Shrimp-Tom-Rang-Muoi-Recipe.jpg', price: 70000, note: '' },
        { name: 'Rang muối', img: 'https://i.ytimg.com/vi/4gTrFP7d2Yk/hq720.jpg', price: 80000, note: '' }
    ]}
];

// ==================== RENDER MENU ====================
function renderMenu() {
    const container = document.getElementById('menu-container');
    if (!container) return;
    container.innerHTML = '';

    categories.forEach((cat, index) => {
        // Header danh mục
        const header = document.createElement('section');
        header.className = 'category-header';
        header.innerHTML = `<span>${cat.name}</span><i class="fas fa-chevron-down arrow"></i>`;
        header.onclick = () => toggleCategory(index);
        container.appendChild(header);

        // Danh sách món
        const list = document.createElement('div');
        list.className = 'dish-list';
        list.id = `cat-${index}`;

        cat.dishes.forEach(dish => {
            const dishEl = document.createElement('div');
            dishEl.className = 'dish';
           dishEl.innerHTML = `
                <img src="${dish.img}" alt="${dish.name}" class="dish-img" data-name="${dish.name} (${cat.name})">
                <div class="dish-info">
                    <div class="dish-name">${dish.name}</div>
                    <div class="dish-price" style="${dish.note ? 'color:#ff4444; font-weight:bold;' : ''}">
                        ${dish.note ? 'Liên hệ báo giá' : 'VND ' + dish.price.toLocaleString()}
                    </div>
                    ${dish.note ? `<div class="dish-note">(${dish.note})</div>` : ''}
                </div>
                <button class="add-btn" data-name="${dish.name} (${cat.name})">Thêm</button>
            `;
            list.appendChild(dishEl);
        });

        container.appendChild(list);
    });

    // Gắn sự kiện thêm món
    document.querySelectorAll('.add-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            addToCart(btn.dataset.name);
        };
    });

    document.querySelectorAll('.dish-img').forEach(img => {
        img.onclick = (e) => {
            e.stopPropagation();
            addToCart(img.dataset.name);
        };
    });
}

// Mở/đóng danh mục (bấm lần 2 ẩn đi)
function toggleCategory(index) {
    const list = document.getElementById(`cat-${index}`);
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

    // Tính tổng số lượng món
    let totalItems = 0;
    Object.keys(cart).forEach(name => {
        totalItems += cart[name];
    });

    // Cập nhật badge
    const badge = document.getElementById('cart-badge');
    if (badge) {
        badge.textContent = totalItems;
        if (totalItems === 0) {
            badge.classList.add('zero');
        } else {
            badge.classList.remove('zero');
        }
    }

    if (totalItems === 0) {
        itemsContainer.innerHTML = '<div id="cart-empty">Chưa có món nào</div>';
        
        // Mở khóa nút quay lại khi giỏ trống
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

        // Khóa nút quay lại khi có món
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

// ==================== XÁC NHẬN ĐƠN HÀNG ====================
function confirmOrder() {
    if (Object.keys(cart).length === 0) {
        alert('Giỏ hàng đang trống! Vui lòng chọn món trước.');
        return;
    }

    const orders = JSON.parse(localStorage.getItem('orders')) || {};
    orders[tableNumber] = {
        items: { ...cart },
        note: localStorage.getItem(`table_${tableNumber}_note`) || ''
    };
    localStorage.setItem('orders', JSON.stringify(orders));

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
        // Sau khi xác nhận → mở khóa nút quay lại (nếu còn nút)
    const backBtn = document.getElementById('back-to-tables-btn');
    if (backBtn) {
        backBtn.disabled = false;
        backBtn.style.opacity = '1';
        backBtn.style.cursor = 'pointer';
        backBtn.title = '';
        backBtn.onclick = backToTables;
    }
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

// ==================== KHỞI ĐỘNG ====================
renderMenu();
updateCart();