# แผนงานสำหรับ Feature: ติดตามสถานะ Order (Order Status Tracking)

## 1. สรุปแนวทาง
- ฟีเจอร์นี้จะสร้างหน้ารายการ Order และหน้ารายละเอียด Order เพื่อให้ลูกค้าเห็น Order ของตนเองและติดตามสถานะปัจจุบันตาม FR-19, FR-20 และ FR-23
- ผู้ใช้หลักคือ ลูกค้า / นักศึกษา ที่มี Order อยู่ในระบบและต้องเห็นเฉพาะ Order ที่ตนเองมีสิทธิ์เข้าถึงตาม FR-19, FR-23 และ NFR-SEC-02
- ระบบจะดึงสถานะ Order จากข้อมูลที่บันทึกไว้ในระบบแล้ว และแสดงลำดับสถานะ 4 ขั้นคือ “รอรับ Order” → “กำลังเตรียม” → “พร้อมรับสินค้า” → “รับสินค้าแล้ว” ตาม FR-21 และ AC-STATUS-03
- หากโหลดข้อมูลสถานะไม่สำเร็จ ระบบจะไม่แสดงข้อมูลสถานะที่ยังไม่ได้รับการยืนยัน และแสดงข้อความ “ไม่สามารถโหลดสถานะได้” พร้อมปุ่ม “ลองใหม่” ตาม Exception Flow 4a และ AC-STATUS-07
- แผนนี้จะไม่สร้างฟังก์ชันนอก scope เช่น การสร้าง Order, การแก้ไข Order, การชำระเงิน, การจัดการ Order ของพนักงาน, หรือการส่งแจ้งเตือน เมื่อสถานะเปลี่ยนแปลง เนื่องจากถูกกำหนดไว้ใน Out of scope

## 2. เทคโนโลยีที่ใช้

| สิ่งที่เลือก | มาจาก | หมายเหตุ |
|---|---|---|
| React (Vite) สำหรับหน้ารายการ Order และหน้ารายละเอียด Order | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้แสดงรายการ Order, ผู้ใช้เลือก Order, และแสดงสถานะล่าสุด/รายละเอียดสินค้า |
| Python FastAPI สำหรับ API ตรวจสอบสถานะ Order | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้ดึงข้อมูล Order และ Order status จากระบบที่บันทึกไว้สำหรับผู้ใช้แต่ละคน |
| ฐานข้อมูลเชิงสัมพันธ์ (เช่น PostgreSQL) | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้เก็บ Order, OrderItem, OrderStatusHistory และ user ownership mapping |
| Polling หรือ refresh-on-demand สำหรับข้อมูลล่าสุด | ทีมเลือกเอง ไม่ได้มาจาก spec | สอดคล้องกับ Requirement ที่ระบุให้แสดงสถานะล่าสุดจากข้อมูลที่ยืนยันแล้ว และ Option สำหรับ “ลองใหม่” เมื่อโหลดไม่สำเร็จ |
| Session/Auth user context | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้จำกัดให้ผู้ใช้เห็น Order ของตนเองเท่านั้นตาม NFR-SEC-02 และ Constraints |

## 3. โมเดลข้อมูล

| Entity | ฟิลด์หลัก | รองรับ FR / NFR |
|---|---|---|
| UserOrderSummary | `order_id`, `user_id`, `created_at`, `status`, `last_updated_at`, `total_amount` | รองรับ FR-19, FR-23, AC-STATUS-01, AC-STATUS-05 |
| Order | `order_id`, `user_id`, `created_at`, `status`, `total_amount`, `last_status_change_at`, `is_active` | รองรับ FR-20, FR-21, FR-22, AC-STATUS-02, AC-STATUS-03, AC-STATUS-04 |
| OrderItem | `order_item_id`, `order_id`, `menu_item_id`, `menu_name`, `quantity`, `unit_price`, `line_total` | รองรับ FR-22, AC-STATUS-04 |
| OrderStatusHistory | `status_log_id`, `order_id`, `status_code`, `status_name`, `changed_at`, `is_confirmed` | รองรับ FR-21, NFR-REL-03, AC-STATUS-03, AC-STATUS-08 |
| OrderStatusSnapshot | `order_id`, `current_status`, `latest_status_time`, `is_loaded`, `error_message` | รองรับ Exception Flow 4a, AC-STATUS-07 |

หมายเหตุโมเดลข้อมูล:
- `status_code` จะใช้ค่าจากลำดับ 4 ขั้นของ spec: `PENDING_ACCEPT`, `PREPARING`, `READY_FOR_PICKUP`, `PICKED_UP`
- `OrderStatusHistory` จะเก็บสถานะที่ได้รับการยืนยันแล้วเท่านั้น เพื่อให้สอดคล้องกับ NFR-REL-03 และการไม่แสดงข้อมูลที่ไม่ยืนยัน
- `Order` จะไม่เก็บฟิลด์สำหรับการแก้ไขสินค้า หรือการชำระเงิน เนื่องจาก Out of scope
- `OrderItem` จะมีเพียงรายการสินค้า จำนวน ราคา และสถานะล่าสุด ตาม ASM-10 และ AC-STATUS-04
- `user_id` จะใช้เพื่อจำกัดการเข้าถึง Order ของผู้ใช้เฉพาะคนเท่านั้นตาม NFR-SEC-02

## 4. API / หน้าจอ

- `GET /api/orders` — Input: authenticated user; Output: รายการ Order ของผู้ใช้ที่เรียงตามวันที่สร้างล่าสุดก่อน — รองรับ FR-19, FR-23, AC-STATUS-01, AC-STATUS-05
- `GET /api/orders/{order_id}` — Input: `order_id`, authenticated user; Output: รายละเอียด Order, รายการสินค้า, สถานะล่าสุด, และเวลาเมื่อสถานะเปลี่ยนล่าสุด — รองรับ FR-20, FR-21, FR-22, AC-STATUS-02, AC-STATUS-03, AC-STATUS-04
- `GET /orders/status` — Output: หน้าแสดงรายการ Order ของผู้ใช้ และรายการที่สามารถเลือกดูต่อได้ — รองรับ FR-19, FR-23, AC-STATUS-01, AC-STATUS-05
- `GET /orders/{order_id}/details` — Output: หน้ารายละเอียด Order พร้อมข้อมูลสินค้าและสถานะล่าสุด — รองรับ FR-20, FR-22, AC-STATUS-02, AC-STATUS-04
- `POST /api/orders/{order_id}/status/refresh` — Input: `order_id`; Output: โหลดสถานะล่าสุดใหม่อีกครั้ง หรือ error state หากโหลดไม่สำเร็จ — รองรับ Exception Flow 4a, AC-STATUS-07
- `GET /api/orders/{order_id}/status` — Output: `current_status`, `latest_status_time`, `status_history[]`, `error_message?` — รองรับ FR-21, NFR-REL-03, AC-STATUS-03, AC-STATUS-08

## 5. ตารางตรวจ Constraints

| Constraint ID | ถูกนำไปใช้ที่ไหนใน plan | สถานะ |
|---|---|---|
| ผู้ใช้ต้องมี Order อยู่ในระบบก่อนจึงสามารถติดตามสถานะได้ | ใช้ใน `GET /api/orders` และ `GET /api/orders/{order_id}` เพื่อแสดงเฉพาะ Order ที่มีจริงให้เลือก | ใช้แล้ว |
| ผู้ใช้สามารถดูสถานะเฉพาะ Order ของตนเอง | ใช้ใน user context validation และ filter ของ query ตาม `user_id` | ใช้แล้ว |
| สถานะ Order ต้องมาจากข้อมูลที่ระบบบันทึกไว้ | ใช้ใน `OrderStatusHistory` และ `GET /api/orders/{order_id}/status` เพื่ออ่านจากข้อมูลที่ยืนยันแล้ว | ใช้แล้ว |
| ลูกค้าไม่สามารถแก้ไขหรือเปลี่ยนสถานะ Order ได้เอง | ใช้ใน API/หน้าจอโดยไม่เปิดปุ่มแก้ไขสถานะหรือยืนยันสถานะจากผู้ใช้ | ใช้แล้ว |
| หากไม่สามารถโหลดสถานะล่าสุดได้ ระบบต้องไม่แสดงข้อมูลสถานะที่ไม่ยืนยัน | ใช้ใน refresh/error handling และ UI error state ที่ป้องกันการแสดงสถานะเก่า/ไม่ยืนยัน | ใช้แล้ว |

## 6. แผนทดสอบจาก Acceptance Criteria

| AC ID | ชื่อ test | ทดสอบอย่างไร |
|---|---|---|
| AC-STATUS-01 | `test_AC_STATUS_01_show_only_user_orders` | สร้าง Order ของผู้ใช้ 2 คน แล้ว login เป็นลูกค้าคนหนึ่ง ตรวจสอบว่ารายการ Order ที่เห็นมีเฉพาะของตนเอง |
| AC-STATUS-02 | `test_AC_STATUS_02_select_order_and_view_detail` | เลือก Order จากรายการ แล้วตรวจสอบว่าระบบแสดงรายละเอียดและสถานะล่าสุดของ Order นั้นถูกต้อง |
| AC-STATUS-03 | `test_AC_STATUS_03_display_4_step_status_flow` | กำหนดสถานะ 4 ขั้นในฐานข้อมูล แล้วเปิดรายละเอียด Order ตรวจสอบว่าระบบแสดงตามลำดับ “รอรับ Order → กำลังเตรียม → พร้อมรับสินค้า → รับสินค้าแล้ว” และแสดงเวลาเมื่อถึง “พร้อมรับสินค้า” หรือ “รับสินค้าแล้ว” |
| AC-STATUS-04 | `test_AC_STATUS_04_show_order_items_and_latest_status` | เลือก Order ที่มีรายการสินค้า 2-3 รายการ และตรวจสอบว่าระบบแสดงรายการสินค้า จำนวน ราคา และสถานะล่าสุดอย่างถูกต้อง |
| AC-STATUS-05 | `test_AC_STATUS_05_list_orders_sorted_by_latest_created` | สร้าง Order หลายรายการในเวลาแตกต่างกัน แล้วเปิดหน้าติดตามสถานะ ตรวจสอบว่ารายการเรียงตามวันที่สร้างล่าสุดก่อน |
| AC-STATUS-06 | `test_AC_STATUS_06_select_order_from_multiple_orders` | เปิดหน้าติดตามสถานะที่มีหลาย Order แล้วเลือก Order ใด Order หนึ่ง ตรวจสอบว่าระบบแสดงรายละเอียดและสถานะของตามที่เลือก |
| AC-STATUS-07 | `test_AC_STATUS_07_show_retry_when_load_fails` | จำลอง API โหลดสถานะล้มเหลว แล้วตรวจสอบว่า UI แสดงข้อความ “ไม่สามารถโหลดสถานะได้” และมีปุ่ม “ลองใหม่” และไม่แสดงสถานะเดิมที่ยังไม่ได้รับการยืนยัน |
| AC-STATUS-08 | `test_AC_STATUS_08_show_only_confirmed_status` | บันทึกสถานะที่ยังไม่ได้ยืนยัน และสถานะยืนยันแล้วในฐานข้อมูล แล้วตรวจสอบว่าระบบแสดงเฉพาะสถานะที่ยืนยันแล้ว |
| AC-STATUS-09 | `test_AC_STATUS_09_show_only_authorized_orders` | สร้าง Order ของคนละบัญชี แล้ว login เป็นบัญชีหนึ่ง ตรวจสอบว่าไม่เห็น Order ของอีกบัญชี |

## 7. ลำดับงาน

1. กำหนด schema สำหรับ `UserOrderSummary`, `Order`, `OrderItem`, และ `OrderStatusHistory` ตาม FR-19, FR-20, FR-21 และ NFR-SEC-02
2. สร้างหน้า `GET /orders/status` และ `GET /orders/{order_id}/details` พร้อม UI สำหรับแสดงรายการ Order และเลือก Order ที่ต้องการดู ตาม FR-19, FR-20, FR-23 และ AC-STATUS-01, AC-STATUS-02, AC-STATUS-05, AC-STATUS-06
3. สร้าง API ดึงรายการ Order ของผู้ใช้ และดึงรายละเอียด Order ครบโดย filter ตาม `user_id` และ `order_id` ตาม FR-19, FR-20, NFR-SEC-02 และ AC-STATUS-01, AC-STATUS-02, AC-STATUS-09
4. สร้าง logic แสดงสถานะ 4 ขั้นจาก `OrderStatusHistory` และแสดงเวลาเมื่อสถานะถึง “พร้อมรับสินค้า” หรือ “รับสินค้าแล้ว” ตาม FR-21 และ AC-STATUS-03, AC-STATUS-08
5. สร้าง logic สำหรับแสดงข้อมูลรายการสั่งซื้อในรายละเอียด Order เช่น รายการสินค้า จำนวน ราคา และสถานะล่าสุด ตาม FR-22 และ AC-STATUS-04
6. สร้าง handling สำหรับกรณีโหลดข้อมูลล้มเหลว: แสดงข้อความ “ไม่สามารถโหลดสถานะได้”, มีปุ่ม “ลองใหม่”, และไม่แสดงสถานะที่ไม่ยืนยัน ตาม Exception Flow 4a, NFR-REL-03 และ AC-STATUS-07, AC-STATUS-08
7. ทดสอบ end-to-end ทั้ง 9 Acceptance Criteria เพื่อยืนยันว่า UI/API/permission logic สอดคล้องกับ spec และไม่มีการเพิ่มฟังก์ชันนอก Scope

## 8. สิ่งที่ยังไม่ทำ

- ไม่มี Open Questions ใน spec.md ปัจจุบัน
  - ส่วนที่เกี่ยวข้องกับข้อนี้จะยังไม่สร้างจนกว่าจะได้คำตอบ

---

สรุป: แผนงานนี้จะสร้างหน้าติดตามสถานะ Order แบบ end-to-end ตั้งแต่แสดงรายการ Order ของผู้ใช้, เลือก Order, แสดงสถานะ 4 ขั้นและรายละเอียดสินค้า, จนถึงแสดงข้อความล้มเหลวและ retry เมื่อโหลดข้อมูลไม่สำเร็จ โดยยึด FR, NFR และ AC ของ spec อย่างเคร่งครัด และไม่เพิ่มฟังก์ชันนอก scope
