"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function BeallitasokPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    promotions: false,
    newsletter: true,
  });

  useEffect(() => {
    let active = true;
    fetch("/api/account/profile", { cache: "no-store" })
      .then((response) => response.json().then((payload) => ({ response, payload })))
      .then(({ response, payload }) => {
        if (!active || !response.ok) return;
        const user = payload.user as { name?: string; email?: string; phone?: string } | undefined;
        if (!user) return;
        setName(user.name ?? "");
        setEmail(user.email ?? "");
        setPhone(user.phone ?? "");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    try {
      const saved = localStorage.getItem("bo-account-notifications");
      if (saved) {
        setNotifications(JSON.parse(saved));
      }
    } catch {
      // ignore invalid local storage
    }

    return () => {
      active = false;
    };
  }, []);

  const handleSaveProfile = async () => {
    try {
      setNotice(null);
      const response = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "profile", name, phone }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setNotice(payload.error ?? "Nem sikerült menteni a profilt.");
        return;
      }
      setNotice("Sikeres mentés.");
    } catch {
      setNotice("Hálózati hiba miatt a mentés nem sikerült.");
    }
  };

  const handleDeleteAccount = async () => {
    if (deletingAccount) return;
    const confirmed = window.confirm(
      "Biztosan törlöd a fiókod? Ez a művelet nem visszavonható."
    );
    if (!confirmed) return;
    setDeletingAccount(true);
    setNotice(null);
    try {
      const response = await fetch("/api/account/delete", { method: "POST" });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setNotice(payload.error ?? "A fiók törlése sikertelen.");
        setDeletingAccount(false);
        return;
      }
      localStorage.removeItem("bo-auth-user");
      router.replace("/");
    } catch {
      setNotice("Hálózati hiba miatt a fiók törlése sikertelen.");
      setDeletingAccount(false);
    }
  };

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem("bo-account-notifications", JSON.stringify(next));
      return next;
    });
  };

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-dark mb-8">
        Beállítások
      </h1>

      <div className="space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="card p-6 md:p-8"
        >
          <h2 className="text-xl font-extrabold tracking-tight text-neutral-dark mb-6">
            Személyes adatok
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-dark mb-2">
                Név
              </label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-dark mb-2">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="input-field opacity-70"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-dark mb-2">
                Telefon
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="input-field"
              />
            </div>
          </div>
          <button type="button" className="btn-primary mt-4" onClick={handleSaveProfile} disabled={loading}>
            Mentés
          </button>
          {notice && <p className="mt-3 text-sm text-neutral-medium">{notice}</p>}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="card p-6 md:p-8"
        >
          <h2 className="text-xl font-extrabold tracking-tight text-neutral-dark mb-2">
            Jelszó módosítás
          </h2>
          <p className="text-sm text-neutral-medium">
            A jelszó módosítása hamarosan elérhető. Jelenleg kérlek használd az „Elfelejtett jelszó” funkciót.
          </p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="card p-6 md:p-8"
        >
          <h2 className="text-xl font-extrabold tracking-tight text-neutral-dark mb-6 flex items-center gap-2">
            <Bell className="size-5" />
            Értesítések
          </h2>
          <div className="space-y-4">
            {[
              {
                key: "orderUpdates" as const,
                label: "Rendelés státusz frissítések",
                desc: "E-mail értesítés a rendelésed állapotáról",
              },
              {
                key: "promotions" as const,
                label: "Akciók és promóciók",
                desc: "Egyedi ajánlatok és kedvezmények",
              },
              {
                key: "newsletter" as const,
                label: "Hírlevél",
                desc: "Heti tippek és újdonságok",
              },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <div>
                  <div className="font-medium text-neutral-dark">
                    {item.label}
                  </div>
                  <div className="text-sm text-neutral-medium">
                    {item.desc}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleNotification(item.key)}
                  className={cn(
                    "relative w-12 h-6 rounded-full transition-colors",
                    notifications[item.key]
                      ? "bg-primary"
                      : "bg-gray-200"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                      notifications[item.key] ? "left-7" : "left-1"
                    )}
                  />
                </button>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="card p-6 md:p-8 border-red-200"
        >
          <h2 className="text-xl font-extrabold tracking-tight text-red-600 mb-2">
            Fiók törlése
          </h2>
          <p className="text-neutral-medium text-sm mb-4">
            A fiók törlése visszavonhatatlan. Minden adatod véglegesen törlődik.
          </p>
          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={deletingAccount}
            className="font-semibold text-red-600 hover:text-red-700 border border-red-300 hover:border-red-400 px-6 py-3 rounded-xl transition-colors"
          >
            {deletingAccount ? "Törlés..." : "Fiók törlése"}
          </button>
        </motion.section>
      </div>
    </div>
  );
}
