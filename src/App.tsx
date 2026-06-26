import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Heart, Calendar, MapPin, Clock, Sparkles, Music, AlertCircle, 
  Check, Gift, HelpCircle, ChevronRight, Volume2 
} from "lucide-react";

import { WeddingSettings, EventTimelineItem, Guest } from "./types";
import FallingPetals from "./components/FallingPetals";
import ScratchCard from "./components/ScratchCard";
import AudioPlayer from "./components/AudioPlayer";
import GalleryViewer from "./components/GalleryViewer";

// Map string icon names to Lucide elements
import { Sun, Sparkles as SparklesIcon, Heart as HeartIcon, GlassWater, Landmark } from "lucide-react";

const iconMap: Record<string, any> = {
  Sun: Sun,
  Sparkles: SparklesIcon,
  Heart: HeartIcon,
  GlassWater: GlassWater,
  Landmark: Landmark
};

export default function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [triggerMusic, setTriggerMusic] = useState(false);
  const [guestToken, setGuestToken] = useState<string | null>(null);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [settings, setSettings] = useState<WeddingSettings | null>(null);
  const [events, setEvents] = useState<EventTimelineItem[]>([]);
  const [gallery, setGallery] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Countdown timer state
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  // RSVP Form state
  const [rsvpAttend, setRsvpAttend] = useState<boolean | null>(null);
  const [rsvpGuestsCount, setRsvpGuestsCount] = useState(2);
  const [rsvpMessage, setRsvpMessage] = useState("");
  const [rsvpSuccess, setRsvpSuccess] = useState(false);
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);

  // Confetti / Particles for the big reveal
  const [showConfetti, setShowConfetti] = useState(false);

  // Detect invitation token from path
  useEffect(() => {
    const path = window.location.pathname;
    // Check if path is like /invite/some-token
    const match = path.match(/\/invite\/([^/]+)/);
    if (match) {
      setGuestToken(match[1]);
    }
    
    // Load initial data
    loadWeddingDetails(match ? match[1] : null);
  }, []);

  const loadWeddingDetails = async (token: string | null) => {
    try {
      // Fetch public details
      const detailsRes = await fetch("/api/wedding-details");
      const detailsData = await detailsRes.json();
      setSettings(detailsData.settings);
      setEvents(detailsData.events);
      setGallery(detailsData.gallery);

      if (token) {
        // Fetch specific guest
        const guestRes = await fetch(`/api/invite/${token}`);
        if (guestRes.ok) {
          const guestData = await guestRes.json();
          setGuest(guestData.guest);
          
          // Pre-fill RSVP state if already submitted
          if (guestData.guest.status === "rsvp_yes") {
            setRsvpAttend(true);
            setRsvpGuestsCount(guestData.guest.rsvpGuests || 1);
            setRsvpMessage(guestData.guest.rsvpMessage || "");
          } else if (guestData.guest.status === "rsvp_no") {
            setRsvpAttend(false);
            setRsvpMessage(guestData.guest.rsvpMessage || "");
          }
        }
      }
    } catch (err) {
      console.error("Failed to load details:", err);
    } finally {
      setLoading(false);
    }
  };

  // Log open tracking when card is opened by user
  const trackInvitationOpen = async () => {
    if (!guestToken) return;
    try {
      await fetch(`/api/invite/${guestToken}/open`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Tick Countdown timer
  useEffect(() => {
    if (!settings?.weddingDate) return;

    const timer = setInterval(() => {
      const targetTime = new Date(settings.weddingDate).getTime();
      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        clearInterval(timer);
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setCountdown({ days, hours, minutes, seconds, isExpired: false });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [settings?.weddingDate]);

  const handleOpenInvitation = () => {
    setIsOpen(true);
    setTriggerMusic(true);
    setShowConfetti(true);
    trackInvitationOpen();
    setTimeout(() => {
      setShowConfetti(false);
    }, 5000);
  };

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rsvpAttend === null) return;

    setRsvpSubmitting(true);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: guestToken || "general",
          attend: rsvpAttend,
          rsvpGuests: rsvpAttend ? rsvpGuestsCount : 0,
          message: rsvpMessage
        })
      });

      if (res.ok) {
        setRsvpSuccess(true);
        // Reload guest record
        if (guestToken) {
          loadWeddingDetails(guestToken);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRsvpSubmitting(false);
    }
  };

  // Google Calendar URL generator
  const getGoogleCalendarUrl = () => {
    if (!settings) return "";
    const title = `${settings.brideName} & ${settings.groomName}'s Wedding Celebration`;
    const cleanDate = settings.weddingDate.replace(/[-:]/g, "").split(".")[0];
    const details = "You are cordially invited to join us in celebrating our marriage! ✨";
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${cleanDate}/${cleanDate}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(settings.venueName + ", " + settings.venueAddress)}`;
  };

  // ICS file calendar link download
  const getIcsCalendarBlob = () => {
    if (!settings) return "";
    const cleanDate = settings.weddingDate.replace(/[-:]/g, "").split(".")[0];
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Interactive Wedding Invitation//EN
BEGIN:VEVENT
UID:wedding-${Date.now()}
DTSTAMP:${cleanDate}Z
DTSTART:${cleanDate}
DTEND:${cleanDate}
SUMMARY:${settings.brideName} & ${settings.groomName}'s Wedding
LOCATION:${settings.venueName}, ${settings.venueAddress}
DESCRIPTION:You are cordially invited to join us in celebrating our marriage! ✨
END:VEVENT
END:VCALENDAR`;
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    return URL.createObjectURL(blob);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-4">
        <Heart className="w-8 h-8 text-brand-accent animate-bounce mb-2 fill-brand-accent/20" />
        <span className="font-serif text-sm tracking-widest text-brand-gold animate-pulse uppercase">
          Opening Sealed Invitation...
        </span>
      </div>
    );
  }

  // Fallback default settings
  const coupleName = `${settings?.brideName || "Meera"} & ${settings?.groomName || "Aarav"}`;
  const monogram = settings?.monogramText || "M & A";

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex justify-center items-center font-sans antialiased relative selection:bg-brand-peach/35 overflow-x-hidden">
      
      {/* Dynamic luxury floral background overlay */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none select-none z-0">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <pattern id="floral" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
            <path d="M100 20 C120 50 150 50 180 80 S150 150 100 180 S20 150 20 80 S80 50 100 20" fill="none" stroke="#D4AF37" strokeWidth="0.5" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#floral)" />
        </svg>
      </div>
      
      {/* Background audio player (floating and persistent) */}
      <AudioPlayer url={settings?.musicUrl || ""} triggerPlay={triggerMusic} />

      {/* MAIN MOBILE CONTAINER - Optimized for smartphones */}
      <div className="w-full max-w-md min-h-screen bg-brand-bg relative overflow-x-hidden flex flex-col justify-between shadow-2xl pb-10 border-x border-brand-gold/20 z-10">
        
        {/* WELCOME OPENING CARD OVERLAY */}
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              id="welcome-screen"
              initial={{ opacity: 1 }}
              exit={{ y: "-100%", opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="absolute inset-0 bg-brand-bg z-50 flex flex-col justify-center items-center text-center p-6 overflow-hidden select-none border-[12px] border-brand-cream rounded-[2.5rem] gap-y-5 sm:gap-y-6"
            >
              {/* Floral background inside welcome overlay */}
              <div className="absolute inset-0 opacity-[0.06] pointer-events-none select-none z-0">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <pattern id="floral-welcome" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
                    <path d="M100 20 C120 50 150 50 180 80 S150 150 100 180 S20 150 20 80 S80 50 100 20" fill="none" stroke="#D4AF37" strokeWidth="0.5" />
                  </pattern>
                  <rect width="100%" height="100%" fill="url(#floral-welcome)" />
                </svg>
              </div>

              {/* Luxury floral golden frame design */}
              <div className="absolute top-0 inset-x-0 h-40 bg-[linear-gradient(to_bottom,rgba(212,175,55,0.15),transparent)] pointer-events-none z-10" />
              
              {/* Couple portrait portrait image */}
              <div className="relative z-10">
                <div className="w-36 h-36 rounded-full border-2 border-brand-gold overflow-hidden p-1 bg-brand-cream shadow-lg mx-auto">
                  <img
                    src={settings?.coupleImageUrl}
                    alt="The Wedding Couple"
                    className="w-full h-full object-cover rounded-full"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-brand-cream rounded-full border border-brand-gold/35 flex items-center justify-center shadow">
                  <Heart className="w-3.5 h-3.5 text-brand-accent fill-brand-accent animate-pulse" />
                </div>
              </div>

              {/* Title & Monogram */}
              <div className="space-y-3 px-4 z-10">
                <span className="font-sans text-[10px] font-semibold tracking-[0.2em] text-brand-gold uppercase">
                  Are Cordially Invited To Celebrate
                </span>
                
                {/* Monogram Badge */}
                <div className="w-12 h-12 rounded-full border border-brand-gold/30 flex items-center justify-center font-serif text-base text-brand-gold font-bold tracking-widest bg-brand-cream/60 shadow-sm mx-auto my-1.5">
                  {monogram}
                </div>

                <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-brand-text leading-tight">
                  {settings?.brideName}
                  <span className="block font-sans font-light italic text-xl sm:text-2xl text-brand-accent my-0.5">&</span>
                  {settings?.groomName}
                </h1>

                <p className="font-sans text-[10px] tracking-widest text-brand-gold uppercase mt-1">
                  Save The Date • 2026
                </p>
              </div>

              {/* Tap to Open Interaction Button */}
              <div className="space-y-3 w-full px-6 z-10">
                {guest && (
                  <div className="space-y-0.5">
                    <p className="font-sans text-[9px] text-brand-text/50 uppercase tracking-widest">Specially Sealed For</p>
                    <p className="font-serif text-xs sm:text-sm font-bold text-brand-accent">{guest.name}</p>
                  </div>
                )}
                
                <motion.button
                  id="open-invitation-btn"
                  onClick={handleOpenInvitation}
                  className="w-full py-3 px-6 bg-brand-accent text-white rounded-xl text-sm font-semibold tracking-wider uppercase shadow-md flex items-center justify-center gap-2 hover:bg-brand-accent/90 cursor-pointer border border-brand-peach/30"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Sparkles className="w-4 h-4 text-brand-peach animate-spin" />
                  Tap to Open Invitation
                </motion.button>
                <p className="text-[10px] text-brand-text/60 italic">Turns on beautiful background music ♫</p>
              </div>

              {/* Bottom design margin */}
              <div className="absolute bottom-0 inset-x-0 h-28 bg-[linear-gradient(to_top,rgba(212,175,55,0.08),transparent)] pointer-events-none" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* REVEAL PARTICLES AND FIREWORKS ANIMATIONS */}
        <FallingPetals />
        {showConfetti && (
          <div className="absolute inset-x-0 top-1/4 pointer-events-none flex flex-col items-center z-30">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [0.8, 1.2, 1], opacity: [0, 1, 0] }}
              transition={{ duration: 1.5 }}
              className="font-serif text-4xl text-brand-gold font-extrabold"
            >
              ✨ Welcome! ✨
            </motion.div>
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: [0, -40], opacity: [1, 0] }}
              transition={{ duration: 2, delay: 0.3 }}
              className="text-xs text-brand-accent font-medium"
            >
              🌸 Falling Love 🌸
            </motion.div>
          </div>
        )}

        {/* SCROLLABLE INVITATION SECTIONS */}
        <div className="flex-1 w-full space-y-12">
          
          {/* Header Monogram Cover Banner */}
          <section className="bg-brand-cream border-b border-brand-gold/15 px-6 pt-10 pb-8 text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-bg rounded-full border border-brand-gold/20">
              <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
              <span className="font-sans text-[10px] font-bold tracking-widest text-brand-accent uppercase">Official Wedding Invite</span>
            </div>
            
            <h2 className="font-serif text-3xl font-bold tracking-tight text-brand-text">
              {coupleName}
            </h2>
            <p className="font-serif text-xs italic text-brand-text/75 max-w-xs mx-auto">
              "Two hearts joining in friendship, love, and life. You are a special part of our story, and we invite you to share this day."
            </p>

            {guest ? (
              <div className="mt-6 p-4 bg-brand-bg rounded-2xl border border-brand-gold/20 max-w-sm mx-auto">
                <span className="text-[10px] text-brand-text/50 font-bold uppercase tracking-wider block mb-1">Honored Guest</span>
                <p className="font-serif text-lg font-bold text-brand-accent">{guest.name}</p>
                <p className="text-[11px] text-brand-text/80 leading-relaxed mt-1">We would be absolutely delighted to have your presence on our auspicious day.</p>
              </div>
            ) : (
              <div className="mt-6 p-4 bg-brand-bg rounded-2xl border border-brand-gold/20 max-w-sm mx-auto">
                <span className="text-[10px] text-brand-text/50 font-bold uppercase tracking-wider block mb-1">Honored Guest</span>
                <p className="font-serif text-base font-bold text-brand-accent">Dear Family & Friends</p>
                <p className="text-[11px] text-brand-text/80 leading-relaxed mt-1">We would be absolutely delighted to have your presence on our auspicious day.</p>
              </div>
            )}
          </section>

          {/* INTERACTIVE SCRATCH TO REVEAL */}
          <section className="px-4">
            <div className="bg-brand-cream rounded-2xl border border-brand-gold/20 p-2 shadow-sm">
              <ScratchCard
                dateStr="Saturday, Nov 28, 2026"
                timeStr="Wedding ceremony starts 04:00 PM"
                venueName={settings?.venueName || "The Grand Palace Pavilion"}
                venueAddress={settings?.venueAddress || ""}
              />
            </div>
          </section>

          {/* DYNAMIC COUNTDOWN TIMER */}
          <section className="px-6 text-center space-y-4">
            <h3 className="font-serif text-sm tracking-widest text-brand-gold uppercase font-semibold">Ticking To Forever</h3>
            
            <div className="grid grid-cols-4 gap-2.5 max-w-xs mx-auto">
              {/* Days circle */}
              <div className="bg-brand-cream border border-brand-gold/20 rounded-2xl p-2 shadow-sm flex flex-col items-center">
                <span className="font-serif text-xl font-bold text-brand-text">{countdown.days}</span>
                <span className="text-[9px] font-medium text-brand-text/60 uppercase tracking-wider">Days</span>
              </div>
              {/* Hours circle */}
              <div className="bg-brand-cream border border-brand-gold/20 rounded-2xl p-2 shadow-sm flex flex-col items-center">
                <span className="font-serif text-xl font-bold text-brand-text">{countdown.hours}</span>
                <span className="text-[9px] font-medium text-brand-text/60 uppercase tracking-wider">Hours</span>
              </div>
              {/* Minutes circle */}
              <div className="bg-brand-cream border border-brand-gold/20 rounded-2xl p-2 shadow-sm flex flex-col items-center">
                <span className="font-serif text-xl font-bold text-brand-text">{countdown.minutes}</span>
                <span className="text-[9px] font-medium text-brand-text/60 uppercase tracking-wider">Min</span>
              </div>
              {/* Seconds circle */}
              <div className="bg-brand-cream border border-brand-gold/20 rounded-2xl p-2 shadow-sm flex flex-col items-center">
                <span className="font-serif text-xl font-bold text-brand-accent">{countdown.seconds}</span>
                <span className="text-[9px] font-medium text-brand-text/60 uppercase tracking-wider">Sec</span>
              </div>
            </div>

            {countdown.isExpired && (
              <p className="text-xs text-brand-gold font-semibold">✨ Today is the Auspicious Day! ✨</p>
            )}
          </section>

          {/* VISUAL IMAGE GALLERY */}
          <section className="bg-brand-cream py-6 border-y border-brand-gold/15">
            <GalleryViewer images={gallery} />
          </section>

          {/* EVENT TIMELINE */}
          <section className="px-6 space-y-6">
            <div className="text-center">
              <h3 className="font-serif text-sm tracking-widest text-brand-gold uppercase font-semibold">The Wedding Schedule</h3>
              <p className="text-[11px] text-brand-text/60 italic mt-1">Please grace us with your arrival for all functions</p>
            </div>

            <div className="relative border-l border-brand-gold/30 pl-6 ml-3 space-y-6">
              {events.map((evt) => {
                const EvtIcon = iconMap[evt.icon] || Heart;
                return (
                  <div key={evt.id} className="relative">
                    {/* Floating circle with Icon */}
                    <div className="absolute -left-[35px] top-0.5 w-6 h-6 rounded-full bg-brand-bg border border-brand-gold flex items-center justify-center text-brand-gold shadow-sm">
                      <EvtIcon className="w-3.5 h-3.5" />
                    </div>

                    {/* Timeline card */}
                    <div className="bg-brand-cream border border-brand-gold/20 rounded-2xl p-4 shadow-sm space-y-1.5 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <h4 className="font-serif text-sm font-bold text-brand-text">{evt.title}</h4>
                        <span className="text-[10px] font-sans font-bold bg-brand-bg text-brand-accent px-2 py-0.5 rounded border border-brand-peach/10">
                          {evt.time}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-[10px] text-brand-gold font-medium">
                        <Calendar className="w-3 h-3" />
                        <span>{evt.date}</span>
                      </div>
                      
                      <div className="flex items-start gap-1 text-[10px] text-brand-text/80">
                        <MapPin className="w-3 h-3 text-brand-text/50 mt-0.5" />
                        <span>{evt.venue}</span>
                      </div>

                      <div className="border-t border-brand-gold/10 pt-2 mt-2">
                        <span className="text-[9px] uppercase tracking-wider text-brand-text/50 font-bold block">Dress Code</span>
                        <p className="text-[11px] text-brand-accent font-medium">{evt.dressCode}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* VENUE MAPS & DIRECTIONS CARD */}
          <section className="px-6 space-y-4">
            <h3 className="font-serif text-center text-sm tracking-widest text-brand-gold uppercase font-semibold">The Venue</h3>
            
            <div className="bg-brand-cream border border-brand-gold/20 rounded-2xl p-3 shadow-sm space-y-3 overflow-hidden">
              <div className="h-32 rounded-xl overflow-hidden relative">
                <img
                  src="https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&q=80&w=600"
                  alt="Elegant Palace Pavilion wedding"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-2.5">
                  <span className="font-serif text-xs text-white font-bold tracking-wide">
                    {settings?.venueName}
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <p className="font-bold text-brand-text">{settings?.venueName}</p>
                <p className="text-brand-text/75 leading-relaxed text-[11px]">{settings?.venueAddress}</p>
              </div>

              <a
                id="maps-navigation-link"
                href={settings?.mapLink}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 bg-brand-bg hover:bg-brand-gold/10 border border-brand-gold/30 rounded-xl text-brand-gold font-semibold text-xs tracking-wide flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5" />
                Navigate via Google Maps
              </a>
            </div>
          </section>

          {/* THE RSVP SUBMISSION FORM */}
          <section className="px-6">
            <div className="bg-brand-cream border border-brand-gold/25 rounded-2xl p-5 shadow-md space-y-4 text-center">
              <div className="w-10 h-10 bg-brand-bg rounded-full flex items-center justify-center mx-auto border border-brand-gold/20">
                <Heart className="w-5 h-5 text-brand-gold fill-brand-gold/20" />
              </div>

              <div>
                <h3 className="font-serif text-sm font-bold text-brand-text">Are You Joining Us?</h3>
                <p className="text-[11px] text-brand-text/60 italic">Please RSVP by October 30, 2026</p>
              </div>

              {rsvpSuccess ? (
                <div className="bg-brand-peach/20 border border-brand-peach/30 rounded-xl p-4 text-center space-y-2">
                  <Check className="w-6 h-6 text-brand-accent mx-auto" />
                  <p className="text-xs font-bold text-brand-text">Your RSVP has been submitted!</p>
                  <p className="text-[11px] text-brand-accent">
                    {rsvpAttend ? "Thank you! We can't wait to welcome you. 🎉" : "We are sorry you can't make it. Thank you for letting us know."}
                  </p>
                  <button
                    id="rsvp-change-btn"
                    onClick={() => setRsvpSuccess(false)}
                    className="text-[10px] text-brand-accent font-bold underline cursor-pointer"
                  >
                    Change response
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRsvpSubmit} className="space-y-4 text-left">
                  {/* Attendance toggle buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      id="rsvp-attend-yes"
                      type="button"
                      onClick={() => setRsvpAttend(true)}
                      className={`py-3 rounded-xl border font-semibold text-xs transition-all cursor-pointer ${
                        rsvpAttend === true
                          ? "bg-brand-accent text-white border-brand-accent shadow"
                          : "bg-brand-bg text-brand-text border-brand-gold/20 hover:bg-brand-cream"
                      }`}
                    >
                      ✓ Joyfully Attend
                    </button>
                    <button
                      id="rsvp-attend-no"
                      type="button"
                      onClick={() => setRsvpAttend(false)}
                      className={`py-3 rounded-xl border font-semibold text-xs transition-all cursor-pointer ${
                        rsvpAttend === false
                          ? "bg-brand-peach text-brand-text border-brand-peach shadow"
                          : "bg-brand-bg text-brand-text border-brand-gold/20 hover:bg-brand-cream"
                      }`}
                    >
                      ✗ Respectfully Decline
                    </button>
                  </div>

                  {/* Dynamic guests counter if attending */}
                  {rsvpAttend === true && (
                    <div className="bg-brand-bg rounded-xl p-3 space-y-2 border border-brand-gold/15">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-brand-text">Number of Guests</span>
                        <div className="flex items-center gap-3">
                          <button
                            id="rsvp-guests-minus"
                            type="button"
                            onClick={() => setRsvpGuestsCount(prev => Math.max(1, prev - 1))}
                            className="w-7 h-7 rounded-full bg-brand-cream border border-brand-gold/20 flex items-center justify-center font-bold font-mono text-brand-text active:scale-90 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-bold text-sm font-mono text-brand-text">{rsvpGuestsCount}</span>
                          <button
                            id="rsvp-guests-plus"
                            type="button"
                            onClick={() => setRsvpGuestsCount(prev => Math.min(10, prev + 1))}
                            className="w-7 h-7 rounded-full bg-brand-cream border border-brand-gold/20 flex items-center justify-center font-bold font-mono text-brand-text active:scale-90 cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* RSVP message textarea */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-brand-text/50 font-bold uppercase tracking-wider block">Send a Wish or Note</label>
                    <textarea
                      id="rsvp-message-input"
                      placeholder="Share your wishes or food restrictions here..."
                      value={rsvpMessage}
                      onChange={(e) => setRsvpMessage(e.target.value)}
                      className="w-full p-2.5 border border-brand-gold/20 rounded-xl text-xs bg-brand-bg text-brand-text h-16 resize-none focus:outline-none focus:ring-1 focus:ring-brand-gold focus:bg-brand-bg"
                    />
                  </div>

                  <button
                    id="rsvp-submit-btn"
                    type="submit"
                    disabled={rsvpAttend === null || rsvpSubmitting}
                    className={`w-full py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider text-white shadow transition-all cursor-pointer ${
                      rsvpAttend === null
                        ? "bg-brand-gold/40 cursor-not-allowed"
                        : "bg-brand-accent hover:bg-brand-accent/90 active:scale-95"
                    }`}
                  >
                    {rsvpSubmitting ? "Submitting RSVP..." : "Send Response"}
                  </button>
                </form>
              )}
            </div>
          </section>

          {/* SAVE TO CALENDAR SECTION */}
          <section className="px-6 text-center space-y-4">
            <h3 className="font-serif text-sm tracking-widest text-brand-gold uppercase font-semibold">Keep Us in Mind</h3>
            
            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
              <a
                id="save-gcal-link"
                href={getGoogleCalendarUrl()}
                target="_blank"
                rel="noreferrer"
                className="py-2 px-3 border border-brand-gold/30 rounded-xl text-xs font-semibold bg-brand-cream text-brand-text hover:border-brand-accent hover:bg-brand-accent/5 flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                📅 Google Calendar
              </a>
              <a
                id="save-apple-cal"
                href={getIcsCalendarBlob()}
                download="wedding_invitation.ics"
                className="py-2 px-3 border border-brand-gold/30 rounded-xl text-xs font-semibold bg-brand-cream text-brand-text hover:border-brand-accent hover:bg-brand-accent/5 flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                🍏 Apple / ICS Calendar
              </a>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="text-center py-6 border-t border-brand-gold/15 text-[10px] text-brand-text/50 space-y-2">
            <p>Designed Specially for Aarav & Meera's Guests</p>
            <p className="font-serif italic font-semibold text-brand-gold text-xs">With Love, Aarav & Meera</p>
          </footer>

        </div>
      </div>
    </div>
  );
}
