# Product Requirements Document (PRD)
## CoalTools - Mining Management Platform

---

### Document Information
- **Version**: 1.0
- **Date**: August 30, 2025
- **Last Updated**: August 30, 2025
- **Product Manager**: CoalTools Development Team
- **Status**: Production Ready

---

## 1. Executive Summary

### 1.1 Product Vision
CoalTools is a comprehensive mining management platform designed to streamline coal mining operations through integrated tools for production tracking, financial management, payroll processing, and business document generation. The platform serves as a unified solution for mining companies to manage their end-to-end operations with modern web technologies.

### 1.2 Product Mission
To digitize and optimize coal mining operations by providing an intuitive, scalable, and secure platform that enhances productivity, ensures compliance, and delivers actionable insights for better decision-making.

### 1.3 Success Metrics
- **User Adoption**: 100% active deployment for target mining operations
- **Operational Efficiency**: 40% reduction in manual processing time
- **Data Accuracy**: 99.5% accuracy in payroll and financial calculations
- **User Satisfaction**: 4.5+ star rating from end users
- **System Reliability**: 99.9% uptime with <2 second response times

---

## 2. Target Audience

### 2.1 Primary Users
- **Mining Operations Managers**: Overall operation oversight and reporting
- **HR & Payroll Administrators**: Employee management and salary processing
- **Financial Controllers**: Expense tracking and budget management
- **Production Supervisors**: Daily production monitoring and reporting

### 2.2 Secondary Users
- **Executive Management**: High-level analytics and strategic insights
- **Administrative Staff**: Document generation and basic data entry
- **External Auditors**: Compliance reporting and data verification

### 2.3 User Personas

#### Persona 1: Operations Manager (Primary)
- **Demographics**: 35-50 years old, 10+ years mining experience
- **Goals**: Streamline operations, reduce costs, ensure compliance
- **Pain Points**: Manual processes, scattered data sources, delayed reporting
- **Technical Proficiency**: Moderate to high

#### Persona 2: Payroll Administrator (Primary)
- **Demographics**: 25-40 years old, HR/Finance background
- **Goals**: Accurate payroll processing, compliance with labor laws
- **Pain Points**: Complex payroll calculations, manual receipt generation
- **Technical Proficiency**: Moderate

---

## 3. Product Overview

### 3.1 Core Value Proposition
CoalTools provides a unified platform that eliminates the need for multiple disconnected systems by offering:
- **Integrated Operations Management**: All tools in one platform
- **Automated Calculations**: Reduce human error in financial processes
- **Professional Documentation**: Generate compliant business documents
- **Real-time Analytics**: Data-driven decision making
- **Scalable Architecture**: Grows with business needs

### 3.2 Key Differentiators
1. **Industry-Specific Design**: Built specifically for coal mining operations
2. **Complete Integration**: All modules work seamlessly together
3. **Indonesian Compliance**: Built-in compliance with Indonesian business regulations
4. **Mobile-First Design**: Works on all devices and screen sizes
5. **Enterprise Security**: Role-based access with comprehensive audit trails

---

## 4. Feature Requirements

### 4.1 Authentication & Security System

#### 4.1.1 User Authentication
**Priority**: P0 (Critical)
**Description**: Secure user authentication with role-based access control

**Features**:
- Multi-role authentication (Admin, Manager, Staff, Demo)
- Secure password hashing with bcrypt
- Session management with automatic logout
- Login activity tracking and monitoring
- IP address and user agent logging

**User Stories**:
- As a system administrator, I want to control user access based on roles so that sensitive data is protected
- As a user, I want my login activities to be tracked so that I can monitor account security
- As a manager, I want to see who accessed the system when for audit purposes

**Acceptance Criteria**:
- ✅ Users can log in with email and password
- ✅ Different user roles have appropriate access levels
- ✅ All login attempts are logged with timestamps
- ✅ Sessions expire after inactivity
- ✅ Password requirements are enforced

### 4.2 Coal Tools Management Suite

#### 4.2.1 Payroll Calculator
**Priority**: P0 (Critical)
**Description**: Comprehensive payroll processing system with dynamic components

**Features**:
- Employee management with full profile data
- Dynamic pay components (earnings and deductions)
- Configurable tax and overtime settings
- Automatic payroll calculations
- PDF and Excel export capabilities
- Automatic kwitansi (receipt) generation
- Interactive tutorial system

**User Stories**:
- As a payroll administrator, I want to calculate employee salaries with customizable components
- As an HR manager, I want to export payroll data to PDF and Excel for reporting
- As an employee, I want to receive professional kwitansi for my salary payments

**Acceptance Criteria**:
- ✅ Calculate payroll for multiple employees simultaneously
- ✅ Support for manual tax and overtime configuration
- ✅ Generate professional PDF reports
- ✅ Export detailed Excel files for analysis
- ✅ Automatically create kwitansi for each employee
- ✅ Interactive tutorial for new users

#### 4.2.2 Employee Management
**Priority**: P0 (Critical)
**Description**: Complete employee database with comprehensive profiles

**Features**:
- Full employee profiles with personal and financial data
- Bank account information management
- Active/inactive status tracking
- Site-based employee organization
- Contract and salary information

**User Stories**:
- As an HR manager, I want to maintain complete employee records including bank details
- As a payroll administrator, I want to access employee salary information for payroll processing
- As a manager, I want to organize employees by site for better management

**Acceptance Criteria**:
- ✅ Store complete employee personal information
- ✅ Manage bank account details for payments
- ✅ Track employee status (active/inactive)
- ✅ Organize employees by work sites
- ✅ Maintain contract and salary information

#### 4.2.3 Kas Besar (Large Cash Management)
**Priority**: P1 (High)
**Description**: Management system for large financial transactions and expenses

**Features**:
- Large transaction recording and tracking
- Vendor management with contact information
- Document attachment support (contracts, receipts)
- Approval workflow system
- Status tracking (Draft, Submitted, Reviewed, Approved, Archived, Rejected)
- Comprehensive reporting and analytics

**User Stories**:
- As a financial controller, I want to track large expenses with proper documentation
- As a manager, I want to approve large transactions before payment
- As an auditor, I want to review all large transactions with supporting documents

**Acceptance Criteria**:
- ✅ Record large transactions with detailed information
- ✅ Attach supporting documents
- ✅ Implement approval workflow
- ✅ Track transaction status throughout lifecycle
- ✅ Generate financial reports

#### 4.2.4 Kas Kecil (Petty Cash Management)
**Priority**: P1 (High)
**Description**: Small expense tracking and petty cash management

**Features**:
- Small expense recording
- Category-based expense classification
- Receipt management
- Monthly summaries and reports
- Budget tracking and alerts

**User Stories**:
- As an administrative staff member, I want to record small daily expenses efficiently
- As a supervisor, I want to monitor petty cash usage and budgets
- As an accountant, I want monthly summaries of all small expenses

**Acceptance Criteria**:
- ✅ Record small expenses with categories
- ✅ Generate monthly expense summaries
- ✅ Track against budgets
- ✅ Provide expense analytics

#### 4.2.5 Production Reporting
**Priority**: P1 (High)
**Description**: Coal production tracking and reporting system

**Features**:
- Daily production data entry
- Vehicle and shipment tracking
- Buyer management integration
- Weight measurements (gross, tare, netto)
- Excel import/export capabilities
- Production analytics and trends

**User Stories**:
- As a production supervisor, I want to record daily coal production data
- As an operations manager, I want to track production trends and performance
- As a sales manager, I want to link production data with buyer information

**Acceptance Criteria**:
- ✅ Record daily production with vehicle details
- ✅ Calculate net weight automatically
- ✅ Link production data with buyers
- ✅ Import/export data via Excel
- ✅ Generate production reports and analytics

### 4.3 Business Tools Suite

#### 4.3.1 Invoice Generator
**Priority**: P0 (Critical)
**Description**: Professional invoice creation and management system

**Features**:
- Multi-item invoice creation
- Customer/vendor management
- Tax and discount calculations
- Professional PDF generation
- Invoice tracking and history
- Search and filter capabilities
- Save up to 100 invoices per user

**User Stories**:
- As a sales administrator, I want to create professional invoices for coal sales
- As an accountant, I want to track all invoices and their payment status
- As a business owner, I want professional-looking invoices that represent my company well

**Acceptance Criteria**:
- ✅ Create multi-item invoices with calculations
- ✅ Generate professional PDF invoices
- ✅ Save and manage invoice history
- ✅ Search invoices by various criteria
- ✅ Export invoice data

#### 4.3.2 Kwitansi (Receipt) Generator
**Priority**: P0 (Critical)
**Description**: Indonesian-compliant receipt generation system

**Features**:
- Professional receipt creation
- Indonesian language support
- Customizable company information
- PDF export with professional formatting
- Receipt numbering system
- Save up to 100 receipts per user
- Search and filter capabilities

**User Stories**:
- As a finance staff, I want to generate official receipts for payments received
- As a customer, I want to receive professional receipts for my payments
- As an accountant, I want to maintain records of all receipts issued

**Acceptance Criteria**:
- ✅ Generate Indonesian-format receipts
- ✅ Professional PDF output
- ✅ Automatic receipt numbering
- ✅ Save and search receipt history
- ✅ Customizable company information

### 4.4 Analytics & Reporting

#### 4.4.1 Dashboard Analytics
**Priority**: P1 (High)
**Description**: Real-time business intelligence and analytics dashboard

**Features**:
- Key performance indicators (KPIs)
- Production metrics visualization
- Financial summaries
- Employee statistics
- Interactive charts and graphs
- Export capabilities

**User Stories**:
- As an operations manager, I want to see real-time production metrics
- As a financial controller, I want visual summaries of expenses and revenue
- As an executive, I want high-level KPIs for strategic decision making

**Acceptance Criteria**:
- ✅ Display real-time production data
- ✅ Show financial summaries
- ✅ Interactive charts and visualizations
- ✅ Export dashboard data

### 4.5 System Administration

#### 4.5.1 User Management
**Priority**: P0 (Critical)
**Description**: Comprehensive user and role management system

**Features**:
- User creation and management
- Role-based permissions
- Activity monitoring
- Account status management
- Audit trail maintenance

**User Stories**:
- As a system administrator, I want to create and manage user accounts
- As a security officer, I want to monitor user activities
- As a compliance officer, I want audit trails for all user actions

**Acceptance Criteria**:
- ✅ Create and manage user accounts
- ✅ Assign role-based permissions
- ✅ Monitor user activities
- ✅ Maintain comprehensive audit logs

---

## 5. Technical Requirements

### 5.1 Technology Stack

#### 5.1.1 Frontend
- **Framework**: Next.js 15.4.6 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS v4 for responsive design
- **UI Components**: Radix UI + shadcn/ui for consistent design
- **Charts**: Recharts for data visualization
- **Forms**: React Hook Form + Zod for validation
- **Icons**: Lucide React for consistent iconography

#### 5.1.2 Backend
- **Runtime**: Node.js with Next.js API routes
- **Database**: PostgreSQL for production reliability
- **ORM**: Prisma for type-safe database operations
- **Authentication**: bcrypt for password hashing
- **Validation**: Zod for runtime type checking

#### 5.1.3 Infrastructure
- **Hosting**: Vercel for serverless deployment
- **Database**: Neon/Supabase PostgreSQL
- **Storage**: File system for document storage
- **CDN**: Vercel Edge Network for global performance

### 5.2 Performance Requirements
- **Page Load Time**: < 2 seconds for 95% of requests
- **API Response Time**: < 500ms for database operations
- **Uptime**: 99.9% availability target
- **Concurrent Users**: Support for 100+ simultaneous users
- **Data Processing**: Handle payroll for 1000+ employees

### 5.3 Security Requirements
- **Authentication**: Secure password hashing with bcrypt
- **Authorization**: Role-based access control (RBAC)
- **Data Protection**: SQL injection prevention via Prisma
- **Session Management**: Secure session handling
- **Audit Logging**: Comprehensive activity tracking
- **Data Encryption**: HTTPS for all communications

### 5.4 Scalability Requirements
- **Database**: Optimized with proper indexing
- **Caching**: Edge caching for static content
- **API Design**: RESTful APIs with proper pagination
- **File Management**: Efficient file upload and storage
- **Resource Optimization**: Code splitting and lazy loading

---

## 6. User Experience Requirements

### 6.1 Design Principles
- **Simplicity**: Clean, intuitive interface design
- **Consistency**: Unified design language across all modules
- **Accessibility**: WCAG 2.1 AA compliance
- **Responsiveness**: Mobile-first responsive design
- **Performance**: Fast loading and smooth interactions

### 6.2 User Interface Requirements
- **Theme Support**: Light and dark mode toggle
- **Mobile Optimization**: Full functionality on mobile devices
- **Navigation**: Intuitive sidebar navigation
- **Feedback**: Clear success/error messages
- **Loading States**: Visual feedback for all operations

### 6.3 Usability Requirements
- **Learning Curve**: New users productive within 30 minutes
- **Help System**: Built-in tutorials and help documentation
- **Error Handling**: Clear error messages with recovery suggestions
- **Keyboard Navigation**: Full keyboard accessibility
- **Touch Support**: Optimized for touch interactions

---

## 7. Database Architecture

### 7.1 Core Entities

#### 7.1.1 User Management
```sql
Users (15+ fields)
- id, name, email, password, role, aktif
- created_at, updated_at
- Relationships: login_activity, pay_components

LoginActivity
- id, user_id, email, ip_address, user_agent, status, created_at
```

#### 7.1.2 Employee Management
```sql
Employees (15+ fields)
- id, nama, nik, jabatan, site, tempat_lahir, tanggal_lahir
- kontrak_upah_harian, default_uang_makan, default_uang_bbm
- bank_name, bank_account, npwp, start_date, aktif
- Relationships: payroll_lines, component_selections
```

#### 7.1.3 Payroll System
```sql
PayComponents
- id, nama, tipe, metode, basis, rate, nominal
- cap_min, cap_max, order, aktif, taxable

PayrollRuns
- id, periode_awal, periode_akhir, status
- created_by, approved_by, notes

PayrollLines
- id, payroll_run_id, employee_id, employee_name
- hari_kerja, upah_harian, uang_makan_harian, uang_bbm_harian
- bruto, pajak_rate, pajak_nominal, neto, status
```

#### 7.1.4 Financial Management
```sql
KasBesarExpense
- id, hari, tanggal, bulan, tipe_aktivitas, barang
- banyak, satuan, harga_satuan, total
- vendor_nama, vendor_telp, vendor_email, jenis, sub_jenis
- bukti_url, kontrak_url, status, notes

KasKecilExpense
- id, tanggal, deskripsi, kategori, jumlah
- bukti_url, status, notes, created_by
```

#### 7.1.5 Production Management
```sql
ProductionReports
- id, tanggal, nopol, pembeli_id, pembeli_nama
- tujuan, gross_ton, tare_ton, netto_ton
- source_file, notes, status, created_by, approved_by

Buyers
- id, nama, harga_per_ton_default, alamat
- telepon, email, npwp, aktif
```

#### 7.1.6 Business Documents
```sql
Kwitansi
- id, nomor_kwitansi, tanggal, nama_penerima
- jumlah_uang, untuk_pembayaran, nama_pembayar
- nomor_rekening, nama_rekening, bank_name
- transfer_method, tempat, tanggal_kwitansi
- signature_name, signature_position, materai

Invoices
- id, invoice_number, invoice_date, due_date
- applicant_name, recipient_name, recipient_address
- items (JSON), subtotal, total_discount, total_tax
- grand_total, notes, created_by
```

### 7.2 Database Design Principles
- **Normalization**: 3NF compliance for data integrity
- **Indexing**: Strategic indexes for query performance
- **Constraints**: Foreign key relationships for data consistency
- **Audit Trail**: Comprehensive logging for all data changes
- **Soft Deletion**: Preserve data integrity with soft deletes

---

## 8. API Specification

### 8.1 API Design Principles
- **RESTful**: Standard HTTP methods and status codes
- **Consistent**: Uniform response formats across all endpoints
- **Versioned**: API versioning for backward compatibility
- **Secure**: Authentication required for all protected endpoints
- **Documented**: Comprehensive API documentation

### 8.2 Core API Endpoints

#### 8.2.1 Authentication APIs
```
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

#### 8.2.2 Employee Management APIs
```
GET    /api/employees
POST   /api/employees
GET    /api/employees/[id]
PUT    /api/employees/[id]
DELETE /api/employees/[id]
```

#### 8.2.3 Payroll APIs
```
GET    /api/payroll
POST   /api/payroll
GET    /api/payroll/[id]
PATCH  /api/payroll/[id]
DELETE /api/payroll/[id]

GET    /api/pay-components
POST   /api/pay-components
PUT    /api/pay-components/[id]
DELETE /api/pay-components/[id]
```

#### 8.2.4 Financial Management APIs
```
GET    /api/kas-besar
POST   /api/kas-besar
GET    /api/kas-besar/[id]
PUT    /api/kas-besar/[id]
DELETE /api/kas-besar/[id]
GET    /api/kas-besar/stats

GET    /api/kas-kecil
POST   /api/kas-kecil
GET    /api/kas-kecil/[id]
PUT    /api/kas-kecil/[id]
DELETE /api/kas-kecil/[id]
```

#### 8.2.5 Business Document APIs
```
GET    /api/kwitansi
POST   /api/kwitansi
PUT    /api/kwitansi/[id]
DELETE /api/kwitansi/[id]

GET    /api/invoices
POST   /api/invoices
PUT    /api/invoices/[id]
DELETE /api/invoices/[id]
```

### 8.3 Response Formats
```typescript
// Success Response
{
  success: true,
  data: T,
  message?: string,
  pagination?: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}

// Error Response
{
  success: false,
  error: string,
  details?: any,
  stack?: string (development only)
}
```

---

## 9. Deployment & Operations

### 9.1 Deployment Strategy
- **Platform**: Vercel for Next.js applications
- **Database**: Neon PostgreSQL for production
- **Domain**: Custom domain with SSL certificate
- **Environment**: Separate staging and production environments
- **CI/CD**: GitHub integration for automatic deployments

### 9.2 Monitoring & Analytics
- **Performance Monitoring**: Vercel Analytics
- **Error Tracking**: Built-in error logging
- **Database Monitoring**: Connection pool monitoring
- **User Analytics**: Usage tracking and reporting
- **Uptime Monitoring**: External uptime monitoring service

### 9.3 Backup & Recovery
- **Database Backups**: Daily automated backups
- **Point-in-time Recovery**: Database recovery capabilities
- **File Backups**: Regular file system backups
- **Disaster Recovery**: Cross-region backup strategy
- **Recovery Testing**: Regular recovery procedure testing

---

## 10. Compliance & Security

### 10.1 Data Privacy
- **Data Protection**: Compliance with Indonesian data protection laws
- **User Consent**: Clear privacy policy and user consent
- **Data Retention**: Defined data retention policies
- **Data Access**: Controlled access to sensitive data
- **Data Anonymization**: User data anonymization capabilities

### 10.2 Security Measures
- **Authentication**: Multi-factor authentication support
- **Authorization**: Role-based access control
- **Data Encryption**: Encryption at rest and in transit
- **Security Headers**: HTTPS and security headers
- **Audit Logging**: Comprehensive security audit trails

### 10.3 Business Compliance
- **Indonesian Standards**: Compliance with local business regulations
- **Financial Reporting**: Standard financial reporting formats
- **Labor Compliance**: Payroll compliance with labor laws
- **Tax Compliance**: Proper tax calculation and reporting
- **Document Standards**: Standard business document formats

---

## 11. Success Metrics & KPIs

### 11.1 Business Metrics
- **User Adoption Rate**: 95% of target users actively using the platform
- **Time Savings**: 40% reduction in manual processing time
- **Error Reduction**: 90% reduction in payroll calculation errors
- **Document Generation**: 100% automated document generation
- **Process Efficiency**: 50% improvement in operational workflows

### 11.2 Technical Metrics
- **System Uptime**: 99.9% availability
- **Response Time**: <2 second page load times
- **API Performance**: <500ms API response times
- **Error Rate**: <0.1% application error rate
- **User Satisfaction**: 4.5+ star user satisfaction rating

### 11.3 Financial Metrics
- **Cost Reduction**: 30% reduction in operational costs
- **ROI**: 200% return on investment within 12 months
- **Maintenance Costs**: <10% of total system costs
- **Training Costs**: <5% of implementation costs
- **Support Costs**: <3% of ongoing operational costs

---

## 12. Risk Assessment

### 12.1 Technical Risks
- **Database Performance**: Risk of slow performance with large datasets
  - *Mitigation*: Database optimization and indexing strategies
- **Third-party Dependencies**: Risk of external service failures
  - *Mitigation*: Redundancy and fallback mechanisms
- **Security Vulnerabilities**: Risk of security breaches
  - *Mitigation*: Regular security audits and updates

### 12.2 Business Risks
- **User Adoption**: Risk of low user adoption
  - *Mitigation*: Comprehensive training and support programs
- **Data Migration**: Risk of data loss during migration
  - *Mitigation*: Thorough testing and backup procedures
- **Regulatory Changes**: Risk of changing compliance requirements
  - *Mitigation*: Flexible architecture and regular compliance reviews

### 12.3 Operational Risks
- **Staff Training**: Risk of inadequate user training
  - *Mitigation*: Comprehensive training programs and documentation
- **Change Management**: Risk of resistance to change
  - *Mitigation*: Gradual rollout and change management strategies
- **Support Requirements**: Risk of inadequate ongoing support
  - *Mitigation*: Dedicated support team and documentation

---

## 13. Future Roadmap

### 13.1 Phase 2 Enhancements (Q1 2026)
- **Advanced Analytics**: Machine learning-powered insights
- **Mobile Applications**: Native iOS and Android apps
- **Integration APIs**: Third-party system integrations
- **Advanced Reporting**: Custom report builder
- **Workflow Automation**: Advanced business process automation

### 13.2 Phase 3 Expansions (Q2-Q3 2026)
- **Multi-company Support**: Support for multiple mining operations
- **Advanced Security**: Advanced authentication and authorization
- **IoT Integration**: Integration with mining equipment sensors
- **Predictive Analytics**: Predictive maintenance and production forecasting
- **International Expansion**: Support for other countries and regulations

### 13.3 Long-term Vision (2027+)
- **AI-Powered Operations**: Artificial intelligence for operational optimization
- **Blockchain Integration**: Blockchain for supply chain transparency
- **Environmental Monitoring**: Environmental impact tracking and reporting
- **Global Platform**: Multi-region, multi-language platform
- **Industry Standards**: Setting industry standards for mining software

---

## 14. Conclusion

CoalTools represents a comprehensive solution for modern coal mining operations, combining operational efficiency with technological innovation. The platform's modular architecture, robust security, and user-centric design make it an ideal solution for mining companies looking to digitize their operations.

The successful implementation of this PRD will result in a production-ready platform that meets all specified requirements while providing a foundation for future enhancements and expansions. The platform's focus on Indonesian compliance, mining industry specifics, and user experience ensures its success in the target market.

### 14.1 Key Success Factors
1. **User-Centric Design**: Focus on actual user needs and workflows
2. **Technical Excellence**: Robust, scalable, and secure architecture
3. **Industry Expertise**: Deep understanding of mining operations
4. **Continuous Improvement**: Regular updates and feature enhancements
5. **Strong Support**: Comprehensive training and ongoing support

### 14.2 Next Steps
1. **Technical Review**: Review technical specifications with development team
2. **User Validation**: Validate requirements with target users
3. **Implementation Planning**: Create detailed implementation timeline
4. **Testing Strategy**: Develop comprehensive testing procedures
5. **Deployment Planning**: Plan production deployment and rollout strategy

---

**Document End**

*This PRD serves as the comprehensive guide for the CoalTools platform development and implementation. Regular reviews and updates ensure continued alignment with business objectives and user needs.*
