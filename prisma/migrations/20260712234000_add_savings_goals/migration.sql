-- CreateEnum
CREATE TYPE "SavingsGoalStatus" AS ENUM ('active', 'paused', 'completed', 'cancelled');

-- CreateTable
CREATE TABLE "savings_goals" (
    "id" UUID NOT NULL,
    "child_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "target_amount_minor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'simulated_cash',
    "status" "SavingsGoalStatus" NOT NULL DEFAULT 'active',
    "due_date" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "savings_goals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "savings_goals_child_id_currency_idx" ON "savings_goals"("child_id", "currency");

-- AddForeignKey
ALTER TABLE "savings_goals" ADD CONSTRAINT "savings_goals_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- EnableRowLevelSecurity
ALTER TABLE "savings_goals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "savings_goals" FORCE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY savings_goals_family_policy ON "public"."savings_goals"
  FOR ALL
  TO public
  USING (
    rls_bypass()
    OR EXISTS (
      SELECT 1 FROM "public"."child_profiles" cp
      WHERE cp.id = "savings_goals"."child_id"
        AND cp."family_id" = (current_app_family_id())::uuid
    )
  )
  WITH CHECK (
    rls_bypass()
    OR EXISTS (
      SELECT 1 FROM "public"."child_profiles" cp
      WHERE cp.id = "savings_goals"."child_id"
        AND cp."family_id" = (current_app_family_id())::uuid
    )
  );
