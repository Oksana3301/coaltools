# CoalTools - Mining Management Dashboard

A comprehensive Next.js application for coal mining operations management, featuring production tracking, expense management, payroll calculation, business analytics, and a complete authentication system.

## 🚀 Features

### 🔐 **Authentication System**
- **Multiple Demo Accounts** - 4 different user roles (Admin, Manager, Staff, Demo)
- **Login Activity Tracking** - Comprehensive monitoring of all login attempts
- **Session Management** - Secure password hashing and role-based access control
- **Activity Dashboard** - Real-time login activity monitoring with export capabilities

### 📊 **Dashboard Analytics**
- Real-time production metrics and insights
- Interactive charts and data visualization
- Performance monitoring and reporting

### ⛏️ **Coal Tools Management**
- **Production Report Tracking** - Monitor coal production metrics
- **Expense Management** - Track and manage operational expenses
- **Kas Besar (Cash Flow) Management** - Large transaction management
- **Kas Kecil (Petty Cash) Management** - Small expense tracking
- **Payroll Calculator** - Employee salary calculation and management

### 🏢 **Business Tools**
- **Invoice Generator** - Professional invoice creation with PDF export
- **Kwitansi Generator** - Receipt generation with custom formatting
- **Customer Management** - Track customer information
- **Document Management** - File upload and organization

### 🎨 **User Experience**
- **Responsive Design** - Works on desktop and mobile devices
- **Dark/Light Theme** - Toggle between themes
- **Modern UI** - Clean, professional interface
- **Real-time Updates** - Live data synchronization

## 🛠️ Tech Stack

- **Framework**: Next.js 15.4.6 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI + shadcn/ui
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: bcrypt password hashing
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Data Processing**: XLSX for Excel file handling
- **PDF Generation**: Browser-based PDF export

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your device:

- **Node.js** (version 18.0 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn** or **pnpm**
- **Git** - [Download here](https://git-scm.com/)
- **PostgreSQL Database** (for production features)

## 🔧 Local Deployment Instructions

### Step 1: Clone the Repository

Open your terminal/command prompt and run:

```bash
git clone https://github.com/Oksana3301/coaltools.git
```

### Step 2: Navigate to Project Directory

```bash
cd coaltools
```

### Step 3: Install Dependencies

Choose one of the following package managers:

```bash
# Using npm (recommended)
npm install

# OR using yarn
yarn install

# OR using pnpm
pnpm install
```

### Step 4: Database Setup (Optional)

For full functionality with database features:

```bash
# Copy environment template
cp env.supabase.template .env.local

# Update .env.local with your database credentials
# Then run:
npm run db:push
npm run db:seed-users
```

### Step 5: Run the Development Server

```bash
# Using npm
npm run dev

# OR using yarn
yarn dev

# OR using pnpm
pnpm dev
```

### Step 6: Access the Application

Open your web browser and go to:

```
http://localhost:3000
```

You should see the CoalTools dashboard running locally on your device!

## 🔐 Authentication & Demo Accounts

The application includes a complete authentication system with demo accounts:

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| Admin | `admin@example.com` | `Admin123!` | Full access |
| Manager | `manager@example.com` | `Manager123!` | Approver access |
| Staff | `staff@example.com` | `Staff123!` | User access |
| Demo | `demo@example.com` | `Demo123!` | Full access |

### Login Activity Tracking
- All login attempts are automatically logged
- View activity history at `/login-activity`
- Export data to CSV for reporting
- Monitor IP addresses and user agents

## 📁 Project Structure

```
coaltools/
├── app/                    # Next.js App Router pages
│   ├── (with-sidebar)/    # Pages with sidebar layout
│   │   ├── auth/          # Authentication pages
│   │   ├── coal-tools-*/  # Individual coal tools pages
│   │   ├── invoice/       # Invoice management
│   │   ├── kwitansi/      # Receipt generator
│   │   └── login-activity/ # Login activity dashboard
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication APIs
│   │   ├── kas-besar/     # Large cash management
│   │   ├── kas-kecil/     # Small cash management
│   │   ├── payroll/       # Payroll APIs
│   │   └── users/         # User management
│   └── page.tsx           # Main landing page
├── components/            # Reusable React components
│   ├── coal-tools/        # Coal-specific components
│   ├── dashboard/         # Dashboard components
│   ├── ui/                # UI component library
│   └── layout-with-sidebar.tsx # Main layout component
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
│   ├── api.ts            # API service functions
│   ├── auth.ts           # Authentication utilities
│   ├── db.ts             # Database connection
│   └── utils.ts          # General utilities
├── prisma/               # Database schema and migrations
├── scripts/              # Database seeding scripts
├── public/               # Static assets (images, icons)
├── package.json          # Project dependencies
├── next.config.ts        # Next.js configuration
├── tailwind.config.js    # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
```

## 🚀 Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Database operations
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to database
npm run db:studio      # Open Prisma Studio
npm run db:reset       # Reset database
npm run db:seed-users  # Create demo users
```

## 🔧 Environment Setup

Create a `.env.local` file in the root directory:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/coaltools"

# Next.js Configuration
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Optional: Supabase Configuration
# NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
# NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

## 📱 Access Points

Once the application is running, you can access different sections:

- **Main Dashboard**: `http://localhost:3000/`
- **Authentication**: `http://localhost:3000/auth`
- **Login Activity**: `http://localhost:3000/login-activity`
- **Coal Tools**:
  - **Kas Kecil**: `http://localhost:3000/coal-tools-kaskecil`
  - **Kas Besar**: `http://localhost:3000/coal-tools-kasbesar`
  - **Kalkulator Gaji**: `http://localhost:3000/coal-tools-kalkulatorgaji`
  - **Laporan Produksi**: `http://localhost:3000/coal-tools-laporanproduksi`
- **Invoice Generator**: `http://localhost:3000/invoice`
- **Kwitansi Generator**: `http://localhost:3000/kwitansi`

## 🛠️ Troubleshooting

### Common Issues:

1. **Port 3000 already in use**:
```bash
# Kill the process using port 3000
npx kill-port 3000
# Or run on a different port
npm run dev -- -p 3001
```

2. **Node.js version issues**:
- Ensure you're using Node.js 18.0 or higher
- Check version: `node --version`

3. **Dependencies installation fails**:
```bash
# Clear npm cache
npm cache clean --force
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

4. **Database connection issues**:
```bash
# Check database connection
npm run db:studio
# Reset database if needed
npm run db:reset
```

5. **TypeScript errors**:
```bash
# Run type checking
npx tsc --noEmit
```

## 🌐 Production Deployment

### Deploy on Vercel (Recommended)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your GitHub repository
4. Add environment variables
5. Deploy with default settings

### Deploy on Netlify

1. Build the project: `npm run build`
2. Go to [Netlify](https://netlify.com)
3. Drag and drop the `out` folder

### Deploy on your own server

1. Build the project: `npm run build`
2. Copy files to your server
3. Run: `npm start`

## 📚 Documentation

- **[Authentication System](README-AUTH.md)** - Complete auth system documentation
- **[Database Setup](README-DATABASE.md)** - Database configuration guide
- **[Setup Guide](SETUP-GUIDE.md)** - Step-by-step setup instructions

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Developer

**Atika Dewi Suryani** (@Oksana3301)

- GitHub: [https://github.com/Oksana3301](https://github.com/Oksana3301)

## 📞 Support

If you encounter any issues or have questions:

1. Check the Issues section
2. Create a new issue if your problem isn't already reported
3. Provide detailed information about your environment and the issue

## 🎯 Recent Updates

### ✅ **Latest Features Added**
- **Complete Authentication System** with 4 demo accounts
- **Login Activity Tracking** with comprehensive monitoring
- **Database Integration** with PostgreSQL and Prisma
- **Individual Tool Pages** for better navigation
- **Enhanced UI/UX** with modern components
- **PDF Generation** for invoices and receipts
- **Real-time Data Sync** across all components
- **Export Functionality** for reports and data

### 🔧 **Technical Improvements**
- **TypeScript Integration** throughout the application
- **API Route Optimization** for better performance
- **Error Handling** with user-friendly messages
- **Responsive Design** for all screen sizes
- **Database Schema** with proper relationships
- **Security Features** with password hashing

---

**Happy Mining! ⛏️**