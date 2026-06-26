import React, { useEffect, useRef, useState } from "react";
import { Music, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AudioPlayerProps {
  url: string;
  triggerPlay?: boolean;
}

export default function AudioPlayer({ url, triggerPlay = false }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Initialize and load preferences
  useEffect(() => {
    const savedVolume = localStorage.getItem("wedding-music-volume");
    if (savedVolume !== null) {
      const volNum = parseFloat(savedVolume);
      setVolume(volNum);
      if (volNum === 0) setIsMuted(true);
    }

    const savedPlayPref = localStorage.getItem("wedding-music-play-pref");
    // Default to false or saved preference
    if (savedPlayPref === "true" && triggerPlay) {
      setIsPlaying(true);
    }
  }, []);

  // Sync audio ref volume and state
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // Handle play/pause
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current
        .play()
        .then(() => {
          localStorage.setItem("wedding-music-play-pref", "true");
        })
        .catch((err) => {
          console.warn("Autoplay block or audio load failure:", err);
          setIsPlaying(false);
        });
    } else {
      audioRef.current.pause();
      localStorage.setItem("wedding-music-play-pref", "false");
    }
  }, [isPlaying, url]);

  // Handle external trigger (e.g. from the Welcome Tap)
  useEffect(() => {
    if (triggerPlay) {
      setIsPlaying(true);
    }
  }, [triggerPlay]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    localStorage.setItem("wedding-music-volume", val.toString());
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (volume === 0) setVolume(0.5);
    } else {
      setIsMuted(true);
    }
  };

  return (
    <div className="fixed bottom-24 right-5 z-40 flex flex-col items-center gap-2">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={url}
        loop
        preload="auto"
      />

      {/* Floating Controls Overlay */}
      <div className="flex items-center bg-white/90 backdrop-blur-md border border-[#F3E5AB]/60 rounded-full px-2 py-1.5 shadow-lg gap-1">
        {/* Play/Pause round rotating vinyl button */}
        <motion.button
          id="music-play-button"
          onClick={togglePlay}
          className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
            isPlaying
              ? "bg-[#B89450] text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
          whileTap={{ scale: 0.9 }}
          animate={isPlaying ? { rotate: 360 } : {}}
          transition={
            isPlaying
              ? { duration: 8, repeat: Infinity, ease: "linear" }
              : { duration: 0 }
          }
        >
          <Music className="w-5 h-5" />
        </motion.button>

        {/* Volume slider toggle */}
        <div className="relative flex items-center">
          <motion.button
            id="music-mute-button"
            onClick={toggleMute}
            onMouseEnter={() => setShowVolumeSlider(true)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 cursor-pointer"
            whileTap={{ scale: 0.9 }}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#B89450]" />
            )}
          </motion.button>

          {/* Volume Slider Popout */}
          <AnimatePresence>
            {showVolumeSlider && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 64, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="overflow-hidden flex items-center h-8 px-1.5 mr-1"
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 accent-[#B89450] h-1 cursor-pointer bg-slate-200 rounded-lg appearance-none"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Simple musical notes floating on playing */}
      {isPlaying && (
        <div className="absolute -top-10 left-1 pointer-events-none">
          <motion.span
            animate={{ y: [-10, -35], x: [0, -10], opacity: [1, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.5 }}
            className="absolute text-xs text-[#B89450] font-bold"
          >
            ♪
          </motion.span>
          <motion.span
            animate={{ y: [-5, -30], x: [0, 8], opacity: [1, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: 0.6 }}
            className="absolute text-[10px] text-pink-400 font-bold ml-4"
          >
            ♫
          </motion.span>
        </div>
      )}
    </div>
  );
}
