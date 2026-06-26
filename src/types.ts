export interface Guest {
  id: string;
  name: string;
  token: string;
  status: "pending" | "opened" | "rsvp_yes" | "rsvp_no";
  rsvpGuests: number;
  rsvpMessage: string;
  openCount: number;
  lastOpenedAt?: string;
}

export interface EventTimelineItem {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  dressCode: string;
  icon: string;
}

export interface WeddingSettings {
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

export interface AdminStats {
  totalGuests: number;
  opened: number;
  rsvpYesCount: number;
  rsvpNoCount: number;
  attendingCount: number;
  guests: Guest[];
}
