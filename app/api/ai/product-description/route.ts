import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const productName = body.productName ?? "Termék";
    const category = body.category ?? "Általános";
    const attributes = body.attributes ?? {};

    const attrStr =
      typeof attributes === "object" && Object.keys(attributes).length > 0
        ? Object.entries(attributes)
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ")
        : "";

    const description = `A ${productName} kiváló választás a ${category} kategóriában. ${attrStr ? `Jellemzők: ${attrStr}. ` : ""}Minőségi anyagokból készült, bababaráttal tesztelt termék. Magyarországi garanciával rendelkezik. Ajánlott minden figyelmes szülőnek.`;

    return NextResponse.json({
      description,
      productName,
      category,
    });
  } catch (error) {
    console.error("POST /api/ai/product-description error:", error);
    return NextResponse.json(
      { error: "Failed to generate description" },
      { status: 500 }
    );
  }
}
