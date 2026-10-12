const menuItems = [
  {
    id: 1,
    name: 'ชาไทย',
    price: 45,
    description: 'ชาล้วนเข้มข้น กลิ่นหอมอ่อน ๆ เหมาะสำหรับมื้อเช้าแบบสดชื่น',
    status: 'open',
  },
  {
    id: 2,
    name: 'มัทฉะลาเต้',
    price: 75,
    description: 'นมข้นหวานผสมมัทฉะสูตรเข้มข้น พร้อมฟองนมเนียนละมุน',
    status: 'open',
  },
  {
    id: 3,
    name: 'น้ำส้มคั้น',
    price: 55,
    description: 'รสเปรี้ยวสดชื่นจากส้มคั้นบริสุทธิ์ ไม่หวานเกินไป',
    status: 'out_of_stock',
  },
  {
    id: 4,
    name: 'กาแฟเย็น',
    price: 65,
    description: 'กาแฟคั่วอ่อนเข้มข้น ดื่มคู่กับนมและน้ำเชื่อมแบบเรียบลื่น',
    status: 'open',
  },
];

const menuListElement = document.getElementById('menu-list');

const statusLabels = {
  open: 'เปิดขาย',
  out_of_stock: 'หมด',
};

function formatPrice(value) {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
  }).format(value);
}

function renderMenu(items) {
  if (!items || items.length === 0) {
    menuListElement.innerHTML = '<p>ขณะนี้ไม่มีรายการเครื่องดื่ม</p>';
    return;
  }

  menuListElement.innerHTML = items
    .map((item) => {
      const isAvailable = item.status === 'open';
      const statusClass = isAvailable ? 'status-available' : 'status-soldout';
      const buttonLabel = isAvailable ? 'สั่งซื้อ' : 'หมด';

      return `
        <article class="menu-item" aria-label="${item.name}">
          <div class="menu-item__meta">
            <h2>${item.name}</h2>
            <span class="status-badge ${statusClass}">${statusLabels[item.status]}</span>
          </div>

          <p class="menu-item__description">${item.description}</p>

          <div class="menu-item__footer">
            <strong class="price">${formatPrice(item.price)}</strong>
            <button type="button" class="order-button" ${isAvailable ? '' : 'disabled'}>
              ${buttonLabel}
            </button>
          </div>
        </article>
      `;
    })
    .join('');
}

renderMenu(menuItems);
