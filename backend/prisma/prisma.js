// prisma.js

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
async function connectDB(params) {
    try{

        await prisma.$connect();
        console.log("Connected to DB");
    }catch(err){
        console.log("Error connecting to DB");
        console.log(err);   
    }
}
connectDB().catch((e) => {
    throw e;
});

module.exports = prisma;
