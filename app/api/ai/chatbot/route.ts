import { NextRequest, NextResponse } from "next/server";
import { getProductsByCategory } from "@/lib/mock-data";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = (body.message ?? "").toLowerCase().trim();

    if (!message) {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      );
    }

    let response: string;

    if (message.includes("pelenka") || message.includes("pelenkák")) {
      const pelenkak = getProductsByCategory("pelenkak");
      const names = pelenkak.slice(0, 3).map((p) => p.name).join(", ");
      response = `Ajánlom a következő pelenka termékeket: ${names}. Melyik érdekel jobban?`;
    } else if (
      message.includes("rendelés") ||
      message.includes("rendeles") ||
      message.includes("követés") ||
      message.includes("kovetes")
    ) {
      response =
        "Kérlek add meg a rendelésszámot (pl. BO-ABC123-XY), hogy nyomon követhessük a csomagodat.";
    } else if (
      message.includes("szállítás") ||
      message.includes("szallitas") ||
      message.includes("kézbesítés")
    ) {
      response =
        "GLS és Magyar Posta szállítással dolgozunk. 20 000 Ft feletti rendelésnél ingyenes a szállítás!";
    } else if (
      message.includes("fizetés") ||
      message.includes("fizetes") ||
      message.includes("kártya")
    ) {
      response =
        "Bankkártyával (Visa, Mastercard) és utalással is fizethetsz. A fizetés biztonságos Stripe rendszeren keresztül történik.";
    } else if (message.includes("viszonteladó") || message.includes("bolt")) {
      response =
        "Viszonteladói programunkról a info@babyonline.hu e-mail címen tudsz többet megtudni.";
    } else {
      response = "Miben segíthetek?";
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error("POST /api/ai/chatbot error:", error);
    return NextResponse.json(
      { error: "Chatbot failed" },
      { status: 500 }
    );
  }
}
