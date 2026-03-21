import { NextRequest, NextResponse } from "next/server";
import type { Product } from "@/types";
import { getEffectiveProductBySlug } from "@/lib/server/products";
import { maybeTriggerAutomaticSupplierSync } from "@/lib/server/supplier-sync";

type RouteParams = { params: Promise<{ slug: string }> };

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await maybeTriggerAutomaticSupplierSync();
    const { slug } = await params;
    const product = await getEffectiveProductBySlug(slug);

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("GET /api/products/[slug] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { slug } = await params;
    const product = await getEffectiveProductBySlug(slug);

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const merged: Product = {
      ...product,
      ...body,
      id: product.id,
      slug: product.slug,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(merged);
  } catch (error) {
    console.error("PUT /api/products/[slug] error:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { slug } = await params;
    const product = await getEffectiveProductBySlug(slug);

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Product deleted (simulated)",
    });
  } catch (error) {
    console.error("DELETE /api/products/[slug] error:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
