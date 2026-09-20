# แผนงานสำหรับ Feature: อัปเดตสถานะ Order (Update Order Status)

## 1. สรุปแนวทาง
- ฟีเจอร์นี้จะสร้างหน้าจัดการสถานะ Order สำหรับพนักงานให้เลือก Order ที่ต้องจัดการ, ดูสถานะปัจจุบัน, เลือกสถานะใหม่, และบันทึกข้อมูลให้ลูกค้าเห็นแบบ Real-time ตาม FR-24, FR-25, FR-26, FR-27 และ FR-28
- ผู้ใช้หลักคือ พนักงานร้านที่มีสิทธิ์ในการอัปเดตสถานะ Order เท่านั้น และต้องผ่านการเข้าสู่ระบบก่อนเข้าถึงฟังก์ชันนี้ ตาม Constraints และ NFR-SEC-01
- ระบบจะตรวจสอบสถานะก่อนบันทึกให้เป็นไปตามลำดับเดียว: “รอรับ Order → กำลังเตรียม → พร้อมรับสินค้า → รับสินค้าแล้ว” และไม่อนุญาตให้ย้อนกลับสถานะตาม FR-25 และ FR-26
- เมื่อสถานะใหม่เป็น “พร้อมรับสินค้า” ระบบจะเรียกใช้ UC-06 เพื่อดำเนินการแจ้งเตือนผ่าน LINE แต่จะไม่ให้สถานะกลับไปเป็นก่อนหน้าและไม่ retry อัตโนมัติเมื่อแจ้งเตือนล้มเหลว ตาม FR-28, Exception Flow 6b และ Constraints
- แผนนี้จะไม่สร้างฟังก์ชันนอก scope เช่น การชำระเงิน, การสร้าง Order, การจัดการเมนูค่าใช้จ่าย, หรือรายงานยอดขาย เพราะถูกระบุไว้ใน Out of scope อย่างชัดเจน

## 2. เทคโนโลยีที่ใช้

| สิ่งที่เลือก | มาจาก | หมายเหตุ |
|---|---|---|
| React (Vite) สำหรับหน้าจัดการสถานะ Order ของพนักงาน | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้แสดง Order list, status current, dropdown เลือกสถานะใหม่ และ status validation |
| Python FastAPI สำหรับ API สร้าง/ตรวจสอบสถานะ Order | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้จัดการ workflow validation, status transition, และ persistence ของสถานะใหม่ |
| ฐานข้อมูลเชิงสัมพันธ์ (เช่น PostgreSQL) | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้เก็บ Order, OrderStatusHistory, และผลการอัปเดตสถานะสำหรับการตรวจสอบ Real-time |
| Status transition engine / queue validation | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้บังคับให้สถานะอัปเดตตามลำดับที่ถูกกำหนดและป้องกันย้อนกลับ |
| Staff authorization context | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้จำกัดให้เฉพาะพนักงานที่มีสิทธิ์เท่านั้นสามารถอัปเดตสถานะได้ |

## 3. โมเดลข้อมูล

| Entity | ฟิลด์หลัก | รองรับ FR / NFR |
|---|---|---|
| Order | `order_id`, `current_status`, `created_at`, `updated_at`, `user_id` | รองรับ FR-24, FR-25, FR-27, FR-28, AC-STATUS-01, AC-STATUS-02 |
| OrderStatusHistory | `status_log_id`, `order_id`, `previous_status`, `new_status`, `changed_by`, `changed_at`, `is_valid` | รองรับ FR-25, FR-26, FR-27, NFR-REL-01, AC-STATUS-01, AC-STATUS-04 |
| StaffStatusUpdateRequest | `order_id`, `new_status`, `staff_id`, `requested_at` | รองรับ FR-25, FR-26, FR-27, AC-STATUS-01 |
| NotificationDispatchResult | `order_id`, `new_status`, `notification_status`, `result_message`, `attempted_at` | รองรับ FR-28, Alternative Flow 6a, Exception Flow 6b, AC-STATUS-03, AC-STATUS-05 |

หมายเหตุโมเดลข้อมูล:
- `current_status` จะใช้ค่าจากลำดับที่กำหนด: `รอรับ Order`, `กำลังเตรียม`, `พร้อมรับสินค้า`, `รับสินค้าแล้ว`
- `OrderStatusHistory` จะเก็บ record การเปลี่ยนแปลงและจะถูกใช้เพื่อบันทึกว่า status อัปเดตถูกต้องหรือไม่ถูกต้อง ตาม NFR-REL-01
- จะไม่มีฟิลด์สำหรับข้อมูลลูกค้า, ชำระเงิน, หรือเมนูราคาโปรโมชั่น เนื่องจาก Out of scope
- เมื่อ `new_status` เป็น “พร้อมรับสินค้า” ระบบยังคงต้องคง `current_status` เป็น “พร้อมรับสินค้า” หาก LINE Notification ล้มเหลว ตาม Exception Flow 6b

## 4. API / หน้าจอ

- `GET /api/staff/orders` — Input: authenticated staff user; Output: รายการ Order ที่สามารถเลือกได้พร้อมสถานะปัจจุบัน — รองรับ FR-24, AC-STATUS-01
- `GET /api/staff/orders/{order_id}` — Input: `order_id`, authenticated staff user; Output: Order detail + current status — รองรับ FR-24, AC-STATUS-01
- `PATCH /api/staff/orders/{order_id}/status` — Input: `new_status` และ staff identity; Output: status updated / validation error / failed update — รองรับ FR-25, FR-26, FR-27, AC-STATUS-01, AC-STATUS-04
- `GET /staff/orders/status` — Output: หน้าเลือก Order และปรับสถานะใหม่ — รองรับ FR-24, FR-25, AC-STATUS-01, AC-STATUS-02
- `POST /api/staff/orders/{order_id}/status/ready` — Input: `order_id`; Output: trigger UC-06 notification flow when `new_status = พร้อมรับสินค้า` — รองรับ FR-28, Alternative Flow 6a, AC-STATUS-03
- `POST /api/notifications/ready-callback` — Input: notification result; Output: log result and preserve current status if failed — รองรับ Exception Flow 6b, AC-STATUS-05

## 5. ตารางตรวจ Constraints

| Constraint ID | ถูกนำไปใช้ที่ไหนใน plan | สถานะ |
|---|---|---|
| เฉพาะพนักงานที่มีสิทธิ์เท่านั้นที่สามารถอัปเดตสถานะ Order ได้ | ใช้ใน staff auth guard สำหรับ `PATCH /api/staff/orders/{order_id}/status` | ใช้แล้ว |
| Order ต้องมีอยู่ในระบบก่อนอัปเดตสถานะ | ใช้ใน validation ก่อนอัปเดต state และ `GET /api/staff/orders/{order_id}` | ใช้แล้ว |
| ระบบต้องตรวจสอบความถูกต้องของสถานะก่อนบันทึก | ใช้ใน status transition validation logic และ error response | ใช้แล้ว |
| สถานะ Order เป็นลำดับไปทางเดียว: รอรับ Order → กำลังเตรียม → พร้อมรับสินค้า → รับสินค้าแล้ว | ใช้ใน state machine สำหรับ transition rules | ใช้แล้ว |
| พนักงานไม่สามารถเปลี่ยนสถานะย้อนกลับได้ | ใช้ใน status validation ที่ป้องกัน backward transition | ใช้แล้ว |
| เมื่อสถานะเปลี่ยนเป็น “พร้อมรับสินค้า” ระบบต้องเรียกใช้ UC-06 | ใช้ใน `POST /api/staff/orders/{order_id}/status/ready` และ notification dispatch | ใช้แล้ว |
| หากการแจ้งเตือนผ่าน LINE ล้มเหลว ต้องคงสถานะ Order ไว้และไม่ retry อัตโนมัติทันที | ใช้ใน notification callback handling ที่ไม่มี automatic retry immediately | ใช้แล้ว |

## 6. แผนทดสอบจาก Acceptance Criteria

| AC ID | ชื่อ test | ทดสอบอย่างไร |
|---|---|---|
| AC-STATUS-01 | `test_AC_STATUS_01_staff_updates_order_status_successfully` | login เป็น staff ที่มีสิทธิ์ เปิด Order แล้วเลือกสถานะใหม่และยืนยัน ตรวจสอบว่าระบบตรวจสอบและบันทึกสถานะใหม่สำเร็จ |
| AC-STATUS-02 | `test_AC_STATUS_02_customer_sees_latest_status` | อัปเดตสถานะของ Order แล้วเปิดดู Order ของลูกค้า ตรวจสอบว่าลูกค้าจะเห็นสถานะล่าสุด |
| AC-STATUS-03 | `test_AC_STATUS_03_trigger_line_notification_when_ready` | เลือกสถานะใหม่เป็น “พร้อมรับสินค้า” แล้วตรวจสอบว่าระบบเรียกใช้ UC-06 เพื่อส่งแจ้งเตือน LINE |
| AC-STATUS-04 | `test_AC_STATUS_04_dont_update_when_status_save_fails` | จำลอง error เมื่อบันทึกสถานะเข้าฐานข้อมูล แล้วตรวจสอบว่าระบบแจ้งเตือนพนักงานและคงสถานะเดิม |
| AC-STATUS-05 | `test_AC_STATUS_05_keep_ready_status_when_line_fails` | จำลองการแจ้งเตือน LINE ไม่สำเร็จ หลังเปลี่ยนสถานะเป็น “พร้อมรับสินค้า” แล้วตรวจสอบว่าระบบคงสถานะเป็น “พร้อมรับสินค้า” และบันทึกผลล้มเหลว |

## 7. ลำดับงาน

1. กำหนด state machine สำหรับ Order status และ validation rules ตาม FR-25, FR-26 และ Constraints
2. สร้างหน้าจัดการสถานะ Order สำหรับพนักงานพร้อมแสดงรายการ Order, current status, และ selector สำหรับ status ใหม่ ตาม FR-24, FR-25, AC-STATUS-01
3. สร้าง API `PATCH /api/staff/orders/{order_id}/status` เพื่อ validate และบันทึก status ใหม่ทันทีตาม FR-26, FR-27 และ AC-STATUS-01, AC-STATUS-04
4. สร้าง mechanism สำหรับทำให้ลูกค้าเห็นสถานะล่าสุดแบบ Real-time เมื่อ status update สำเร็จ ตาม FR-27, AC-STATUS-02
5. สร้าง trigger เมื่อ status ใหม่เป็น “พร้อมรับสินค้า” เพื่อเรียกใช้ UC-06 ตาม FR-28 และ AC-STATUS-03
6. สร้าง error handling สำหรับการอัปเดตสถานะล้มเหลว และกรณีแจ้งเตือน LINE ล้มเหลว โดยไม่เปลี่ยน status กลับ/ไม่ retry อัตโนมัติทันที ตาม Exception Flow 5a, Exception Flow 6b, AC-STATUS-04, AC-STATUS-05
7. ทดสอบ end-to-end ตาม Acceptance Criteria ทั้ง 5 ข้อ เพื่อยืนยัน state machine, security, notification integration, และ failure handling เป็นไปตาม spec

## 8. สิ่งที่ยังไม่ทำ

- สถานะ Order ที่ระบบต้องรองรับทั้งหมดมีอะไรบ้าง
  - ส่วนที่เกี่ยวข้องกับข้อนี้จะยังไม่สร้างจนกว่าจะได้คำตอบ

- มีสถานะอื่นนอกเหนือจากลำดับพื้นฐานหรือไม่
  - ส่วนที่เกี่ยวข้องกับข้อนี้จะยังไม่สร้างจนกว่าจะได้คำตอบ

- หากพนักงานเปลี่ยนสถานะผิด จะมีการยืนยันก่อนบันทึกหรือไม่
  - ส่วนที่เกี่ยวข้องกับข้อนี้จะยังไม่สร้างจนกว่าจะได้คำตอบ

---

สรุป: แผนงานนี้จะสร้างฟังก์ชันจัดการสถานะ Order สำหรับพนักงานแบบ end-to-end ตั้งแต่ดู order, validate transition, บันทึก status ใหม่, จนถึง trigger LINE notification เมื่อเป็น “พร้อมรับสินค้า” โดยยึด FR, NFR, Constraints และ AC ของ spec อย่างเคร่งครัด และไม่เพิ่มฟังก์ชันนอก scope
