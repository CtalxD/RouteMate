// model Payment {
//   id            String       @id @default(uuid())
//   amount        Float
//   transactionId String       @unique
//   status        PaymentStatus @default(INITIATED)
//   createdAt     DateTime     @default(now())
//   updatedAt     DateTime     @updatedAt

//   @@index([transactionId])
//   @@index([ticketId])
//   @@index([status])
// }