import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding started...");

  // 1. Seed Admin User
  const adminEmail = "admin@pos.com";
  const hashedPassword = bcrypt.hashSync("Admin@123", 10);
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Admin User",
      email: adminEmail,
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log(`Seeded admin user: ${adminUser.email}`);

  // 2. Seed Categories
  const categoriesData = [
    { name: "Beverages", icon: "Coffee" },
    { name: "Snacks", icon: "Cookie" },
    { name: "Main Course", icon: "Utensils" },
    { name: "Desserts", icon: "IceCream" },
    { name: "Merchandise", icon: "Shirt" },
  ];

  const categories = [];
  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
    categories.push(created);
  }
  console.log(`Seeded ${categories.length} product categories.`);

  // 3. Seed Suppliers
  const suppliersData = [
    { name: "Global Beverage Distrib", contact: "John Smith", phone: "099111222", email: "john@globalbev.com", address: "Phnom Penh, Cambodia" },
    { name: "Sweet Delight Bakery Supplies", contact: "Jane Doe", phone: "088222333", email: "jane@sweetdelight.com", address: "Siem Reap, Cambodia" },
  ];

  for (const sup of suppliersData) {
    await prisma.supplier.create({
      data: sup,
    });
  }
  console.log("Seeded sample suppliers.");

  // 4. Seed Products
  const categoryMap = categories.reduce((acc, cat) => {
    acc[cat.name] = cat.id;
    return acc;
  }, {} as Record<string, number>);

  const productsData = [
    // Beverages
    { name: "Iced Latte", code: "BEV-001", price: 3.50, cost: 1.20, stock: 50, minStock: 10, categoryId: categoryMap["Beverages"] },
    { name: "Hot Americano", code: "BEV-002", price: 2.50, cost: 0.80, stock: 100, minStock: 15, categoryId: categoryMap["Beverages"] },
    { name: "Green Tea Frappe", code: "BEV-003", price: 4.00, cost: 1.50, stock: 30, minStock: 8, categoryId: categoryMap["Beverages"] },
    { name: "Coca Cola Canned", code: "BEV-004", price: 1.50, cost: 0.60, stock: 150, minStock: 20, categoryId: categoryMap["Beverages"] },
    { name: "Mineral Water", code: "BEV-005", price: 1.00, cost: 0.30, stock: 200, minStock: 25, categoryId: categoryMap["Beverages"] },
    // Snacks
    { name: "Chocolate Chip Cookie", code: "SNA-001", price: 2.00, cost: 0.70, stock: 40, minStock: 10, categoryId: categoryMap["Snacks"] },
    { name: "Potato Chips", code: "SNA-002", price: 1.80, cost: 0.90, stock: 60, minStock: 12, categoryId: categoryMap["Snacks"] },
    { name: "Salted Peanuts", code: "SNA-003", price: 1.20, cost: 0.50, stock: 80, minStock: 15, categoryId: categoryMap["Snacks"] },
    { name: "Cheese Crackers", code: "SNA-004", price: 2.20, cost: 1.10, stock: 4, minStock: 10, categoryId: categoryMap["Snacks"] }, // Low stock
    // Main Course
    { name: "Club Sandwich", code: "FOD-001", price: 5.50, cost: 2.20, stock: 25, minStock: 5, categoryId: categoryMap["Main Course"] },
    { name: "Beef Burger", code: "FOD-002", price: 6.50, cost: 2.80, stock: 20, minStock: 5, categoryId: categoryMap["Main Course"] },
    { name: "Spaghetti Bolognese", code: "FOD-003", price: 7.50, cost: 3.00, stock: 15, minStock: 5, categoryId: categoryMap["Main Course"] },
    { name: "Chicken Fried Rice", code: "FOD-004", price: 5.00, cost: 1.80, stock: 3, minStock: 5, categoryId: categoryMap["Main Course"] }, // Low stock
    // Desserts
    { name: "New York Cheesecake", code: "DES-001", price: 4.50, cost: 1.80, stock: 12, minStock: 4, categoryId: categoryMap["Desserts"] },
    { name: "Chocolate Fudge Cake", code: "DES-002", price: 4.50, cost: 1.70, stock: 15, minStock: 4, categoryId: categoryMap["Desserts"] },
    { name: "Tiramisu Cups", code: "DES-003", price: 5.00, cost: 2.00, stock: 10, minStock: 3, categoryId: categoryMap["Desserts"] },
    { name: "Strawberry Tart", code: "DES-004", price: 4.20, cost: 1.60, stock: 2, minStock: 5, categoryId: categoryMap["Desserts"] }, // Low stock
    // Merchandise
    { name: "Logo Mug Black", code: "MER-001", price: 12.00, cost: 5.00, stock: 30, minStock: 5, categoryId: categoryMap["Merchandise"] },
    { name: "Logo T-Shirt White", code: "MER-002", price: 18.00, cost: 7.50, stock: 25, minStock: 5, categoryId: categoryMap["Merchandise"] },
    { name: "Canvas Tote Bag", code: "MER-003", price: 10.00, cost: 4.00, stock: 40, minStock: 5, categoryId: categoryMap["Merchandise"] },
  ];

  for (const prod of productsData) {
    const createdProduct = await prisma.product.upsert({
      where: { code: prod.code },
      update: {
        price: prod.price,
        cost: prod.cost,
        stock: prod.stock,
        minStock: prod.minStock,
        categoryId: prod.categoryId,
      },
      create: prod,
    });

    // Create initial stock-in log for each product
    await prisma.inventoryLog.create({
      data: {
        productId: createdProduct.id,
        type: "IN",
        quantity: prod.stock,
        beforeQty: 0,
        afterQty: prod.stock,
        note: "Initial stock setup via system seed",
        userId: adminUser.id,
      },
    });
  }
  console.log("Seeded sample products with initial stock logs.");

  // 5. Seed Customers
  const customersData = [
    { name: "Sok Dara", phone: "012345678", email: "dara@email.com", address: "Phnom Penh", points: 120 },
    { name: "Chan Leakhena", phone: "098765432", email: "leakhena@email.com", address: "Siem Reap", points: 340 },
    { name: "Keo Sophea", phone: "087654321", email: "sophea@email.com", address: "Battambang", points: 50 },
  ];

  for (const cust of customersData) {
    await prisma.customer.upsert({
      where: { phone: cust.phone },
      update: {},
      create: cust,
    });
  }
  console.log("Seeded sample customers.");

  // 6. Seed Discounts
  const discountsData = [
    { name: "Grand Opening (10% Off)", type: "PERCENT" as const, value: 10.00, minPurchase: 10.00, startDate: new Date("2026-06-01"), endDate: new Date("2026-12-31"), isActive: true },
    { name: "$5 Off Mega Deal", type: "FIXED" as const, value: 5.00, minPurchase: 30.00, startDate: new Date("2026-06-01"), endDate: new Date("2026-12-31"), isActive: true },
    { name: "Expired Summer Promo", type: "PERCENT" as const, value: 15.00, minPurchase: 15.00, startDate: new Date("2025-06-01"), endDate: new Date("2025-08-31"), isActive: false },
  ];

  for (const disc of discountsData) {
    await prisma.discount.create({
      data: disc,
    });
  }
  console.log("Seeded active and expired discounts.");

  // 7. Seed Role Permissions
  console.log("Seeding role permissions...");
  const adminPages = ["/", "/pos", "/products", "/categories", "/discounts", "/inventory", "/purchases", "/suppliers", "/customers", "/orders", "/reports", "/users", "/settings", "/roles"];
  const managerPages = ["/", "/pos", "/products", "/categories", "/discounts", "/inventory", "/purchases", "/suppliers", "/customers", "/orders"];
  const cashierPages = ["/pos"];

  const rolePermissions = [
    { role: "ADMIN" as const, pages: adminPages },
    { role: "MANAGER" as const, pages: managerPages },
    { role: "CASHIER" as const, pages: cashierPages },
  ];

  for (const rp of rolePermissions) {
    await prisma.rolePermission.upsert({
      where: { role: rp.role },
      update: { pages: rp.pages },
      create: rp,
    });
  }
  console.log("Seeded role permissions.");

  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
