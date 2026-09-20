# แผนงานสำหรับ Feature: ดูรายงานยอดขายและสถิติ (Sales Report & Statistics)

## 1. สรุปแนวทาง
- ฟีเจอร์นี้จะสร้างหน้า Manager สำหรับเลือกรายงานตามสาขาและช่วงวันที่ที่ต้องการ เพื่อคำนวณและแสดงยอดขายรวม จำนวน Order และเมนูขายดี ตาม FR-50 ถึง FR-56
- ผู้ใช้หลักคือ Manager ที่มีสิทธิ์ของสาขานั้น โดยต้องเข้าสู่ระบบและมีสิทธิ์เข้าถึงข้อมูลรายงานเฉพาะสาขาที่ตนเองดูแล ตาม Constraints และ NFR-SEC-06
- ระบบจะใช้ Order ที่ชำระเงินสำเร็จเท่านั้นในการคำนวณยอดขายและจำนวน Order และจัดอันดับเมนูขายดีจากจำนวนชิ้นที่ขาย ตาม FR-52, FR-53, FR-54 และ NFR-ACC-01
- หากไม่มีข้อมูลในช่วงเวลาที่เลือก หรือระบบประมวลผลรายงานไม่สำเร็จ จะต้องแสดงข้อความตาม spec และไม่แสดงตัวเลขหรือข้อมูลที่ไม่สมบูรณ์ ตาม Exception Flow 4a, 4b, AC-REPORT-09 และ AC-REPORT-10
- แผนนี้จะไม่สร้างฟังก์ชันนอก scope เช่น การสร้าง/แก้ไข Order, การชำระเงิน, การอัปเดตสถานะ Order, หรือการจัดการบัญชีผู้ใช้งาน เพราะถูกกำหนดไว้ใน Out of scope อย่างชัดเจน

## 2. เทคโนโลยีที่ใช้

| สิ่งที่เลือก | มาจาก | หมายเหตุ |
|---|---|---|
| React (Vite) สำหรับหน้า Manager รายงานยอดขาย | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้แสดงสาขา, ช่วงวันที่, KPI, และตารางเมนูขายดี |
| Python FastAPI สำหรับ API รายงานยอดขาย | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้คำนวณยอดขาย จำนวน Order และเมนูขายดี จาก Order ที่ชำระเงินสำเร็จเท่านั้น |
| ฐานข้อมูลเชิงสัมพันธ์ (เช่น PostgreSQL) | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้เก็บ Order, OrderItem, Branch, และข้อมูลชำระเงินเพื่อประมวลผลรายงาน |
| Report aggregation service | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้คำนวณตามสาขาและช่วงวันที่และจัดอันดับเมนูขายดีจากจำนวนชิ้นที่ขาย |
| Manager authorization scope | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้จำกัดให้แสดงข้อมูลเฉพาะสาขาที่ manager มีสิทธิ์เข้าถึงตาม NFR-SEC-06 |

## 3. โมเดลข้อมูล

| Entity | ฟิลด์หลัก | รองรับ FR / NFR |
|---|---|---|
| BranchReportRequest | `branch_id`, `start_date`, `end_date`, `manager_id` | รองรับ FR-51, FR-55, AC-REPORT-02, AC-REPORT-06, AC-REPORT-08 |
| SalesSummary | `branch_id`, `period_start`, `period_end`, `total_sales`, `completed_order_count`, `generated_at` | รองรับ FR-52, FR-53, FR-56, AC-REPORT-03, AC-REPORT-04, AC-REPORT-07 |
| TopSellingMenu | `menu_id`, `menu_name`, `quantity_sold`, `rank` | รองรับ FR-54, AC-REPORT-05 |
| Order | `order_id`, `branch_id`, `user_id`, `status`, `payment_status`, `created_at`, `completed_at` | รองรับ FR-52, FR-53, NFR-ACC-01, AC-REPORT-03, AC-REPORT-04, AC-REPORT-07, AC-REPORT-12 |
| ReportResult | `summary`, `top_selling_menu[]`, `status`, `warning_message` | รองรับ Exception Flow 4a, 4b, AC-REPORT-09, AC-REPORT-10 |

หมายเหตุโมเดลข้อมูล:
- `payment_status` จะต้องเป็น “success” เท่านั้นเพื่อให้ยอดขายและจำนวน Order คำนวณจาก Order ที่ชำระเงินสำเร็จตาม Constraints
- `TopSellingMenu` จะเรียงลำดับจากจำนวนชิ้นที่ขายมากที่สุดก่อน ตาม FR-54 และ ASM-07
- จะไม่มีฟิลด์ใน report model สำหรับข้อมูลลูกค้า, การชำระเงินรายละเอียด, หรือบัญชีภาษี เนื่องจาก Out of scope
- `ReportResult.warning_message` ถูกใช้สำหรับข้อความเตือนสากลเมื่อประมวลผลผิดพลาดตาม Exception Flow 4b

## 4. API / หน้าจอ

- `GET /api/reports/sales` — Input: `branch_id`, `start_date`, `end_date`, authenticated manager; Output: sales summary, completed order count, top-selling menu — รองรับ FR-50, FR-51, FR-52, FR-53, FR-54, AC-REPORT-01, AC-REPORT-02, AC-REPORT-03, AC-REPORT-04, AC-REPORT-05
- `POST /api/reports/sales/refresh` — Input: `branch_id`, `start_date`, `end_date`; Output: recalculated report for new filters — รองรับ FR-55, Alternative Flow 3a, AC-REPORT-06, AC-REPORT-08
- `GET /reports/sales` — Output: หน้ารายงานยอดขายและสถิติ พร้อม selector ของสาขาและช่วงวันที่, plus empty state/warning — รองรับ FR-50, FR-51, Exception Flow 4a, 4b, AC-REPORT-01, AC-REPORT-09, AC-REPORT-10
- `GET /api/reports/sales/export` — Output: data payload ที่ใช้ซ้ำใน UI / future export (ถ้าทำต่อ) — ไม่จำเป็นโดย spec แต่เป็น extension ไม่ได้สร้างตาม scope

## 5. ตารางตรวจ Constraints

| Constraint ID | ถูกนำไปใช้ที่ไหนใน plan | สถานะ |
|---|---|---|
| ผู้ใช้งานต้องเข้าสู่ระบบและมีสิทธิ์เป็น Manager ของสาขานั้นก่อนเข้าถึงรายงาน | ใช้ใน auth guard สำหรับทุก API / page ของ report | ใช้แล้ว |
| ระบบต้องคำนวณรายงานจากข้อมูล Order และยอดขายที่มีอยู่ในระบบ | ใช้ใน report aggregation logic จาก `Order` และ `SalesSummary` | ใช้แล้ว |
| ช่วงเวลาที่เลือกต้องเป็นช่วงวันที่ที่ถูกต้อง และค่าเริ่มต้นของช่วงวันที่คือ 7 วันที่ผ่านมา | ใช้ใน form validation และ default query สำหรับ date range | ใช้แล้ว |
| Manager สามารถดูข้อมูลได้เฉพาะข้อมูลในสาขาที่ตนเองมีสิทธิ์เข้าถึง | ใช้ใน `branch_id` scope check และ query filter | ใช้แล้ว |
| ยอดขายรวมและจำนวน Order คำนวณจาก Order ที่ชำระเงินสำเร็จเท่านั้น | ใช้ใน report query: `payment_status = success` และ `status = completed/success` | ใช้แล้ว |
| เมนูขายดีจัดอันดับจากจำนวนชิ้นที่ขายในช่วงเวลาที่เลือก | ใช้ใน `TopSellingMenu` aggregation และ sort by `quantity_sold DESC` | ใช้แล้ว |
| หากไม่มีข้อมูลในช่วงเวลาที่เลือก ระบบต้องแสดงข้อความว่าไม่มีข้อมูลสำหรับช่วงเวลานั้น และไม่แสดงตัวเลขใด ๆ | ใช้ใน empty state logic `ReportResult.status = empty` | ใช้แล้ว |
| หากระบบไม่สามารถประมวลผลรายงานได้ ระบบต้องแสดงข้อความเตือนแบบสากล และไม่แสดงข้อมูลรายงานที่ไม่สมบูรณ์ | ใช้ใน error state logic และ warning message | ใช้แล้ว |
| การคำนวณยอดขายและจำนวน Order ต้องสอดคล้องกับข้อมูลที่บันทึกในระบบ | ใช้ใน aggregation logic และ validation ที่คาดว่า matching persisted data | ใช้แล้ว |
| รายงานยอดขายควรแสดงผลภายใน 5 วินาทีสำหรับข้อมูลปกติ | ใช้ใน performance requirements สำหรับ query/report rendering | ใช้แล้ว |

## 6. แผนทดสอบจาก Acceptance Criteria

| AC ID | ชื่อ test | ทดสอบอย่างไร |
|---|---|---|
| AC-REPORT-01 | `test_AC_REPORT_01_manager_can_open_sales_report` | login เป็น manager แล้วเปิดหน้ารายงาน ตรวจสอบว่าระบบแสดงหน้า report อย่างถูกต้อง |
| AC-REPORT-02 | `test_AC_REPORT_02_filter_by_branch_and_date` | เลือกสาขาและช่วงวันที่เริ่ม/สิ้นสุด หรือใช้ default 7 วันที่ผ่านมา แล้วตรวจสอบว่าระบบรับค่าและใช้ในการคำนวณ |
| AC-REPORT-03 | `test_AC_REPORT_03_show_total_sales` | กำหนดข้อมูล Order ที่ชำระเงินสำเร็จในช่วงเวลาที่เลือก แล้วตรวจสอบว่าระบบแสดงยอดขายรวมถูกต้อง |
| AC-REPORT-04 | `test_AC_REPORT_04_show_completed_order_count` | เปิดรายงานในช่วงเวลาที่มี Order สำเร็จ แล้วตรวจสอบว่าจำนวน Order แสดงถูกต้อง |
| AC-REPORT-05 | `test_AC_REPORT_05_show_top_selling_menu` | เปิดรายงานที่มีข้อมูลการขายหลายเมนู แล้วตรวจสอบว่าเมนูขายดีแสดงตามจำนวนชิ้นที่ขายลดลง |
| AC-REPORT-06 | `test_AC_REPORT_06_recalculate_on_filter_change` | เปลี่ยนสาขา หรือช่วงวันที่แล้วตรวจสอบว่าระบบคำนวณและแสดงรายงานใหม่ตามเงื่อนไขใหม่ |
| AC-REPORT-07 | `test_AC_REPORT_07_report_matches_saved_data` | เปรียบเทียบผล report กับข้อมูล Order ที่บันทึกในระบบ ตรวจสอบว่าค่าที่แสดงสอดคล้องกัน |
| AC-REPORT-08 | `test_AC_REPORT_08_refresh_report_after_filter_change` | เปลี่ยนสาขา/ช่วงเวลาแล้วตรวจสอบว่า report refresh ตามสาขาและช่วงเวลาใหม่ |
| AC-REPORT-09 | `test_AC_REPORT_09_empty_data_message` | เลือกช่วงเวลาที่ไม่มี Order หรือยอดขาย แล้วตรวจสอบว่าแสดงข้อความว่าไม่มีข้อมูลสำหรับช่วงเวลานั้น และไม่แสดงตัวเลข |
| AC-REPORT-10 | `test_AC_REPORT_10_global_warning_when_report_fails` | จำลองระบบประมวลผล report ล้มเหลว แล้วตรวจสอบว่าส่ง warning แบบสากลและไม่แสดง data ที่ไม่สมบูรณ์ |
| AC-REPORT-11 | `test_AC_REPORT_11_manager_scope_restriction` | login เป็น manager ของสาขา A แล้วพยายามเข้าถึงสาขา B ตรวจสอบว่าระบบปฏิเสธ |
| AC-REPORT-12 | `test_AC_REPORT_12_performance_and_accuracy` | เปิดรายงานด้วยข้อมูลปกติแล้ววัดว่า response ภายใน 5 วินาที และผลลัพธ์สอดคล้องกับ persisted data |

## 7. ลำดับงาน

1. กำหนด schema สำหรับ `BranchReportRequest`, `SalesSummary`, `TopSellingMenu`, และ `ReportResult` ตาม FR-50 ถึง FR-56 และ NFR-ACC-01
2. สร้างหน้า Manager รายงานยอดขาย พร้อมเลือกสาขาและช่วงวันที่, default 7 วัน, และ state สำหรับ warning / empty data ตาม FR-50, FR-51, Exception Flow 4a, 4b
3. สร้าง API ดึงข้อมูล report โดยกำหนด branch scope และ date range จาก manager identity ตาม FR-51, NFR-SEC-06, AC-REPORT-02, AC-REPORT-11
4. สร้าง aggregation logic สำหรับยอดขายรวมและจำนวน Order เฉพาะ Order ที่ชำระเงินสำเร็จตาม FR-52, FR-53, NFR-ACC-01, AC-REPORT-03, AC-REPORT-04, AC-REPORT-07, AC-REPORT-12
5. สร้าง aggregation logic สำหรับเมนูขายดีจากจำนวนชิ้นที่ขายตาม FR-54 และ AC-REPORT-05
6. สร้าง refresh logic เมื่อเปลี่ยนสาขา/ช่วงเวลาให้คำนวณ report ใหม่ตามเงื่อนไขใหม่ และไม่แสดงข้อมูลที่ไม่สมบูรณ์ตาม FR-55, Alternative Flow 3a, AC-REPORT-06, AC-REPORT-08
7. ทดสอบ end-to-end สำหรับทุก Acceptance Criteria รวมถึง empty state, warning, security restriction, และ performance

## 8. สิ่งที่ยังไม่ทำ

- ไม่มี Open Questions ใน spec.md ปัจจุบัน
  - ส่วนที่เกี่ยวข้องกับข้อนี้จะยังไม่สร้างจนกว่าจะได้คำตอบ

---

สรุป: แผนงานนี้จะสร้างหน้าและ API สำหรับ Manager ดูรายงานยอดขายและสถิติแบบ end-to-end โดยยึด FR, NFR, Constraints และ AC ของ spec อย่างเคร่งครัด พร้อมทั้งคำนวณจากข้อมูลที่ถูกต้องและไม่แสดงข้อมูลที่ไม่สมบูรณ์
