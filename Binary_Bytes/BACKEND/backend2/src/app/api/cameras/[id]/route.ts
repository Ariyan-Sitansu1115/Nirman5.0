import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/app/lib/db";
import { getAuthToken, verifyToken } from "@/app/lib/auth";
import Camera from "@/app/models/Camera";

// GET /api/cameras/[id] - Get a specific camera
export async function GET(
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

    const camera = await Camera.findOne({ 
      userId: decoded.userId, 
      id: params.id 
    });

    if (!camera) {
      return NextResponse.json({ error: "Camera not found" }, { status: 404 });
    }

    return NextResponse.json({ camera }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching camera:", error);
    return NextResponse.json(
      { error: "Failed to fetch camera", details: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/cameras/[id] - Update a camera
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
    
    const camera = await Camera.findOneAndUpdate(
      { userId: decoded.userId, id: params.id },
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!camera) {
      return NextResponse.json({ error: "Camera not found" }, { status: 404 });
    }

    return NextResponse.json({ camera }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating camera:", error);
    return NextResponse.json(
      { error: "Failed to update camera", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/cameras/[id] - Delete a camera
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

    const camera = await Camera.findOneAndDelete({ 
      userId: decoded.userId, 
      id: params.id 
    });

    if (!camera) {
      return NextResponse.json({ error: "Camera not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Camera deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting camera:", error);
    return NextResponse.json(
      { error: "Failed to delete camera", details: error.message },
      { status: 500 }
    );
  }
}

