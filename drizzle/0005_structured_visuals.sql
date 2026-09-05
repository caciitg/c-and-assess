ALTER TABLE questions ADD COLUMN visual_kind TEXT;
--> statement-breakpoint
ALTER TABLE questions ADD COLUMN visual_spec_json TEXT;
--> statement-breakpoint
ALTER TABLE questions ADD COLUMN visual_alt_text TEXT NOT NULL DEFAULT '';
