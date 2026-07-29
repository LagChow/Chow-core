import { NextResponse } from "next/server";
import { db, deliveryModes, eq } from "@lagchow/database";

export async function GET() {
  try {
    const modes = await db.select().from(deliveryModes).orderBy(deliveryModes.maxDistanceKm);
    return NextResponse.json(modes);
  } catch (error) {
    console.error("Error fetching delivery modes:", error);
    return NextResponse.json({ error: "Failed to fetch delivery modes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, maxDistanceKm, baseFee } = body;

    if (!name || maxDistanceKm == null || baseFee == null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newMode = await db.insert(deliveryModes).values({
      name,
      maxDistanceKm: parseFloat(maxDistanceKm),
      baseFee: parseInt(baseFee, 10),
    }).returning();

    return NextResponse.json(newMode[0]);
  } catch (error) {
    console.error("Error creating delivery mode:", error);
    return NextResponse.json({ error: "Failed to create delivery mode" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
    }

    await db.delete(deliveryModes).where(eq(deliveryModes.id, id));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting delivery mode:", error);
    return NextResponse.json({ error: "Failed to delete delivery mode" }, { status: 500 });
  }
}
