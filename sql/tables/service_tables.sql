-- Service sections table
CREATE TABLE IF NOT EXISTS "service_sections" (
    "section_id" serial PRIMARY KEY NOT NULL,
    "section_key" varchar(100) NOT NULL UNIQUE,
    "title" text,
    "subtitle" text,
    "description" text,
    "badge_text" varchar(100),
    "is_active" boolean DEFAULT true NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Service items table
CREATE TABLE IF NOT EXISTS "service_items" (
    "item_id" serial PRIMARY KEY NOT NULL,
    "section_key" varchar(100) NOT NULL,
    "item_type" varchar(50) NOT NULL,
    "title" varchar(255) NOT NULL,
    "description" text,
    "icon_name" varchar(100),
    "image_url" text,
    "badge_text" varchar(100),
    "is_active" boolean DEFAULT true NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    FOREIGN KEY ("section_key") REFERENCES "service_sections"("section_key") ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_sections_active_order ON "service_sections"("is_active", "display_order");
CREATE INDEX IF NOT EXISTS idx_service_items_section_active ON "service_items"("section_key", "is_active", "display_order");
