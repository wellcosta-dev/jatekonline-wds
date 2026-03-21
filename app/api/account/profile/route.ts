import { NextRequest, NextResponse } from "next/server";
import type { Address } from "@/types";
import { getSessionUser } from "@/lib/server/api-auth";
import {
  getUserByEmail,
  updateUserAddresses,
  updateUserProfile,
  updateUserWishlist,
} from "@/lib/server/users";

export async function GET(request: NextRequest) {
  try {
    const session = getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: "Nincs aktív session." }, { status: 401 });
    }
    const user = await getUserByEmail(session.email);
    if (!user) {
      return NextResponse.json({ error: "Felhasználó nem található." }, { status: 404 });
    }
    return NextResponse.json({ user });
  } catch (error) {
    console.error("GET /api/account/profile error:", error);
    return NextResponse.json({ error: "Nem sikerült betölteni a profilt." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: "Nincs aktív session." }, { status: 401 });
    }

    const body = (await request.json()) as {
      mode?: "profile" | "addresses" | "wishlist";
      name?: string;
      phone?: string;
      addresses?: Address[];
      wishlist?: string[];
    };

    const mode = body.mode ?? "profile";
    if (mode === "addresses") {
      const user = await updateUserAddresses(session.email, body.addresses ?? []);
      return NextResponse.json({ user });
    }
    if (mode === "wishlist") {
      const user = await updateUserWishlist(session.email, body.wishlist ?? []);
      return NextResponse.json({ user });
    }

    const user = await updateUserProfile(session.email, {
      name: body.name,
      phone: body.phone,
    });
    return NextResponse.json({ user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nem sikerült menteni a profilt.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
