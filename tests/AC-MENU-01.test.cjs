const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { runInNewContext } = require('node:vm');
const { test } = require('node:test');

const appScript = readFileSync(resolve(__dirname, '../app.js'), 'utf8');
const renderCall = 'renderMenu(menuItems);';

function renderMenuWith(items) {
  assert.equal(appScript.split(renderCall).length - 1, 1);

  const menuListElement = { innerHTML: '' };
  const scriptWithTestData = appScript.replace(renderCall, 'renderMenu(testMenuItems);');

  runInNewContext(scriptWithTestData, {
    document: {
      getElementById(id) {
        assert.equal(id, 'menu-list');
        return menuListElement;
      },
    },
    testMenuItems: items,
  });

  return menuListElement.innerHTML;
}

test('test_TC_MENU_01_1_no_menu_data', () => {
  // Given: ระบบไม่มีรายการเครื่องดื่มเลย
  // When: ผู้ใช้เปิดหน้ารายการเมนู
  const menuMarkup = renderMenuWith([]);

  // Then: ระบบแสดงข้อความ “ขณะนี้ไม่มีรายการเครื่องดื่ม” (FR-01, AC-MENU-01)
  assert.match(menuMarkup, /ขณะนี้ไม่มีรายการเครื่องดื่ม/);
});

test('test_TC_MENU_01_2_show_open_menu_items', () => {
  // Given: ระบบมีรายการเครื่องดื่มที่ร้านเปิดขาย
  // When: ผู้ใช้เปิดหน้ารายการเมนู
  const menuMarkup = renderMenuWith([
    {
      id: 101,
      name: 'ชาไทยสำหรับทดสอบ',
      price: 45,
      description: 'รายละเอียดชาไทยสำหรับทดสอบ',
      status: 'open',
    },
    {
      id: 102,
      name: 'กาแฟสำหรับทดสอบ',
      price: 65,
      description: 'รายละเอียดกาแฟสำหรับทดสอบ',
      status: 'open',
    },
  ]);

  // Then: ระบบแสดงรายการเครื่องดื่มที่ร้านเปิดขาย (FR-01, AC-MENU-01)
  assert.match(menuMarkup, /aria-label="ชาไทยสำหรับทดสอบ"/);
  assert.match(menuMarkup, /aria-label="กาแฟสำหรับทดสอบ"/);
});

test('test_TC_MENU_01_3_show_single_open_menu_item', () => {
  // Given: ระบบมีรายการเครื่องดื่มที่ร้านเปิดขาย 1 รายการ
  // When: ผู้ใช้เปิดหน้ารายการเมนู
  const menuMarkup = renderMenuWith([
    {
      id: 103,
      name: 'ชาเขียวรายการเดียว',
      price: 55,
      description: 'รายละเอียดชาเขียวรายการเดียว',
      status: 'open',
    },
  ]);

  // Then: ระบบแสดงรายการเครื่องดื่มที่ร้านเปิดขาย (FR-01, AC-MENU-01)
  assert.match(menuMarkup, /aria-label="ชาเขียวรายการเดียว"/);
  assert.equal((menuMarkup.match(/<article class="menu-item"/g) || []).length, 1);
});
