### Prisma

- Each model splitted into 4 sections ("References", "Audit", "Relations", "Constraints)
- Database table primary key is "@id @default(uuid(7)) @db.Uuid"
- When referencing other models, the foreign key is String with "@db.Uuid"

### API

- Don't duplicate error handling - it's already global
- For existence checks without using data: `await prisma.modelName.findUniqueOrThrow({ where: { id } })`
- Custom error messages only when necessary
- To throw errors use `HTTPException` class from Hono:

```ts
throw new HTTPException(400, {
  message: '...',
  cause: {
    code: '<feature/domain>/<code>',
    detail: 'instructive detail',
  },
});
```

### Date & Time

- Use date-fns when possible.
- Use Intl API when date-fns doesn't support the required functionality.

### Generating the client

Two parts, first is generating openapi and that can done through "nx run db:build" and then generating the client itself through running the frontend build "nx run frontend:build".

Note: the client is automatically generated via vite plugin.

### Migration

Migrations are handled through Prisma. To create a new migration, run the following command:

```
nx run db:migrate --name=<migration_name>
```
