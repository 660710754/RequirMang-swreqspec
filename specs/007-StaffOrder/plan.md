# แผนงานสำหรับ Feature: ดูรายการ Order สำหรับพนักงาน (Staff Order List)

## 1. สรุปแนวทาง
- ฟีเจอร์นี้จะสร้างหน้ารายการ Order สำหรับพนักงานที่เปิดดู Order ที่ลูกค้าสั่งเข้ามา พร้อมหมายเลข Order, ลำดับตามเวลาที่สั่งเข้ามา, รายละเอียดเครื่องดื่ม, จำนวน, ตัวเลือก, และสถานะปัจจุบัน ตาม FR-29, FR-30, FR-31 และ FR-32
- ผู้ใช้หลักคือ พนักงานร้าน (Staff) ที่ต้องเข้าสู่ระบบและมีสิทธิ์เป็น Staff ก่อนเข้าถึงข้อมูล Order ตาม Constraints และ ASM-01
- ระบบจะแสดง Order ใหม่ก่อน, จัด Order ที่สิ้นสุดไว้ท้ายรายการ, และอัปเดตรายการแบบ Real-time เมื่อมี Order ใหม่เข้ามา ตาม FR-33, Constraints, และ ASM-08
- หากโหลดข้อมูล Order ไม่สำเร็จ ระบบจะไม่แสดงข้อมูลที่ไม่สมบูรณ์หรือไม่ยืนยัน และจะแสดงข้อความว่า “ไม่สามารถโหลดรายการ Order ได้” พร้อมปุ่ม “ลองใหม่” ตาม Exception Flow 2b และ AC-STAFF-ORDER-07
- แผนนี้จะไม่สร้างฟังก์ชันนอก scope เช่น การสร้าง Order, แก้ไขรายการ Order, การชำระเงิน, การส่งแจ้งเตือน LINE, หรือรายงานยอดขาย เนื่องจากมีการกำหนดไว้ใน Out of scope อย่างชัดเจน

## 2. เทคโนโลยีที่ใช้

| สิ่งที่เลือก | มาจาก | หมายเหตุ |
|---|---|---|
| React (Vite) สำหรับหน้าแสดงรายการ Order ของพนักงาน | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้แสดง Order list, order queue, และสถานะปัจจุบันตามลำดับที่พนักงานต้องเตรียมเครื่องดื่ม |
| Python FastAPI สำหรับ API รายการ Order สำหรับพนักงาน | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้ดึง Order ที่มีสิทธิ์เข้าถึงและส่งข้อมูลที่เป็นข้อมูลล่าสุดให้ UI |
| ฐานข้อมูลเชิงสัมพันธ์ (เช่น PostgreSQL) | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้เก็บ Order, OrderItem, OrderStatus, และข้อมูลการอัปเดตแบบ Real-time |
| Real-time refresh / polling สำหรับ Order list | ทีมเลือกเอง ไม่ได้มาจาก spec | สอดคล้องกับ constraint ที่ระบบต้องอัปเดตรายการ Order แบบ Real-time เมื่อมี Order ใหม่เข้ามา |
| Staff session / authorization check | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้ป้องกันไม่ให้สมาชิกที่ไม่ใช่ Staff เข้าถึงข้อมูล Order ตาม Constraints |

## 3. โมเดลข้อมูล

| Entity | ฟิลด์หลัก | รองรับ FR / NFR |
|---|---|---|
| StaffOrderQueue | `order_id`, `sequence_no`, `created_at`, `status`, `is_finished`, `last_updated_at` | รองรับ FR-30, FR-32, FR-33, AC-STAFF-ORDER-02, AC-STAFF-ORDER-04, AC-STAFF-ORDER-05 |
| Order | `order_id`, `user_id`, `created_at`, `status`, `order_number`, `total_amount`, `is_finished` | รองรับ FR-29, FR-30, FR-32, AC-STAFF-ORDER-01, AC-STAFF-ORDER-02, AC-STAFF-ORDER-04 |
| OrderItem | `order_item_id`, `order_id`, `menu_item_name`, `quantity`, `selected_options` | รองรับ FR-31, AC-STAFF-ORDER-03 |
| OrderStatus | `order_id`, `current_status`, `updated_at`, `status_label` | รองรับ FR-32, NFR-USE-01, AC-STAFF-ORDER-04, AC-STAFF-ORDER-09 |
| OrderLoadState | `loaded_at`, `is_success`, `error_message`, `retry_available` | รองรับ Exception Flow 2b, AC-STAFF-ORDER-07 |

หมายเหตุโมเดลข้อมูล:
- `sequence_no` จะใช้หมายถึงลำดับตามเวลาที่สั่งเข้ามา เพื่อให้สอดคล้องกับ FR-30 และ FR-33
- `is_finished` จะใช้คัดแยก Order ที่มีสถานะ “รับสินค้าแล้ว” หรือ “ยกเลิก” ให้ถูกวางไว้ท้ายรายการตามสถานะ ตาม Constraint และ ASM-10
- `OrderItem.selected_options` จะเก็บตัวเลือกของเครื่องดื่มตามที่ลูกค้าสั่ง เช่น ความหวาน ไอซ์ toppings ตาม spec ของ feature Order
- จะไม่มีฟิลด์ข้อมูลลูกค้า หรือข้อมูลเมนูราคาโปรโมชั่นในโมเดลนี้ เนื่องจาก Out of scope และ requirement ระบุว่าแสดงเฉพาะรายการเครื่องดื่ม จำนวน และตัวเลือกให้เห็นเท่านั้น

## 4. API / หน้าจอ

- `GET /api/staff/orders` — Input: authenticated staff user; Output: รายการ Order ทั้งหมดที่พนักงานมีสิทธิ์เห็น โดยเรียงตามเวลาที่สั่งล่าสุดก่อน — รองรับ FR-29, FR-33, AC-STAFF-ORDER-01, AC-STAFF-ORDER-05
- `GET /api/staff/orders/{order_id}` — Input: `order_id`, authenticated staff; Output: รายการเครื่องดื่ม จำนวน ตัวเลือก และสถานะปัจจุบันของ Order — รองรับ FR-30, FR-31, FR-32, AC-STAFF-ORDER-02, AC-STAFF-ORDER-03, AC-STAFF-ORDER-04
- `GET /staff/orders` — Output: หน้ารายการ Order สำหรับพนักงาน พร้อมหมายเลข Order, ลำดับ, สถานะ, และ status badge — รองรับ FR-29, FR-30, FR-32, NFR-USE-01, AC-STAFF-ORDER-01, AC-STAFF-ORDER-02, AC-STAFF-ORDER-04, AC-STAFF-ORDER-09
- `POST /api/staff/orders/refresh` — Input: authenticated staff user; Output: load list ใหม่/พังส่ง error state เมื่อโหลดไม่ได้ — รองรับ Exception Flow 2b, AC-STAFF-ORDER-07
- `GET /api/staff/orders/summary` — Output: count/order queue snapshot สำหรับแสดง “ไม่มีรายการ Order ใหม่” หรือมากรณี list ว่าง — รองรับ Alternative Flow 2a, AC-STAFF-ORDER-06

## 5. ตารางตรวจ Constraints

| Constraint ID | ถูกนำไปใช้ที่ไหนใน plan | สถานะ |
|---|---|---|
| ผู้ใช้งานต้องเข้าสู่ระบบและมีสิทธิ์เป็น Staff ก่อนเข้าถึงรายการ Order | ใช้ใน API และหน้า `GET /staff/orders` ผ่าน staff session/auth check | ใช้แล้ว |
| ระบบต้องแสดงเฉพาะ Order ที่พนักงานมีสิทธิ์เข้าถึง | ใช้ใน backend query filter ที่จำกัดข้อมูลตาม staff role และ scope | ใช้แล้ว |
| รายการ Order ต้องแสดงข้อมูลจากระบบที่เป็นข้อมูลล่าสุด | ใช้ใน `GET /api/staff/orders` และ refresh logic เพื่อดึงข้อมูลปัจจุบันล่าสุด | ใช้แล้ว |
| รายละเอียดของ Order ต้องตรงกับรายการที่ลูกค้าสั่ง | ใช้ใน `GET /api/staff/orders/{order_id}` และ relation ของ OrderItem ที่มีข้อมูล exact order details | ใช้แล้ว |
| หากไม่สามารถโหลดข้อมูล Order ได้ ระบบต้องไม่แสดงข้อมูลที่ไม่สมบูรณ์หรือไม่ยืนยัน | ใช้ใน `OrderLoadState` และ UI error handling ก่อน render | ใช้แล้ว |
| ลำดับของ Order คือ ลำดับตามเวลาที่สั่งเข้ามา | ใช้ใน `sequence_no` และ sort order ตาม `created_at` | ใช้แล้ว |
| Order ที่สถานะ “รับสินค้าแล้ว” หรือ “ยกเลิก” จะยังคงแสดงในรายการ แต่จะถูกวางไว้ท้ายรายการตามสถานะ | ใช้ใน `is_finished` sort logic สำหรับ status ordering | ใช้แล้ว |
| ระบบต้องอัปเดตรายการ Order แบบ Real-time เมื่อมี Order ใหม่เข้ามา | ใช้ใน polling/refresh mechanism สำหรับหน้ารายการ Order | ใช้แล้ว |
| พนักงานสามารถดู Order ย้อนหลังได้ภายใน 7 วัน | ใช้ใน filter query ของ `created_at` ก่อน 7 วัน | ใช้แล้ว |

## 6. แผนทดสอบจาก Acceptance Criteria

| AC ID | ชื่อ test | ทดสอบอย่างไร |
|---|---|---|
| AC-STAFF-ORDER-01 | `test_AC_STAFF_ORDER_01_show_order_list_for_staff` | login เป็น staff แล้วเปิดหน้ารายการ Order ตรวจสอบว่าระบบแสดง Order ที่ลูกค้าสั่งเข้ามา |
| AC-STAFF-ORDER-02 | `test_AC_STAFF_ORDER_02_show_order_number_and_sequence` | เปิดหน้ารายการ Order แล้วตรวจสอบว่ามีหมายเลข Order และลำดับของแต่ละ Order แสดงชัดเจน |
| AC-STAFF-ORDER-03 | `test_AC_STAFF_ORDER_03_show_order_details_items_and_options` | เลือก Order ที่มีรายการเครื่องดื่มหลายรายการ แล้วตรวจสอบว่าระบบแสดงรายการเครื่องดื่ม จำนวน และตัวเลือกอย่างถูกต้อง |
| AC-STAFF-ORDER-04 | `test_AC_STAFF_ORDER_04_show_current_status_for_each_order` | เปิดหน้ารายการ Order แล้วตรวจสอบว่ามี status สำหรับแต่ละ Order ตามข้อมูลจริงในระบบ |
| AC-STAFF-ORDER-05 | `test_AC_STAFF_ORDER_05_queue_is_sorted_by_created_time` | สร้าง Order หลายรายการในเวลาแตกต่างกัน แล้วตรวจสอบว่ารายการเรียงตามเวลาที่สั่งล่าสุดก่อน และ Order ที่สิ้นสุดจัดอยู่ท้าย | 
| AC-STAFF-ORDER-06 | `test_AC_STAFF_ORDER_06_show_empty_state_when_no_new_orders` | ตั้งค่าระบบว่ามี Order หมดแล้ว แล้วเปิดหน้ารายการ Order ตรวจสอบว่าระบบแสดงข้อความหรือสถานะว่าไม่มีรายการ Order ใหม่ |
| AC-STAFF-ORDER-07 | `test_AC_STAFF_ORDER_07_show_retry_when_load_fails` | จำลอง API โหลด Order ล้มเหลว แล้วตรวจสอบว่าระบบแสดงข้อความ “ไม่สามารถโหลดรายการ Order ได้” และมีปุ่ม “ลองใหม่” |
| AC-STAFF-ORDER-08 | `test_AC_STAFF_ORDER_08_list_loads_within_reasonable_time` | เปิดหน้ารายการ Order ภายใต้ข้อมูลจำนวนมาก แล้วตรวจสอบว่า response/ render อยู่ในเวลาที่เหมาะสมต่อการปฏิบัติงาน |
| AC-STAFF-ORDER-09 | `test_AC_STAFF_ORDER_09_order_number_sequence_status_are_visible` | เปิดหน้ารายการ Order แล้วตรวจสอบว่าหมายเลข Order, ลำดับ, และสถานะสามารถดูและระบุได้ชัดเจน |

## 7. ลำดับงาน

1. กำหนด schema และ validation สำหรับ `Order`, `OrderItem`, `OrderStatus`, และ `StaffOrderQueue` ตาม FR-29, FR-30, FR-31, FR-32 และ NFR-USE-01
2. สร้างหน้ารายการ Order สำหรับพนักงานที่ต้อง login และมีสิทธิ์เป็น Staff พร้อมแสดง order queue, status badge, และ empty state ตาม Constraints, FR-29, AC-STAFF-ORDER-01, AC-STAFF-ORDER-06
3. สร้าง API ดึงรายการ Order ที่มีสิทธิ์เข้าถึงและจัดเรียงตามเวลาที่สั่งล่าสุดก่อน พร้อม filter 7 วัน ตาม FR-29, FR-33, Constraints, AC-STAFF-ORDER-05
4. สร้าง logic สำหรับแสดงหมายเลข Order และลำดับตามเวลาที่สั่งเข้ามาและจัด Order สิ้นสุดไว้ท้ายรายการตาม FR-30, FR-32, FR-33, AC-STAFF-ORDER-02, AC-STAFF-ORDER-05
5. สร้าง API ดึงรายละเอียด Order เช่น รายการเครื่องดื่ม จำนวน ตัวเลือก และสถานะปัจจุบัน ตาม FR-31, FR-32 และ AC-STAFF-ORDER-03, AC-STAFF-ORDER-04, AC-STAFF-ORDER-09
6. สร้าง handling สำหรับโหลดข้อมูลล้มเหลว: ไม่แสดงข้อมูลที่ไม่สมบูรณ์และมีปุ่ม “ลองใหม่” ตาม Exception Flow 2b, Constraints, AC-STAFF-ORDER-07
7. เพิ่ม real-time refresh / polling mechanism เพื่ออัปเดตรายการ Order เมื่อมี Order ใหม่เข้ามา ตาม Constraints และ ASM-08
8. ทดสอบ end-to-end สำหรับ Acceptance Criteria ทุกข้อ เพื่อยืนยันว่ารายการ Order / queue / real-time / error handling สอดคล้องกับ spec

## 8. สิ่งที่ยังไม่ทำ

- หลังจาก Order สิ้นสุดแล้ว ควรมีการลบออกจากหน้ารายการหรือให้คงไว้และแสดงเป็นสถานะสุดท้ายต่อไป
  - ส่วนที่เกี่ยวข้องกับข้อนี้จะยังไม่สร้างจนกว่าจะได้คำตอบ

- มีเงื่อนไขทางสิทธิ์หรือช่วงเวลาใดบ้างที่อนุญาตให้พนักงานเห็น Order เก่าเกิน 7 วัน
  - ส่วนที่เกี่ยวข้องกับข้อนี้จะยังไม่สร้างจนกว่าจะได้คำตอบ

- ระบบควรมีการแจ้งเตือนหลังกดใหม่เข้ามาหรือใช้การแสดงรายการอัตโนมัติอย่างไร
  - ส่วนที่เกี่ยวข้องกับข้อนี้จะยังไม่สร้างจนกว่าจะได้คำตอบ

---

สรุป: แผนงานนี้จะสร้างหน้ารายการ Order สำหรับพนักงานแบบ end-to-end ตั้งแต่ login & authorization, แสดง order queue, detail ของ Order, real-time update, empty state, และ retry เมื่อโหลดข้อมูลล้มเหลว โดยยึด FR, NFR, Constraints และ AC ของ spec อย่างเคร่งครัด และไม่ขยาย scope ออกจาก Out of scope
