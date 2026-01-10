// admin-script.js - Toàn bộ logic cho trang admin (fix lưu giá & đơn hàng hiển thị)

import { db, ref, onValue, set, remove } from "./firebase.js";

let categories = [];

// Lắng nghe realtime từ root (cấu trúc 0,1,2 trực tiếp ở root cho menu)
const rootRef = ref(db, '/');
onValue(rootRef, (snapshot) => {
    const data = snapshot.val() || {};
    
    // Lấy danh mục menu (key là số 0,1,2...)
    const categoryEntries = Object.entries(data)
        .filter(([key]) => !isNaN(key))
        .sort(([keyA], [keyB]) => Number(keyA) - Number(keyB));

    categories = categoryEntries.map(([key, value]) => {
        return {
            name: value?.name || '',
            dishes: Array.isArray(value?.dishes) ? value.dishes : []
        };
    });
    
    renderAdmin();
}, (error) => {
    console.error("Lỗi đọc Firebase:", error);
    categories = [];
    renderAdmin();
});

let currentCatIndex = null;
let currentDishImageData = '';

// ==================== ĐĂNG NHẬP ====================
function checkPassword() {
    const password = document.getElementById('admin-password').value.trim();
    const savedPassword = localStorage.getItem('admin_password') || '20062003';

    if (password === savedPassword) {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';
        openTab('orders');
        renderOrders();
        renderAdmin();
    } else {
        alert('Mật khẩu sai! Vui lòng thử lại.');
        document.getElementById('admin-password').value = '';
    }
}

document.getElementById('admin-password').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') checkPassword();
});

// ==================== TAB CHUYỂN ĐỔI ====================
function openTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    document.getElementById(tabName + '-tab').classList.add('active');
    document.querySelector(`.tab-btn[onclick="openTab('${tabName}')"]`).classList.add('active');

    if (tabName === 'menu') renderAdmin();
    if (tabName === 'orders') renderOrders();
}

// ==================== QUẢN LÝ MENU ====================
function renderAdmin() {
    const container = document.getElementById('admin-categories');
    if (!container) return;
    container.innerHTML = '';

    if (categories.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#888;">Đang tải menu...</p>';
        return;
    }

    categories.forEach((cat, catIdx) => {
        const catDiv = document.createElement('div');
        catDiv.className = 'category-admin';
        catDiv.innerHTML = `
            <h3>
                <input type="text" value="${cat.name || ''}" id="cat-${catIdx}-name">
                <button onclick="deleteCategory(${catIdx})" class="delete-btn">Xóa Danh Mục</button>
            </h3>
            <button onclick="addDish(${catIdx})">+ Thêm Món Vào Danh Mục Này</button>
            <div>
                ${(cat.dishes || []).map((dish, dishIdx) => `
                    <div class="dish-admin">
                        <input type="text" value="${dish.name || ''}" id="dish-${catIdx}-${dishIdx}-name">
                        <input type="text" value="${dish.img || ''}" id="dish-${catIdx}-${dishIdx}-img">
                        <input type="number" value="${dish.price || 0}" id="dish-${catIdx}-${dishIdx}-price">
                        <textarea id="dish-${catIdx}-${dishIdx}-note">${dish.note || ''}</textarea>
                        <button onclick="deleteDish(${catIdx}, ${dishIdx})" class="delete-btn">Xóa Món</button>
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(catDiv);
    });
}

function addCategory() {
    const name = prompt('Nhập tên danh mục mới:');
    if (name && name.trim()) {
        categories.push({ name: name.trim(), dishes: [] });
        saveChanges();
    }
}

function deleteCategory(idx) {
    if (confirm('Xóa danh mục này?')) {
        categories.splice(idx, 1);
        saveChanges();
    }
}

// ==================== MODAL THÊM MÓN ====================
function addDish(catIdx) {
    currentCatIndex = catIdx;
    currentDishImageData = '';

    document.getElementById('new-dish-name').value = '';
    document.getElementById('new-dish-img').value = '';
    document.getElementById('new-dish-price').value = '0';
    document.getElementById('new-dish-note').value = '';
    document.getElementById('dish-preview').style.display = 'none';
    document.getElementById('dish-preview').src = '';

    document.getElementById('add-dish-modal').style.display = 'flex';
}

function closeAddDishModal() {
    document.getElementById('add-dish-modal').style.display = 'none';
    currentCatIndex = null;
    currentDishImageData = '';
}

document.getElementById('new-dish-file').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            currentDishImageData = event.target.result;
            document.getElementById('dish-preview').src = currentDishImageData;
            document.getElementById('dish-preview').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('new-dish-img').addEventListener('input', function(e) {
    const url = e.target.value.trim();
    if (url) {
        currentDishImageData = url;
        document.getElementById('dish-preview').src = url;
        document.getElementById('dish-preview').style.display = 'block';
    }
});

function confirmAddDish() {
    const name = document.getElementById('new-dish-name').value.trim();
    const price = Number(document.getElementById('new-dish-price').value);
    const note = document.getElementById('new-dish-note').value.trim();

    if (!name) return alert('Nhập tên món!');
    if (!currentDishImageData) return alert('Chọn ảnh hoặc nhập URL!');
    if (isNaN(price) || price < 0) return alert('Giá hợp lệ!');

    categories[currentCatIndex].dishes.push({
        name,
        img: currentDishImageData,
        price,
        note
    });

    closeAddDishModal();
    saveChanges();
}

function deleteDish(catIdx, dishIdx) {
    if (confirm('Xóa món?')) {
        categories[catIdx].dishes.splice(dishIdx, 1);
        saveChanges();
    }
}

function saveChanges() {
    // Đọc giá trị từ input trước khi lưu (để lưu thay đổi giá/tên/note)
    categories.forEach((cat, catIdx) => {
        const nameInput = document.getElementById(`cat-${catIdx}-name`);
        if (nameInput) cat.name = nameInput.value.trim();

        (cat.dishes || []).forEach((dish, dishIdx) => {
            const nameIn = document.getElementById(`dish-${catIdx}-${dishIdx}-name`);
            const imgIn = document.getElementById(`dish-${catIdx}-${dishIdx}-img`);
            const priceIn = document.getElementById(`dish-${catIdx}-${dishIdx}-price`);
            const noteIn = document.getElementById(`dish-${catIdx}-${dishIdx}-note`);

            if (nameIn) dish.name = nameIn.value.trim();
            if (imgIn) dish.img = imgIn.value.trim();
            if (priceIn) dish.price = Number(priceIn.value) || 0;
            if (noteIn) dish.note = noteIn.value.trim();
        });
    });

    // Lưu lên Firebase
    const data = {};
    categories.forEach((cat, index) => {
        data[index] = cat;
    });

    set(ref(db, '/'), data).then(() => {
        alert('Lưu thành công!');
        renderAdmin(); // Refresh giao diện
    }).catch((error) => {
        alert('Lỗi lưu: ' + error.message);
    });
}

// ==================== XEM ĐƠN HÀNG ====================
// ==================== XEM ĐƠN HÀNG ====================
function renderOrders() {
    const container = document.getElementById('orders-view');
    if (!container) return;
    container.innerHTML = '<p style="text-align:center; color:#888;">Đang tải đơn hàng...</p>';

    // Đọc từ node riêng /orders
    const ordersRef = ref(db, 'orders');
    onValue(ordersRef, (snapshot) => {
        const orders = snapshot.val() || {};

        container.innerHTML = '';
        if (Object.keys(orders).length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#888;">Chưa có đơn hàng nào.</p>';
            return;
        }

        Object.keys(orders).sort((a, b) => Number(a) - Number(b)).forEach(table => {
            const order = orders[table];
            const div = document.createElement('div');
            div.className = 'category-admin';
            div.innerHTML = `
                <h3>Bàn ${table}</h3>
                <p><strong>Ghi chú:</strong> ${order.note || '<i>Không có</i>'}</p>
                <ul style="margin-left:20px;">
                    ${Object.keys(order.items || {}).map(item => `<li>${item} × ${order.items[item]}</li>`).join('')}
                </ul>
                <button onclick="clearTableOrder('${table}')" class="delete-btn">Xóa Đơn Bàn Này</button>
            `;
            container.appendChild(div);
        });
    });
}

function clearTableOrder(table) {
    if (confirm(`Xóa đơn bàn ${table}?`)) {
        remove(ref(db, `orders/${table}`)).then(() => {
            alert('Xóa thành công!');
        }).catch(error => {
            alert('Lỗi xóa: ' + error.message);
        });
    }
}

// Hủy đăng nhập, quay về trang menu khách
function cancelLogin() {
    window.location.href = 'index.html'; // Quay về trang menu (không đăng nhập)
}

// ==================== KHỞI ĐỘNG ====================
document.addEventListener('DOMContentLoaded', () => {
    // Không tự render, chờ đăng nhập
});

// Export hàm ra global scope để onclick trong HTML hoạt động
window.checkPassword = checkPassword;
window.openTab = openTab;
window.addCategory = addCategory;
window.deleteCategory = deleteCategory;
window.addDish = addDish;
window.closeAddDishModal = closeAddDishModal;
window.confirmAddDish = confirmAddDish;
window.deleteDish = deleteDish;
window.saveChanges = saveChanges;
window.clearTableOrder = clearTableOrder;
window.cancelLogin = cancelLogin;
