-- AlterTable
ALTER TABLE "public"."CampaignMember" ADD COLUMN     "canInvite" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canManageCombat" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canManageJournal" BOOLEAN NOT NULL DEFAULT false;
