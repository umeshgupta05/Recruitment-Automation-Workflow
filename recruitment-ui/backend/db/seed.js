const bcrypt = require("bcryptjs");
const { getDb } = require("./database");

async function seedUsers() {
  const db = getDb();

  const demoUsers = [
    {
      email: "demo@company.com",
      password: "password123",
      name: "Demo Recruiter",
      role: "recruiter",
      company: "Demo Co",
      phone: "+1 (555) 000-0001",
    },
    {
      email: "admin@company.com",
      password: "admin123",
      name: "Admin User",
      role: "admin",
      company: "Demo Co",
      phone: "+1 (555) 000-0002",
    },
  ];

  for (const user of demoUsers) {
    const existing = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(user.email);

    if (!existing) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      db.prepare(
        `INSERT INTO users (email, password, name, role, company, phone)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(
        user.email,
        hashedPassword,
        user.name,
        user.role,
        user.company,
        user.phone,
      );
      console.log(`✅ Created user: ${user.email}`);
    } else {
      console.log(`ℹ️  User already exists: ${user.email}`);
    }
  }

  console.log("✅ Database seeding completed");
}

module.exports = { seedUsers };
