# แผนงานสำหรับ Feature: สมัครสมาชิก / เข้าสู่ระบบ (Register & Login)

## 1. สรุปแนวทาง
- ฟีเจอร์นี้จะสร้างหน้าเดียวสำหรับลูกค้าในการสมัครสมาชิกและเข้าสู่ระบบ โดยมีฟอร์ม login ด้านบนและปุ่มสมัครสมาชิกด้านล่าง ตาม FR-02 และ NFR-USE-01
- ระบบจะตรวจสอบข้อมูล Email หรือเบอร์โทรศัพท์ + รหัสผ่าน ก่อนสร้างบัญชีหรืออนุญาตให้เข้าสู่ระบบ ตาม FR-01, FR-03, FR-04
- ระบบจะเก็บข้อมูลบัญชีพื้นฐานและตรวจสอบข้อมูลซ้ำก่อนยอมให้สมัครใหม่ เพื่อป้องกันการสร้างบัญชีซ้ำตาม FR-01, FR-02, FR-04
- ระบบจะมีทางเลือกเชื่อมต่อ LINE แบบไม่บังคับ โดยบันทึก LINE User ID เมื่อสำเร็จ และให้ผู้ใช้ข้ามได้ตาม FR-05, FR-06 และ Alternative Flow 7a/7b
- กลุ่มงานจะออกแบบแบบฟอร์มหน้าเว็บ, API สำหรับ auth, validation และ guard สิทธิ์รองรับการเข้าถึงข้อมูลบัญชีพื้นฐาน ตาม NFR-SEC-01 และ Acceptance Criteria AC-ACCOUNT-01 ถึง AC-ACCOUNT-06

## 2. เทคโนโลยีที่ใช้

| สิ่งที่เลือก | มาจาก | หมายเหตุ |
|---|---|---|
| React (Vite) สำหรับหน้าเว็บ | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้สร้างหน้าเดียวสำหรับ login/signup และ flow การเชื่อมต่อ LINE |
| Python FastAPI สำหรับ API แก้ไขบัญชีและเข้าสู่ระบบ | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้จัดการ validation, duplicate check, token/session, และ LINE linkage |
| ฐานข้อมูลเชิงสัมพันธ์ (เช่น PostgreSQL) | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้เก็บบัญชีผู้ใช้และ mapping ระหว่างบัญชีกับ LINE User ID |
| JWT หรือ session-based auth | ทีมเลือกเอง ไม่ได้มาจาก spec | ใช้หลัง login เพื่อป้องกันการเข้าถึงข้อมูลบัญชีพื้นฐานที่ต้องมีสิทธิ์ |
| LINE OAuth / LINE Login หรือ callback webhook แบบทีมกำหนด | ทีมเลือกเอง ไม่ได้มาจาก spec | ต้องรอคำตอบ Open Questions ก่อนตัดสินใจรูปแบบจริง |

## 3. โมเดลข้อมูล

| Entity | ฟิลด์หลัก | รองรับ FR / NFR |
|---|---|---|
| Account | `account_id`, `email`, `phone_number`, `password_hash`, `is_verified`, `created_at`, `updated_at` | รองรับ FR-01, FR-02, FR-03, FR-04, NFR-SEC-01 |
| AccountLinkLine | `account_id`, `line_user_id`, `connected_at`, `status` | รองรับ FR-05, FR-06, Alternative Flow 7a, Exception Flow 7c, NFR-REL-01 |
| AuthSession | `session_id`, `account_id`, `issued_at`, `expires_at` | รองรับ FR-03, NFR-SEC-01 |

หมายเหตุโมเดลข้อมูล:
- ผู้ใช้สามารถกรอก Email หรือเบอร์โทรศัพท์อย่างน้อยหนึ่งช่อง โดยไม่จำเป็นต้องกรอกทั้งคู่ ตาม Constraint ใน spec
- ระบบจะเก็บ hash ของ password เท่านั้น และไม่เก็บ Password ของบัญชี LINE ตาม Constraint
- `line_user_id` จะเป็นค่าว่างหรือ null จนกว่าจะเชื่อมต่อ LINE สำเร็จ ตาม FR-05, FR-06 และ Exception Flow 7c
- ข้อมูลส่วนบุคคลที่เกี่ยวกับบัญชี เช่น ชื่อ อีเมล เบอร์โทรศัพท์ จะเข้าถึงได้เฉพาะหลัง login ตาม NFR-SEC-01

## 4. API / หน้าจอ

- `GET /auth` — แสดงหน้า login/signup เดียวกัน พร้อมฟอร์ม login ด้านบนและปุ่มสมัครสมาชิกด้านล่าง — รองรับ FR-02, NFR-USE-01
- `POST /api/auth/register` — Input: `email?`, `phone_number?`, `password`; Output: created account / validation error / duplicate error — รองรับ FR-01, FR-02, FR-04, AC-ACCOUNT-01
- `POST /api/auth/login` — Input: `email_or_phone`, `password`; Output: session token หรือ redirect หลัง login สำเร็จ / error message — รองรับ FR-03, FR-04, AC-ACCOUNT-02, AC-ACCOUNT-03
- `POST /api/auth/line/connect` — Input: `account_id`, `line_user_id`; Output: success/failure result และไม่บันทึกเมื่อล้มเหลว — รองรับ FR-05, FR-06, Alternative Flow 7a, AC-ACCOUNT-04, AC-ACCOUNT-06
- `POST /api/auth/line/skip` — Input: `account_id`; Output: continue without line connection — รองรับ Alternative Flow 7b, AC-ACCOUNT-05
- `GET /api/account/profile` หรือ protected endpoint — Output: ข้อมูลบัญชีพื้นฐานหลัง login เท่านั้น — รองรับ NFR-SEC-01

## 5. ตารางตรวจ Constraints

| Constraint ID | ถูกนำไปใช้ที่ไหนใน plan | สถานะ |
|---|---|---|
| ไม่ระบุ ID ใน spec — ลูกค้าต้องสามารถเข้าถึงหน้าสมัครสมาชิกหรือเข้าสู่ระบบได้ | ใช้ในหน้าจอ `GET /auth` และ flow ของ login/register ในหน้าเดียว | ใช้แล้ว |
| ไม่ระบุ ID ใน spec — Email หรือเบอร์โทรศัพท์ต้องไม่ซ้ำกับบัญชีที่มีอยู่ในระบบ | ใช้ใน validation ของ `POST /api/auth/register` และ duplicate-check logic | ใช้แล้ว |
| ไม่ระบุ ID ใน spec — ผู้ใช้สามารถกรอก Email หรือเบอร์โทรศัพท์อย่างน้อยหนึ่งช่อง โดยไม่จำเป็นต้องกรอกทั้งคู่ | ใช้ใน validation สำหรับ input ของ register/login และ error handling | ใช้แล้ว |
| ไม่ระบุ ID ใน spec — Password ต้องเป็นไปตามเงื่อนไขที่ระบบกำหนด โดยข้อมูลที่ไม่ว่างถือว่าเป็นข้อมูลที่ถูกต้องสำหรับการเข้าสู่ระบบ | ใช้ใน register/login validator และ message “กรุณากรอกข้อมูลให้ถูกต้อง” | ใช้แล้ว |
| ไม่ระบุ ID ใน spec — การเชื่อมต่อ LINE เป็นทางเลือก ไม่บังคับต่อการสมัครสมาชิกหรือเข้าสู่ระบบ | ใช้ใน `POST /api/auth/line/connect` และ `POST /api/auth/line/skip` | ใช้แล้ว |
| ไม่ระบุ ID ใน spec — ระบบต้องไม่จัดเก็บ Password ของบัญชี LINE | ใช้ใน model `AccountLinkLine` ให้มีเฉพาะ `line_user_id` และไม่มี password field | ใช้แล้ว |
| ไม่ระบุ ID ใน spec — ระบบต้องสามารถเชื่อมโยง LINE User ID กับบัญชีลูกค้าได้อย่างถูกต้อง | ใช้ใน `AccountLinkLine` และ API connect flow พร้อมตรวจสอบ account_id + line_user_id | ใช้แล้ว |
| ไม่ระบุ ID ใน spec — ข้อมูลส่วนบุคคลที่เกี่ยวกับบัญชี เช่น ชื่อ อีเมล เบอร์โทรศัพท์ ต้องมีการ login ก่อนถึงจะเข้าถึงได้ | ใช้ใน protected endpoint และ auth guard สำหรับ `/api/account/profile` | ใช้แล้ว |

## 6. แผนทดสอบจาก Acceptance Criteria

| AC ID | ชื่อ test | ทดสอบอย่างไร |
|---|---|---|
| AC-ACCOUNT-01 | `test_AC_ACCOUNT_01_register_success` | โจมตี API `POST /api/auth/register` ด้วย email/phone + password ที่ถูกต้อง แล้วตรวจว่าควรสร้างบัญชีและคืน session/token ให้ผู้ใช้เข้าสู่ระบบได้ |
| AC-ACCOUNT-02 | `test_AC_ACCOUNT_02_login_success` | เข้าสู่ระบบด้วยบัญชีที่มีอยู่และข้อมูลถูกต้อง แล้วตรวจว่าระบบอนุญาต login ได้ |
| AC-ACCOUNT-03 | `test_AC_ACCOUNT_03_login_invalid_input` | ส่งข้อมูล login ที่ไม่ถูกต้องหรือว่าง แล้วตรวจว่าระบบปฏิเสธและแสดงข้อความ “กรุณากรอกข้อมูลให้ถูกต้อง” |
| AC-ACCOUNT-04 | `test_AC_ACCOUNT_04_line_connect_success` | เลือกเชื่อมต่อ LINE ให้ callback สำเร็จ แล้วตรวจว่ามีการบันทึก `line_user_id` ผูกกับบัญชีที่ login อยู่ |
| AC-ACCOUNT-05 | `test_AC_ACCOUNT_05_skip_line_connection` | เลือกข้ามขั้นตอน LINE แล้วตรวจว่าระบบให้ใช้งานต่อได้ตามปกติ โดยไม่ติดการเชื่อมต่อ |
| AC-ACCOUNT-06 | `test_AC_ACCOUNT_06_line_connect_failure` | จำลอง LINE connect ล้มเหลว แล้วตรวจว่าระบบไม่บันทึก `line_user_id` และผู้ใช้ยังคงใช้งานได้ต่อ |

## 7. ลำดับงาน

1. วิเคราะห์และกำหนดรูปแบบ validation สำหรับ Email/เบอร์โทรศัพท์/รหัสผ่าน และการตรวจข้อมูลซ้ำ ตาม FR-01, FR-03, FR-04
2. สร้างหน้า login/signup แบบหน้าเดียว พร้อมฟอร์มและข้อความแจ้งเตือนตาม FR-02 และ NFR-USE-01
3. สร้าง API สมัครสมาชิกและตรวจสอบ duplicate check ตาม FR-01, FR-02, AC-ACCOUNT-01
4. สร้าง API เข้าสู่ระบบ พร้อม error handling และ session/token ตาม FR-03, FR-04, AC-ACCOUNT-02, AC-ACCOUNT-03
5. เพิ่ม auth guard และ protected resource สำหรับข้อมูลบัญชีพื้นฐาน ตาม NFR-SEC-01
6. สร้าง flow เชื่อมต่อ LINE แบบ optional และ skip flow ตาม FR-05, FR-06, Alternative Flow 7a/7b, AC-ACCOUNT-04, AC-ACCOUNT-05, AC-ACCOUNT-06
7. ทดสอบ end-to-end กับทุก Acceptance Criteria และตรวจความสอดคล้องกับ Open Questions โดยไม่สร้างฟังก์ชันนอก scope

## 8. สิ่งที่ยังไม่ทำ

- ระบบจะใช้ LINE Login หรือวิธีการเชื่อมบัญชี LINE รูปแบบใด
  - ส่วนที่เกี่ยวข้องกับข้อนี้จะยังไม่สร้างจนกว่าจะได้คำตอบ
- ลูกค้าสามารถยกเลิกการเชื่อมต่อ LINE ภายหลังได้หรือไม่
  - ส่วนที่เกี่ยวข้องกับข้อนี้จะยังไม่สร้างจนกว่าจะได้คำตอบ
- หากลูกค้าเปลี่ยนบัญชี LINE จะต้องดำเนินการเชื่อมต่อใหม่อย่างไร
  - ส่วนที่เกี่ยวข้องกับข้อนี้จะยังไม่สร้างจนกว่าจะได้คำตอบ

---

สรุป: แผนงานนี้จะสร้างระบบสมัคร/เข้าสู่ระบบแบบหน้าเดียว, validation และ duplicate-check สำหรับบัญชี, auth guard สำหรับข้อมูลส่วนบุคคล, และ flow เชื่อมต่อ LINE แบบเสริมที่ไม่กระทบต่อการสมัครหรือ login หลัก ตาม spec.md โดยไม่มีการขยาย scope เกินที่กำหนดไว้
