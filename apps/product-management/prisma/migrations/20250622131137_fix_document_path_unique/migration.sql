/*
  Warnings:

  - A unique constraint covering the columns `[path,productId]` on the table `Document` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Document_path_key";

-- CreateIndex
CREATE UNIQUE INDEX "Document_path_productId_key" ON "Document"("path", "productId");
