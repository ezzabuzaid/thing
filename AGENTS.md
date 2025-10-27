### Prisma

- Each model splitted into 4 sections ("References", "Audit", "Relations", "Constraints)
- Database table primary key is "@id @default(dbgenerated("uuidv7()")) @db.Uuid"
- When referencing other models, the foreign key is String with "@db.Uuid"

### API

- Don't duplicate error handling - it's already global
- For existence checks without using data: `await prisma.modelName.findUniqueOrThrow({ where: { id } })`
- Custom error messages only when necessary

### Date & Time

- Use date-fns when possible.
- Use Intl API when date-fns doesn't support the required functionality.
