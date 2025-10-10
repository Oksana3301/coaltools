# 📚 CoalTools API Documentation

## 🎯 Overview
Dokumentasi lengkap untuk semua API endpoints CoalTools, termasuk request/response format, error handling, dan contoh penggunaan.

## 🔗 Base URL
```
Development: http://localhost:3000/api
Staging: https://staging.coaltools.com/api
Production: https://coaltools.com/api
```

## 🔐 Authentication

### Bearer Token Authentication
```http
Authorization: Bearer <your-jwt-token>
```

### API Key Authentication (untuk integrations)
```http
X-API-Key: <your-api-key>
```

## 📋 Standard Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation completed successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 👥 Employee Management API

### 1. Create Employee

**Endpoint**: `POST /api/employees`

**Description**: Membuat karyawan baru dalam sistem

**Request Body**:
```json
{
  "nama": "John Doe",
  "nik": "1234567890123456",
  "email": "john.doe@company.com",
  "telepon": "+6281234567890",
  "alamat": "Jl. Sudirman No. 123, Jakarta",
  "tanggalLahir": "1990-05-15",
  "jenisKelamin": "L",
  "agama": "Islam",
  "statusPernikahan": "Menikah",
  "pendidikanTerakhir": "S1",
  "posisi": "Software Engineer",
  "departemen": "IT",
  "tanggalMasuk": "2024-01-15",
  "statusKaryawan": "Tetap",
  "kontrakUpahHarian": 500000,
  "aktif": true
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "clr1234567890",
    "nama": "John Doe",
    "nik": "1234567890123456",
    "email": "john.doe@company.com",
    "telepon": "+6281234567890",
    "alamat": "Jl. Sudirman No. 123, Jakarta",
    "tanggalLahir": "1990-05-15T00:00:00Z",
    "jenisKelamin": "L",
    "agama": "Islam",
    "statusPernikahan": "Menikah",
    "pendidikanTerakhir": "S1",
    "posisi": "Software Engineer",
    "departemen": "IT",
    "tanggalMasuk": "2024-01-15T00:00:00Z",
    "statusKaryawan": "Tetap",
    "kontrakUpahHarian": 500000,
    "aktif": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "message": "Karyawan berhasil dibuat",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid input data
- `409 Conflict`: NIK already exists
- `422 Unprocessable Entity`: Validation errors

**Example cURL**:
```bash
curl -X POST http://localhost:3000/api/employees \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "nama": "John Doe",
    "nik": "1234567890123456",
    "email": "john.doe@company.com",
    "posisi": "Software Engineer",
    "departemen": "IT"
  }'
```

### 2. Get All Employees

**Endpoint**: `GET /api/employees`

**Description**: Mengambil daftar semua karyawan dengan pagination dan filtering

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `search` (optional): Search by name, NIK, or email
- `departemen` (optional): Filter by department
- `aktif` (optional): Filter by active status (true/false)
- `sortBy` (optional): Sort field (nama, tanggalMasuk, etc.)
- `sortOrder` (optional): Sort order (asc/desc)

**Example Request**:
```http
GET /api/employees?page=1&limit=20&search=john&departemen=IT&aktif=true&sortBy=nama&sortOrder=asc
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "employees": [
      {
        "id": "clr1234567890",
        "nama": "John Doe",
        "nik": "1234567890123456",
        "email": "john.doe@company.com",
        "posisi": "Software Engineer",
        "departemen": "IT",
        "aktif": true,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  },
  "message": "Data karyawan berhasil diambil",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 3. Get Employee by ID

**Endpoint**: `GET /api/employees/{id}`

**Description**: Mengambil detail karyawan berdasarkan ID

**Path Parameters**:
- `id`: Employee ID

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "clr1234567890",
    "nama": "John Doe",
    "nik": "1234567890123456",
    "email": "john.doe@company.com",
    "telepon": "+6281234567890",
    "alamat": "Jl. Sudirman No. 123, Jakarta",
    "tanggalLahir": "1990-05-15T00:00:00Z",
    "jenisKelamin": "L",
    "agama": "Islam",
    "statusPernikahan": "Menikah",
    "pendidikanTerakhir": "S1",
    "posisi": "Software Engineer",
    "departemen": "IT",
    "tanggalMasuk": "2024-01-15T00:00:00Z",
    "statusKaryawan": "Tetap",
    "kontrakUpahHarian": 500000,
    "aktif": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "message": "Detail karyawan berhasil diambil",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Error Responses**:
- `404 Not Found`: Employee not found

### 4. Update Employee

**Endpoint**: `PUT /api/employees/{id}`

**Description**: Memperbarui data karyawan

**Path Parameters**:
- `id`: Employee ID

**Request Body** (partial update supported):
```json
{
  "nama": "John Doe Updated",
  "email": "john.doe.updated@company.com",
  "posisi": "Senior Software Engineer",
  "kontrakUpahHarian": 600000
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "clr1234567890",
    "nama": "John Doe Updated",
    "email": "john.doe.updated@company.com",
    "posisi": "Senior Software Engineer",
    "kontrakUpahHarian": 600000,
    "updatedAt": "2024-01-15T11:30:00Z"
  },
  "message": "Data karyawan berhasil diperbarui",
  "timestamp": "2024-01-15T11:30:00Z"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid input data
- `404 Not Found`: Employee not found
- `409 Conflict`: NIK already exists (if updating NIK)

### 5. Delete Employee (Soft Delete)

**Endpoint**: `DELETE /api/employees/{id}`

**Description**: Menonaktifkan karyawan (soft delete)

**Path Parameters**:
- `id`: Employee ID

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "clr1234567890",
    "aktif": false,
    "updatedAt": "2024-01-15T12:30:00Z"
  },
  "message": "Karyawan berhasil dinonaktifkan",
  "timestamp": "2024-01-15T12:30:00Z"
}
```

### 6. Hard Delete Employee (Testing Only)

**Endpoint**: `DELETE /api/employees/{id}/hard`

**Description**: Menghapus karyawan secara permanen (hanya untuk testing)

**⚠️ Warning**: Endpoint ini hanya tersedia di environment testing

**Path Parameters**:
- `id`: Employee ID

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Karyawan berhasil dihapus permanen",
  "timestamp": "2024-01-15T12:30:00Z"
}
```

## 📊 Statistics & Reports API

### 1. Employee Statistics

**Endpoint**: `GET /api/employees/statistics`

**Description**: Mengambil statistik karyawan

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "totalEmployees": 150,
    "activeEmployees": 145,
    "inactiveEmployees": 5,
    "byDepartment": {
      "IT": 25,
      "HR": 10,
      "Finance": 15,
      "Operations": 100
    },
    "byStatus": {
      "Tetap": 120,
      "Kontrak": 25,
      "Magang": 5
    },
    "recentHires": 8,
    "averageAge": 32.5
  },
  "message": "Statistik karyawan berhasil diambil",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🔍 Search API

### 1. Global Search

**Endpoint**: `GET /api/search`

**Description**: Pencarian global di seluruh sistem

**Query Parameters**:
- `q`: Search query (required)
- `type`: Search type (employees, departments, etc.)
- `limit`: Maximum results (default: 10)

**Example Request**:
```http
GET /api/search?q=john&type=employees&limit=5
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "type": "employee",
        "id": "clr1234567890",
        "title": "John Doe",
        "subtitle": "Software Engineer - IT",
        "relevance": 0.95
      }
    ],
    "totalResults": 1,
    "searchTime": "0.05s"
  },
  "message": "Pencarian berhasil",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🏥 Health Check API

### 1. Application Health

**Endpoint**: `GET /api/health`

**Description**: Memeriksa status kesehatan aplikasi

**Response** (200 OK):
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "database": "connected",
  "redis": "connected",
  "uptime": 86400,
  "memory": {
    "rss": 52428800,
    "heapTotal": 29360128,
    "heapUsed": 20537896,
    "external": 1089775
  },
  "version": "1.0.0"
}
```

**Response** (503 Service Unavailable) - when unhealthy:
```json
{
  "status": "unhealthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "error": "Database connection failed"
}
```

## 📝 Audit Log API

### 1. Get Audit Logs

**Endpoint**: `GET /api/audit-logs`

**Description**: Mengambil log audit sistem

**Query Parameters**:
- `page`: Page number
- `limit`: Items per page
- `userId`: Filter by user ID
- `action`: Filter by action type
- `startDate`: Start date filter
- `endDate`: End date filter

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "log123",
        "userId": "user456",
        "action": "CREATE_EMPLOYEE",
        "resource": "employees",
        "resourceId": "clr1234567890",
        "details": {
          "employeeName": "John Doe",
          "department": "IT"
        },
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0...",
        "timestamp": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 10,
      "totalItems": 100
    }
  },
  "message": "Log audit berhasil diambil",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## ❌ Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `UNPROCESSABLE_ENTITY` | 422 | Validation errors |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

## 🔒 Security Headers

Semua API responses menyertakan security headers berikut:

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
```

## 📊 Rate Limiting

- **General API**: 100 requests per minute per IP
- **Authentication**: 5 requests per minute per IP
- **Search API**: 50 requests per minute per user
- **File Upload**: 10 requests per minute per user

## 📝 Request/Response Examples

### JavaScript/TypeScript

```typescript
// Create employee
const createEmployee = async (employeeData: CreateEmployeeRequest) => {
  const response = await fetch('/api/employees', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(employeeData)
  })
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  return await response.json()
}

// Get employees with pagination
const getEmployees = async (page = 1, limit = 10) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  })
  
  const response = await fetch(`/api/employees?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  
  return await response.json()
}
```

### Python

```python
import requests

class CoalToolsAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def create_employee(self, employee_data):
        response = requests.post(
            f'{self.base_url}/employees',
            json=employee_data,
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
    
    def get_employees(self, page=1, limit=10):
        params = {'page': page, 'limit': limit}
        response = requests.get(
            f'{self.base_url}/employees',
            params=params,
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()
```

## 🧪 Testing

### Postman Collection

Import collection dari: `/docs/postman/CoalTools-API.postman_collection.json`

### Environment Variables

```json
{
  "development": {
    "base_url": "http://localhost:3000/api",
    "token": "your-dev-token"
  },
  "staging": {
    "base_url": "https://staging.coaltools.com/api",
    "token": "your-staging-token"
  },
  "production": {
    "base_url": "https://coaltools.com/api",
    "token": "your-prod-token"
  }
}
```

## 📞 Support

- **API Documentation**: https://docs.coaltools.com/api
- **Support Email**: api-support@coaltools.com
- **GitHub Issues**: https://github.com/coaltools/coaltools/issues
- **Slack Channel**: #api-support

---

**📝 Note**: Dokumentasi ini akan diupdate secara otomatis setiap kali ada perubahan API. Pastikan selalu menggunakan versi terbaru.

**🔄 Last Updated**: $(date +%Y-%m-%d)
**📧 Contact**: api@coaltools.com