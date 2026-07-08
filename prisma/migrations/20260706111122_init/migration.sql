-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLoginAt" DATETIME
);

-- CreateTable
CREATE TABLE "HousingProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "housingType" TEXT,
    "surfaceM2" REAL,
    "occupants" INTEGER,
    "country" TEXT DEFAULT 'France',
    "city" TEXT,
    "mainEnergy" TEXT,
    "hasElectricHeating" BOOLEAN NOT NULL DEFAULT false,
    "hasGasHeating" BOOLEAN NOT NULL DEFAULT false,
    "hasAirConditioning" BOOLEAN NOT NULL DEFAULT false,
    "hasElectricWaterHeater" BOOLEAN NOT NULL DEFAULT false,
    "monthlyBillEuro" REAL,
    "monthlyConsumptionKwh" REAL,
    "knownKwhPrice" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HousingProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MeterType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "energyType" TEXT NOT NULL,
    "description" TEXT,
    "supportsQrDemo" BOOLEAN NOT NULL DEFAULT false,
    "supportsManualEntry" BOOLEAN NOT NULL DEFAULT true,
    "supportsRealConnectionLater" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "UserMeterProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "meterTypeId" TEXT NOT NULL,
    "label" TEXT,
    "manualMonthlyBillEuro" REAL,
    "manualMonthlyKwh" REAL,
    "prepaidMonthlyBudget" REAL,
    "prepaidRechargeAmount" REAL,
    "prepaidRechargeFrequency" TEXT,
    "demoMeterIdentifier" TEXT,
    "isConnectedDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserMeterProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserMeterProfile_meterTypeId_fkey" FOREIGN KEY ("meterTypeId") REFERENCES "MeterType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MeterReading" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "meterTypeId" TEXT,
    "periodStart" DATETIME,
    "periodEnd" DATETIME,
    "consumptionKwh" REAL,
    "costEuro" REAL,
    "sourceType" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MeterReading_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MeterReading_meterTypeId_fkey" FOREIGN KEY ("meterTypeId") REFERENCES "MeterType" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "powerWatts" REAL,
    "averageMonthlyKwh" REAL,
    "averageYearlyKwh" REAL,
    "defaultDailyHours" REAL,
    "impactLevel" TEXT,
    "sourceId" TEXT,
    "description" TEXT,
    "advice" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Device_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "CalculationSource" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserDevice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "usageHoursPerDay" REAL,
    "usageDaysPerMonth" REAL,
    "energyClass" TEXT,
    "customPowerWatts" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserDevice_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Habit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "category" TEXT,
    "recommendationTrigger" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "UserHabit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "habitId" TEXT NOT NULL,
    "answerValue" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserHabit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserHabit_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CalculationSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "organization" TEXT,
    "url" TEXT,
    "description" TEXT,
    "checkedAt" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "EnergyPrice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "energyType" TEXT NOT NULL,
    "pricePerKwh" REAL NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'France',
    "sourceId" TEXT,
    "validFrom" DATETIME,
    "validTo" DATETIME,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "EnergyPrice_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "CalculationSource" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CalculationRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "formulaType" TEXT,
    "coefficient" REAL,
    "targetCategory" TEXT,
    "sourceId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "CalculationRule_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "CalculationSource" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortDescription" TEXT,
    "detailedExplanation" TEXT,
    "category" TEXT,
    "effortLevel" TEXT,
    "impactLevel" TEXT,
    "sourceId" TEXT,
    "ruleId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Recommendation_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "CalculationSource" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Recommendation_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "CalculationRule" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecommendationResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "recommendationId" TEXT NOT NULL,
    "estimatedMonthlySavingEuro" REAL,
    "estimatedYearlySavingEuro" REAL,
    "estimatedMonthlySavingKwh" REAL,
    "calculationDetailsJson" TEXT,
    "sourceLabel" TEXT,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecommendationResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RecommendationResult_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "Recommendation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AiAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "summary" TEXT,
    "explanation" TEXT,
    "modelName" TEXT,
    "usedFallback" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActionPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Plan d''action 30 jours',
    "durationDays" INTEGER NOT NULL DEFAULT 30,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ActionPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActionItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actionPlanId" TEXT NOT NULL,
    "recommendationId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "weekNumber" INTEGER NOT NULL DEFAULT 1,
    "estimatedMonthlySavingEuro" REAL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    CONSTRAINT "ActionItem_actionPlanId_fkey" FOREIGN KEY ("actionPlanId") REFERENCES "ActionPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActionItem_recommendationId_fkey" FOREIGN KEY ("recommendationId") REFERENCES "Recommendation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DemoProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "housingDataJson" TEXT,
    "devicesJson" TEXT,
    "habitsJson" TEXT,
    "meterDataJson" TEXT,
    "qrCodePath" TEXT,
    "qrPayload" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "AdminSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "HousingProfile_userId_key" ON "HousingProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MeterType_slug_key" ON "MeterType"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Habit_key_key" ON "Habit"("key");

-- CreateIndex
CREATE UNIQUE INDEX "UserHabit_userId_habitId_key" ON "UserHabit"("userId", "habitId");

-- CreateIndex
CREATE UNIQUE INDEX "CalculationRule_key_key" ON "CalculationRule"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Recommendation_key_key" ON "Recommendation"("key");

-- CreateIndex
CREATE UNIQUE INDEX "DemoProfile_slug_key" ON "DemoProfile"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSetting_key_key" ON "AdminSetting"("key");
