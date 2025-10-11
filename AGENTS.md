### Prisma

- Each model splitted into 4 sections ("References", "Audit", "Relations", "Constraints)
- Database table primary key is "@id @default(dbgenerated("uuidv7()")) @db.Uuid"
- When referencing other models, the foreign key is String with "@db.Uuid"
