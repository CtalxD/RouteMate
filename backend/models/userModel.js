const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class User {
  static async create(user) {
    try {
      const createdUser = await prisma.user.create({
        data: {
          email: user.email,
          password: user.password,
          role: user.role,
        },
      });
      return createdUser;
    } catch (error) {
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });
      return user;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;
