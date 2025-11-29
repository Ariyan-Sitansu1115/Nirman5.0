import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/app/lib/db";
import { getAuthToken, verifyToken } from "@/app/lib/auth";
import Threat from "@/app/models/Threat";

// PATCH /api/threats/[id] - Update a threat
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const token = getAuthToken(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await req.json();
    
    const threat = await Threat.findOneAndUpdate(
      { userId: decoded.userId, id: params.id },
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!threat) {
      return NextResponse.json({ error: "Threat not found" }, { status: 404 });
    }

    return NextResponse.json({ threat }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating threat:", error);
    return NextResponse.json(
      { error: "Failed to update threat", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/threats/[id] - Delete a threat
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const token = getAuthToken(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const threat = await Threat.findOneAndDelete({ 
      userId: decoded.userId, 
      id: params.id 
    });

    if (!threat) {
      return NextResponse.json({ error: "Threat not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Threat deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting threat:", error);
    return NextResponse.json(
      { error: "Failed to delete threat", details: error.message },
      { status: 500 }
    );
  }
}

