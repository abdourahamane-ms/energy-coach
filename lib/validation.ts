import { z } from "zod";

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, "Le prénom est requis.").max(60),
  lastName: z.string().trim().min(1, "Le nom est requis.").max(60),
  email: z.string().trim().toLowerCase().email("Adresse email invalide."),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
    .max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Adresse email invalide."),
  password: z.string().min(1, "Le mot de passe est requis."),
});

const optionalPositive = z
  .union([z.number(), z.string()])
  .optional()
  .transform((v) => {
    if (v === undefined || v === null || v === "") return undefined;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : undefined;
  })
  .refine((v) => v === undefined || v > 0, {
    message: "La valeur doit être un nombre positif.",
  });

export const housingProfileSchema = z.object({
  housingType: z.enum(["appartement", "maison", "studio", "autre"]).optional(),
  surfaceM2: optionalPositive,
  occupants: optionalPositive,
  country: z.string().trim().max(60).optional(),
  city: z.string().trim().max(80).optional(),
  mainEnergy: z.enum(["electricite", "gaz", "mixte"]).optional(),
  hasElectricHeating: z.boolean().optional(),
  hasGasHeating: z.boolean().optional(),
  hasAirConditioning: z.boolean().optional(),
  hasElectricWaterHeater: z.boolean().optional(),
  monthlyBillEuro: optionalPositive,
  monthlyConsumptionKwh: optionalPositive,
  knownKwhPrice: optionalPositive,
});

export const meterChoiceSchema = z.object({
  meterSlug: z.string().min(1),
  label: z.string().trim().max(80).optional(),
  manualMonthlyBillEuro: optionalPositive,
  manualMonthlyKwh: optionalPositive,
  prepaidMonthlyBudget: optionalPositive,
  prepaidRechargeAmount: optionalPositive,
  prepaidRechargeFrequency: z.string().trim().max(40).optional(),
});

export const userDeviceSchema = z.object({
  deviceId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(50).default(1),
  usageHoursPerDay: z.coerce.number().min(0).max(24).optional(),
  usageDaysPerMonth: z.coerce.number().min(0).max(31).optional(),
  energyClass: z.string().trim().max(4).optional(),
  customPowerWatts: z.coerce.number().min(0).max(20000).optional(),
});

export const habitAnswerSchema = z.object({
  habitId: z.string().min(1),
  answerValue: z.enum([
    "jamais",
    "rarement",
    "parfois",
    "souvent",
    "tres_souvent",
  ]),
});

export const qrScanSchema = z.object({
  payload: z.string().trim().min(1, "Contenu du QR code manquant."),
});
