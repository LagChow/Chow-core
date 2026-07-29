import { NextResponse } from "next/server";
import { db } from "@lagchow/database";
import { deliveryModes } from "@lagchow/database/src/schema";

export async function GET() {
  try {
    const modes = await db.select().from(deliveryModes).orderBy(deliveryModes.maxDistanceKm);
    return NextResponse.json(modes);
  } catch (error) {
    console.error("Error fetching delivery modes:", error);
    return NextResponse.json({ error: "Failed to fetch delivery modes" }, { status: 500 });
  }
}
