# 📚 API Documentation - CoalTools

## 🔗 Base URL
```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## 🔐 Authentication

Semua endpoint yang memerlukan autentikasi menggunakan session-based authentication melalui NextAuth.js.

### Login
```http
POST /api/auth/signin
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}
```

### Logout
```http
POST /api/auth/signout
```

## 🏥 Health Check

### Get System Health
```http
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2024-12-01T10:00:00.000Z",
  "environment": "development",
  "database": {
    "available": true,
    "status": "connected",
    "error": null,
    "url_configured": true
  },
  "message": "Health check completed"
}
```

## 👥 Users Management

### Get All Users
```http
GET /api/users
Authorization: Required (ADMIN)
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "user-123",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "ADMIN",
      "aktif": true,
      "created_at": "2024-12-01T10:00:00.000Z"
    }
  ]
}
```

### Create User
```http
POST /api/users
Content-Type: application/json
Authorization: Required (ADMIN)

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123",
  "role": "STAFF"
}
```

### Update User
```http
PUT /api/users/[id]
Content-Type: application/json
Authorization: Required (ADMIN)

{
  "name": "Jane Smith",
  "role": "MANAGER",
  "aktif": true
}
```

### Delete User
```http
DELETE /api/users/[id]
Authorization: Required (ADMIN)
```

## 👷 Employee Management

### Get All Employees
```http
GET /api/employees
Authorization: Required

# Query Parameters:
# - page: number (default: 1)
# - limit: number (default: 100)
# - search: string
# - site: string
# - aktif: boolean
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "emp-123",
      "nama": "John Worker",
      "nik": "EMP001",
      "jabatan": "Operator",
      "site": "Site A",
      "tempatLahir": "Jakarta",
      "tanggalLahir": "1990-01-01",
      "alamat": "Jl. Contoh No. 123",
      "kontrakUpahHarian": 150000,
      "defaultUangMakan": 25000,
      "defaultUangBbm": 15000,
      "bankName": "BCA",
      "bankAccount": "1234567890",
      "noRekening": "1234567890",
      "npwp": "12.345.678.9-012.345",
      "startDate": "2024-01-01",
      "aktif": true,
      "created_at": "2024-12-01T10:00:00.000Z",
      "updated_at": "2024-12-01T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 150,
    "totalPages": 2
  }
}
```

### Get Employee by ID
```http
GET /api/employees/[id]
Authorization: Required
```

### Create Employee
```http
POST /api/employees
Content-Type: application/json
Authorization: Required

{
  "nama": "John Worker",
  "nik": "EMP001",
  "jabatan": "Operator",
  "site": "Site A",
  "tempatLahir": "Jakarta",
  "tanggalLahir": "1990-01-01",
  "alamat": "Jl. Contoh No. 123",
  "kontrakUpahHarian": 150000,
  "defaultUangMakan": 25000,
  "defaultUangBbm": 15000,
  "bankName": "BCA",
  "bankAccount": "1234567890",
  "noRekening": "1234567890",
  "npwp": "12.345.678.9-012.345",
  "startDate": "2024-01-01"
}
```

### Update Employee
```http
PUT /api/employees/[id]
Content-Type: application/json
Authorization: Required

{
  "nama": "John Worker Updated",
  "jabatan": "Senior Operator",
  "kontrakUpahHarian": 175000
}
```

### Soft Delete Employee
```http
DELETE /api/employees/[id]
Authorization: Required
```

### Hard Delete Employee
```http
DELETE /api/employees/[id]?hard=true
Authorization: Required (ADMIN)
```

## 💰 Payroll Management

### Get Payroll Data
```http
GET /api/payroll
Authorization: Required

# Query Parameters:
# - month: number (1-12)
# - year: number
# - employeeId: string
# - site: string
```

### Create Payroll Entry
```http
POST /api/payroll
Content-Type: application/json
Authorization: Required

{
  "employeeId": "emp-123",
  "month": 12,
  "year": 2024,
  "hariKerja": 22,
  "jamKerja": 176,
  "jamLembur": 8,
  "uangMakan": 550000,
  "uangBbm": 330000,
  "bonus": 100000,
  "potongan": 50000
}
```

### Generate Payroll Report
```http
POST /api/payroll/generate-report
Content-Type: application/json
Authorization: Required

{
  "month": 12,
  "year": 2024,
  "site": "Site A",
  "format": "pdf" // or "excel"
}
```

## 📊 Production Reports

### Get Production Reports
```http
GET /api/production-reports
Authorization: Required

# Query Parameters:
# - startDate: string (YYYY-MM-DD)
# - endDate: string (YYYY-MM-DD)
# - site: string
# - shift: string
```

### Create Production Report
```http
POST /api/production-reports
Content-Type: application/json
Authorization: Required

{
  "tanggal": "2024-12-01",
  "site": "Site A",
  "shift": "Pagi",
  "targetProduksi": 1000,
  "realisasiProduksi": 950,
  "kualitasA": 800,
  "kualitasB": 150,
  "reject": 0,
  "downtime": 30,
  "keterangan": "Produksi normal"
}
```

## 💳 Pay Components

### Get Pay Components
```http
GET /api/pay-components
Authorization: Required
```

### Create Pay Component
```http
POST /api/pay-components
Content-Type: application/json
Authorization: Required (ADMIN)

{
  "name": "Tunjangan Transport",
  "type": "ALLOWANCE", // ALLOWANCE, DEDUCTION, OVERTIME
  "amount": 50000,
  "isPercentage": false,
  "isActive": true
}
```

## 💰 Kas Besar & Kas Kecil

### Get Kas Besar Transactions
```http
GET /api/kas-besar
Authorization: Required

# Query Parameters:
# - startDate: string (YYYY-MM-DD)
# - endDate: string (YYYY-MM-DD)
# - type: string (INCOME, EXPENSE)
```

### Create Kas Besar Transaction
```http
POST /api/kas-besar
Content-Type: application/json
Authorization: Required

{
  "tanggal": "2024-12-01",
  "keterangan": "Pembelian equipment",
  "type": "EXPENSE",
  "jumlah": 5000000,
  "kategori": "Equipment",
  "bukti": "INV-001"
}
```

### Get Kas Kecil Transactions
```http
GET /api/kas-kecil
Authorization: Required
```

### Create Kas Kecil Transaction
```http
POST /api/kas-kecil
Content-Type: application/json
Authorization: Required

{
  "tanggal": "2024-12-01",
  "keterangan": "Pembelian ATK",
  "type": "EXPENSE",
  "jumlah": 150000,
  "kategori": "Office Supplies"
}
```

## 📄 Invoice & Kwitansi

### Get Invoices
```http
GET /api/invoices
Authorization: Required
```

### Create Invoice
```http
POST /api/invoices
Content-Type: application/json
Authorization: Required

{
  "nomorInvoice": "INV-001",
  "tanggal": "2024-12-01",
  "kepada": "PT. Client",
  "alamat": "Jl. Client No. 123",
  "items": [
    {
      "deskripsi": "Jasa Konsultasi",
      "quantity": 1,
      "harga": 10000000,
      "total": 10000000
    }
  ],
  "subtotal": 10000000,
  "pajak": 1100000,
  "total": 11100000
}
```

### Get Kwitansi
```http
GET /api/kwitansi
Authorization: Required
```

### Create Kwitansi
```http
POST /api/kwitansi
Content-Type: application/json
Authorization: Required

{
  "nomorKwitansi": "KWT-001",
  "tanggal": "2024-12-01",
  "terimaDari": "PT. Client",
  "jumlah": 11100000,
  "terbilang": "Sebelas juta seratus ribu rupiah",
  "untuk": "Pembayaran jasa konsultasi"
}
```

## 🏢 Buyers Management

### Get Buyers
```http
GET /api/buyers
Authorization: Required
```

### Create Buyer
```http
POST /api/buyers
Content-Type: application/json
Authorization: Required

{
  "nama": "PT. Buyer Company",
  "alamat": "Jl. Buyer No. 123",
  "telepon": "021-1234567",
  "email": "buyer@company.com",
  "kontak": "John Buyer",
  "npwp": "12.345.678.9-012.345"
}
```

## ❌ Error Responses

### Standard Error Format
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Specific field error"
  }
}
```

### Common Error Codes
- `UNAUTHORIZED` (401): Authentication required
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `VALIDATION_ERROR` (400): Invalid input data
- `DUPLICATE_ENTRY` (409): Resource already exists
- `INTERNAL_ERROR` (500): Server error

## 📝 Request/Response Examples

### Successful Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "nik": "NIK already exists",
    "email": "Invalid email format"
  }
}
```

### Pagination Response
```json
{
  "success": true,
  "data": [ /* array of items */ ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 250,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## 🔒 Rate Limiting

- **General endpoints**: 100 requests per minute
- **Authentication endpoints**: 10 requests per minute
- **File upload endpoints**: 20 requests per minute

## 📋 Testing

### Test Endpoints
```bash
# Health check
curl http://localhost:3000/api/health

# Get employees (requires auth)
curl -H "Cookie: next-auth.session-token=..." \
     http://localhost:3000/api/employees

# Create employee
curl -X POST \
     -H "Content-Type: application/json" \
     -H "Cookie: next-auth.session-token=..." \
     -d '{"nama":"Test Employee","nik":"TEST001"}' \
     http://localhost:3000/api/employees
```

---

*Dokumentasi ini diperbarui secara berkala. Untuk informasi terbaru, silakan cek repository atau hubungi tim development.*