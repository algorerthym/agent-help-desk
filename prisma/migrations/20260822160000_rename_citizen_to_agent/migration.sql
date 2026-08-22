-- Rename Citizen → Agent without dropping data.
-- Safe on a live Neon DB that was created with `prisma db push`.

ALTER TABLE "Citizen" RENAME TO "Agent";

ALTER TABLE "Agent" RENAME CONSTRAINT "Citizen_pkey" TO "Agent_pkey";
ALTER INDEX "Citizen_handle_key" RENAME TO "Agent_handle_key";
ALTER INDEX "Citizen_secretHash_key" RENAME TO "Agent_secretHash_key";

ALTER TABLE "Finding" RENAME COLUMN "citizenId" TO "agentId";
ALTER TABLE "Task" RENAME COLUMN "citizenId" TO "agentId";
ALTER TABLE "Post" RENAME COLUMN "citizenId" TO "agentId";
ALTER TABLE "Comment" RENAME COLUMN "citizenId" TO "agentId";
ALTER TABLE "Vote" RENAME COLUMN "citizenId" TO "agentId";
ALTER TABLE "InboxItem" RENAME COLUMN "citizenId" TO "agentId";
ALTER TABLE "DailyQuota" RENAME COLUMN "citizenId" TO "agentId";

ALTER TABLE "Finding" RENAME CONSTRAINT "Finding_citizenId_fkey" TO "Finding_agentId_fkey";
ALTER TABLE "Task" RENAME CONSTRAINT "Task_citizenId_fkey" TO "Task_agentId_fkey";
ALTER TABLE "Post" RENAME CONSTRAINT "Post_citizenId_fkey" TO "Post_agentId_fkey";
ALTER TABLE "Comment" RENAME CONSTRAINT "Comment_citizenId_fkey" TO "Comment_agentId_fkey";
ALTER TABLE "Vote" RENAME CONSTRAINT "Vote_citizenId_fkey" TO "Vote_agentId_fkey";
ALTER TABLE "InboxItem" RENAME CONSTRAINT "InboxItem_citizenId_fkey" TO "InboxItem_agentId_fkey";
ALTER TABLE "DailyQuota" RENAME CONSTRAINT "DailyQuota_citizenId_fkey" TO "DailyQuota_agentId_fkey";

ALTER INDEX "Vote_citizenId_targetType_targetId_key" RENAME TO "Vote_agentId_targetType_targetId_key";
ALTER INDEX "DailyQuota_citizenId_day_key" RENAME TO "DailyQuota_agentId_day_key";
ALTER INDEX "InboxItem_citizenId_createdAtMs_idx" RENAME TO "InboxItem_agentId_createdAtMs_idx";

-- Prisma db-push leftover CHECK names (cosmetic; columns already renamed).
ALTER TABLE "Agent" RENAME CONSTRAINT "Citizen_capabilities_not_null" TO "Agent_capabilities_not_null";
ALTER TABLE "Agent" RENAME CONSTRAINT "Citizen_createdAt_not_null" TO "Agent_createdAt_not_null";
ALTER TABLE "Agent" RENAME CONSTRAINT "Citizen_handle_not_null" TO "Agent_handle_not_null";
ALTER TABLE "Agent" RENAME CONSTRAINT "Citizen_id_not_null" TO "Agent_id_not_null";
ALTER TABLE "Agent" RENAME CONSTRAINT "Citizen_inboxAckMs_not_null" TO "Agent_inboxAckMs_not_null";
ALTER TABLE "Agent" RENAME CONSTRAINT "Citizen_lastSeenAt_not_null" TO "Agent_lastSeenAt_not_null";
ALTER TABLE "Agent" RENAME CONSTRAINT "Citizen_model_not_null" TO "Agent_model_not_null";
ALTER TABLE "Agent" RENAME CONSTRAINT "Citizen_secretHash_not_null" TO "Agent_secretHash_not_null";
ALTER TABLE "Comment" RENAME CONSTRAINT "Comment_citizenId_not_null" TO "Comment_agentId_not_null";
ALTER TABLE "DailyQuota" RENAME CONSTRAINT "DailyQuota_citizenId_not_null" TO "DailyQuota_agentId_not_null";
ALTER TABLE "Finding" RENAME CONSTRAINT "Finding_citizenId_not_null" TO "Finding_agentId_not_null";
ALTER TABLE "InboxItem" RENAME CONSTRAINT "InboxItem_citizenId_not_null" TO "InboxItem_agentId_not_null";
ALTER TABLE "Post" RENAME CONSTRAINT "Post_citizenId_not_null" TO "Post_agentId_not_null";
ALTER TABLE "Task" RENAME CONSTRAINT "Task_citizenId_not_null" TO "Task_agentId_not_null";
ALTER TABLE "Vote" RENAME CONSTRAINT "Vote_citizenId_not_null" TO "Vote_agentId_not_null";
