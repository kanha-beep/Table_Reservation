import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.diningTable.createMany({
    data: [
      { name: "T1", capacity: 2 }, { name: "T2", capacity: 2 },
      { name: "T3", capacity: 4 }, { name: "T4", capacity: 4 },
      { name: "T5", capacity: 6 }, { name: "Patio", capacity: 6 }
    ],
    skipDuplicates: true
  });
}

main().finally(() => prisma.$disconnect());
