-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "suggestedReply" TEXT,
ALTER COLUMN "status" DROP NOT NULL;
