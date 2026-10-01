-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'STAFF');

-- CreateEnum
CREATE TYPE "MetalType" AS ENUM ('GOLD', 'SILVER', 'DIAMOND', 'PLATINUM', 'OTHER');

-- CreateEnum
CREATE TYPE "MaterialType" AS ENUM ('GOLD_BAR', 'GOLD_COIN', 'GOLD_SCRAP', 'SILVER', 'ALLOY', 'STONE', 'DIAMOND', 'ACCESSORY', 'OTHER');

-- CreateEnum
CREATE TYPE "GoldStockStatus" AS ENUM ('AVAILABLE', 'IN_PRODUCTION', 'USED', 'SOLD');

-- CreateEnum
CREATE TYPE "StockItemType" AS ENUM ('GOLD', 'STONE', 'PRODUCT');

-- CreateEnum
CREATE TYPE "AdjustmentType" AS ENUM ('INCREASE', 'DECREASE');

-- CreateEnum
CREATE TYPE "AdjustmentReason" AS ENUM ('WASTAGE', 'DAMAGE', 'MISSING', 'CORRECTION', 'PHYSICAL_ADJUSTMENT', 'INTERNAL_TRANSFER');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('CASH', 'CARD', 'UPI', 'BANK', 'CHEQUE', 'CREDIT');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('PAID', 'PARTIAL', 'DUE', 'CANCELLED', 'VOID');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('COMPLETED', 'CANCELLED', 'REVERSED');

-- CreateEnum
CREATE TYPE "PurchasePaymentStatus" AS ENUM ('PAID', 'PARTIAL', 'DUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExchangeType" AS ENUM ('BUY', 'EXCHANGE');

-- CreateEnum
CREATE TYPE "WorkPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "WorkStatusValue" AS ENUM ('PENDING', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'REWORK_REQUIRED', 'REJECTED', 'CANCELLED', 'QUALITY_CHECK', 'APPROVED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "QCResult" AS ENUM ('APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('WORK_ASSIGNED', 'WORK_COMPLETED', 'WORK_OVERDUE', 'WORK_REJECTED', 'REWORK_REQUIRED', 'STOCK_LOW', 'PAYMENT_DUE', 'NEW_SALE', 'NEW_PURCHASE', 'WORK_REASSIGNED', 'WORK_DEADLINE');

-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RestockingStatus" AS ENUM ('PENDING', 'DONE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'STAFF',
    "passwordHash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "specialty" TEXT,
    "lastLogin" TIMESTAMP(3),
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purity" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "metal" "MetalType" NOT NULL DEFAULT 'GOLD',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Purity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkStatus" (
    "id" TEXT NOT NULL,
    "value" "WorkStatusValue" NOT NULL,
    "label" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "pincode" TEXT,
    "gstin" TEXT,
    "pan" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "anniversary" TIMESTAMP(3),
    "totalPurchasePaise" BIGINT NOT NULL DEFAULT 0,
    "totalPaidPaise" BIGINT NOT NULL DEFAULT 0,
    "totalDuePaise" BIGINT NOT NULL DEFAULT 0,
    "totalBills" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "supplierCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyName" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "pincode" TEXT,
    "gstin" TEXT,
    "pan" TEXT,
    "openingBalancePaise" BIGINT NOT NULL DEFAULT 0,
    "totalPurchasePaise" BIGINT NOT NULL DEFAULT 0,
    "totalPaidPaise" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoldStock" (
    "id" TEXT NOT NULL,
    "stockId" TEXT NOT NULL,
    "materialType" "MaterialType" NOT NULL DEFAULT 'GOLD_BAR',
    "metal" "MetalType" NOT NULL DEFAULT 'GOLD',
    "purity" TEXT NOT NULL,
    "karat" TEXT NOT NULL,
    "grossWeightMg" BIGINT NOT NULL,
    "fineGoldWeightMg" BIGINT NOT NULL,
    "supplierId" TEXT,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "purchaseRatePaisePerGram" BIGINT NOT NULL,
    "purchaseValuePaise" BIGINT NOT NULL,
    "currentLocation" TEXT NOT NULL DEFAULT 'Vault A',
    "status" "GoldStockStatus" NOT NULL DEFAULT 'AVAILABLE',
    "referenceNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoldStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoneItem" (
    "id" TEXT NOT NULL,
    "stoneId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "shape" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "weightCarats" DECIMAL(10,3) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'carat',
    "purchaseCostPaise" BIGINT NOT NULL,
    "supplierId" TEXT,
    "usedQuantity" INTEGER NOT NULL DEFAULT 0,
    "remainingQuantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoneItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "itemType" "StockItemType" NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "fromLocation" TEXT NOT NULL,
    "toLocation" TEXT NOT NULL,
    "fromUserId" TEXT,
    "toUserId" TEXT,
    "weightMg" BIGINT,
    "quantity" INTEGER,
    "reason" TEXT NOT NULL,
    "reference" TEXT,
    "remarks" TEXT,
    "performedById" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockAdjustment" (
    "id" TEXT NOT NULL,
    "itemType" "StockItemType" NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "adjustmentType" "AdjustmentType" NOT NULL,
    "weightMg" BIGINT,
    "quantity" INTEGER,
    "reason" "AdjustmentReason" NOT NULL,
    "remarks" TEXT NOT NULL,
    "performedById" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "productCode" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "subCategory" TEXT,
    "designNumber" TEXT,
    "metal" "MetalType" NOT NULL DEFAULT 'GOLD',
    "purity" TEXT NOT NULL,
    "grossWeightMg" BIGINT NOT NULL,
    "netWeightMg" BIGINT NOT NULL,
    "stoneWeightMg" BIGINT NOT NULL DEFAULT 0,
    "wastageMg" BIGINT NOT NULL DEFAULT 0,
    "makingChargePaise" BIGINT NOT NULL DEFAULT 0,
    "otherChargesPaise" BIGINT NOT NULL DEFAULT 0,
    "gstRateBps" INTEGER NOT NULL DEFAULT 300,
    "sellingPricePaise" BIGINT NOT NULL,
    "costPricePaise" BIGINT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 1,
    "hsnCode" TEXT NOT NULL DEFAULT '7113',
    "imageColor" TEXT DEFAULT 'from-amber-400 to-yellow-600',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerAddress" TEXT,
    "customerGstin" TEXT,
    "subtotalPaise" BIGINT NOT NULL,
    "totalMakingPaise" BIGINT NOT NULL DEFAULT 0,
    "totalStonePaise" BIGINT NOT NULL DEFAULT 0,
    "totalOtherPaise" BIGINT NOT NULL DEFAULT 0,
    "totalDiscountPaise" BIGINT NOT NULL DEFAULT 0,
    "totalGstPaise" BIGINT NOT NULL DEFAULT 0,
    "grandTotalPaise" BIGINT NOT NULL,
    "paidAmountPaise" BIGINT NOT NULL DEFAULT 0,
    "dueAmountPaise" BIGINT NOT NULL DEFAULT 0,
    "paymentMode" "PaymentMode" NOT NULL DEFAULT 'CASH',
    "paymentRef" TEXT,
    "status" "SaleStatus" NOT NULL DEFAULT 'PAID',
    "cancelReason" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelledById" TEXT,
    "oldGoldAdjustmentPaise" BIGINT NOT NULL DEFAULT 0,
    "branch" TEXT NOT NULL DEFAULT 'Main Branch',
    "billedById" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleItem" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "productId" TEXT,
    "productCode" TEXT,
    "name" TEXT NOT NULL,
    "hsn" TEXT NOT NULL DEFAULT '7113',
    "metal" "MetalType" NOT NULL DEFAULT 'GOLD',
    "purity" TEXT NOT NULL,
    "grossWeightMg" BIGINT NOT NULL,
    "netWeightMg" BIGINT NOT NULL,
    "stoneWeightMg" BIGINT NOT NULL DEFAULT 0,
    "ratePaisePerGram" BIGINT NOT NULL,
    "makingAmountPaise" BIGINT NOT NULL DEFAULT 0,
    "stoneAmountPaise" BIGINT NOT NULL DEFAULT 0,
    "otherChargesPaise" BIGINT NOT NULL DEFAULT 0,
    "subtotalPaise" BIGINT NOT NULL,
    "discountPaise" BIGINT NOT NULL DEFAULT 0,
    "gstRateBps" INTEGER NOT NULL DEFAULT 300,
    "gstAmountPaise" BIGINT NOT NULL DEFAULT 0,
    "totalPaise" BIGINT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "saleId" TEXT,
    "invoiceNo" TEXT,
    "customerId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "amountPaise" BIGINT NOT NULL,
    "paymentMode" "PaymentMode" NOT NULL,
    "transactionId" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'COMPLETED',
    "cancelReason" TEXT,
    "receivedById" TEXT NOT NULL,
    "remarks" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesReturn" (
    "id" TEXT NOT NULL,
    "returnId" TEXT NOT NULL,
    "originalInvoiceNo" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "returnQuantity" INTEGER NOT NULL DEFAULT 1,
    "returnWeightMg" BIGINT NOT NULL,
    "reason" TEXT NOT NULL,
    "refundAmountPaise" BIGINT NOT NULL DEFAULT 0,
    "exchangeAmountPaise" BIGINT NOT NULL DEFAULT 0,
    "restockingStatus" "RestockingStatus" NOT NULL DEFAULT 'PENDING',
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "subtotalPaise" BIGINT NOT NULL,
    "totalTaxPaise" BIGINT NOT NULL DEFAULT 0,
    "grandTotalPaise" BIGINT NOT NULL,
    "paidAmountPaise" BIGINT NOT NULL DEFAULT 0,
    "paymentStatus" "PurchasePaymentStatus" NOT NULL DEFAULT 'PAID',
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "cancelReason" TEXT,
    "notes" TEXT,
    "performedById" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseItem" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "materialType" "MaterialType" NOT NULL DEFAULT 'GOLD_BAR',
    "description" TEXT NOT NULL,
    "purity" TEXT NOT NULL,
    "grossWeightMg" BIGINT NOT NULL,
    "netWeightMg" BIGINT NOT NULL,
    "ratePaisePerGram" BIGINT NOT NULL,
    "makingChargesPaise" BIGINT NOT NULL DEFAULT 0,
    "taxPaise" BIGINT NOT NULL DEFAULT 0,
    "totalPaise" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OldGoldExchange" (
    "id" TEXT NOT NULL,
    "voucherNo" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "type" "ExchangeType" NOT NULL DEFAULT 'BUY',
    "itemDescription" TEXT NOT NULL,
    "grossWeightMg" BIGINT NOT NULL,
    "netWeightMg" BIGINT NOT NULL,
    "karat" TEXT NOT NULL,
    "touchBps" INTEGER NOT NULL,
    "ratePaisePerGram" BIGINT NOT NULL,
    "totalValuePaise" BIGINT NOT NULL,
    "adjustedAgainstSaleId" TEXT,
    "adjustedAgainstInvoice" TEXT,
    "paidAmountPaise" BIGINT NOT NULL DEFAULT 0,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OldGoldExchange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workflow" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowStep" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "defaultUserId" TEXT,
    "estimatedHours" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrder" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "productCode" TEXT,
    "productName" TEXT NOT NULL,
    "customerName" TEXT,
    "workflowId" TEXT NOT NULL,
    "workflowName" TEXT NOT NULL,
    "currentStepIndex" INTEGER NOT NULL DEFAULT 0,
    "grossWeightMg" BIGINT NOT NULL,
    "netWeightMg" BIGINT,
    "purity" TEXT NOT NULL,
    "metal" "MetalType" NOT NULL DEFAULT 'GOLD',
    "priority" "WorkPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "WorkStatusValue" NOT NULL DEFAULT 'PENDING',
    "assignedToId" TEXT,
    "assignedToName" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedCompletion" TIMESTAMP(3) NOT NULL,
    "actualCompletion" TIMESTAMP(3),
    "notes" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrderStep" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "stepName" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "assignedToId" TEXT,
    "assignedToName" TEXT,
    "status" "WorkStatusValue" NOT NULL DEFAULT 'PENDING',
    "inputWeightMg" BIGINT,
    "outputWeightMg" BIGINT,
    "wastageMg" BIGINT,
    "remarks" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrderStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkHistory" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WastageRecord" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "stepName" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "inputWeightMg" BIGINT NOT NULL,
    "outputWeightMg" BIGINT NOT NULL,
    "wastageWeightMg" BIGINT NOT NULL,
    "wastageBps" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WastageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualityCheck" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "weightChecked" BOOLEAN NOT NULL DEFAULT false,
    "purityChecked" BOOLEAN NOT NULL DEFAULT false,
    "designChecked" BOOLEAN NOT NULL DEFAULT false,
    "stoneChecked" BOOLEAN NOT NULL DEFAULT false,
    "finishingChecked" BOOLEAN NOT NULL DEFAULT false,
    "result" "QCResult" NOT NULL DEFAULT 'APPROVED',
    "remarks" TEXT,
    "checkedById" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QualityCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "userName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "details" TEXT,
    "ipAddress" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppNotification" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "forUserId" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopSetting" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "shopName" TEXT NOT NULL DEFAULT 'S.S JEWELLERY',
    "ownerName" TEXT NOT NULL DEFAULT 'Suresh Shah',
    "phone" TEXT NOT NULL DEFAULT '+91 98250 12345',
    "email" TEXT NOT NULL DEFAULT 'contact@ssjewellery.in',
    "address" TEXT NOT NULL DEFAULT 'Shop 12, Manek Chowk, Ring Road',
    "city" TEXT NOT NULL DEFAULT 'Surat',
    "pincode" TEXT NOT NULL DEFAULT '395003',
    "gstin" TEXT NOT NULL DEFAULT '24ABCDE1234F1Z5',
    "pan" TEXT NOT NULL DEFAULT 'ABCDE1234F',
    "defaultGstRateBps" INTEGER NOT NULL DEFAULT 300,
    "makingGstRateBps" INTEGER NOT NULL DEFAULT 500,
    "defaultGoldRate24KPaise" BIGINT NOT NULL DEFAULT 725000,
    "defaultSilverRatePaisePerKg" BIGINT NOT NULL DEFAULT 9450000,
    "branch" TEXT NOT NULL DEFAULT 'Main Branch',
    "currency" TEXT NOT NULL DEFAULT 'Γé╣',
    "invoicePrefix" TEXT NOT NULL DEFAULT 'INV-2026',
    "purchasePrefix" TEXT NOT NULL DEFAULT 'PUR-2026',
    "workOrderPrefix" TEXT NOT NULL DEFAULT 'WF',
    "customerPrefix" TEXT NOT NULL DEFAULT 'CUST',
    "invoiceFooter" TEXT NOT NULL DEFAULT 'Thank you for your business! Visit again.',
    "termsConditions" TEXT NOT NULL DEFAULT '1. Goods once sold will not be taken back.
2. All disputes subject to Surat jurisdiction.
3. Gold rate applicable as on date of bill.',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SequenceCounter" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "financialYear" TEXT NOT NULL,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SequenceCounter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_active_idx" ON "User"("role", "active");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Purity_label_key" ON "Purity"("label");

-- CreateIndex
CREATE INDEX "Purity_metal_active_idx" ON "Purity"("metal", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE INDEX "Category_active_idx" ON "Category"("active");

-- CreateIndex
CREATE UNIQUE INDEX "WorkStatus_value_key" ON "WorkStatus"("value");

-- CreateIndex
CREATE INDEX "WorkStatus_active_idx" ON "WorkStatus"("active");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_customerId_key" ON "Customer"("customerId");

-- CreateIndex
CREATE INDEX "Customer_phone_idx" ON "Customer"("phone");

-- CreateIndex
CREATE INDEX "Customer_name_idx" ON "Customer"("name");

-- CreateIndex
CREATE INDEX "Customer_city_idx" ON "Customer"("city");

-- CreateIndex
CREATE INDEX "Customer_totalDuePaise_idx" ON "Customer"("totalDuePaise");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_supplierCode_key" ON "Supplier"("supplierCode");

-- CreateIndex
CREATE INDEX "Supplier_phone_idx" ON "Supplier"("phone");

-- CreateIndex
CREATE INDEX "Supplier_name_idx" ON "Supplier"("name");

-- CreateIndex
CREATE UNIQUE INDEX "GoldStock_stockId_key" ON "GoldStock"("stockId");

-- CreateIndex
CREATE INDEX "GoldStock_status_metal_idx" ON "GoldStock"("status", "metal");

-- CreateIndex
CREATE INDEX "GoldStock_currentLocation_idx" ON "GoldStock"("currentLocation");

-- CreateIndex
CREATE INDEX "GoldStock_supplierId_idx" ON "GoldStock"("supplierId");

-- CreateIndex
CREATE INDEX "GoldStock_purchaseDate_idx" ON "GoldStock"("purchaseDate");

-- CreateIndex
CREATE UNIQUE INDEX "StoneItem_stoneId_key" ON "StoneItem"("stoneId");

-- CreateIndex
CREATE INDEX "StoneItem_type_shape_idx" ON "StoneItem"("type", "shape");

-- CreateIndex
CREATE INDEX "StoneItem_supplierId_idx" ON "StoneItem"("supplierId");

-- CreateIndex
CREATE INDEX "StoneItem_remainingQuantity_idx" ON "StoneItem"("remainingQuantity");

-- CreateIndex
CREATE INDEX "StockMovement_itemId_itemType_idx" ON "StockMovement"("itemId", "itemType");

-- CreateIndex
CREATE INDEX "StockMovement_performedById_idx" ON "StockMovement"("performedById");

-- CreateIndex
CREATE INDEX "StockMovement_timestamp_idx" ON "StockMovement"("timestamp");

-- CreateIndex
CREATE INDEX "StockAdjustment_itemId_itemType_idx" ON "StockAdjustment"("itemId", "itemType");

-- CreateIndex
CREATE INDEX "StockAdjustment_performedById_idx" ON "StockAdjustment"("performedById");

-- CreateIndex
CREATE INDEX "StockAdjustment_timestamp_idx" ON "StockAdjustment"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Product_productCode_key" ON "Product"("productCode");

-- CreateIndex
CREATE UNIQUE INDEX "Product_barcode_key" ON "Product"("barcode");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_metal_purity_idx" ON "Product"("metal", "purity");

-- CreateIndex
CREATE INDEX "Product_stock_idx" ON "Product"("stock");

-- CreateIndex
CREATE INDEX "Product_name_idx" ON "Product"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_invoiceNo_key" ON "Sale"("invoiceNo");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_idempotencyKey_key" ON "Sale"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Sale_customerId_idx" ON "Sale"("customerId");

-- CreateIndex
CREATE INDEX "Sale_status_idx" ON "Sale"("status");

-- CreateIndex
CREATE INDEX "Sale_createdAt_idx" ON "Sale"("createdAt");

-- CreateIndex
CREATE INDEX "Sale_billedById_idx" ON "Sale"("billedById");

-- CreateIndex
CREATE INDEX "Sale_dueAmountPaise_idx" ON "Sale"("dueAmountPaise");

-- CreateIndex
CREATE INDEX "SaleItem_saleId_idx" ON "SaleItem"("saleId");

-- CreateIndex
CREATE INDEX "SaleItem_productId_idx" ON "SaleItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_paymentId_key" ON "Payment"("paymentId");

-- CreateIndex
CREATE INDEX "Payment_saleId_idx" ON "Payment"("saleId");

-- CreateIndex
CREATE INDEX "Payment_customerId_idx" ON "Payment"("customerId");

-- CreateIndex
CREATE INDEX "Payment_date_idx" ON "Payment"("date");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SalesReturn_returnId_key" ON "SalesReturn"("returnId");

-- CreateIndex
CREATE INDEX "SalesReturn_saleId_idx" ON "SalesReturn"("saleId");

-- CreateIndex
CREATE INDEX "SalesReturn_date_idx" ON "SalesReturn"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Purchase_purchaseId_key" ON "Purchase"("purchaseId");

-- CreateIndex
CREATE INDEX "Purchase_supplierId_idx" ON "Purchase"("supplierId");

-- CreateIndex
CREATE INDEX "Purchase_purchaseDate_idx" ON "Purchase"("purchaseDate");

-- CreateIndex
CREATE INDEX "Purchase_paymentStatus_idx" ON "Purchase"("paymentStatus");

-- CreateIndex
CREATE INDEX "PurchaseItem_purchaseId_idx" ON "PurchaseItem"("purchaseId");

-- CreateIndex
CREATE UNIQUE INDEX "OldGoldExchange_voucherNo_key" ON "OldGoldExchange"("voucherNo");

-- CreateIndex
CREATE INDEX "OldGoldExchange_adjustedAgainstSaleId_idx" ON "OldGoldExchange"("adjustedAgainstSaleId");

-- CreateIndex
CREATE INDEX "OldGoldExchange_customerPhone_idx" ON "OldGoldExchange"("customerPhone");

-- CreateIndex
CREATE INDEX "OldGoldExchange_date_idx" ON "OldGoldExchange"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Workflow_code_key" ON "Workflow"("code");

-- CreateIndex
CREATE INDEX "Workflow_active_idx" ON "Workflow"("active");

-- CreateIndex
CREATE INDEX "WorkflowStep_workflowId_order_idx" ON "WorkflowStep"("workflowId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrder_workId_key" ON "WorkOrder"("workId");

-- CreateIndex
CREATE INDEX "WorkOrder_workflowId_idx" ON "WorkOrder"("workflowId");

-- CreateIndex
CREATE INDEX "WorkOrder_assignedToId_idx" ON "WorkOrder"("assignedToId");

-- CreateIndex
CREATE INDEX "WorkOrder_status_idx" ON "WorkOrder"("status");

-- CreateIndex
CREATE INDEX "WorkOrder_expectedCompletion_idx" ON "WorkOrder"("expectedCompletion");

-- CreateIndex
CREATE INDEX "WorkOrder_priority_idx" ON "WorkOrder"("priority");

-- CreateIndex
CREATE INDEX "WorkOrderStep_workOrderId_order_idx" ON "WorkOrderStep"("workOrderId", "order");

-- CreateIndex
CREATE INDEX "WorkOrderStep_assignedToId_status_idx" ON "WorkOrderStep"("assignedToId", "status");

-- CreateIndex
CREATE INDEX "WorkHistory_workOrderId_timestamp_idx" ON "WorkHistory"("workOrderId", "timestamp");

-- CreateIndex
CREATE INDEX "WastageRecord_workOrderId_idx" ON "WastageRecord"("workOrderId");

-- CreateIndex
CREATE INDEX "WastageRecord_userId_idx" ON "WastageRecord"("userId");

-- CreateIndex
CREATE INDEX "WastageRecord_date_idx" ON "WastageRecord"("date");

-- CreateIndex
CREATE INDEX "QualityCheck_workOrderId_idx" ON "QualityCheck"("workOrderId");

-- CreateIndex
CREATE INDEX "QualityCheck_checkedById_idx" ON "QualityCheck"("checkedById");

-- CreateIndex
CREATE INDEX "QualityCheck_result_idx" ON "QualityCheck"("result");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "AppNotification_forUserId_read_idx" ON "AppNotification"("forUserId", "read");

-- CreateIndex
CREATE INDEX "AppNotification_createdAt_idx" ON "AppNotification"("createdAt");

-- CreateIndex
CREATE INDEX "SequenceCounter_entityType_financialYear_idx" ON "SequenceCounter"("entityType", "financialYear");

-- CreateIndex
CREATE UNIQUE INDEX "SequenceCounter_entityType_financialYear_prefix_key" ON "SequenceCounter"("entityType", "financialYear", "prefix");

-- AddForeignKey
ALTER TABLE "GoldStock" ADD CONSTRAINT "GoldStock_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoneItem" ADD CONSTRAINT "StoneItem_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_billedById_fkey" FOREIGN KEY ("billedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturn" ADD CONSTRAINT "SalesReturn_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OldGoldExchange" ADD CONSTRAINT "OldGoldExchange_adjustedAgainstSaleId_fkey" FOREIGN KEY ("adjustedAgainstSaleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStep" ADD CONSTRAINT "WorkflowStep_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowStep" ADD CONSTRAINT "WorkflowStep_defaultUserId_fkey" FOREIGN KEY ("defaultUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderStep" ADD CONSTRAINT "WorkOrderStep_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderStep" ADD CONSTRAINT "WorkOrderStep_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkHistory" ADD CONSTRAINT "WorkHistory_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkHistory" ADD CONSTRAINT "WorkHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WastageRecord" ADD CONSTRAINT "WastageRecord_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WastageRecord" ADD CONSTRAINT "WastageRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityCheck" ADD CONSTRAINT "QualityCheck_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualityCheck" ADD CONSTRAINT "QualityCheck_checkedById_fkey" FOREIGN KEY ("checkedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppNotification" ADD CONSTRAINT "AppNotification_forUserId_fkey" FOREIGN KEY ("forUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

