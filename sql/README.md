# SQL Database Structure

This directory contains all SQL-related files organized by type and purpose.

## 📁 Directory Structure

```text
sql/
├── migrations/          # Database schema migrations (historical)
├── functions/           # Stored procedures and functions
├── triggers/            # Database triggers
├── views/               # Database views
├── tables/              # Table definitions (non-migration)
├── seeds/               # Sample and demo data
└── README.md           # This file
```

## 📋 File Categories

### 🔄 Migrations (`migrations/`)

- **Purpose:** Historical database schema changes
- **Naming:** `####_description.sql` (timestamped)
- **Usage:** Drizzle ORM automatically applies these in order
- **Note:** Do not modify existing migration files

### ⚡ Functions (`functions/`)

- **Purpose:** Reusable stored procedures and database functions
- **Examples:** `handle_sign_up.sql`, `set_updated_at.sql`, `welcome_email.sql`
- **Usage:** Called from triggers, applications, or other functions

### 🎯 Triggers (`triggers/`)

- **Purpose:** Automatic database operations in response to events
- **Examples:** `work_triggers.sql` (auto-updates timestamps, adds workflow owners)
- **Usage:** Automatically executed on INSERT/UPDATE/DELETE operations

### 👁️ Views (`views/`)

- **Purpose:** Virtual tables based on complex queries
- **Usage:** Simplify complex queries, provide data abstraction
- **Note:** Currently empty - add views as needed

### 🌱 Seeds (`seeds/`)

- **Purpose:** Sample and demo data for development/testing
- **Examples:** `work_sample_data.sql`, `demo_data.sql`
- **Usage:** Populate database with test data after schema is created
- **Note:** Separated from migrations to avoid mixing schema and data

### 📊 Tables (`tables/`)

- **Purpose:** Table definitions that don't need migration tracking
- **Examples:** `service_tables.sql` (service content tables)
- **Usage:** For standalone tables or reference definitions

## 🛠 Development Guidelines

### Adding New Components

1. **Tables:** Add to `migrations/` if schema change, or `tables/` if standalone
2. **Functions:** Add to `functions/`
3. **Triggers:** Add to `triggers/`
4. **Views:** Add to `views/`
5. **Seeds:** Add to `seeds/`

### File Naming

- **Migrations:** `####_description.sql` (Drizzle convention)
- **Functions:** `function_name.sql`
- **Triggers:** `feature_triggers.sql`
- **Views:** `view_name.sql`
- **Tables:** `feature_tables.sql`
- **Seeds:** `data_type.sql`

### Dependencies & Execution Order

⚠️ **Important:** Apply files in this order to avoid dependency errors:

1. **Tables** → Create base table structure
2. **Functions** → Create reusable functions
3. **Triggers** → Create triggers that use functions
4. **Views** → Create views that use tables/functions
5. **Seeds** → Insert sample data (last)

### Dependencies:

- Functions should be created before triggers that use them
- Tables should be created before functions/triggers that reference them
- Views should be created after all referenced tables exist

## 🚀 Deployment

1. Run migrations: `npm run db:migrate`
2. Apply functions/triggers/views manually or include in migration scripts
3. Test all database operations after deployment
