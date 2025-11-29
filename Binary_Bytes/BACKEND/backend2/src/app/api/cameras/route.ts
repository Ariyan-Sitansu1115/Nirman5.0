import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/app/lib/db";
import { getAuthToken, verifyToken } from "@/app/lib/auth";
import Camera from "@/app/models/Camera";

// GET /api/cameras - Get all cameras for the authenticated user
export async function GET(req: NextRequest) {
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

    const cameras = await Camera.find({ userId: decoded.userId }).sort({ createdAt: -1 });
    
    return NextResponse.json({ cameras }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching cameras:", error);
    return NextResponse.json(
      { error: "Failed to fetch cameras", details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/cameras - Create a new camera
export async function POST(req: NextRequest) {
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
    const { id, name, ip, status, risk, securityChecks } = body;

    if (!id || !name || !ip) {
      return NextResponse.json(
        { error: "Missing required fields: id, name, ip" },
        { status: 400 }
      );
    }

    const camera = await Camera.create({
      userId: decoded.userId,
      id,
      name,
      ip,
      status: status || 'vulnerable',
      risk: risk || 'medium',
      securityChecks: securityChecks || {
        strongPassword: false,
        encryption: false,
        authentication: false,
        firewall: false,
        firmware: false,
      },
    });

    return NextResponse.json({ camera }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating camera:", error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Camera with this ID already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create camera", details: error.message },
      { status: 500 }
    );
  }
}

