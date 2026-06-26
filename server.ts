import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

interface Guest {
  id: string;
  name: string;
  token: string;
  status: "pending" | "opened" | "rsvp_yes" | "rsvp_no";
  rsvpGuests: number;
  rsvpMessage: string;
  openCount: number;
  lastOpenedAt?: string;
}

interface EventTimelineItem {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  dressCode: string;
  icon: string;
}

interface WeddingSettings {
  brideName: string;
  groomName: string;
  weddingDate: string; // YYYY-MM-DDTHH:mm:ss
  venueName: string;
  venueAddress: string;
  mapEmbedUrl?: string;
  mapLink: string;
  musicUrl: string;
  coupleImageUrl: string;
  monogramText: string;
}

interface Database {
  settings: WeddingSettings;
  guests: Guest[];
  events: EventTimelineItem[];
  gallery: string[];
}

const DB_FILE = path.join(process.cwd(), "database.json");

const defaultSettings: WeddingSettings = {
  brideName: "Meera",
  groomName: "Aarav",
  weddingDate: "2026-11-28T16:00:00", // November 28, 2026
  venueName: "The Grand Palace Pavilion",
  venueAddress: "Regency Ballroom & Lawns, MG Road, Pune, Maharashtra 411001",
  mapLink: "https://maps.google.com/?q=The+Grand+Palace+Pavilion+Pune",
  musicUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", // stable default audio
  coupleImageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800", // elegant couple silhouette
  monogramText: "A & M"
};

const defaultEvents: EventTimelineItem[] = [
  {
    id: "1",
    title: "Haldi Ceremony",
    date: "November 27, 2026",
    time: "10:00 AM",
    venue: "Palace Sunken Gardens",
    dressCode: "Traditional Yellow / Mustard Elegance",
    icon: "Sun"
  },
  {
    id: "2",
    title: "Sangeet & Cocktail",
    date: "November 27, 2026",
    time: "07:00 PM",
    venue: "Grand Ballroom",
    dressCode: "Glitz, Glamour & Indo-Western Sparkle",
    icon: "Sparkles"
  },
  {
    id: "3",
    title: "Wedding Ceremony (Phere)",
    date: "November 28, 2026",
    time: "04:00 PM",
    venue: "Royal Mandap lawns",
    dressCode: "Traditional Royal Attire (Pastels / Reds)",
    icon: "Heart"
  },
  {
    id: "4",
    title: "Reception Dinner",
    date: "November 28, 2026",
    time: "08:00 PM",
    venue: "The Palace Pavilion Grand Lawns",
    dressCode: "Formal Suits / Tuxedos & Evening Gowns",
    icon: "GlassWater"
  }
];

const defaultGuests: Guest[] = [
  {
    id: "g1",
    name: "Rahul & Family",
    token: "rahul",
    status: "pending",
    rsvpGuests: 0,
    rsvpMessage: "",
    openCount: 0
  },
  {
    id: "g2",
    name: "Priya & Partner",
    token: "priya",
    status: "pending",
    rsvpGuests: 0,
    rsvpMessage: "",
    openCount: 0
  },
  {
    id: "g3",
    name: "Amit Sharma",
    token: "amit",
    status: "pending",
    rsvpGuests: 0,
    rsvpMessage: "",
    openCount: 0
  },
  {
    id: "g4",
    name: "Sneha Patel",
    token: "sneha",
    status: "pending",
    rsvpGuests: 0,
    rsvpMessage: "",
    openCount: 0
  }
];

const defaultGallery: string[] = [
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1607190074257-dd4b7af0309f?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1519225495810-7512c696505a?auto=format&fit=crop&q=80&w=600"
];

// Helper to read database
function getDb(): Database {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading database:", err);
  }
  
  // Create default db
  const db: Database = {
    settings: defaultSettings,
    guests: defaultGuests,
    events: defaultEvents,
    gallery: defaultGallery
  };
  saveDb(db);
  return db;
}

// Helper to save database
function saveDb(db: Database) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving database:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API ROUTES

  // Get Wedding Details & Gallery & Events
  app.get("/api/wedding-details", (req, res) => {
    const db = getDb();
    res.json({
      settings: db.settings,
      events: db.events,
      gallery: db.gallery
    });
  });

  // Verify Guest Token
  app.get("/api/invite/:token", (req, res) => {
    const token = req.params.token.trim().toLowerCase();
    const db = getDb();
    const guest = db.guests.find(g => g.token.toLowerCase() === token);

    if (!guest) {
      return res.status(404).json({ error: "Invitation not found" });
    }

    res.json({ guest, settings: db.settings });
  });

  // Track invitation open
  app.post("/api/invite/:token/open", (req, res) => {
    const token = req.params.token.trim().toLowerCase();
    const db = getDb();
    const guestIndex = db.guests.findIndex(g => g.token.toLowerCase() === token);

    if (guestIndex !== -1) {
      db.guests[guestIndex].openCount += 1;
      db.guests[guestIndex].lastOpenedAt = new Date().toISOString();
      if (db.guests[guestIndex].status === "pending") {
        db.guests[guestIndex].status = "opened";
      }
      saveDb(db);
      res.json({ success: true, openCount: db.guests[guestIndex].openCount });
    } else {
      res.status(404).json({ error: "Guest not found" });
    }
  });

  // Submit RSVP
  app.post("/api/rsvp", (req, res) => {
    const { token, attend, rsvpGuests, message } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }

    const db = getDb();
    const guestIndex = db.guests.findIndex(g => g.token.toLowerCase() === token.trim().toLowerCase());

    if (guestIndex === -1) {
      return res.status(404).json({ error: "Guest not found" });
    }

    db.guests[guestIndex].status = attend ? "rsvp_yes" : "rsvp_no";
    db.guests[guestIndex].rsvpGuests = attend ? Number(rsvpGuests) || 1 : 0;
    db.guests[guestIndex].rsvpMessage = message || "";
    saveDb(db);

    res.json({ success: true, guest: db.guests[guestIndex] });
  });

  // ADMIN ENDPOINTS

  // Admin Login
  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    // Premium secure wedding password
    if (password === "love2026" || password === "admin123") {
      res.json({ token: "admin-jwt-token-placeholder-love2026" });
    } else {
      res.status(401).json({ error: "Invalid password" });
    }
  });

  // Admin auth helper middleware
  const adminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader === "Bearer admin-jwt-token-placeholder-love2026") {
      next();
    } else {
      res.status(403).json({ error: "Unauthorized admin access" });
    }
  };

  // Get Admin Stats
  app.get("/api/admin/stats", adminAuth, (req, res) => {
    const db = getDb();
    const totalGuests = db.guests.length;
    const opened = db.guests.filter(g => g.openCount > 0).length;
    const rsvpYes = db.guests.filter(g => g.status === "rsvp_yes");
    const rsvpNo = db.guests.filter(g => g.status === "rsvp_no");
    
    const attendingCount = rsvpYes.reduce((sum, g) => sum + g.rsvpGuests, 0);

    res.json({
      totalGuests,
      opened,
      rsvpYesCount: rsvpYes.length,
      rsvpNoCount: rsvpNo.length,
      attendingCount,
      guests: db.guests
    });
  });

  // Save Settings
  app.post("/api/admin/settings", adminAuth, (req, res) => {
    const db = getDb();
    db.settings = { ...db.settings, ...req.body };
    saveDb(db);
    res.json({ success: true, settings: db.settings });
  });

  // Save Events List
  app.post("/api/admin/events", adminAuth, (req, res) => {
    const db = getDb();
    if (Array.isArray(req.body)) {
      db.events = req.body;
      saveDb(db);
      res.json({ success: true, events: db.events });
    } else {
      res.status(400).json({ error: "Invalid events format" });
    }
  });

  // Save Gallery List
  app.post("/api/admin/gallery", adminAuth, (req, res) => {
    const db = getDb();
    if (Array.isArray(req.body)) {
      db.gallery = req.body;
      saveDb(db);
      res.json({ success: true, gallery: db.gallery });
    } else {
      res.status(400).json({ error: "Invalid gallery format" });
    }
  });

  // Manage Guests (Add / Update / Delete)
  app.post("/api/admin/guests", adminAuth, (req, res) => {
    const db = getDb();
    const { action, guest } = req.body;

    if (action === "add") {
      const token = guest.name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
      const newGuest: Guest = {
        id: "g_" + Date.now(),
        name: guest.name,
        token: token || "invite-" + Math.floor(Math.random() * 10000),
        status: "pending",
        rsvpGuests: 0,
        rsvpMessage: "",
        openCount: 0
      };
      // Prevent duplicate token
      const exists = db.guests.some(g => g.token === newGuest.token);
      if (exists) {
        newGuest.token = `${newGuest.token}-${Math.floor(Math.random() * 1000)}`;
      }
      db.guests.push(newGuest);
      saveDb(db);
      return res.json({ success: true, guest: newGuest });
    }

    if (action === "update") {
      const idx = db.guests.findIndex(g => g.id === guest.id);
      if (idx !== -1) {
        db.guests[idx] = { ...db.guests[idx], ...guest };
        saveDb(db);
        return res.json({ success: true, guest: db.guests[idx] });
      }
      return res.status(404).json({ error: "Guest not found" });
    }

    if (action === "delete") {
      db.guests = db.guests.filter(g => g.id !== guest.id);
      saveDb(db);
      return res.json({ success: true });
    }

    res.status(400).json({ error: "Invalid action" });
  });

  // Serve static assets in production or use Vite middleware in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
