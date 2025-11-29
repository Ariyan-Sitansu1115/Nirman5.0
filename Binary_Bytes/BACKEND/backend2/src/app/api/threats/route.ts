import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/app/lib/db";
import { getAuthToken, verifyToken } from "@/app/lib/auth";
import Threat from "@/app/models/Threat";

// GET /api/threats - Get all threats for the authenticated user
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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');

    const query: any = { userId: decoded.userId };
    if (status && status !== 'all') {
      query.status = status;
    }
    if (severity && severity !== 'all') {
      query.severity = severity;
    }

    const threats = await Threat.find(query).sort({ timestamp: -1 });
    
    return NextResponse.json({ threats }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching threats:", error);
    return NextResponse.json(
      { error: "Failed to fetch threats", details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/threats - Create a new threat
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
    const { id, timestamp, type, severity, source, camera, description, status } = body;

    if (!id || !type || !severity || !source || !camera || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const threat = await Threat.create({
      userId: decoded.userId,
      id,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      type,
      severity,
      source,
      camera,
      description,
      status: status || 'active',
    });

    return NextResponse.json({ threat }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating threat:", error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Threat with this ID already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create threat", details: error.message },
      { status: 500 }
    );
  }
}

