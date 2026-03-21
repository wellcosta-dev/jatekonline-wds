"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { products, categories } from "@/lib/mock-data";
import { formatPrice } from "@/lib/utils";

const QUICK_CHIPS = [
  "Pelenka ajánlás",
  "Szállítási infó",
  "Rendelés követése",
];

function getBotResponse(message: string): string {
  const lower = message.toLowerCase().trim();

  if (
    lower.includes("pelenka") ||
    lower.includes("pelenk") ||
    lower.includes("ajánlás")
  ) {
    const pelenkaCategory = categories.find((c) => c.slug === "pelenkak");
    const pelenkaProducts = products
      .filter(
        (p) =>
          p.categoryId === pelenkaCategory?.id ||
          p.tags.some((t) => t.toLowerCase().includes("pelenka"))
      )
      .slice(0, 2);
    if (pelenkaProducts.length === 0) {
      return "Sajnos jelenleg nincs pelenka a kínálatunkban. Kérjük, nézz vissza később!";
    }
    const list = pelenkaProducts
      .map(
        (p) =>
          `• ${p.name} - ${formatPrice(p.salePrice ?? p.price)} (${p.shortDesc ?? ""})`
      )
      .join("\n");
    return `Íme néhány népszerű pelenka ajánlatunk:\n\n${list}\n\nBöngéssz a pelenkák között: /kategoriak/pelenkak`;
  }

  if (
    lower.includes("szállítás") ||
    lower.includes("szallitas") ||
    lower.includes("kiszállítás") ||
    lower.includes("infó")
  ) {
    return `Szállítási információk:\n\n• Ingyenes szállítás 20 000 Ft feletti rendelés esetén\n• GLS Házhozszállítás: 2 390 Ft (1-2 munkanap)\n• Magyar Posta: 2 390 Ft (2-3 munkanap)\n• Foxpost: 890 Ft (1-2 munkanap)\n\nMagyarországra szállítunk.`;
  }

  if (
    lower.includes("rendelés") ||
    lower.includes("rendeles") ||
    lower.includes("követés") ||
    lower.includes("kovetes") ||
    lower.includes("tracking")
  ) {
    if (/\d/.test(message) && message.length > 5) {
      return "Köszönöm! A rendelésed státusza: Kiszállítás alatt. A csomag várhatóan 1-2 munkanapon belül megérkezik. Követési link: gls.hu";
    }
    return "Kérlek add meg a rendelésszámot (pl. BO-ABC123-XY), hogy nyomon követhessem a csomagodat!";
  }

  return "Köszönöm a kérdésed! Tudok segíteni pelenka ajánlásban, szállítási információkban vagy rendelés követésében. Írd be a kérdésedet vagy válassz egy gyors gombot fent!";
}

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: Date;
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "bot",
      content:
        "Szia! 👋 Miben segíthetek? Kérdezz bátran termékekről, szállításról vagy rendelésedről!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const response = getBotResponse(trimmed);
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        role: "bot",
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 800 + Math.random() * 400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleChipClick = (chip: string) => {
    sendMessage(chip);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-24 right-4 md:right-6 z-50 w-[calc(100vw-2rem)] max-w-md"
          >
            <div className="card shadow-heavy rounded-2xl overflow-hidden flex flex-col max-h-[70vh]">
              <div className="flex items-center justify-between p-4 bg-primary text-white">
                <h3 className="font-display font-bold text-lg">
                  BabyOnline Asszisztens 🤖
                </h3>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Bezárás"
                >
                  <Minus className="size-5" />
                </button>
              </div>

              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px] max-h-[320px]"
              >
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                        msg.role === "user"
                          ? "bg-primary text-white"
                          : "bg-primary-pale text-neutral-dark"
                      )}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-primary-pale rounded-2xl px-4 py-2.5">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-gray-100">
                <div className="flex gap-2 mb-3 flex-wrap">
                  {QUICK_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleChipClick(chip)}
                      className="text-xs px-3 py-1.5 rounded-full bg-neutral-pale hover:bg-primary-pale text-neutral-dark hover:text-primary transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Írd ide a kérdésed..."
                    className="input-field flex-1 py-2.5 text-sm"
                  />
                  <button
                    type="submit"
                    className="btn-primary p-2.5"
                    aria-label="Küldés"
                  >
                    <Send className="size-5" />
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="fixed bottom-6 right-4 md:right-6 z-50 w-14 h-14 rounded-full bg-primary text-white shadow-heavy flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        aria-label="Chat megnyitása"
      >
        <MessageCircle className="size-7" />
      </motion.button>
    </>
  );
}
