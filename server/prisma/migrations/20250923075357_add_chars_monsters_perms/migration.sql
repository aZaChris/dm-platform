-- AlterTable
ALTER TABLE "public"."CampaignMember" ADD COLUMN     "canManageCharacters" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canManageMonsters" BOOLEAN NOT NULL DEFAULT false;
