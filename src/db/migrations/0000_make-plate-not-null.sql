CREATE TYPE "public"."event_status" AS ENUM('draft', 'signed');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('inspection');--> statement-breakpoint
CREATE TYPE "public"."finding_status" AS ENUM('good', 'attention', 'critical', 'not_evaluated', 'not_applicable');--> statement-breakpoint
CREATE TYPE "public"."inspection_type" AS ENUM('pre_purchase', 'intake', 'periodic', 'other');--> statement-breakpoint
CREATE TYPE "public"."match_rating" AS ENUM('yes', 'partially', 'no');--> statement-breakpoint
CREATE TYPE "public"."node_member_role" AS ENUM('member', 'node_admin');--> statement-breakpoint
CREATE TYPE "public"."node_member_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."node_status" AS ENUM('active', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."node_type" AS ENUM('inspector');--> statement-breakpoint
CREATE TYPE "public"."photo_type" AS ENUM('finding', 'vehicle');--> statement-breakpoint
CREATE TYPE "public"."requested_by" AS ENUM('buyer', 'seller', 'agency', 'other');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'platform_admin');--> statement-breakpoint
CREATE TABLE "event_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"finding_id" uuid,
	"photo_type" "photo_type" NOT NULL,
	"url" varchar(500) NOT NULL,
	"caption" varchar(500),
	"order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"node_id" uuid NOT NULL,
	"signed_by_user_id" uuid,
	"event_type" "event_type" NOT NULL,
	"odometer_km" integer NOT NULL,
	"event_date" date NOT NULL,
	"status" "event_status" DEFAULT 'draft' NOT NULL,
	"signed_at" timestamp with time zone,
	"slug" varchar(20) NOT NULL,
	"correction_of_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inspection_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"template_snapshot" jsonb NOT NULL,
	"inspection_type" "inspection_type" NOT NULL,
	"requested_by" "requested_by" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inspection_findings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"section_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"status" "finding_status",
	"observation" text,
	"tags" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inspection_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"node_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"sections" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "node_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"node_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "node_member_role" DEFAULT 'member' NOT NULL,
	"status" "node_member_status" DEFAULT 'active' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "node_type" DEFAULT 'inspector' NOT NULL,
	"slug" varchar(100) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"logo_url" varchar(500),
	"brand_color" varchar(7),
	"contact_email" varchar(255) NOT NULL,
	"contact_phone" varchar(50),
	"address" text,
	"bio" text,
	"status" "node_status" DEFAULT 'active' NOT NULL,
	"verified_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"match_rating" "match_rating" NOT NULL,
	"comment" text,
	"reviewer_identifier" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vin" varchar(17) NOT NULL,
	"plate" varchar(20) NOT NULL,
	"make" varchar(100),
	"model" varchar(100),
	"year" integer,
	"trim" varchar(100),
	"created_by_node_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "event_photos" ADD CONSTRAINT "event_photos_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_photos" ADD CONSTRAINT "event_photos_finding_id_inspection_findings_id_fk" FOREIGN KEY ("finding_id") REFERENCES "public"."inspection_findings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_vehicle_id_vehicles_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_signed_by_user_id_users_id_fk" FOREIGN KEY ("signed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspection_details" ADD CONSTRAINT "inspection_details_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspection_findings" ADD CONSTRAINT "inspection_findings_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspection_templates" ADD CONSTRAINT "inspection_templates_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_members" ADD CONSTRAINT "node_members_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_members" ADD CONSTRAINT "node_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_created_by_node_id_nodes_id_fk" FOREIGN KEY ("created_by_node_id") REFERENCES "public"."nodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "events_slug_unique" ON "events" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "inspection_details_event_unique" ON "inspection_details" USING btree ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "inspection_findings_event_section_item_unique" ON "inspection_findings" USING btree ("event_id","section_id","item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "node_members_node_user_unique" ON "node_members" USING btree ("node_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "nodes_slug_unique" ON "nodes" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicles_vin_unique" ON "vehicles" USING btree ("vin");