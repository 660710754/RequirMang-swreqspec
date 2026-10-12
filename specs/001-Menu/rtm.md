# RTM: ดูเมนูและโปรโมชั่น (Menu & Promotion)
อ้างอิง: spec.md Draft v7 | tasks.md | test-cases.md
สร้างด้วย /verify รอบสอง เมื่อ 2569-10-12 10:53 UTC | test: 10 ผ่าน 0 ไม่ผ่าน

## 1. ตามรอยไปข้างหน้า (requirement ไป โค้ด ไป test)
| ID | AC | task | โค้ด (ไฟล์: ฟังก์ชัน) | test (ผล) | สถานะ |
|---|---|---|---|---|---|
| FR-01 | AC-MENU-01 | T-01 completed | `app.js`: `renderMenu` (empty-list branch); `index.html`: `#menu-list` | `test_TC_MENU_01_1_no_menu_data`, `test_TC_MENU_01_2_show_open_menu_items`, `test_TC_MENU_01_3_show_single_open_menu_item` (ผ่าน) | ครบ |
| FR-02 | AC-MENU-02 | T-01 completed; T-02 pending | `app.js`: `statusLabels`, `formatPrice`, `renderMenu`; `index.html`: `#menu-list` | Test เดิมและ `test_TC_MENU_02_1_show_menu_data_and_status`, `test_TC_MENU_02_2_show_sold_out_menu`, `test_TC_MENU_02_3_show_single_available_menu` ผ่าน; ไม่มี Test สำหรับ TC-MENU-02-4 ที่อนุมัติแล้วและไม่มีการทดสอบการคลิกจริง | ช่องโหว่ — F-02; ข้อกำหนดใหม่ยังไม่ถึงใน T-02 |
| FR-03 | AC-MENU-03 | T-03 pending | ไม่มี search field หรือ search logic ใน `index.html` / `app.js` | ไม่มี Automated Test สำหรับ AC-MENU-03 | ยังไม่ถึง |
| FR-05 | AC-MENU-04 | T-04 pending | ไม่มี logic โปรโมชั่นใน `app.js` / `index.html` | ไม่มี Automated Test สำหรับ AC-MENU-04 | ยังไม่ถึง |
| UC-01 Exception Flow 2a | AC-MENU-05 | T-05 pending | ไม่มี error state หรือ retry action ใน `app.js` / `index.html` | ไม่มี Automated Test สำหรับ AC-MENU-05 | ยังไม่ถึง |
| NFR-22 | AC-MENU-06 | T-06 pending | ไม่มี performance/concurrency test | ไม่มีผลทดสอบ p95 ภายใต้ผู้ใช้พร้อมกัน 100 คน | ยังไม่ถึง |
| NFR-26 | AC-MENU-07 | T-07 pending | ไม่มี usability study | ไม่มีผลทดสอบผู้ใช้ใหม่ 10 คนตามเกณฑ์ 8 ใน 10 คน | ยังไม่ถึง |
| Constraint: ผู้ใช้ทั่วไปดูได้แต่แก้ไขไม่ได้ | ไม่มี AC เฉพาะ | T-01, T-02, T-04 | `index.html` และ `app.js`: UI แสดงรายการเท่านั้น; ไม่พบ edit action | ไม่มี Automated Test ที่ยืนยัน constraint แบบ read-only | ช่องโหว่ — F-03 |
| Constraint: ค้นหา partial และไม่แยกตัวพิมพ์เล็ก/ใหญ่ | AC-MENU-03 | T-03 pending | ไม่มี search field หรือ search logic ใน `index.html` / `app.js` | ไม่มี Automated Test สำหรับ AC-MENU-03 | ยังไม่ถึง |
| Constraint: เมนูหมดสต็อกแสดง “หมด” และสั่งไม่ได้ | AC-MENU-02 | T-02 pending | `app.js`: `statusLabels`, `renderMenu` (ปุ่ม disabled); `styles.css`: disabled styling | Test เดิม, `test_TC_MENU_02_1_show_menu_data_and_status` และ `test_TC_MENU_02_2_show_sold_out_menu` ผ่าน; T-02 ยัง pending | ยังไม่ถึง |
| Constraint: แสดงเฉพาะโปรโมชั่นที่กำลังใช้งาน | AC-MENU-04 | T-04 pending | ไม่มี logic โปรโมชั่นใน `app.js` / `index.html` | ไม่มี Automated Test สำหรับ AC-MENU-04 | ยังไม่ถึง |

## 2. ตามรอยย้อนกลับ (โค้ด ไป requirement)
| โค้ด (ไฟล์: ฟังก์ชัน หรือ endpoint) | อ้าง ID | ตรงกับข้อความใน spec ไหม | หมายเหตุ |
|---|---|---|---|
| `app.js`: `menuItems` | FR-01, FR-02 | บางส่วน | ข้อมูลตัวอย่างมีชื่อ ราคา รายละเอียด และสถานะ; ทีมตัดสิน F-06 แล้วว่าเป็นข้อมูลตัวอย่างและไม่ใช่บั๊ก; ไม่มีการโหลดจากแหล่งข้อมูลจริง |
| `app.js`: `statusLabels` | FR-02, Constraint เมนูหมดสต็อก | ใช่ | แสดง “เปิดขาย” และ “หมด” ตามสถานะ |
| `app.js`: `formatPrice` | FR-02 | บางส่วน | แสดงราคาเป็น THB ด้วย `th-TH` และไม่แสดงทศนิยม; Spec ไม่กำหนดรูปแบบราคา และเป็นข้อพิจารณาตามคำตัดสิน F-06 ไม่ใช่บั๊กที่เปิดอยู่ |
| `app.js`: `renderMenu` | FR-01, FR-02, AC-MENU-01, AC-MENU-02 | บางส่วน | แสดงชื่อ ราคา รายละเอียด สถานะ; empty state ตรง FR-01; สถานะหมดปิดปุ่ม; ปุ่มเมนูเปิดขายไม่มี click handler ตาม F-02; ยังไม่มี search, promotion หรือ error state ซึ่งอยู่ใน Task pending |
| `app.js`: `renderMenu(menuItems)` | FR-01, AC-MENU-01 | ใช่บางส่วน | render ข้อมูลตัวอย่างเมื่อเปิดหน้า |
| `index.html`: `#menu-list`, script และ header | Goal, FR-01, FR-02 | ใช่บางส่วน | มีพื้นที่แสดงเมนูและโหลด `app.js`; ไม่มีส่วนค้นหา/โปรโมชั่น/error ซึ่ง Task ที่เกี่ยวข้องยัง pending |
| `styles.css`: layout, status badges, order button | FR-02, Constraint เมนูหมดสต็อก | ใช่บางส่วน | จัดรูปแบบรายการและ disabled button; ไม่พบ mockup ให้เทียบ |
| `tests/AC-MENU-01.test.cjs`: AC-MENU-01 tests | FR-01, AC-MENU-01 | ใช่ | ตรวจ empty state และรายการหนึ่งรายการ/หลายรายการ; ผ่าน 3/3 |
| `tests/AC-MENU-02.test.cjs`: legacy และ TC-MENU-02-1 ถึง 02-3 | FR-02, AC-MENU-02 | ใช่บางส่วน | ตรวจข้อมูลเมนู, สถานะ และ disabled/enabled markup; ไม่ได้จำลอง event click และไม่มี test ของ TC-MENU-02-4 ที่อนุมัติแล้ว |

## 3. ข้อค้นพบ
ชนิด: AC ไม่มี test / test อ่อน / โค้ดไม่มี FR / FR ไม่มี AC / เดา Q-xx / ละเมิด Constraint / ตัวเลขไม่ตรง spec / เอกสารไม่สอดคล้อง
ทีมตัดสิน: แก้โค้ด / แก้ spec / เพิ่ม Q-xx / ไม่ใช่ปัญหา (พร้อมเหตุผล 1 บรรทัด)

| F-ID | ชนิด | อยู่ที่ | ขัดกับ | รายละเอียด | ทีมตัดสิน |
|---|---|---|---|---|---|
| F-02 | รอแก้ Code และ Test (Q-04 ตอบแล้ว) | `app.js`: `renderMenu` ปุ่ม order; `tests/AC-MENU-02.test.cjs` | FR-02, AC-MENU-02; Out of scope: การสร้างคำสั่งซื้อออนไลน์ | ทีมตอบ Q-04 และอนุมัติผ่าน CR-MENU-002 แล้ว: คลิกปุ่ม “สั่งซื้อ” ของเมนูเปิดขายต้องแสดง “ระบบสั่งซื้อออนไลน์ยังไม่เปิดให้บริการ” และไม่สร้าง Order ออนไลน์. T-02 ยัง pending และโค้ดยังไม่มีพฤติกรรมนี้. TC-MENU-02-4 ได้รับอนุมัติเป็น “ใช้ได้” แต่ไม่มี Automated Test; test ที่มีจำลองเพียง `document.getElementById`/`innerHTML` ผ่าน `node:vm` และไม่มี DOM จริงให้คลิกหรือตรวจผลหน้าจอ. รอบนี้ไม่เพิ่มเครื่องมือหรือ Test ตามข้อกำหนด | รอให้ T-02 พัฒนา click behavior และมีวิธีทดสอบ DOM interaction ที่ทีมอนุมัติ ก่อนเพิ่ม Automated Test ที่จำลองคลิกจริงและตรวจข้อความ/ไม่มี Order; เหตุผล: Test Runner ปัจจุบันไม่มี DOM จริง และห้ามเพิ่ม dependency ตามข้อกำหนดรอบนี้ |
| F-03 | AC ไม่มี test | `tests/AC-MENU-01.test.cjs`, `tests/AC-MENU-02.test.cjs` | Constraint: ผู้ใช้ทั่วไปดูได้แต่แก้ไขไม่ได้ | ไม่พบ assertion ที่ตรวจว่าผู้ใช้ทั่วไปไม่สามารถแก้ไขข้อมูลเมนู/โปรโมชั่น แม้โค้ดปัจจุบันไม่มี UI/API แก้ไข; ยังไม่มี test ยืนยัน constraint นี้ | เพิ่ม Automated Test เพื่อตรวจ Constraint ว่าผู้ใช้ทั่วไปไม่สามารถแก้ไขข้อมูลเมนู โดยไม่เปลี่ยนพฤติกรรมระบบ; เหตุผล: ข้อกำหนด read-only มีอยู่แล้ว แต่ยังไม่มี test ยืนยัน |
| F-06 | ข้อมูลตัวอย่าง / พิจารณาความครบถ้วนของ Spec | `app.js`: `menuItems` บรรทัด 1-29, `formatPrice` บรรทัด 39-44 | FR-02 | มีการกำหนดราคา 45, 75, 55, 65 และรูปแบบเงิน THB/ไม่มีทศนิยมในโค้ด; ทีมยืนยันว่าราคาเป็นข้อมูลตัวอย่าง จึงไม่ใช่บั๊กของโค้ดปัจจุบัน อย่างไรก็ตาม Spec ไม่ได้ระบุแหล่งข้อมูลหรือรูปแบบราคา | ไม่ใช่บั๊กของโค้ดในปัจจุบัน เพราะราคาใน `app.js` เป็นข้อมูลตัวอย่าง; ให้ทีมพิจารณาเพิ่มเติมว่าควรระบุแหล่งข้อมูลและรูปแบบราคาใน Spec หรือไม่ โดยยังไม่แก้ Spec ในรอบนี้ |

## 4. แก้แล้ว
| F-ID | แก้อย่างไร | รู้ได้อย่างไร |
|---|---|---|
| F-01 | แก้ `app.js` ใน empty-list branch ของ `renderMenu` ให้แสดง “ขณะนี้ไม่มีรายการเครื่องดื่ม” ตาม FR-01/AC-MENU-01 โดยไม่เปลี่ยนข้อความ “ไม่พบเมนู” ที่ระบุสำหรับ FR-03 ใน Spec | `node --test tests/*.test.cjs` รอบสองผ่าน 10/10; `test_TC_MENU_01_1_no_menu_data` ตรวจข้อความ empty state และผ่าน |
| F-04 | ตามคำตัดสินของทีมให้แก้ Spec ผ่าน CR-MENU-003; ปรับ NFR-26 ให้ครอบคลุมเฉพาะภารกิจค้นหาเมนู และ AC-MENU-07 ให้ระบุการทดสอบผู้ใช้ใหม่ 10 คน โดยอย่างน้อย 8 คนค้นหาได้โดยไม่ขอความช่วยเหลือ | CR-MENU-003 ที่อนุมัติแล้ว และข้อความ NFR-26/AC-MENU-07 ใน Spec Draft v6/v7 |
| F-05 | ตามคำตัดสินของทีมให้แก้ Spec ผ่าน CR-MENU-003; ปรับ NFR-22 ให้ครอบคลุมเฉพาะหน้าเมนู และ AC-MENU-06 ให้กำหนด p95 ไม่เกิน 2 วินาทีภายใต้ผู้ใช้พร้อมกัน 100 คน | CR-MENU-003 ที่อนุมัติแล้ว และข้อความ NFR-22/AC-MENU-06 ใน Spec Draft v6/v7 |
| F-07 | ตามคำตัดสินของทีมให้แก้ข้อกำหนดที่ขัดแย้งกันผ่าน CR-MENU-004; ปรับ FR-05, AC-MENU-04 และ ASM-04 ให้เมื่อไม่มีโปรโมชั่นยังแสดงเมนูหมดสต็อกพร้อมสถานะ “หมด” และปุ่ม “สั่งซื้อ” กดไม่ได้ | CR-MENU-004 ที่อนุมัติแล้ว; FR-05, AC-MENU-04 และ ASM-04 ใน Spec Draft v7 ระบุพฤติกรรมสอดคล้องกัน |
| F-08 | ตามคำตัดสินของทีมให้แก้ plan.md ให้ตรงกับ Spec Draft v7 และ CR-MENU-004 โดยคงขอบเขตและสถานะ Task เดิม; เหตุผล: แผนต้องสะท้อนข้อกำหนดปัจจุบันและ Constraints จริง ไม่ระบุเงื่อนไขแสดงเมนูที่ขัดกับ Spec | ปรับข้อความสรุป, API, แผนทดสอบ AC-MENU-04 และตาราง Constraints ใน plan.md ให้ระบุเมนูหมดสต็อกและสถานะ/ปุ่มตาม Spec; ตรวจเทียบกับ CR-MENU-004 และ Spec Draft v7; ไม่เปลี่ยน Task |
| F-09 | ตามคำตัดสินของทีมให้แก้ test-cases.md ให้อ้างอิง Spec Draft v7 และระบุเครื่องมือ node:test; เหตุผล: เอกสาร Test Case ต้องตรงกับเวอร์ชัน Spec และ runner ที่ใช้จริง | ส่วนหัว test-cases.md อ้าง Draft v7 และทุกแถวระบุ node:test ตรงกับ `node --test tests/*.test.cjs`; คง Test Case และสถานะเดิม |
