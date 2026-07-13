-- CreateTable
CREATE TABLE "simulated_accounts" (
    "id" UUID NOT NULL,
    "child_id" UUID NOT NULL,
    "currency" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "simulated_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "virtual_ledger_entries" (
    "id" UUID NOT NULL,
    "child_id" UUID NOT NULL,
    "simulated_account_id" UUID NOT NULL,
    "amount_minor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "entry_type" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_id" UUID,
    "idempotency_key" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "virtual_ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "simulated_accounts_child_id_currency_key" ON "simulated_accounts"("child_id", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "virtual_ledger_entries_idempotency_key_key" ON "virtual_ledger_entries"("idempotency_key");

-- AddForeignKey
ALTER TABLE "simulated_accounts" ADD CONSTRAINT "simulated_accounts_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "virtual_ledger_entries" ADD CONSTRAINT "virtual_ledger_entries_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "child_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "virtual_ledger_entries" ADD CONSTRAINT "virtual_ledger_entries_simulated_account_id_fkey" FOREIGN KEY ("simulated_account_id") REFERENCES "simulated_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
