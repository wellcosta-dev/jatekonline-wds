"use client";

import { useEffect, useState } from "react";
import {
  Store,
  Truck,
  CreditCard,
  Mail,
  Bell,
  Shield,
  Loader2,
  Send,
  Save,
  ChevronRight,
  Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  EmailSettings as EmailSettingsModel,
  LoyaltySettings as LoyaltySettingsModel,
} from "@/types";

type NotificationSettingsModel = {
  newOrderNotification: boolean;
  lowStockAlert: boolean;
  weeklySummary: boolean;
  aiAgentAlert: boolean;
};

const sections = [
  { id: "shop", label: "Webshop", icon: Store, color: "text-primary", bg: "bg-primary/10" },
  { id: "shipping", label: "Szállítás", icon: Truck, color: "text-brand-cyan", bg: "bg-brand-cyan/10" },
  { id: "payment", label: "Fizetés", icon: CreditCard, color: "text-emerald-600", bg: "bg-emerald-100" },
  { id: "loyalty", label: "Babapont", icon: Gift, color: "text-amber-600", bg: "bg-amber-100" },
  { id: "email", label: "Email", icon: Mail, color: "text-brand-pink", bg: "bg-brand-pink/10" },
  { id: "notifications", label: "Értesítések", icon: Bell, color: "text-accent", bg: "bg-accent/10" },
  { id: "security", label: "Biztonság", icon: Shield, color: "text-purple-600", bg: "bg-purple-100" },
];

export default function AdminBeallitasokPage() {
  const [activeSection, setActiveSection] = useState("shop");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-neutral-dark tracking-tight">Beállítások</h1>
        <p className="text-sm text-neutral-medium">Rendszer és webshop beállítások</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4">
        {/* Sidebar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-3 h-fit">
          <div className="space-y-0.5">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all",
                    activeSection === section.id
                      ? "bg-primary text-white shadow-sm shadow-primary/20"
                      : "text-neutral-medium hover:bg-gray-50 hover:text-neutral-dark"
                  )}
                >
                  <Icon className="size-4 flex-shrink-0" />
                  <span>{section.label}</span>
                  <ChevronRight className={cn("size-3 ml-auto", activeSection === section.id ? "text-white/60" : "text-neutral-medium/30")} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          {activeSection === "shop" && <ShopSettings />}
          {activeSection === "shipping" && <ShippingSettings />}
          {activeSection === "payment" && <PaymentSettings />}
          {activeSection === "loyalty" && <LoyaltySettings />}
          {activeSection === "email" && <EmailSettings />}
          {activeSection === "notifications" && <NotificationSettings />}
          {activeSection === "security" && <SecuritySettings />}
        </div>
      </div>
    </div>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3.5 border-b border-gray-50 last:border-0">
      <div>
        <p className="text-xs font-bold text-neutral-dark">{label}</p>
        {description && <p className="text-[10px] text-neutral-medium mt-0.5">{description}</p>}
      </div>
      <div className="sm:max-w-xs">{children}</div>
    </div>
  );
}

function Toggle({
  defaultChecked,
  checked,
  onChange,
}: {
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (value: boolean) => void;
}) {
  const [internal, setInternal] = useState(defaultChecked ?? false);
  const on = checked ?? internal;

  const handleClick = () => {
    const next = !on;
    if (checked === undefined) {
      setInternal(next);
    }
    onChange?.(next);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "relative w-10 h-5.5 rounded-full transition-colors",
        on ? "bg-primary" : "bg-gray-200"
      )}
      style={{ height: 22 }}
    >
      <span className={cn(
        "absolute top-0.5 left-0.5 size-[18px] bg-white rounded-full shadow-sm transition-transform",
        on && "translate-x-[18px]"
      )} />
    </button>
  );
}

function InputField({ defaultValue, placeholder }: { defaultValue?: string; placeholder?: string }) {
  return (
    <input
      type="text"
      defaultValue={defaultValue}
      placeholder={placeholder}
      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
    />
  );
}

function ShopSettings() {
  return (
    <div>
      <h2 className="text-sm font-bold text-neutral-dark tracking-tight mb-4">Webshop beállítások</h2>
      <SettingRow label="Bolt neve" description="Megjelenik a fejlécben és az emailekben">
        <InputField defaultValue="BabyOnline.hu" />
      </SettingRow>
      <SettingRow label="Email cím" description="Admin értesítésekhez">
        <InputField defaultValue="hello@babyonline.hu" />
      </SettingRow>
      <SettingRow label="Telefonszám">
        <InputField defaultValue="06202982228" />
      </SettingRow>
      <SettingRow label="Ingyenes szállítás határa" description="Forintban megadva">
        <InputField defaultValue="20000" />
      </SettingRow>
      <SettingRow label="Karbantartás mód" description="Az oldal nem érhető el a látogatók számára">
        <Toggle />
      </SettingRow>
      <div className="flex justify-end mt-4">
        <button className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary rounded-xl hover:bg-primary-dark shadow-sm shadow-primary/20 transition-colors">
          <Save className="size-3.5" />
          Mentés
        </button>
      </div>
    </div>
  );
}

function ShippingSettings() {
  return (
    <div>
      <h2 className="text-sm font-bold text-neutral-dark tracking-tight mb-4">Szállítási beállítások</h2>
      <SettingRow label="GLS futárszolgálat" description="Szállítási díj: 2 390 Ft">
        <Toggle defaultChecked />
      </SettingRow>
      <SettingRow label="Magyar Posta" description="Szállítási díj: 2 390 Ft">
        <Toggle defaultChecked />
      </SettingRow>
      <SettingRow label="Foxpost csomagautomata" description="Szállítási díj: 890 Ft">
        <Toggle defaultChecked />
      </SettingRow>
      <SettingRow label="GLS API kulcs">
        <InputField defaultValue="••••••••••••" />
      </SettingRow>
      <div className="flex justify-end mt-4">
        <button className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary rounded-xl hover:bg-primary-dark shadow-sm shadow-primary/20 transition-colors">
          <Save className="size-3.5" />
          Mentés
        </button>
      </div>
    </div>
  );
}

function PaymentSettings() {
  return (
    <div>
      <h2 className="text-sm font-bold text-neutral-dark tracking-tight mb-4">Fizetési beállítások</h2>
      <SettingRow label="Stripe fizetés" description="Online bankkártyás fizetés">
        <Toggle defaultChecked />
      </SettingRow>
      <SettingRow label="Utánvét" description="Fizetés kézbesítéskor (+590 Ft)">
        <Toggle defaultChecked />
      </SettingRow>
      <SettingRow label="Stripe API kulcs">
        <InputField defaultValue="••••••••••••" />
      </SettingRow>
      <SettingRow label="Billingo API kulcs" description="Számlázási integráció">
        <InputField defaultValue="••••••••••••" />
      </SettingRow>
      <div className="flex justify-end mt-4">
        <button className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary rounded-xl hover:bg-primary-dark shadow-sm shadow-primary/20 transition-colors">
          <Save className="size-3.5" />
          Mentés
        </button>
      </div>
    </div>
  );
}

function EmailSettings() {
  const [form, setForm] = useState<EmailSettingsModel>({
    smtpHost: "",
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: "",
    smtpPass: "",
    fromName: "BabyOnline.hu",
    fromEmail: "hello@babyonline.hu",
    replyTo: "hello@babyonline.hu",
    orderConfirmationEnabled: true,
    orderStatusUpdateEnabled: true,
    adminNewOrderEnabled: true,
    adminNotificationEmail: "hello@babyonline.hu",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [testingEmail, setTestingEmail] = useState(false);
  const [testRecipient, setTestRecipient] = useState("hello@babyonline.hu");
  const [templates, setTemplates] = useState<
    { type: string; title: string; html: string; subject: string }[]
  >([]);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/admin/email-settings", { cache: "no-store" });
        if (response.ok) {
          const data = (await response.json()) as { settings: EmailSettingsModel };
          setForm(data.settings);
          setTestRecipient(data.settings.adminNotificationEmail || data.settings.fromEmail);
        }

        const templateDefs = [
          { type: "order_confirmation", title: "Rendelés visszaigazolás" },
          { type: "order_status_update", title: "Rendelés státusz frissítés" },
          { type: "admin_new_order", title: "Új rendelés admin értesítő" },
        ];
        const loaded = await Promise.all(
          templateDefs.map(async (item) => {
            const res = await fetch(`/api/admin/email-templates?type=${item.type}`, { cache: "no-store" });
            if (!res.ok) return { ...item, html: "<p>Sablon nem elérhető</p>", subject: "" };
            const payload = (await res.json()) as { html: string; subject: string };
            return { ...item, html: payload.html, subject: payload.subject };
          })
        );
        setTemplates(loaded);
      } catch {
        setMessage("Nem sikerült betölteni az email beállításokat.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const setField = <K extends keyof EmailSettingsModel>(key: K, value: EmailSettingsModel[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/email-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await response.json()) as { settings?: EmailSettingsModel; error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Mentési hiba");
      }
      if (data.settings) setForm(data.settings);
      setMessage("Email beállítások mentve.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Mentési hiba");
    } finally {
      setSaving(false);
    }
  }

  async function handleTestEmail() {
    setTestingEmail(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: testRecipient }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Teszt email hiba");
      setMessage("Teszt email sikeresen elküldve.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Teszt email hiba");
    } finally {
      setTestingEmail(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-neutral-medium">
        <Loader2 className="size-4 animate-spin" />
        Email beállítások betöltése...
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-sm font-bold text-neutral-dark tracking-tight mb-4">Email beállítások (valós SMTP)</h2>
      <SettingRow label="SMTP szerver">
        <input
          value={form.smtpHost}
          onChange={(e) => setField("smtpHost", e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="smtp.gmail.com"
        />
      </SettingRow>
      <SettingRow label="SMTP port">
        <input
          type="number"
          value={form.smtpPort}
          onChange={(e) => setField("smtpPort", Number(e.target.value || 587))}
          className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </SettingRow>
      <SettingRow label="SMTP felhasználó">
        <input
          value={form.smtpUser}
          onChange={(e) => setField("smtpUser", e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="smtp-user@domain.hu"
        />
      </SettingRow>
      <SettingRow label="SMTP jelszó">
        <input
          type="password"
          value={form.smtpPass}
          onChange={(e) => setField("smtpPass", e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="••••••••"
        />
      </SettingRow>
      <SettingRow label="SSL/TLS (secure)">
        <Toggle
          checked={form.smtpSecure}
          onChange={(checked) => setField("smtpSecure", checked)}
        />
      </SettingRow>
      <SettingRow label="Feladó név">
        <input
          value={form.fromName}
          onChange={(e) => setField("fromName", e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </SettingRow>
      <SettingRow label="Feladó email">
        <input
          value={form.fromEmail}
          onChange={(e) => setField("fromEmail", e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </SettingRow>
      <SettingRow label="Reply-To">
        <input
          value={form.replyTo ?? ""}
          onChange={(e) => setField("replyTo", e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </SettingRow>
      <SettingRow label="Rendelés visszaigazolás email">
        <Toggle
          checked={form.orderConfirmationEnabled}
          onChange={(checked) => setField("orderConfirmationEnabled", checked)}
        />
      </SettingRow>
      <SettingRow label="Rendelés státusz email">
        <Toggle
          checked={form.orderStatusUpdateEnabled}
          onChange={(checked) => setField("orderStatusUpdateEnabled", checked)}
        />
      </SettingRow>
      <SettingRow label="Admin új rendelés értesítés">
        <Toggle
          checked={form.adminNewOrderEnabled}
          onChange={(checked) => setField("adminNewOrderEnabled", checked)}
        />
      </SettingRow>
      <SettingRow label="Admin értesítési email">
        <input
          value={form.adminNotificationEmail ?? ""}
          onChange={(e) => setField("adminNotificationEmail", e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </SettingRow>

      <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50/50 p-4">
        <p className="text-xs font-bold text-neutral-dark mb-2">Teszt email küldés</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={testRecipient}
            onChange={(e) => setTestRecipient(e.target.value)}
            className="flex-1 px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="cimzett@pelda.hu"
          />
          <button
            onClick={handleTestEmail}
            disabled={testingEmail}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-primary bg-primary/10 rounded-xl hover:bg-primary/20 disabled:opacity-50"
          >
            {testingEmail ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
            Teszt email
          </button>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-sm font-bold text-neutral-dark tracking-tight mb-3">Email sablon előnézetek</p>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
          {templates.map((template) => (
            <div key={template.type} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-xs font-bold text-neutral-dark">{template.title}</p>
                <p className="text-[10px] text-neutral-medium line-clamp-1">{template.subject}</p>
              </div>
              <div className="h-52 overflow-auto p-2 bg-gray-50">
                <div
                  className="rounded-lg bg-white border border-gray-100 overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: template.html }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {message && (
        <p className={cn("mt-3 text-xs font-medium", message.includes("siker") ? "text-emerald-600" : "text-red-600")}>
          {message}
        </p>
      )}

      <div className="flex justify-end mt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary rounded-xl hover:bg-primary-dark shadow-sm shadow-primary/20 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
          Mentés
        </button>
      </div>
    </div>
  );
}

function LoyaltySettings() {
  const [form, setForm] = useState<LoyaltySettingsModel>({
    enabled: true,
    earnOnDelivered: true,
    earnDivisor: 100,
    pointValueHuf: 1,
    maxRedeemPercent: 100,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/admin/loyalty-settings", { cache: "no-store" });
        if (!response.ok) throw new Error("Nem sikerült betölteni a Babapont beállításokat.");
        const data = (await response.json()) as { settings: LoyaltySettingsModel };
        setForm(data.settings);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Betöltési hiba");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/loyalty-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await response.json()) as { settings?: LoyaltySettingsModel; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Mentési hiba");
      if (data.settings) setForm(data.settings);
      setMessage("Babapont beállítások mentve.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Mentési hiba");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-neutral-medium">
        <Loader2 className="size-4 animate-spin" />
        Babapont beállítások betöltése...
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-sm font-bold text-neutral-dark tracking-tight mb-4">Babapont beállítások</h2>
      <SettingRow label="Babapont rendszer aktív">
        <Toggle checked={form.enabled} onChange={(checked) => setForm((prev) => ({ ...prev, enabled: checked }))} />
      </SettingRow>
      <SettingRow label="Pont jóváírása csak Teljesítve státusznál">
        <Toggle
          checked={form.earnOnDelivered}
          onChange={(checked) => setForm((prev) => ({ ...prev, earnOnDelivered: checked }))}
        />
      </SettingRow>
      <SettingRow label="Pontképzés osztó" description="Alap: végösszeg / 100">
        <input
          type="number"
          min={1}
          value={form.earnDivisor}
          onChange={(e) => setForm((prev) => ({ ...prev, earnDivisor: Math.max(1, Number(e.target.value || 1)) }))}
          className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </SettingRow>
      <SettingRow label="1 pont értéke (Ft)" description="Mennyit érjen 1 Babapont levonáskor">
        <input
          type="number"
          min={1}
          value={form.pointValueHuf}
          onChange={(e) => setForm((prev) => ({ ...prev, pointValueHuf: Math.max(1, Number(e.target.value || 1)) }))}
          className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </SettingRow>
      <SettingRow label="Max. felhasználható arány (%)" description="Pl. 100 = teljes végösszeg is fizethető ponttal">
        <input
          type="number"
          min={0}
          max={100}
          value={form.maxRedeemPercent}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              maxRedeemPercent: Math.min(100, Math.max(0, Number(e.target.value || 0))),
            }))
          }
          className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </SettingRow>
      {message && (
        <p className={cn("mt-3 text-xs font-medium", message.includes("mentve") ? "text-emerald-600" : "text-red-600")}>
          {message}
        </p>
      )}
      <div className="flex justify-end mt-4">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary rounded-xl hover:bg-primary-dark shadow-sm shadow-primary/20 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
          Mentés
        </button>
      </div>
    </div>
  );
}

function NotificationSettings() {
  const [form, setForm] = useState<NotificationSettingsModel>({
    newOrderNotification: true,
    lowStockAlert: true,
    weeklySummary: true,
    aiAgentAlert: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/admin/notification-settings", { cache: "no-store" });
        const data = (await response.json()) as {
          settings?: NotificationSettingsModel;
          error?: string;
        };
        if (!response.ok || !data.settings) {
          throw new Error(data.error ?? "Nem sikerült betölteni az értesítési beállításokat.");
        }
        setForm(data.settings);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Betöltési hiba");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/notification-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await response.json()) as {
        settings?: NotificationSettingsModel;
        error?: string;
      };
      if (!response.ok || !data.settings) {
        throw new Error(data.error ?? "Mentési hiba");
      }
      setForm(data.settings);
      setMessage("Értesítési beállítások mentve.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Mentési hiba");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-neutral-medium">
        <Loader2 className="size-4 animate-spin" />
        Értesítési beállítások betöltése...
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-sm font-bold text-neutral-dark tracking-tight mb-4">Értesítési beállítások</h2>
      <SettingRow label="Új rendelés értesítés" description="Email értesítés minden új rendelésről">
        <Toggle
          checked={form.newOrderNotification}
          onChange={(checked) => setForm((prev) => ({ ...prev, newOrderNotification: checked }))}
        />
      </SettingRow>
      <SettingRow label="Készlethiány riasztás" description="Értesítés ha egy termék készlete 5 alá csökken">
        <Toggle
          checked={form.lowStockAlert}
          onChange={(checked) => setForm((prev) => ({ ...prev, lowStockAlert: checked }))}
        />
      </SettingRow>
      <SettingRow label="Heti összesítő" description="Heti bevételi és rendelési összesítő email">
        <Toggle
          checked={form.weeklySummary}
          onChange={(checked) => setForm((prev) => ({ ...prev, weeklySummary: checked }))}
        />
      </SettingRow>
      <SettingRow label="AI agent riasztások" description="Értesítés ha egy agent hibát észlel">
        <Toggle
          checked={form.aiAgentAlert}
          onChange={(checked) => setForm((prev) => ({ ...prev, aiAgentAlert: checked }))}
        />
      </SettingRow>
      {message && (
        <p className={cn("mt-3 text-xs font-medium", message.includes("mentve") ? "text-emerald-600" : "text-red-600")}>
          {message}
        </p>
      )}
      <div className="flex justify-end mt-4">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary rounded-xl hover:bg-primary-dark shadow-sm shadow-primary/20 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
          Mentés
        </button>
      </div>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div>
      <h2 className="text-sm font-bold text-neutral-dark tracking-tight mb-4">Biztonsági beállítások</h2>
      <SettingRow label="Kétfaktoros hitelesítés" description="Extra biztonság az admin fiókhoz">
        <Toggle />
      </SettingRow>
      <SettingRow label="Session timeout" description="Automatikus kijelentkezés (percben)">
        <InputField defaultValue="60" />
      </SettingRow>
      <SettingRow label="IP korlátozás" description="Csak megadott IP-kről elérhető az admin">
        <Toggle />
      </SettingRow>
      <SettingRow label="Jelszó módosítás">
        <button className="px-3 py-1.5 text-[10px] font-bold text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors">
          Jelszó módosítása
        </button>
      </SettingRow>
      <div className="flex justify-end mt-4">
        <button className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary rounded-xl hover:bg-primary-dark shadow-sm shadow-primary/20 transition-colors">
          <Save className="size-3.5" />
          Mentés
        </button>
      </div>
    </div>
  );
}
