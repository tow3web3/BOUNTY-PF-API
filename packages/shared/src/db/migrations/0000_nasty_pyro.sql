CREATE TABLE "bounties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"reward_usd" numeric(10, 2) NOT NULL,
	"deadline" timestamp with time zone,
	"link" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"raw_data" jsonb,
	"description_hash" text,
	"creator_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bounties_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "bounty_classifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bounty_id" uuid NOT NULL,
	"category" text NOT NULL,
	"confidence" numeric(3, 2) NOT NULL,
	"effort_estimate" text NOT NULL,
	"reasoning" text NOT NULL,
	"classified_at" timestamp with time zone DEFAULT now() NOT NULL,
	"description_hash_at_classification" text,
	CONSTRAINT "bounty_classifications_bounty_id_unique" UNIQUE("bounty_id"),
	CONSTRAINT "category_check" CHECK ("bounty_classifications"."category" IN ('digital_automatable', 'digital_human', 'physical')),
	CONSTRAINT "effort_check" CHECK ("bounty_classifications"."effort_estimate" IN ('low', 'medium', 'high'))
);
--> statement-breakpoint
CREATE TABLE "bounty_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bounty_id" uuid NOT NULL,
	"status" text NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "revenue_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"endpoint" text NOT NULL,
	"payer_address" text NOT NULL,
	"amount_usd" numeric(10, 6) NOT NULL,
	"tx_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payer_address" text NOT NULL,
	"webhook_url" text NOT NULL,
	"filters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"hmac_secret" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscription_id" uuid NOT NULL,
	"bounty_id" uuid NOT NULL,
	"payload" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_retry_at" timestamp with time zone,
	"last_attempt_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bounty_classifications" ADD CONSTRAINT "bounty_classifications_bounty_id_bounties_id_fk" FOREIGN KEY ("bounty_id") REFERENCES "public"."bounties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bounty_status_history" ADD CONSTRAINT "bounty_status_history_bounty_id_bounties_id_fk" FOREIGN KEY ("bounty_id") REFERENCES "public"."bounties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_bounty_id_bounties_id_fk" FOREIGN KEY ("bounty_id") REFERENCES "public"."bounties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_bounties_status" ON "bounties" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_bounties_external_id" ON "bounties" USING btree ("external_id");--> statement-breakpoint
CREATE INDEX "idx_bounties_updated_at" ON "bounties" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "idx_bc_category" ON "bounty_classifications" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_bc_bounty_id" ON "bounty_classifications" USING btree ("bounty_id");--> statement-breakpoint
CREATE INDEX "idx_bsh_bounty_id" ON "bounty_status_history" USING btree ("bounty_id");--> statement-breakpoint
CREATE INDEX "idx_rev_endpoint_date" ON "revenue_events" USING btree ("endpoint","created_at");--> statement-breakpoint
CREATE INDEX "idx_subs_active" ON "subscriptions" USING btree ("active","expires_at");--> statement-breakpoint
CREATE INDEX "idx_subs_payer" ON "subscriptions" USING btree ("payer_address");--> statement-breakpoint
CREATE INDEX "idx_wd_status_retry" ON "webhook_deliveries" USING btree ("status","next_retry_at");--> statement-breakpoint
CREATE INDEX "idx_wd_subscription_id" ON "webhook_deliveries" USING btree ("subscription_id");