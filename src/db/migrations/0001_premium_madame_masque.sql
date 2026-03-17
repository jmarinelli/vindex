CREATE TABLE "review_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"token" varchar(64) NOT NULL,
	"customer_email" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "reviewer_identifier" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "inspection_details" ADD COLUMN "customer_email" varchar(255);--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "review_token_id" uuid;--> statement-breakpoint
ALTER TABLE "review_tokens" ADD CONSTRAINT "review_tokens_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "review_tokens_token_unique" ON "review_tokens" USING btree ("token");--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_review_token_id_review_tokens_id_fk" FOREIGN KEY ("review_token_id") REFERENCES "public"."review_tokens"("id") ON DELETE no action ON UPDATE no action;