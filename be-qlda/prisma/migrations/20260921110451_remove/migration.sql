/*
  Warnings:

  - You are about to drop the `auth_tokens` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "auth_tokens" DROP CONSTRAINT "auth_tokens_user_id_fkey";

-- DropTable
DROP TABLE "auth_tokens";
