# PharmacyErp

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.19.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

This project uses **Jest** (not Karma). From the repository root:

```bash
npm test                  # all Angular unit tests (src/**/*.spec.ts)
npm run test:watch        # watch mode
npm run test:coverage     # with coverage
npm test -- --testPathPatterns=auth.service.spec   # single file / pattern
```

Full testing guide (backend + Angular, feature filters, e2e, persistence): [Testing architecture doc](docs/pharmacy_erp_architecture_docs/architecture/testing.md).

### Backend tests

From `backend/`:

```bash
npm run test              # unit tests (src/**/*.spec.ts)
npm run test:persistence  # persistence integration (seeded SQLite)
npm run test:e2e          # HTTP e2e (auth, party, app)
npm run test -- --testPathPatterns=reporting   # feature filter example
```

See [backend/README.md](backend/README.md#run-tests) and [testing.md](docs/pharmacy_erp_architecture_docs/architecture/testing.md).

## Running end-to-end tests

Angular CLI e2e (`ng e2e`) is not configured. Backend API e2e:

```bash
cd backend && npm run test:e2e
```

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

### Cursor rules

Agents and contributors should follow project Cursor rules in `.cursor/rules/`:

- [01-coding-principles.mdc](.cursor/rules/01-coding-principles.mdc) — simplicity and human-readability (always applied, backend + frontend)
- [backend/AGENTS.md](backend/AGENTS.md) — backend rule index and module memory doc links
- [angular-rules.mdc](.cursor/rules/angular-rules.mdc) — Angular conventions (`src/**/*.ts`)


## Run SQLLite DB Migrations

```bash
npx prisma migrate dev --name init
```

## Run Backend

```bash
npm run start:dev
```


## Generate module, service, controller

```bash
nest g module <module_name>
nest g service <service_name>
nest g controller <controller_name>
```


This mirrors real-world pharmacy operations:

Purchase Order – "I want to buy."
Goods Receipt – "I physically received the medicines."
Purchase Invoice – "Supplier billed me."
Inventory Update – "Stock is available for sale."
Payment – "I paid the supplier."
