const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { runInNewContext } = require('node:vm');
const { test } = require('node:test');

const appScript = readFileSync(resolve(__dirname, '../app.js'), 'utf8');
const indexHtml = readFileSync(resolve(__dirname, '../index.html'), 'utf8');
const menuListElement = { innerHTML: '' };

runInNewContext(appScript, {
  document: {
    getElementById(id) {
      assert.equal(id, 'menu-list');
      return menuListElement;
    },
  },
});

function getMenuItemMarkup(name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const article = menuListElement.innerHTML.match(
    new RegExp(`<article class="menu-item" aria-label="${escapedName}">[\\s\\S]*?<\\/article>`),
  );

  assert.ok(article, `Expected menu item "${name}" to be rendered`);
  return article[0];
}

test('AC-MENU-02: หน้าเมนูโหลด app.js และมีพื้นที่แสดงรายการเมนู', () => {
  assert.match(indexHtml, /<div id="menu-list"/);
  assert.match(indexHtml, /<script src="app\.js"><\/script>/);
  assert.match(menuListElement.innerHTML, /<article class="menu-item"/);
});

test('AC-MENU-02: เมนูหมดสต็อกแสดงสถานะ “หมด”', () => {
  const soldOutMenu = getMenuItemMarkup('น้ำส้มคั้น');

  assert.match(soldOutMenu, /<span class="status-badge status-soldout">หมด<\/span>/);
});

test('AC-MENU-02: เมนูหมดสต็อกไม่สามารถกดปุ่มสั่งซื้อได้', () => {
  const soldOutMenu = getMenuItemMarkup('น้ำส้มคั้น');
  const orderButton = soldOutMenu.match(/<button\b[^>]*>[\s\S]*?<\/button>/);

  assert.ok(orderButton, 'Expected sold-out menu to render an order button');
  assert.match(orderButton[0], /<button\b[^>]*\bdisabled(?:\s|>)/);
});

test('AC-MENU-02: เมนูที่เปิดขายแสดงสถานะ “เปิดขาย” และปุ่ม “สั่งซื้อ” ที่ใช้งานได้', () => {
  const availableMenu = getMenuItemMarkup('ชาไทย');
  const orderButton = availableMenu.match(/<button\b[^>]*>[\s\S]*?<\/button>/);

  assert.match(availableMenu, /<span class="status-badge status-available">เปิดขาย<\/span>/);
  assert.ok(orderButton, 'Expected available menu to render an order button');
  assert.match(orderButton[0], />\s*สั่งซื้อ\s*<\/button>/);
  assert.doesNotMatch(orderButton[0], /\bdisabled\b/);
});
