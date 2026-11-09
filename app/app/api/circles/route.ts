import { NextResponse } from "next/server";

const DJANGO_URL = process.env.DJANGO_API_URL || "http://127.0.0.1:8000/api";

export async function GET() {
  try {
    try {
      const djangoRes = await fetch(`${DJANGO_URL}/circles/`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (djangoRes.ok) {
        const data = await djangoRes.json();
        return NextResponse.json(data);
      }
    } catch {
      // Fallback
    }

    // Default domain pods
    return NextResponse.json({
      status: "success",
      groups: [
        {
          id: "grp_heartbreak",
          title: "Heartbreak & Sudden Uncoupling Circle",
          domain: "Relationship & Betrayal",
          active_peers: 8,
          language: "English",
          type: "SUPPORT_GROUP",
        },
        {
          id: "grp_burnout",
          title: "High-Pressure Tech & Corporate Burnout Pod",
          domain: "Workplace & Academic Collapse",
          active_peers: 14,
          language: "English",
          type: "SUPPORT_GROUP",
        },
        {
          id: "grp_somatic",
          title: "Panic, Agoraphobia & Somatic Anxiety Circle",
          domain: "Panic & Generalized Anxiety",
          active_peers: 11,
          language: "English",
          type: "SUPPORT_GROUP",
        },
        {
          id: "grp_grief",
          title: "Grief & Bereavement Quiet Room",
          domain: "Loss & Mourning",
          active_peers: 6,
          language: "English",
          type: "SUPPORT_GROUP",
        },
        {
          id: "grp_loneliness",
          title: "Deep Loneliness & Isolation Safe Space",
          domain: "Isolation & Existential Void",
          active_peers: 9,
          language: "English",
          type: "SUPPORT_GROUP",
        },
        {
          id: "grp_boundaries",
          title: "Family Boundaries & Toxic Expectation Recovery",
          domain: "Family & Estrangement",
          active_peers: 12,
          language: "English",
          type: "SUPPORT_GROUP",
        },
      ],
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || "Failed to fetch circles." }, { status: 500 });
  }
}

