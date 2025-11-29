import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/app/lib/db";
import { getAuthToken, verifyToken } from "@/app/lib/auth";
import ScanResult from "@/app/models/ScanResult";

// GET /api/scans - Get all scan results for the authenticated user
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

    const query: any = { userId: decoded.userId };
    if (status && status !== 'all') {
      query.status = status;
    }

    const scanResults = await ScanResult.find(query).sort({ timestamp: -1 });
    
    return NextResponse.json({ scanResults }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching scan results:", error);
    return NextResponse.json(
      { error: "Failed to fetch scan results", details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/scans - Create a new scan result
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
    const { id, rtspUrl, vulnerabilities, riskScore, status, timestamp, findings } = body;

    if (!id || !rtspUrl || riskScore === undefined || !status) {
      return NextResponse.json(
        { error: "Missing required fields: id, rtspUrl, riskScore, status" },
        { status: 400 }
      );
    }

    const scanResult = await ScanResult.create({
      userId: decoded.userId,
      id,
      rtspUrl,
      vulnerabilities: vulnerabilities || [],
      riskScore,
      status,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      findings: findings || {
        weakPassword: false,
        openPorts: [],
        outdatedFirmware: false,
        unencryptedStream: false,
        defaultCredentials: false,
      },
    });

    return NextResponse.json({ scanResult }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating scan result:", error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Scan result with this ID already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create scan result", details: error.message },
      { status: 500 }
    );
  }
}

