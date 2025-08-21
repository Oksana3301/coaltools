# CoalTools - Mining Management Dashboard

A comprehensive Next.js application for coal mining operations management, featuring production tracking, expense management, payroll calculation, and business analytics.

## 🚀 Features

- **Dashboard Analytics** - Real-time production metrics and insights
- **Coal Tools Management**:
  - Production Report Tracking
  - Expense Management
  - Kas Besar (Cash Flow) Management
  - Payroll Calculator
- **Business Tools** - Additional business management features
- **Invoice Management** - Create and manage invoices
- **Customer Management** - Track customer information
- **Responsive Design** - Works on desktop and mobile devices
- **Dark/Light Theme** - Toggle between themes

## 🛠️ Tech Stack

- **Framework**: [Next.js 15.4.6](https://nextjs.org/) with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI + shadcn/ui
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Data Processing**: XLSX for Excel file handling

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your device:

- **Node.js** (version 18.0 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn** or **pnpm**
- **Git** - [Download here](https://git-scm.com/)

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

### Step 4: Run the Development Server

```bash
# Using npm
npm run dev

# OR using yarn
yarn dev

# OR using pnpm
pnpm dev
```

### Step 5: Access the Application

Open your web browser and go to:
```
http://localhost:3000
```

You should see the CoalTools dashboard running locally on your device!

## 📁 Project Structure

```
coaltools/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── business-tools/    # Business management tools
│   ├── coal-tools/        # Coal mining specific tools
│   ├── dashboard/         # Main dashboard and analytics
│   └── invoice-overview/  # Invoice management
├── components/            # Reusable React components
│   ├── coal-tools/        # Coal-specific components
│   ├── dashboard/         # Dashboard components
│   └── ui/                # UI component library
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
├── public/                # Static assets (images, icons)
├── package.json           # Project dependencies
├── next.config.ts         # Next.js configuration
├── tailwind.config.js     # Tailwind CSS configuration
└── tsconfig.json          # TypeScript configuration
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
```

## 🔧 Environment Setup (Optional)

If you need to add environment variables, create a `.env.local` file in the root directory:

```bash
# Example environment variables
NEXT_PUBLIC_API_URL=your_api_url_here
DATABASE_URL=your_database_url_here
```

## 📱 Access Points

Once the application is running, you can access different sections:

- **Main Dashboard**: `http://localhost:3000/dashboard`
- **Coal Tools**: `http://localhost:3000/coal-tools`
- **Business Tools**: `http://localhost:3000/business-tools`
- **Invoice Management**: `http://localhost:3000/invoice-overview`
- **Authentication**: `http://localhost:3000/auth`

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

4. **TypeScript errors**:
   ```bash
   # Run type checking
   npx tsc --noEmit
   ```

## 🌐 Production Deployment

### Deploy on Vercel (Recommended)

1. Push your code to GitHub (already done!)
2. Go to [Vercel](https://vercel.com)
3. Import your GitHub repository
4. Deploy with default settings

### Deploy on Netlify

1. Build the project: `npm run build`
2. Go to [Netlify](https://netlify.com)
3. Drag and drop the `out` folder

### Deploy on your own server

1. Build the project: `npm run build`
2. Copy files to your server
3. Run: `npm start`

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

1. Check the [Issues](https://github.com/Oksana3301/coaltools/issues) section
2. Create a new issue if your problem isn't already reported
3. Provide detailed information about your environment and the issue

---

**Happy Mining! ⛏️**