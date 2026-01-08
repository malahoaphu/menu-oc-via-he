// admin-script.js - Toàn bộ logic cho trang admin (phiên bản hoàn chỉnh với tải ảnh + preview)

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

let currentCatIndex = null; // Lưu danh mục đang thêm món
let currentDishImageData = ''; // Lưu tạm ảnh (base64 hoặc URL)

// ==================== ĐĂNG NHẬP ====================
function checkPassword() {
    const password = document.getElementById('admin-password').value.trim();
    const savedPassword = localStorage.getItem('admin_password') || '20062003';

    if (password === savedPassword) {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';
        openTab('orders'); // Mở tab đơn hàng trước
        renderOrders();
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
    container.innerHTML = '';

    categories.forEach((cat, catIdx) => {
        const catDiv = document.createElement('div');
        catDiv.className = 'category-admin';
        catDiv.innerHTML = `
            <h3>
                <input type="text" value="${cat.name}" id="cat-${catIdx}-name">
                <button onclick="deleteCategory(${catIdx})" class="delete-btn">Xóa Danh Mục</button>
            </h3>
            <button onclick="addDish(${catIdx})">+ Thêm Món Vào Danh Mục Này</button>
            <div>
                ${cat.dishes.map((dish, dishIdx) => `
                    <div class="dish-admin">
                        <input type="text" value="${dish.name}" id="dish-${catIdx}-${dishIdx}-name" placeholder="Tên món">
                        <input type="text" value="${dish.img}" id="dish-${catIdx}-${dishIdx}-img" placeholder="URL ảnh">
                        <input type="number" value="${dish.price || 0}" id="dish-${catIdx}-${dishIdx}-price" placeholder="Giá">
                        <textarea id="dish-${catIdx}-${dishIdx}-note" placeholder="Ghi chú (nếu có thì giá sẽ đỏ và hiện 'Liên hệ báo giá')">${dish.note || ''}</textarea>
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
    if (name && name.trim() !== '') {
        categories.push({ name: name.trim(), dishes: [] });
        renderAdmin();
    }
}

function deleteCategory(idx) {
    if (confirm('Xóa toàn bộ danh mục này và tất cả món bên trong?')) {
        categories.splice(idx, 1);
        renderAdmin();
    }
}

// ==================== MODAL THÊM MÓN (TẢI ẢNH + PREVIEW) ====================
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

// Xử lý tải ảnh từ file (điện thoại/máy tính)
document.getElementById('new-dish-file').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            currentDishImageData = event.target.result;
            document.getElementById('dish-preview').src = currentDishImageData;
            document.getElementById('dish-preview').style.display = 'block';
            document.getElementById('new-dish-img').value = ''; // Xóa URL nếu đang có
        };
        reader.readAsDataURL(file);
    }
});

// Xử lý nhập URL ảnh (preview URL)
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

    if (!name) {
        alert('Vui lòng nhập tên món!');
        return;
    }

    if (!currentDishImageData) {
        alert('Vui lòng chọn ảnh từ máy hoặc nhập URL ảnh!');
        return;
    }

    if (isNaN(price) || price < 0) {
        alert('Giá tiền phải là số hợp lệ!');
        return;
    }

    categories[currentCatIndex].dishes.push({
        name: name,
        img: currentDishImageData, // base64 hoặc URL
        price: price,
        note: note
    });

    closeAddDishModal();
    renderAdmin();
}

function deleteDish(catIdx, dishIdx) {
    if (confirm('Xóa món này khỏi menu?')) {
        categories[catIdx].dishes.splice(dishIdx, 1);
        renderAdmin();
    }
}

function saveChanges() {
    categories.forEach((cat, catIdx) => {
        const nameInput = document.getElementById(`cat-${catIdx}-name`);
        if (nameInput) cat.name = nameInput.value.trim();

        cat.dishes.forEach((dish, dishIdx) => {
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

    localStorage.setItem('categories', JSON.stringify(categories));
    alert('Đã lưu tất cả thay đổi thành công!\nẢnh và ghi chú đã được cập nhật.');
}

// ==================== XEM ĐƠN HÀNG THEO BÀN ====================
function renderOrders() {
    const container = document.getElementById('orders-view');
    if (!container) return;
    container.innerHTML = '';

    const orders = JSON.parse(localStorage.getItem('orders')) || {};

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
                ${Object.keys(order.items).map(item => `<li>${item} × ${order.items[item]}</li>`).join('')}
            </ul>
            <button onclick="clearTableOrder('${table}')" class="delete-btn">Xóa Đơn Bàn Này</button>
        `;
        container.appendChild(div);
    });
}

function clearTableOrder(table) {
    if (confirm(`Xóa toàn bộ đơn hàng bàn ${table}?`)) {
        const orders = JSON.parse(localStorage.getItem('orders')) || {};
        delete orders[table];
        localStorage.setItem('orders', JSON.stringify(orders));
        renderOrders();
    }
}

// ==================== KHỞI ĐỘNG ====================
document.addEventListener('DOMContentLoaded', () => {
    // Không tự render, chờ đăng nhập
});
