# 🚀 Business Tools Hub - New Machine Setup Guide

This guide will help you set up the Business Tools Hub application on a new laptop or machine.

## 📋 Prerequisites

Before starting, ensure you have these installed:

### **Required Software:**
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm** - Usually comes with Node.js
- **Git** - [Download here](https://git-scm.com/)

### **Check Installation:**
```bash
node --version  # Should show 18.x or higher
npm --version   # Should show 8.x or higher
git --version   # Should show 2.x or higher
```

## 🎯 Quick Setup (Recommended)

### **Option 1: Using Setup Script**
```bash
# Clone the repository
git clone https://github.com/Oksana3301/coaltools.git
cd coaltools

# Run the setup script
./scripts/setup-new-machine.sh
```

### **Option 2: Manual Setup**
```bash
# 1. Clone the repository
git clone https://github.com/Oksana3301/coaltools.git
cd coaltools

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Generate Prisma client
npm run db:generate

# 4. Create environment file
cp env.supabase.template .env.local
```

## ⚙️ Environment Configuration

### **Edit `.env.local`:**
```bash
# Open the file in your preferred editor
nano .env.local
# or
code .env.local
# or
vim .env.local
```

### **Required Environment Variables:**
```env
# Database Configuration
DATABASE_URL="postgresql://postgres:MySecurePass123!@db.renoqjwuvdtesblmucax.supabase.co:5432/postgres"

# NextAuth Configuration
NEXTAUTH_SECRET="kwlzX3Mhy0x1SE5GyusWKCErAKLRFjBbRsr9mjbcvec="
NEXTAUTH_URL="http://localhost:3000"

# Environment
NODE_ENV="development"
```

## 🚀 Start Development

```bash
# Start the development server
npm run dev
```

**Open your browser and go to:** http://localhost:3000

## 📚 Available Commands

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:studio        # Open Prisma Studio

# Utilities
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript check
```

## 🔧 Troubleshooting

### **Common Issues:**

#### **1. Node.js Version Issues**
```bash
# If you get version errors, use nvm to manage Node.js versions
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

#### **2. Permission Issues**
```bash
# If you get permission errors on macOS/Linux
sudo chmod +x scripts/setup-new-machine.sh
```

#### **3. Database Connection Issues**
- Verify your `DATABASE_URL` in `.env.local`
- Ensure your Supabase database is accessible
- Check if your IP is whitelisted in Supabase

#### **4. Port Already in Use**
```bash
# If port 3000 is already in use
npm run dev -- -p 3001
# Then access http://localhost:3001
```

#### **5. Dependency Issues**
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

## 🌐 Network Access

### **Access from Other Devices on Same Network:**
The development server will show you the network URL (usually `http://192.168.x.x:3000`). You can access the app from other devices on the same network using this URL.

### **Access from Internet:**
For external access, you'll need to:
1. Configure your router's port forwarding
2. Use a service like ngrok: `npx ngrok http 3000`

## 📱 Application Features

Once running, you'll have access to:

- **🏠 Homepage** - Business Tools Hub landing page
- **🧾 Generator Kwitansi** - Indonesian receipt generator
- **📄 Invoice Generator** - Professional invoice system
- **⛏️ Coal Tools Suite** - Mining industry management tools
- **💰 Payroll Calculator** - Employee salary management
- **👥 Employee Management** - Staff database
- **📊 Production Reports** - Mining production tracking

## 🔐 Security Notes

- Keep your `.env.local` file secure and never commit it to Git
- The database is shared across all development instances
- Use different `NEXTAUTH_SECRET` values for different environments

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all prerequisites are installed
3. Ensure your database credentials are correct
4. Check the application logs for error messages

---

**🎉 You're all set! The Business Tools Hub is now running on your new machine.**
