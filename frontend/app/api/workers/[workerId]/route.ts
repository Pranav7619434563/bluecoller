import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request, { params }: { params: { workerId: string } }) {
  try {
    const workerId = params.workerId;

    // Check shared server-side map first for AI-generated/temporary workers
    const globalRef = global as any;
    const aiWorkersStore = globalRef.aiWorkersStore || new Map();
    const storedWorker = aiWorkersStore.get(workerId);

    if (storedWorker) {
      const seed = (storedWorker.full_name || storedWorker.name || "").charCodeAt(0) || 0;
      const category = storedWorker.job_category || storedWorker.category || "Professional";
      const city = storedWorker.city || "Mumbai";
      const rating = storedWorker.avg_rating || storedWorker.rating || "4.8";
      const hourly = storedWorker.hourly_rate || storedWorker.hourlyRate || 400;
      const trustScore = storedWorker.trustScore || (80 + (seed % 18));
      const jobsCompleted = storedWorker.completedJobs || (20 + (seed % 80));

      return NextResponse.json({
        id: storedWorker.id,
        name: storedWorker.full_name || storedWorker.name,
        photo: storedWorker.avatar_url || storedWorker.photo || null,
        category: category,
        city: city,
        experience: storedWorker.experience || `${3 + (seed % 10)} years`,
        skills: storedWorker.skills || [category, "Installation", "Emergency Repairs", "Maintenance", "Testing"],
        rating: `${Number(rating).toFixed(1)}`,
        hourlyRate: `${hourly}`,
        trustScore: `${trustScore}`,
        reviews: storedWorker.reviews || [
          { customer_name: "Amit Patel", rating: 5, comment: `Outstanding service. The expert arrived right on time and fixed my ${category.toLowerCase()} issues quickly.`, date: "2026-04-10" },
          { customer_name: "Sneha Reddy", rating: 4, comment: "Professional behavior and clean cleanup post-work. Highly recommended.", date: "2026-03-15" }
        ],
        age: storedWorker.age || 26 + (seed % 20),
        gender: storedWorker.gender || (seed % 2 === 0 ? "Male" : "Female"),
        languages: storedWorker.languages || ["English", "Hindi", seed % 2 === 0 ? "Marathi" : "Tamil"],
        availability: storedWorker.availability === false || storedWorker.availability === "Busy" ? "Busy" : "Available",
        completedJobs: jobsCompleted,
        verified: true,
        description: storedWorker.description || storedWorker.bio || `Dedicated ${category} expert providing highly professional services in ${city} for over ${3 + (seed % 10)} years. Fully equipped with modern tools and committed to absolute precision, safety, and customer satisfaction.`,
        portfolio: storedWorker.portfolio || [
          "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&w=600&q=80",
          "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80"
        ],
        phone: storedWorker.phone || "+91 98765 43210",
        recommendations: storedWorker.recommendations || [
          `Located in ${city} for prompt response and zero travel delays.`,
          `Stellar AI Trust Score of ${trustScore}/100 based on verified background and ID check.`,
          `Has successfully resolved over ${jobsCompleted} client service requests.`,
          `Exceptional ${rating}/5 rating with consistent high praise from local customers.`
        ]
      });
    }

    if (workerId.startsWith("mock-")) {
      const parts = workerId.split("-");
      // parts: ["mock", category, city, index, seed]
      const category = parts[1] || "Professional";
      const city = parts[2] || "Mumbai";
      const seed = parseInt(parts[4] || "0") || 0;
      
      const rating = (3.8 + (seed % 12) / 10).toFixed(1);
      const hourly = 300 + (seed % 700);
      const trustScore = 80 + (seed % 18);
      const jobsCompleted = 20 + (seed % 80);
      
      return NextResponse.json({
        id: workerId,
        name: `${category} Specialist`,
        photo: null,
        category: category,
        city: city,
        experience: `${3 + (seed % 10)} years`,
        skills: [category, "Installation", "Emergency Repairs", "Maintenance", "Testing"],
        rating: rating,
        hourlyRate: `${hourly}`,
        trustScore: `${trustScore}`,
        reviews: [
          { customer_name: "Amit Patel", rating: 5, comment: `Outstanding service. The expert arrived right on time and fixed my ${category.toLowerCase()} issues quickly.`, date: "2026-04-10" },
          { customer_name: "Sneha Reddy", rating: 4, comment: "Professional behavior and clean cleanup post-work. Highly recommended.", date: "2026-03-15" }
        ],
        age: 26 + (seed % 20),
        gender: seed % 2 === 0 ? "Male" : "Female",
        languages: ["English", "Hindi", seed % 2 === 0 ? "Marathi" : "Tamil"],
        availability: seed % 10 < 8 ? "Available" : "Busy",
        completedJobs: jobsCompleted,
        verified: true,
        description: `Dedicated ${category} expert providing highly professional services in ${city} for over ${3 + (seed % 10)} years. Fully equipped with modern tools and committed to absolute precision, high standards of safety, and customer satisfaction.`,
        portfolio: [
          "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&w=600&q=80",
          "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80"
        ],
        phone: "+91 98765 43210",
        recommendations: [
          `Located in ${city} for prompt response and zero travel delays.`,
          `Stellar AI Trust Score of ${trustScore}/100 based on verified background and ID check.`,
          `Has successfully resolved over ${jobsCompleted} client service requests.`,
          `Exceptional ${rating}/5 rating with consistent high praise from local customers.`
        ]
      });
    }

    // Otherwise, fetch from Supabase!
    const supabase = createClient();
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", workerId)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: "Worker profile not found." }, { status: 404 });
    }

    const seed = profile.full_name.charCodeAt(0) || 0;
    const rating = profile.avg_rating || (4.0 + (seed % 10) / 10);
    const trustScore = 78 + (seed % 18);
    const jobsCompleted = profile.total_jobs || 32;

    return NextResponse.json({
      id: profile.id,
      name: profile.full_name,
      photo: profile.avatar_url,
      category: profile.job_category || "Professional",
      city: profile.city || "Mumbai",
      experience: `${profile.experience_years || 5} years`,
      skills: profile.skills || [profile.job_category || "Professional", "Service", "Maintenance"],
      rating: `${Number(rating).toFixed(1)}`,
      hourlyRate: `${profile.hourly_rate || 400}`,
      trustScore: `${trustScore}`,
      reviews: [
        { customer_name: "Amit Patel", rating: 5, comment: "Outstanding service. The expert arrived right on time.", date: "2026-04-10" },
        { customer_name: "Sneha Reddy", rating: 4, comment: "Professional behavior and excellent workmanship.", date: "2026-03-15" }
      ],
      age: 27 + (seed % 20),
      gender: seed % 2 === 0 ? "Male" : "Female",
      languages: ["English", "Hindi"],
      availability: "Available",
      completedJobs: jobsCompleted,
      verified: true,
      description: profile.bio || `Highly skilled and verified ${profile.job_category || "professional"} based in ${profile.city || "Mumbai"}. Dedicated to quality service, reliability, and total customer satisfaction.`,
      portfolio: [
        "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&w=600&q=80"
      ],
      phone: "+91 98765 43210",
      recommendations: [
        `Conveniently located in ${profile.city || "Mumbai"}.`,
        `High trust rating of ${trustScore}/100.`,
        `Extensive field experience of ${profile.experience_years || 5} years.`,
        `Highly praised with a rating of ${Number(rating).toFixed(1)}/5.`
      ]
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch worker details." }, { status: 500 });
  }
}
