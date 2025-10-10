"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testDatabaseConnection = void 0;
const client_1 = require("@prisma/client");
// Test database connection
async function testDatabaseConnection() {
    const prisma = new client_1.PrismaClient();
    try {
        // Test the connection
        await prisma.$connect();
        console.log('✅ Database connection successful');
        // Test a simple query
        const userCount = await prisma.user.count();
        console.log(`✅ Database query successful. User count: ${userCount}`);
        return { success: true, userCount };
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
    finally {
        await prisma.$disconnect();
    }
}
exports.testDatabaseConnection = testDatabaseConnection;
//# sourceMappingURL=db-test.js.map