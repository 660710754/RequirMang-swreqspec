# RTM: ดูเมนูและโปรโมชั่น (Menu & Promotion)
อ้างอิง: spec.md Draft v4 | tasks.md | test-cases.md
สร้างด้วย /verify เมื่อ 2569-10-12 09:35 UTC | test: 9 ผ่าน 1 ไม่ผ่าน

## 1. ตามรอยไปข้างหน้า (requirement ไป โค้ด ไป test)
| ID | AC | task | โค้ด (ไฟล์: ฟังก์ชัน) | test (ผล) | สถานะ |
|---|---|---|---|---|---|
| FR-01 | AC-MENU-01 | T-01 completed | `app.js`: `renderMenu` (empty-list branch, บรรทัด 48-50); `menuItems` | `test_TC_MENU_01_1_no_menu_data` (ไม่ผ่าน); `test_TC_MENU_01_2_show_open_menu_items` (ผ่าน); `test_TC_MENU_01_3_show_single_open_menu_item` (ผ่าน) | ช่องโหว่ — F-01: empty-list แสดง “ไม่พบเมนู” ไม่ตรง Requirement |
| FR-02 | AC-MENU-02 | T-01 completed; T-02 pending | `app.js`: `renderMenu`, `statusLabels`, `formatPrice` | Test เดิม AC-MENU-02 และ `test_TC_MENU_02_1_show_menu_data_and_status`, `test_TC_MENU_02_2_show_sold_out_menu`, `test_TC_MENU_02_3_show_single_available_menu` (ผ่านทั้งหมด); ตรวจทุกส่วนของ Then ใน test ใหม่แล้ว | ช่องโหว่ — F-02: ตรวจเพียงปุ่ม enabled แต่ไม่มี action; ความหมาย “กดสั่ง” กำกวมเมื่อเทียบ Out of scope |
| FR-03 | AC-MENU-03 | T-03 pending | ไม่มีการค้นหาใน `app.js` / `index.html` | ไม่มี Automated Test สำหรับ AC-MENU-03; task ยัง pending | ยังไม่ถึง |
| FR-05 | AC-MENU-04 | T-04 pending | ไม่มีส่วนโปรโมชั่นในโค้ด | ไม่มี Automated Test สำหรับ AC-MENU-04; task ยัง pending | ยังไม่ถึง |
| UC-01 Exception Flow 2a | AC-MENU-05 | T-05 pending | ไม่มี error state หรือ retry action ในโค้ด | ไม่มี Automated Test สำหรับ AC-MENU-05; task ยัง pending | ยังไม่ถึง |
| NFR-22 | AC-MENU-06 | T-06 pending | ไม่มีการทดสอบ performance/concurrency ในโค้ดหรือ test | ไม่มี performance test; AC-MENU-06 ตรวจหน้าเมนู แต่ NFR-22 รวมหน้าตรวจสอบสถานะ Order ซึ่งอยู่นอก scope (F-05) | ช่องโหว่ — F-05 |
| NFR-26 | AC-MENU-07 | T-07 pending | ไม่มีการทำ usability study ในโค้ดหรือ test | ไม่มีผลทดสอบผู้ใช้ 10 คน; NFR-26 รวมการสร้าง Order และตรวจสอบสถานะ Order ซึ่งอยู่นอก scope แต่ AC-MENU-07 ตรวจเฉพาะการค้นหา (F-04) | ช่องโหว่ — F-04 |
| Constraint: ผู้ใช้ทั่วไปดูได้แต่แก้ไขไม่ได้ | ไม่มี AC เฉพาะ | T-01, T-02, T-04 | UI ปัจจุบันมีเพียงการ render รายการ; ไม่พบฟังก์ชันแก้ไข | ไม่มี test ที่ assert ว่าผู้ใช้ไม่สามารถแก้ข้อมูลได้ | ช่องโหว่ — F-03 |
| Constraint: ค้นหา partial และไม่แยกตัวพิมพ์เล็ก/ใหญ่ | AC-MENU-03 | T-03 pending | ไม่มีฟิลด์/ฟังก์ชันค้นหาใน `index.html` / `app.js` | ไม่มี Automated Test สำหรับ AC-MENU-03; task ยัง pending | ยังไม่ถึง |
| Constraint: เมนูหมดสต็อกแสดง “หมด” และสั่งไม่ได้ | AC-MENU-02 | T-02 pending | `app.js`: `statusLabels`, `renderMenu` | `test_TC_MENU_02_1_show_menu_data_and_status`, `test_TC_MENU_02_2_show_sold_out_menu` และ test เดิม AC-MENU-02 (ผ่าน) | ยังไม่ถึง — พฤติกรรมและ test ผ่าน แต่ T-02 ยัง pending |
| Constraint: แสดงเฉพาะโปรโมชั่นที่กำลังใช้งาน | AC-MENU-04 | T-04 pending | ไม่มี logic โปรโมชั่นในโค้ด | ไม่มี Automated Test สำหรับ AC-MENU-04; task ยัง pending | ยังไม่ถึง |

## 2. ตามรอยย้อนกลับ (โค้ด ไป requirement)
| โค้ด (ไฟล์: ฟังก์ชัน หรือ endpoint) | อ้าง ID | ตรงกับข้อความใน spec ไหม | หมายเหตุ |
|---|---|---|---|
| `app.js`: `menuItems` | FR-01, FR-02, AC-MENU-01, AC-MENU-02 | บางส่วน | มีข้อมูลตัวอย่างชื่อ ราคา รายละเอียด และสถานะ; source จริงของรายการ/ราคาไม่ได้กำหนดใน spec |
| `app.js`: `statusLabels` | FR-02, Constraint เมนูหมดสต็อก | ใช่ | แสดง “เปิดขาย” และ “หมด” ตามสถานะ |
| `app.js`: `formatPrice` | FR-02 | บางส่วน | แสดงราคา แต่การกำหนดรูปแบบเงิน THB/locale ไม่ได้ระบุใน spec |
| `app.js`: `renderMenu` | FR-01, FR-02, AC-MENU-01, AC-MENU-02 | บางส่วน | สร้างรายการ ชื่อ รายละเอียด ราคา และสถานะ; empty-list ใช้ข้อความจาก FR-03 แทนข้อความ FR-01 (F-01); ปุ่มสั่งซื้อของเมนูเปิดขาย enabled แต่ไม่มี handler (F-02) |
| `app.js`: `renderMenu(menuItems)` | FR-01, AC-MENU-01 | ใช่บางส่วน | เปิดหน้าแล้ว render ข้อมูลรายการที่ hard-code |
| `index.html`: `#menu-list`, `app.js` script | FR-01, FR-02, AC-MENU-01, AC-MENU-02 | ใช่ | มีพื้นที่แสดงรายการและโหลดสคริปต์ |
| `index.html`: header/title “OWL CHA” / “เมนูเครื่องดื่ม” | Goal, FR-01 | ใช่ | ชื่อร้านตรง Goal; ชื่อหน้าเป็นการนำเสนอเมนู |
| `styles.css`: layout, status badges, order button styling | FR-02, Constraint เมนูหมดสต็อก | ใช่บางส่วน | จัดรูปแบบข้อมูลและแยกสถานะ; ไม่พบ mockup ให้เทียบ; ค่าสไตล์เป็นรายละเอียด presentation |
| `tests/AC-MENU-01.test.cjs`: test สามกรณี | FR-01, AC-MENU-01 | บางส่วน | สองกรณีรายการเปิดขายผ่าน; กรณีไม่มีข้อมูลล้มเหลวเพราะข้อความไม่ตรง |
| `tests/AC-MENU-02.test.cjs`: test เดิมและสาม TC | FR-02, AC-MENU-02, ASM-02 | ใช่บางส่วน | test ผ่านทั้งหมด; assertions ครอบคลุมชื่อ ราคา รายละเอียด สถานะ และ disabled/enabled; ไม่มีการทดสอบ action หลังคลิกปุ่ม |

## 3. ข้อค้นพบ
ชนิด: AC ไม่มี test / test อ่อน / โค้ดไม่มี FR / FR ไม่มี AC / เดา Q-xx / ละเมิด Constraint / ตัวเลขไม่ตรง spec / อ้าง ID ผิดเรื่อง
ทีมตัดสิน: แก้โค้ด / แก้ spec / เพิ่ม Q-xx / ไม่ใช่ปัญหา (พร้อมเหตุผล 1 บรรทัด)

| F-ID | ชนิด | อยู่ที่ | ขัดกับ | รายละเอียด | ทีมตัดสิน |
|---|---|---|---|---|---|
| F-01 | อ้าง ID ผิดเรื่อง | `app.js`: `renderMenu`, บรรทัด 48-50 | FR-01, AC-MENU-01; FR-03 | เมื่อรายการว่างในหน้าเมนู ระบบแสดง “ไม่พบเมนู” ซึ่ง spec กำหนดให้ใช้เมื่อค้นหาไม่พบ; แต่ FR-01/AC-MENU-01 กำหนด “ขณะนี้ไม่มีรายการเครื่องดื่ม”. `test_TC_MENU_01_1_no_menu_data` ล้มเหลวด้วยเหตุนี้ | แก้โค้ดให้กรณีไม่มีรายการเครื่องดื่มแสดงข้อความ “ขณะนี้ไม่มีรายการเครื่องดื่ม” ตาม FR-01/AC-MENU-01; เหตุผล: พฤติกรรมปัจจุบันขัดกับ Requirement ที่ยืนยันแล้วและมี Automated Test จับได้ |
| F-02 | รอ Q-04 | `app.js`: `renderMenu` ปุ่ม order; `tests/AC-MENU-02.test.cjs` | FR-02; Out of scope: การสร้างคำสั่งซื้อออนไลน์ | ปุ่มเมนูเปิดขายเพียง enabled และไม่มี click handler; test assert label/disabled เท่านั้น ไม่ตรวจผลจากการกด. FR-02 ระบุว่าสามารถกดสั่งได้ แต่การสร้างคำสั่งซื้อออนไลน์อยู่ Out of scope จึงต้องให้ทีมกำหนดขอบเขตความหมาย “กดสั่ง” | เพิ่ม Q-04 เพื่อถามผลลัพธ์เมื่อคลิกปุ่ม “สั่งซื้อ” โดยไม่สมมติคำตอบและไม่ขยายไปสู่ระบบสร้าง Order ออนไลน์; เหตุผล: FR-02 ระบุให้กดสั่งได้ แต่รายละเอียดผลหลังคลิกยังไม่ชัดและ Order ออนไลน์เป็น Out of scope |
| F-03 | AC ไม่มี test | `tests/AC-MENU-01.test.cjs`, `tests/AC-MENU-02.test.cjs` | Constraint: ผู้ใช้ทั่วไปดูได้แต่แก้ไขไม่ได้ | ไม่พบ assertion ที่ตรวจว่าผู้ใช้ทั่วไปไม่สามารถแก้ไขข้อมูลเมนู/โปรโมชั่น แม้โค้ดปัจจุบันไม่มี UI/API แก้ไข; ยังไม่มี test ยืนยัน constraint นี้ | เพิ่ม Automated Test เพื่อตรวจ Constraint ว่าผู้ใช้ทั่วไปไม่สามารถแก้ไขข้อมูลเมนู โดยไม่เปลี่ยนพฤติกรรมระบบ; เหตุผล: ข้อกำหนด read-only มีอยู่แล้ว แต่ยังไม่มี test ยืนยัน |
| F-04 | test อ่อน / NFR กับ AC ไม่สอดคล้องกัน | `spec.md`: NFR-26 / AC-MENU-07; `tasks.md`: T-07 | NFR-26; Out of scope: การสร้างคำสั่งซื้อออนไลน์และการตรวจสอบสถานะ Order | NFR-26 กำหนด usability สำหรับค้นหาเมนู สร้าง Order และตรวจสอบสถานะ Order แต่ AC-MENU-07/T-07 ตรวจเฉพาะการค้นหา และอีกสองพฤติกรรมอยู่ใน Out of scope | แก้ Spec ผ่าน CR ให้ NFR-26 และ AC-MENU-07 ครอบคลุมเฉพาะการใช้งานที่อยู่ใน Scope; เหตุผล: ข้อกำหนดปัจจุบันรวมการสร้าง/ตรวจ Order ซึ่ง Out of scope ของฟีเจอร์นี้; ห้ามเพิ่มโค้ด Order ในรอบนี้ |
| F-05 | test อ่อน / NFR กับ AC ไม่สอดคล้องกัน | `spec.md`: NFR-22 / AC-MENU-06; `tasks.md`: T-06 | NFR-22; Out of scope: การตรวจสอบสถานะ Order | NFR-22 ครอบคลุมทั้งหน้ารายการเมนูและหน้าตรวจสอบสถานะ Order แต่ AC-MENU-06/T-06 ระบุทดสอบเฉพาะหน้าเมนู ขณะที่หน้าสถานะ Order อยู่ใน Out of scope | แก้ Spec ผ่าน CR ให้ NFR-22 และ AC-MENU-06 ครอบคลุมเฉพาะหน้าเมนู; เหตุผล: ขอบเขตการวัดต้องไม่รวมหน้าตรวจ Order ซึ่งเป็น Out of scope; ห้ามเพิ่มหน้าสถานะ Order ในรอบนี้ |
| F-06 | ข้อมูลตัวอย่าง / พิจารณาความครบถ้วนของ Spec | `app.js`: `menuItems` บรรทัด 1-29, `formatPrice` บรรทัด 39-44 | FR-02 | มีการกำหนดราคา 45, 75, 55, 65 และรูปแบบเงิน THB/ไม่มีทศนิยมในโค้ด; ทีมยืนยันว่าราคาเป็นข้อมูลตัวอย่าง จึงไม่ใช่บั๊กของโค้ดปัจจุบัน อย่างไรก็ตาม Spec ไม่ได้ระบุแหล่งข้อมูลหรือรูปแบบราคา | ไม่ใช่บั๊กของโค้ดในปัจจุบัน เพราะราคาใน `app.js` เป็นข้อมูลตัวอย่าง; ให้ทีมพิจารณาเพิ่มเติมว่าควรระบุแหล่งข้อมูลและรูปแบบราคาใน Spec หรือไม่ โดยยังไม่แก้ Spec ในรอบนี้ |
| F-07 | ข้อกำหนดขัดแย้งกัน | `spec.md`: Constraints บรรทัด 33-34; FR-05 บรรทัด 54-58; AC-MENU-04 บรรทัด 116-126; ASM-04 บรรทัด 164-166 | Constraint เมนูหมดสต็อก; FR-05; AC-MENU-04; ASM-04 | Constraint กำหนดว่าเมนูหมดสต็อกยังต้องแสดงสถานะ “หมด”; แต่เมื่อไม่มีโปรโมชั่น FR-05, AC-MENU-04 และ ASM-04 ระบุให้แสดงเฉพาะเมนูที่ยังเปิดขาย จึงไม่ชัดว่าเมนูหมดสต็อกต้องแสดงหรือไม่ ที่มา: ทีมแจ้งว่าได้ตรวจทาน Spec และยืนยันพบความขัดแย้งนี้ | แก้ Spec ผ่าน CR เพื่อให้ข้อกำหนดสอดคล้องกัน โดยคงการแสดงเมนูหมดสต็อกพร้อมคำว่า “หมด” แม้ไม่มีโปรโมชั่น; เหตุผล: เป็นข้อสรุปที่ทีมยืนยันเพื่อรักษาพฤติกรรมการแสดงสถานะเมนูหมดสต็อก |

## 4. แก้แล้ว
| F-ID | แก้อย่างไร | รู้ได้อย่างไร |
|---|---|---|
