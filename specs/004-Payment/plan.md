# แผนงานสำหรับ Feature: ชำระเงินออนไลน์ (Online Payment)

## 1. สรุปแนวทาง
- ฟีเจอร์นี้จะสร้างหน้าชำระเงินสำหรับ Order ที่มีรายการและยอดชำระเงินถูกต้อง โดยแสดงยอดก่อนผู้ใช้ยืนยันการชำระเงินตาม FR-13
- ผู้ใช้จะส่งข้อมูลการชำระเงินไปยัง Payment Gateway พร้อม order id, amount, และ reference key ตาม FR-14 และ Constraint ที่กำหนด
- ระบบจะรองรับ QR Payment แบบมีเวลา 5 นาที, รอผลจาก Payment Gateway, และป้องกันการยืนยันซ้ำหรือยืนยันโดยไม่มีผลสำเร็จที่ชัดเจนตาม FR-15, FR-16, FR-17, FR-18 และ NFR-REL-02
- เมื่อผลการชำระเงินสำเร็จ ระบบจะบันทึกสถานะและยืนยัน Order แต่จะไม่เปิดเผยข้อมูลสำคัญจาก Payment Gateway ให้ผู้ใช้เห็นตาม FR-17 และ NFR-SEC-01
- หาก Payment Gateway ไม่ตอบกลับหรือไม่สำเร็จ ระบบจะแสดงสถานะ “กำลังตรวจสอบการชำระเงิน” และไม่ยืนยัน Order ว่าชำระเงินสำเร็จ ตาม Exception Flow 5a, 5b และ Constraint ของ timeout

## 2. เทคโนโลยีที่ใช้

| สิ่งที่เลือก | มาจาก | หมายเหตุ |
|---|---|---|
| React (Vite) สำหรับหน้าชำระเงินและแสดง QR | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้แสดงยอดเงิน, QR code, และ message status สำหรับผู้ใช้ |
| Python FastAPI สำหรับ API payment flow | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้ส่งข้อมูลไปยัง Payment Gateway, รับ callback, และบันทึกผล payment |
| ฐานข้อมูลเชิงสัมพันธ์ (เช่น PostgreSQL) | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้เก็บ Order, PaymentTransaction, status, reference key และ duplicate prevention |
| Payment Gateway ภายนอก | ระบบต้องส่งข้อมูลการชำระเงินผ่านช่องทาง Payment Gateway ที่กำหนด | เนื่องจาก spec ระบุ “Payment Gateway ที่กำหนด” แต่ไม่ระบุชื่อ vendor จึงยังไม่เลือก vendor จริง จนกว่าจะมีคำตอบ Open Question |
| QR code renderer + expiry clock 5 นาที | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้ตาม Constraint ว่า QR payment ต้องมีอายุ 5 นาที และ timeout เมื่อหมดอายุ |

## 3. โมเดลข้อมูล

| Entity | ฟิลด์หลัก | รองรับ FR / NFR |
|---|---|---|
| OrderPaymentSession | `order_id`, `amount`, `status`, `reference_key`, `created_at`, `expires_at`, `qr_code_payload` | รองรับ FR-13, FR-14, FR-15, AC-PAYMENT-01, AC-PAYMENT-02, AC-PAYMENT-03 |
| PaymentTransaction | `payment_id`, `order_id`, `gateway_status`, `reference_key`, `paid_at`, `result_code`, `raw_response` | รองรับ FR-16, FR-17, FR-18, AC-PAYMENT-04, AC-PAYMENT-05, AC-PAYMENT-06 |
| Order | `order_id`, `payment_status`, `confirmed_at`, `timeout_at` | รองรับ FR-17, Alternative Flow 4a, Exception Flow 5c, AC-PAYMENT-05, AC-PAYMENT-07, AC-PAYMENT-10 |

หมายเหตุโมเดลข้อมูล:
- จะไม่มีฟิลด์ใดที่เก็บข้อมูลสำคัญจาก Payment Gateway เกินความจำเป็นแก่ผู้ใช้ ตาม NFR-SEC-01 และ FR-17
- `reference_key` จะใช้เป็น key สำหรับป้องกันการยืนยันซ้ำตาม NFR-REL-02 และ AC-PAYMENT-11
- `payment_status` จะมี state เช่น pending, success, failed, timeout ตาม คำจำกัดของ spec และ Exception Flow
- จะไม่เก็บข้อมูลชำระเงินเพิ่มเติมนอกเหนือจากที่ต้องใช้เพื่อยืนยัน Order ตาม scope

## 4. API / หน้าจอ

- `GET /orders/{order_id}/payment` — Output: Order ID, ยอดชำระเงิน, และสถานะก่อนชำระเงิน — รองรับ FR-13, AC-PAYMENT-01
- `POST /api/payments/initiate` — Input: `order_id`, `amount`, `reference_key`; Output: QR payload, expiry time, payment session — รองรับ FR-14, FR-15, AC-PAYMENT-02, AC-PAYMENT-03
- `POST /api/payments/callback` — Input: Payment Gateway result payload; Output: success / failure / pending status — รองรับ FR-16, Exception Flow 5a, Exception Flow 5b, AC-PAYMENT-04, AC-PAYMENT-08, AC-PAYMENT-09
- `POST /api/payments/confirm` — Input: `order_id`, `reference_key`, `gateway_status`; Output: confirm order only when success — รองรับ FR-17, FR-18, NFR-REL-01, NFR-REL-02, AC-PAYMENT-05, AC-PAYMENT-06, AC-PAYMENT-11
- `GET /api/payments/{order_id}/status` — Output: pending / success / failed / timeout — รองรับ Exception Flow 5a, Exception Flow 5c, AC-PAYMENT-08, AC-PAYMENT-10
- `POST /api/payments/timeout` — Input: `order_id`; Output: mark order as timeout and forbid reissue QR — รองรับ Exception Flow 5c, AC-PAYMENT-10

## 5. ตารางตรวจ Constraints

| Constraint ID | ถูกนำไปใช้ที่ไหนใน plan | สถานะ |
|---|---|---|
| ไม่ระบุ ID ใน spec — ผู้ใช้ต้องมี Order ที่มีรายการสินค้าและยอดชำระเงินถูกต้องก่อนเข้าสู่ขั้นตอนการชำระเงิน | ใช้ใน `GET /orders/{order_id}/payment` และ validation ก่อนเริ่ม payment | ใช้แล้ว |
| ไม่ระบุ ID ใน spec — ระบบต้องส่งข้อมูลการชำระเงินผ่านช่องทาง Payment Gateway ที่กำหนด | ใช้ใน `POST /api/payments/initiate` และส่ง `order_id`, `amount`, `reference_key` | ใช้แล้ว |
| ไม่ระบุ ID ใน spec — ระบบต้องตรวจสอบผลการชำระเงินจาก Payment Gateway ก่อนยืนยัน Order | ใช้ใน callback validation และ `POST /api/payments/confirm` | ใช้แล้ว |
| ไม่ระบุ ID ใน spec — หากไม่ได้รับการยืนยันว่าชำระเงินสำเร็จ ระบบต้องไม่ยืนยัน Order ว่าชำระเงินแล้ว | ใช้ใน confirm logic และ pending status handling | ใช้แล้ว |
| ไม่ระบุ ID ใน spec — ระบบต้องป้องกันการยืนยันการชำระเงินซ้ำสำหรับ Order เดิม | ใช้ใน `reference_key` / idempotency check และ AC-PAYMENT-11 | ใช้แล้ว |
| ไม่ระบุ ID ใน spec — ระบบแสดง QR code ภายในเวลาที่กำหนด พร้อม Order ID และยอดเงิน เพื่อให้ลูกค้าสแกนชำระเงิน | ใช้ใน QR generation response และ UI rendering | ใช้แล้ว |
| ไม่ระบุ ID ใน spec — QR Payment มีอายุ 5 นาที และเมื่อหมดอายุ Order จะถูกคงสถานะ timeout | ใช้ใน expiry timer และ `POST /api/payments/timeout` | ใช้แล้ว |
| ไม่ระบุ ID ใน spec — ผู้ใช้ไม่สามารถสร้าง QR ใหม่ได้ และต้องทำรายการใหม่อีกครั้งเมื่อ QR หมดอายุ | ใช้ใน timeout logic และ UI message for retry-new-order | ใช้แล้ว |

## 6. แผนทดสอบจาก Acceptance Criteria

| AC ID | ชื่อ test | ทดสอบอย่างไร |
|---|---|---|
| AC-PAYMENT-01 | `test_AC_PAYMENT_01_show_order_total_before_payment` | เข้าไปที่หน้าชำระเงินของ Order ที่มีรายการแล้วตรวจสอบว่าระบบแสดงยอดชำระเงินให้เห็นก่อนชำระเงิน |
| AC-PAYMENT-02 | `test_AC_PAYMENT_02_send_payment_data_to_gateway` | เริ่มชำระเงินและตรวจสอบว่าระบบส่ง `order id`, `amount`, `reference key` ไปยัง Payment Gateway อย่างถูกต้อง |
| AC-PAYMENT-03 | `test_AC_PAYMENT_03_show_qr_and_expiry` | เรียก API initiate payment แล้วตรวจว่ามี QR code, Order ID, ยอดเงิน, และ expiry time 5 นาที |
| AC-PAYMENT-04 | `test_AC_PAYMENT_04_receive_payment_result` | จำลอง Payment Gateway ส่งผลการชำระเงินกลับมา ตรวจสอบว่า backend บันทึกผลการชำระเงินได้ |
| AC-PAYMENT-05 | `test_AC_PAYMENT_05_confirm_order_on_success` | เมื่อ Payment Gateway ยืนยันสำเร็จ ตรวจสอบว่าระบบบันทึกสถานะสำเร็จและยืนยัน Order แต่ไม่ได้แสดงข้อมูลสำคัญเกินจำเป็น |
| AC-PAYMENT-06 | `test_AC_PAYMENT_06_show_pending_on_failure` | เมื่อ Payment Gateway แจ้งว่าชำระเงินไม่สำเร็จ ตรวจสอบว่าระบบแจ้ง status และไม่ยืนยัน Order ว่าชำระเงินสำเร็จ |
| AC-PAYMENT-07 | `test_AC_PAYMENT_07_keep_order_pending_when_not_paid` | ตรวจสอบว่าหากยังไม่ชำระเงิน Order ยังคงรอการยืนยันและยังไม่อนุมัติชำระเงิน |
| AC-PAYMENT-08 | `test_AC_PAYMENT_08_handle_gateway_timeout` | จำลอง Payment Gateway ไม่ตอบกลับ แล้วตรวจสอบว่าระบบแสดง “กำลังตรวจสอบการชำระเงิน” และไม่ยืนยันสำเร็จ |
| AC-PAYMENT-09 | `test_AC_PAYMENT_09_do_not_forward_failed_order` | เมื่อ Payment Gateway ส่ง failed result ตรวจสอบว่าระบบไม่ส่ง Order ไปยังขั้นตอนถัดไป |
| AC-PAYMENT-10 | `test_AC_PAYMENT_10_timeout_order_and_block_retry_qr` | ให้ QR หมดอายุแล้วตรวจสอบว่าระบบคง Order ไว้ในสถานะ timeout และไม่อนุญาตสร้าง QR ใหม่ |
| AC-PAYMENT-11 | `test_AC_PAYMENT_11_idempotent_duplicate_payment` | ส่ง callback ซ้ำของ Order เดียวกัน ตรวจสอบว่าไม่เกิด duplicate payment confirmation |

## 7. ลำดับงาน

1. กำหนด model และ validation สำหรับ payment session, callback, timeout, และ duplicate key ตาม FR-14, FR-16, NFR-REL-02, AC-PAYMENT-02 และ AC-PAYMENT-11
2. สร้างหน้าชำระเงินที่แสดงยอดเงิน, Order ID, และ QR status พร้อม message state ตาม FR-13, FR-15 และ AC-PAYMENT-01, AC-PAYMENT-03
3. สร้าง API เริ่มชำระเงินและสร้าง QR payload พร้อม expiry time 5 นาที ตาม FR-14, FR-15 และ AC-PAYMENT-02, AC-PAYMENT-03
4. สร้าง callback handler และ payment verification logic เพื่อรับผลจาก Payment Gateway และป้องกันการยืนยันซ้ำ ตาม FR-16, NFR-REL-01, NFR-REL-02 และ AC-PAYMENT-04, AC-PAYMENT-11
5. สร้างการยืนยัน Order เมื่อชำระเงินสำเร็จ และไม่ยืนยันเมื่อ failed/pending/timeout ตาม FR-17, FR-18, Alternative Flow 4a, Exception Flow 5a, 5b, 5c และ AC-PAYMENT-05 ถึง AC-PAYMENT-10
6. ทดสอบ end-to-end ทุก Acceptance Criteria และตรวจว่าการจัดการ status และ duplicate lookup สอดคล้องกับ Queue/Payment Gateway behavior

## 8. สิ่งที่ยังไม่ทำ

- ไม่มี Open Questions ใน spec.md ปัจจุบัน
  - ส่วนที่เกี่ยวข้องกับข้อนี้จะยังไม่สร้างจนกว่าจะได้คำตอบ

---

สรุป: แผนงานนี้จะสร้างระบบชำระเงินออนไลน์แบบ end-to-end ตั้งแต่แสดงยอดเงิน, สร้าง QR, รับผลจาก Payment Gateway, จนถึงยืนยัน Order โดยยึด FR, NFR และ AC ของ spec อย่างเคร่งครัด และไม่เพิ่มฟังก์ชันที่อยู่นอก scope เช่น การสร้าง Order, การแก้ไขสินค้า, หรือการคืนเงิน
