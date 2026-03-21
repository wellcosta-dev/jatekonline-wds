"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, User, MapPin, MessageSquare, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const phoneRegex = /^(\+36|06)?[\s-]?(\d{2})[\s-]?(\d{3})[\s-]?(\d{3,4})$/;

const addressSchema = z.object({
  name: z.string().min(3, "A név legalább 3 karakter legyen"),
  email: z.string().email("Érvényes email címet adj meg"),
  phone: z
    .string()
    .min(9, "Érvényes magyar telefonszámot adj meg")
    .regex(phoneRegex, "Érvényes magyar telefonszámot adj meg (pl. +36 20 123 4567)"),
  postalCode: z
    .string()
    .length(4, "Az irányítószám 4 számjegyű")
    .regex(/^\d{4}$/, "Csak számokat adj meg"),
  city: z.string().min(2, "A város megadása kötelező"),
  street: z.string().min(3, "Az utca és házszám megadása kötelező"),
  notes: z.string().optional(),
  company: z.string().optional(),
  taxNumber: z.string().optional(),
  sameBillingAddress: z.boolean(),
  billingName: z.string().optional(),
  billingPostalCode: z.string().optional(),
  billingCity: z.string().optional(),
  billingStreet: z.string().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

const billingSchema = addressSchema.superRefine((data, ctx) => {
  if (!data.sameBillingAddress) {
    if (!data.billingName || data.billingName.length < 3) {
      ctx.addIssue({ code: "custom", message: "A név legalább 3 karakter", path: ["billingName"] });
    }
    if (!data.billingPostalCode || !/^\d{4}$/.test(data.billingPostalCode)) {
      ctx.addIssue({ code: "custom", message: "Az irányítószám 4 számjegyű", path: ["billingPostalCode"] });
    }
    if (!data.billingCity || data.billingCity.length < 2) {
      ctx.addIssue({ code: "custom", message: "A város megadása kötelező", path: ["billingCity"] });
    }
    if (!data.billingStreet || data.billingStreet.length < 3) {
      ctx.addIssue({ code: "custom", message: "Az utca és házszám megadása kötelező", path: ["billingStreet"] });
    }
  }
});

export interface AddressFormValues {
  name: string;
  email: string;
  phone: string;
  postalCode: string;
  city: string;
  street: string;
  notes?: string;
  company?: string;
  taxNumber?: string;
  sameBillingAddress: boolean;
  billingName?: string;
  billingPostalCode?: string;
  billingCity?: string;
  billingStreet?: string;
}

interface AddressFormProps {
  defaultValues?: Partial<AddressFormValues>;
  onSubmit: (data: AddressFormValues) => void;
}

function FormField({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-semibold text-neutral-dark/80">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}

export function AddressForm({ defaultValues, onSubmit }: AddressFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormData>({
    resolver: zodResolver(billingSchema),
    defaultValues: {
      sameBillingAddress: defaultValues?.sameBillingAddress ?? true,
      ...defaultValues,
    } as AddressFormData,
  });

  const sameBillingAddress = watch("sameBillingAddress");
  const [isBusiness, setIsBusiness] = useState(!!defaultValues?.company);

  const inputCls = "w-full px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all placeholder:text-gray-400";
  const inputErr = "border-red-300 focus:ring-red-200 focus:border-red-400";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6">
      {/* Personal info section */}
      <div className="space-y-4 sm:space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <User className="size-4 text-primary" />
          </div>
          <h3 className="text-base font-bold text-neutral-dark tracking-tight">Személyes adatok</h3>
        </div>
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
          <FormField label="Teljes név *" error={errors.name?.message} className="sm:col-span-2">
            <input
              {...register("name")}
              className={cn(inputCls, errors.name && inputErr)}
              placeholder="Kovács János"
              autoComplete="name"
            />
          </FormField>
          <FormField label="Email *" error={errors.email?.message}>
            <input
              type="email"
              {...register("email")}
              className={cn(inputCls, errors.email && inputErr)}
              placeholder="email@pelda.hu"
              autoComplete="email"
            />
          </FormField>
          <FormField label="Telefon *" error={errors.phone?.message}>
            <input
              type="tel"
              {...register("phone")}
              className={cn(inputCls, errors.phone && inputErr)}
              placeholder="+36 20 123 4567"
              autoComplete="tel"
              inputMode="tel"
            />
          </FormField>
        </div>
      </div>

      {/* Business toggle */}
      <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 cursor-pointer hover:border-primary/30 transition-colors">
        <input
          type="checkbox"
          className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
          checked={isBusiness}
          onChange={(e) => {
            const checked = e.target.checked;
            setIsBusiness(checked);
            if (!checked) {
              setValue("company", "");
              setValue("taxNumber", "");
            }
          }}
        />
        <div className="flex items-center gap-2">
          <Building2 className="size-4 text-neutral-medium" />
          <span className="text-sm font-medium text-neutral-dark">Cégként rendelek</span>
        </div>
      </label>

      {isBusiness && (
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 pl-2 border-l-2 border-primary/20 ml-2">
          <FormField label="Cégnév">
            <input
              {...register("company")}
              className={inputCls}
              placeholder="Példa Kft."
              autoComplete="organization"
            />
          </FormField>
          <FormField label="Adószám">
            <input
              {...register("taxNumber")}
              className={inputCls}
              placeholder="12345678-1-42"
              autoComplete="off"
            />
          </FormField>
        </div>
      )}

      {/* Address section */}
      <div className="space-y-4 sm:space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="size-8 rounded-lg bg-brand-cyan/10 flex items-center justify-center">
            <MapPin className="size-4 text-brand-cyan" />
          </div>
          <h3 className="text-base font-bold text-neutral-dark tracking-tight">Szállítási cím</h3>
        </div>
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-3">
          <FormField label="Irányítószám *" error={errors.postalCode?.message}>
            <input
              {...register("postalCode")}
              className={cn(inputCls, errors.postalCode && inputErr)}
              placeholder="1051"
              maxLength={4}
              autoComplete="postal-code"
              inputMode="numeric"
            />
          </FormField>
          <FormField label="Város *" error={errors.city?.message} className="sm:col-span-2">
            <input
              {...register("city")}
              className={cn(inputCls, errors.city && inputErr)}
              placeholder="Budapest"
              autoComplete="address-level2"
            />
          </FormField>
        </div>
        <FormField label="Utca, házszám *" error={errors.street?.message}>
          <input
            {...register("street")}
            className={cn(inputCls, errors.street && inputErr)}
            placeholder="Példa utca 1."
            autoComplete="address-line1"
          />
        </FormField>
      </div>

      {/* Notes */}
      <div className="space-y-4 sm:space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="size-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <MessageSquare className="size-4 text-accent" />
          </div>
          <h3 className="text-base font-bold text-neutral-dark tracking-tight">Megjegyzés <span className="font-normal text-neutral-medium">(opcionális)</span></h3>
        </div>
        <textarea
          {...register("notes")}
          rows={3}
          className={cn(inputCls, "resize-none")}
          placeholder="Egyéb megjegyzések a szállítással kapcsolatban..."
        />
      </div>

      {/* Billing address toggle */}
      <label className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50/50 cursor-pointer hover:border-primary/30 transition-colors">
        <input
          type="checkbox"
          {...register("sameBillingAddress")}
          className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <span className="text-sm font-medium text-neutral-dark">
          A számlázási cím megegyezik a szállítási címmel
        </span>
      </label>

      {!sameBillingAddress && (
        <div className="space-y-4 rounded-2xl border border-primary/10 bg-primary-pale/20 p-5">
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-primary" />
            <h3 className="text-sm font-bold text-neutral-dark tracking-tight">Számlázási cím</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="Teljes név *" error={errors.billingName?.message} className="sm:col-span-2">
              <input
                {...register("billingName")}
                className={cn(inputCls, "bg-white", errors.billingName && inputErr)}
                placeholder="Kovács János"
                autoComplete="billing name"
              />
            </FormField>
            <FormField label="Irányítószám *" error={errors.billingPostalCode?.message}>
              <input
                {...register("billingPostalCode")}
                className={cn(inputCls, "bg-white", errors.billingPostalCode && inputErr)}
                placeholder="1051"
                maxLength={4}
                autoComplete="billing postal-code"
                inputMode="numeric"
              />
            </FormField>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Város *" error={errors.billingCity?.message}>
              <input
                {...register("billingCity")}
                className={cn(inputCls, "bg-white", errors.billingCity && inputErr)}
                placeholder="Budapest"
                autoComplete="billing address-level2"
              />
            </FormField>
            <FormField label="Utca, házszám *" error={errors.billingStreet?.message}>
              <input
                {...register("billingStreet")}
                className={cn(inputCls, "bg-white", errors.billingStreet && inputErr)}
                placeholder="Példa utca 1."
                autoComplete="billing address-line1"
              />
            </FormField>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-light transition-colors shadow-lg shadow-primary/20 disabled:opacity-50"
      >
        Tovább a szállításhoz
        <ArrowRight className="size-4" />
      </button>
    </form>
  );
}
