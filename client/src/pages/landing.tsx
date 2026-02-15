import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";

import oceanBgImg from "@assets/19c5a9e200bbc_1771115046741.png";
import oceanRippleImg from "@assets/19c5a9be75d2a_1771115056616.png";

import phantomMinnowImg from "../assets/images/legendary-phantom-minnow.png";
import volcanicPerchImg from "../assets/images/legendary-volcanic-perch.png";
import abyssalBassImg from "../assets/images/legendary-abyssal-bass.png";
import frostCatfishImg from "../assets/images/legendary-frost-catfish.png";
import stormSwordfishImg from "../assets/images/legendary-storm-swordfish.png";
import celestialWhaleImg from "../assets/images/legendary-celestial-whale.png";
import neonEelImg from "../assets/images/legendary-neon-eel.png";
import goldenSalmonImg from "../assets/images/legendary-golden-salmon.png";
import shadowLeviathanImg from "../assets/images/legendary-shadow-leviathan.png";

import sealAtTheSeamImg from "@assets/b76a7441-d8a5-49d9-aa5e-8271fc3e3022_1771118262487.png";

const legendaryFish = [
  { name: "Phantom Minnow", img: phantomMinnowImg, aura: "rgba(0,255,200,0.4)", chapter: "I" },
  { name: "Volcanic Perch", img: volcanicPerchImg, aura: "rgba(255,80,0,0.4)", chapter: "II" },
  { name: "Abyssal Bass", img: abyssalBassImg, aura: "rgba(120,0,255,0.4)", chapter: "III" },
  { name: "Frost Catfish", img: frostCatfishImg, aura: "rgba(100,200,255,0.4)", chapter: "IV" },
  { name: "Storm Swordfish", img: stormSwordfishImg, aura: "rgba(255,255,0,0.4)", chapter: "V" },
  { name: "Celestial Whale", img: celestialWhaleImg, aura: "rgba(255,180,255,0.3)", chapter: "VI" },
  { name: "Neon Eel", img: neonEelImg, aura: "rgba(0,255,100,0.4)", chapter: "VII" },
  { name: "Golden Salmon", img: goldenSalmonImg, aura: "rgba(255,200,0,0.45)", chapter: "VIII" },
  { name: "Shadow Leviathan", img: shadowLeviathanImg, aura: "rgba(180,0,50,0.35)", chapter: "IX" },
  { name: "The Seal at the Seam", img: sealAtTheSeamImg, aura: "rgba(30,60,140,0.5)", chapter: "X" },
];

const features = [
  { icon: "/assets/lures/golden_fly.png", title: "17 Fish Species", desc: "Across 5 rarity tiers from common to the legendary ultra-rares" },
  { icon: "/assets/icons/gbux.png", title: "Gbux Economy", desc: "Dynamic market, sell fish, complete bounties, build your fortune" },
  { icon: "/assets/lures/prismatic_lure.png", title: "Equipment System", desc: "5 rods, 5 baits, 11 lures, 22 chum items - each with unique stats" },
  { icon: "/assets/rarity_crown.png", title: "The Legendary 10", desc: "Ultra-rare mythic fish with complete lore and unique visual effects" },
  { icon: "/assets/objects/Boat.png", title: "Open Ocean", desc: "8 world scenes from shallow waters to the deepest abyss" },
  { icon: "/assets/icons/Icons_01.png", title: "Leaderboards", desc: "Compete globally with Grudge ID for biggest catch and legendary hauls" },
];

const factionData = [
  { name: "Fabled", img: "/assets/icons/faction_fabled.png", color: "#4fc3f7" },
  { name: "Legion", img: "/assets/icons/faction_legion.png", color: "#f04050" },
  { name: "Crusade", img: "/assets/icons/faction_crusade.png", color: "#ffd54f" },
];

export default function Landing() {
  const [scrollY, setScrollY] = useState(0);
  const [hoveredLegendary, setHoveredLegendary] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => setScrollY(el.scrollTop);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const parallaxOffset = scrollY * 0.3;

  return (
    <div
      ref={containerRef}
      data-testid="landing-page"
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "auto",
        background: "#030a18",
        color: "#e8edf2",
        fontFamily: "'Press Start 2P', monospace",
        position: "relative",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes pulse-glow { 0%,100%{filter:drop-shadow(0 0 15px rgba(79,195,247,0.4))} 50%{filter:drop-shadow(0 0 30px rgba(79,195,247,0.7))} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes bubble-rise { 0%{transform:translateY(0) scale(1);opacity:0.4} 100%{transform:translateY(-100vh) scale(0.5);opacity:0} }
        @keyframes wave { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes ripple-drift { 0%{transform:translate(0,0)} 25%{transform:translate(-8px,3px)} 50%{transform:translate(0,6px)} 75%{transform:translate(8px,3px)} 100%{transform:translate(0,0)} }
        @keyframes legendaryRotate { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes play-pulse { 0%,100%{box-shadow:0 0 20px rgba(79,195,247,0.3),0 0 40px rgba(79,195,247,0.1)} 50%{box-shadow:0 0 30px rgba(79,195,247,0.5),0 0 60px rgba(79,195,247,0.2)} }
        .landing-btn:hover { transform: scale(1.05) !important; }
        .legendary-card:hover { transform: scale(1.08) !important; z-index: 10 !important; }
        .feature-card:hover { border-color: rgba(79,195,247,0.4) !important; background: rgba(15,35,60,0.9) !important; }
      `}</style>

      {/* Ocean Background - Layered base + ripple overlay */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        {/* Base ocean image */}
        <img
          src={oceanBgImg}
          alt=""
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", opacity: 0.25,
            filter: "saturate(0.7) hue-rotate(-10deg)",
            transform: `translateY(${parallaxOffset}px)`,
          }}
        />
        {/* Ripple/wave overlay - aligned on top of base, animated for water effect */}
        <img
          src={oceanRippleImg}
          alt=""
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "cover", opacity: 0.3,
            filter: "saturate(0.8)",
            animation: "ripple-drift 6s ease-in-out infinite",
            mixBlendMode: "screen",
            transform: `translateY(${parallaxOffset}px)`,
          }}
        />
        {/* Dark gradient overlay for readability */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(3,10,24,0.65) 0%, rgba(5,20,40,0.45) 40%, rgba(3,10,24,0.8) 100%)",
        }} />
        {/* Bubbles */}
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            left: `${10 + i * 15}%`,
            bottom: `-${Math.random() * 20}%`,
            width: 4 + Math.random() * 6,
            height: 4 + Math.random() * 6,
            borderRadius: "50%",
            background: "radial-gradient(circle at 30% 30%, rgba(120,200,255,0.4), rgba(60,150,220,0.1))",
            border: "1px solid rgba(120,200,255,0.15)",
            animation: `bubble-rise ${8 + i * 3}s linear infinite`,
            animationDelay: `${i * 2}s`,
          }} />
        ))}
        {/* God rays */}
        <div style={{
          position: "absolute", top: -100, left: "15%", width: 180, height: "120%",
          background: "linear-gradient(180deg, rgba(79,195,247,0.06) 0%, transparent 60%)",
          transform: "rotate(15deg)", opacity: 0.5,
        }} />
        <div style={{
          position: "absolute", top: -100, left: "65%", width: 140, height: "120%",
          background: "linear-gradient(180deg, rgba(79,195,247,0.04) 0%, transparent 50%)",
          transform: "rotate(-10deg)", opacity: 0.4,
        }} />
      </div>

      {/* Navigation Bar */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(3,10,24,0.9)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(79,195,247,0.1)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 20px", height: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/assets/logo.png" alt="Grudge Angeler" style={{ height: 30, imageRendering: "pixelated" }} />
          <span style={{ fontSize: 8, letterSpacing: 2, color: "#4fc3f7" }}>GRUDGE ANGELER</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <a href="#features" data-testid="nav-features" style={{
            fontSize: 6, color: "#8899a8", textDecoration: "none", padding: "6px 10px",
            borderRadius: 4, transition: "color 0.2s",
          }}>FEATURES</a>
          <a href="#legendaries" data-testid="nav-legendaries" style={{
            fontSize: 6, color: "#8899a8", textDecoration: "none", padding: "6px 10px",
            borderRadius: 4, transition: "color 0.2s",
          }}>LEGENDARIES</a>
          <a href="#factions" data-testid="nav-factions" style={{
            fontSize: 6, color: "#8899a8", textDecoration: "none", padding: "6px 10px",
            borderRadius: 4, transition: "color 0.2s",
          }}>FACTIONS</a>
          <Link href="/legendaries">
            <a data-testid="nav-codex" style={{
              fontSize: 6, color: "#8899a8", textDecoration: "none", padding: "6px 10px",
              borderRadius: 4, transition: "color 0.2s",
            }}>CODEX</a>
          </Link>
          <a href="/gameboard.html" data-testid="nav-gameboard" style={{
            fontSize: 6, color: "#8899a8", textDecoration: "none", padding: "6px 10px",
            borderRadius: 4, transition: "color 0.2s",
          }}>GAME BOARD</a>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        position: "relative", zIndex: 1,
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        textAlign: "center", padding: "80px 20px 40px",
      }}>
        <img
          src="/assets/logo.png"
          alt="Grudge Angeler"
          style={{
            width: 200, maxWidth: "60vw", imageRendering: "pixelated",
            animation: "pulse-glow 3s ease-in-out infinite",
            marginBottom: 20,
          }}
        />
        <h1 style={{
          fontSize: "clamp(16px, 4vw, 32px)", letterSpacing: 4,
          background: "linear-gradient(135deg, #4fc3f7, #ffd54f)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          backgroundClip: "text", marginBottom: 12,
        }}>
          GRUDGE ANGELER
        </h1>
        <p style={{
          fontSize: "clamp(6px, 1.5vw, 9px)", color: "#8899a8", maxWidth: 500,
          lineHeight: 2, letterSpacing: 1, marginBottom: 30,
        }}>
          Cast your line into a pixel art ocean of mystery. Hunt 17 species across
          5 rarity tiers. Pursue The Legendary 10. Conquer the abyss.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/play">
            <a
              data-testid="button-play"
              className="landing-btn"
              style={{
                display: "inline-block", padding: "14px 36px",
                background: "linear-gradient(135deg, #0a3a6b, #0d4a8a)",
                border: "2px solid rgba(79,195,247,0.5)", borderRadius: 8,
                color: "#4fc3f7", fontSize: 12, letterSpacing: 3,
                textDecoration: "none", cursor: "pointer",
                animation: "play-pulse 2s ease-in-out infinite",
                transition: "transform 0.2s",
              }}
            >
              PLAY NOW
            </a>
          </Link>
          <Link href="/legendaries">
            <a
              data-testid="button-codex"
              className="landing-btn"
              style={{
                display: "inline-block", padding: "14px 28px",
                background: "rgba(10,15,30,0.8)",
                border: "1px solid rgba(196,160,80,0.3)", borderRadius: 8,
                color: "#c4a050", fontSize: 10, letterSpacing: 2,
                textDecoration: "none", cursor: "pointer",
                transition: "transform 0.2s",
              }}
            >
              THE LEGENDARY CODEX
            </a>
          </Link>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)",
          animation: "float 2s ease-in-out infinite",
        }}>
          <div style={{ fontSize: 6, color: "#4a6070", letterSpacing: 2 }}>SCROLL DOWN</div>
          <div style={{ textAlign: "center", color: "#4a6070", marginTop: 4, fontSize: 10 }}>v</div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{
        position: "relative", zIndex: 1, padding: "60px 20px",
        maxWidth: 1100, margin: "0 auto",
      }}>
        <h2 style={{
          textAlign: "center", fontSize: "clamp(10px, 2vw, 16px)",
          letterSpacing: 4, marginBottom: 40,
          background: "linear-gradient(135deg, #4fc3f7, #8899a8)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>GAME FEATURES</h2>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
        }}>
          {features.map((f, i) => (
            <div
              key={i}
              className="feature-card"
              style={{
                background: "rgba(10,25,50,0.7)",
                border: "1px solid rgba(79,195,247,0.12)",
                borderRadius: 10, padding: 20,
                display: "flex", alignItems: "flex-start", gap: 14,
                transition: "all 0.3s",
                animation: `fadeInUp 0.5s ease ${i * 0.1}s both`,
              }}
            >
              <img src={f.icon} alt="" style={{
                width: 40, height: 40, imageRendering: "pixelated",
                flexShrink: 0, objectFit: "contain",
              }} />
              <div>
                <div style={{ fontSize: 8, color: "#4fc3f7", letterSpacing: 1, marginBottom: 6 }}>{f.title}</div>
                <div style={{ fontSize: 7, color: "#8899a8", lineHeight: 1.8 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Legendaries Section */}
      <section id="legendaries" style={{
        position: "relative", zIndex: 1, padding: "60px 20px",
        maxWidth: 1200, margin: "0 auto",
      }}>
        <h2 style={{
          textAlign: "center", fontSize: "clamp(10px, 2vw, 16px)",
          letterSpacing: 4, marginBottom: 8,
          background: "linear-gradient(135deg, #ffd54f, #f0a020)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>THE LEGENDARY 10</h2>
        <p style={{
          textAlign: "center", fontSize: 7, color: "#4a6070",
          letterSpacing: 1, marginBottom: 40, lineHeight: 2,
        }}>
          Ultra-rare mythic creatures lurking in the deepest waters. Each with a story. Each worth a fortune.
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 14,
        }}>
          {legendaryFish.map((fish, i) => (
            <div
              key={i}
              className="legendary-card"
              data-testid={`legendary-card-${i}`}
              onMouseEnter={() => setHoveredLegendary(i)}
              onMouseLeave={() => setHoveredLegendary(null)}
              onClick={() => navigate(`/legendaries?fish=${i}&from=home`)}
              style={{
                background: "rgba(8,18,35,0.9)",
                border: `1px solid ${hoveredLegendary === i ? fish.aura : "rgba(79,195,247,0.08)"}`,
                borderRadius: 10,
                textAlign: "center",
                transition: "all 0.3s",
                cursor: "pointer",
                position: "relative", overflow: "hidden",
              }}
            >
              {/* Fish image as card background */}
              <div style={{
                position: "absolute", inset: 0,
                backgroundImage: `url(${fish.img})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                imageRendering: "pixelated",
                opacity: hoveredLegendary === i ? 0.35 : 0.15,
                filter: `saturate(1.3) hue-rotate(0deg)`,
                transition: "opacity 0.3s",
                pointerEvents: "none",
              }} />
              {/* Aura gradient overlay */}
              <div style={{
                position: "absolute", inset: 0,
                background: `radial-gradient(circle at 50% 40%, ${fish.aura}, transparent 70%)`,
                opacity: hoveredLegendary === i ? 0.3 : 0.08,
                transition: "opacity 0.3s",
                pointerEvents: "none",
              }} />
              {/* Dark bottom gradient for text readability */}
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(180deg, transparent 30%, rgba(5,12,25,0.85) 75%, rgba(5,12,25,0.95) 100%)",
                pointerEvents: "none",
              }} />

              <div style={{ position: "relative", zIndex: 1, padding: 16 }}>
                <div style={{
                  width: 80, height: 80, margin: "0 auto 10px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative",
                }}>
                  <div style={{
                    position: "absolute", inset: -5,
                    borderRadius: "50%",
                    background: `radial-gradient(circle, ${fish.aura}, transparent 70%)`,
                    opacity: hoveredLegendary === i ? 0.6 : 0.25,
                    transition: "opacity 0.3s",
                  }} />
                  <img
                    src={fish.img}
                    alt={fish.name}
                    style={{
                      width: fish.name === "The Seal at the Seam" ? 56 : 72,
                      height: fish.name === "The Seal at the Seam" ? 56 : 72,
                      imageRendering: "pixelated",
                      position: "relative", zIndex: 1,
                      objectFit: "contain",
                      filter: `drop-shadow(0 0 8px ${fish.aura})`,
                      animation: hoveredLegendary === i ? "float 2s ease-in-out infinite" : "none",
                    }}
                  />
                </div>
                <div style={{
                  fontSize: 5, color: "#6a8090", letterSpacing: 2, marginBottom: 4,
                }}>CHAPTER {fish.chapter}</div>
                <div style={{
                  fontSize: 7, color: "#e8edf2", letterSpacing: 1,
                  textShadow: `0 0 ${hoveredLegendary === i ? 12 : 6}px ${fish.aura}`,
                }}>{fish.name}</div>
                <div style={{ marginTop: 6, display: "flex", justifyContent: "center", gap: 2 }}>
                  {[...Array(5)].map((_, s) => (
                    <span key={s} style={{ color: "#ffd54f", fontSize: 6 }}>*</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 30 }}>
          <Link href="/legendaries">
            <a
              data-testid="button-view-codex"
              className="landing-btn"
              style={{
                display: "inline-block", padding: "12px 24px",
                background: "rgba(196,160,80,0.1)",
                border: "1px solid rgba(196,160,80,0.3)", borderRadius: 8,
                color: "#c4a050", fontSize: 8, letterSpacing: 2,
                textDecoration: "none", cursor: "pointer",
                transition: "transform 0.2s",
              }}
            >
              READ THE FULL CODEX
            </a>
          </Link>
        </div>
      </section>

      {/* The Seal at the Seam - Special Lore Section */}
      <section style={{
        position: "relative", zIndex: 1, padding: "60px 20px",
        maxWidth: 800, margin: "0 auto",
      }}>
        <div style={{
          background: "rgba(5,10,25,0.9)",
          border: "1px solid rgba(30,60,140,0.25)",
          borderRadius: 14, padding: "40px 30px",
          textAlign: "center", position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(circle at 50% 40%, rgba(30,60,140,0.15), transparent 60%)",
            pointerEvents: "none",
          }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 6, color: "#4a6070", letterSpacing: 4, marginBottom: 12 }}>CHAPTER X</div>
            <img
              src={sealAtTheSeamImg}
              alt="The Seal at the Seam"
              style={{
                width: 80, height: 80, imageRendering: "pixelated",
                filter: "drop-shadow(0 0 20px rgba(30,60,140,0.5))",
                marginBottom: 16,
              }}
            />
            <h3 style={{
              fontSize: 12, letterSpacing: 3,
              background: "linear-gradient(135deg, #3060a0, #8899cc)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text", marginBottom: 8,
            }}>THE SEAL AT THE SEAM</h3>
            <div style={{
              fontSize: 7, color: "#556688", letterSpacing: 2, marginBottom: 16,
            }}>The Guardian of the Lowest Deep</div>
            <p style={{
              fontSize: 7, color: "#7788aa", lineHeight: 2.2,
              fontFamily: "'Georgia', serif", maxWidth: 600, margin: "0 auto",
            }}>
              There is a place beneath the abyss that has no name in any human language.
              Cartographers leave it blank. Sonar returns nothing. It is not a depth — it is a boundary.
              The fishermen who know of it call it the Seam. The Seal does not resist capture.
              It allows itself to be taken — briefly — as if granting an audience.
            </p>
            <div style={{
              marginTop: 20, fontSize: 5, color: "#334466", letterSpacing: 3,
            }}>0.01% SPAWN RATE &middot; 5000 PTS &middot; THE SEAM</div>
          </div>
        </div>
      </section>

      {/* Factions Section */}
      <section id="factions" style={{
        position: "relative", zIndex: 1, padding: "60px 20px",
        maxWidth: 900, margin: "0 auto",
      }}>
        <h2 style={{
          textAlign: "center", fontSize: "clamp(10px, 2vw, 16px)",
          letterSpacing: 4, marginBottom: 8,
          color: "#e8edf2",
        }}>CHOOSE YOUR FACTION</h2>
        <p style={{
          textAlign: "center", fontSize: 7, color: "#4a6070",
          letterSpacing: 1, marginBottom: 40, lineHeight: 2,
        }}>
          Three factions. Three paths. One ocean. Select your allegiance and fish with pride.
        </p>
        <div style={{
          display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap",
        }}>
          {factionData.map((faction, i) => (
            <div key={i} style={{
              background: "rgba(10,20,40,0.8)",
              border: `1px solid ${faction.color}33`,
              borderRadius: 12, padding: "30px 40px",
              textAlign: "center", minWidth: 180,
              transition: "all 0.3s",
            }}>
              <img
                src={faction.img}
                alt={faction.name}
                style={{
                  width: 80, height: 80, imageRendering: "pixelated",
                  filter: `drop-shadow(0 0 12px ${faction.color}66)`,
                  marginBottom: 12,
                }}
              />
              <div style={{
                fontSize: 10, color: faction.color, letterSpacing: 2,
              }}>{faction.name.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Equipment Preview */}
      <section style={{
        position: "relative", zIndex: 1, padding: "60px 20px",
        maxWidth: 1000, margin: "0 auto",
      }}>
        <h2 style={{
          textAlign: "center", fontSize: "clamp(10px, 2vw, 16px)",
          letterSpacing: 4, marginBottom: 40,
          color: "#e8edf2",
        }}>YOUR ARSENAL</h2>
        <div style={{
          display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap",
        }}>
          {[
            "/assets/lures/golden_fly.png", "/assets/lures/prismatic_lure.png",
            "/assets/lures/crankbait.png", "/assets/lures/silver_spinner.png",
            "/assets/lures/glow_jig.png", "/assets/lures/deep_diver.png",
            "/assets/lures/spinnerbait.png", "/assets/lures/spoon.png",
            "/assets/lures/storm_shad.png", "/assets/lures/kraken_bait.png",
            "/assets/lures/nightcrawler.png", "/assets/lures/worm.png",
            "/assets/lures/minnow_bait.png", "/assets/lures/leech.png",
            "/assets/lures/maggots.png", "/assets/lures/grub_worm.png",
          ].map((lure, i) => (
            <div key={i} style={{
              width: 52, height: 52,
              background: "rgba(10,20,40,0.7)",
              border: "1px solid rgba(79,195,247,0.1)",
              borderRadius: 8, display: "flex",
              alignItems: "center", justifyContent: "center",
              transition: "all 0.3s",
            }}>
              <img src={lure} alt="" style={{
                width: 36, height: 36, imageRendering: "pixelated", objectFit: "contain",
              }} />
            </div>
          ))}
        </div>
      </section>

      {/* Catch Preview */}
      <section style={{
        position: "relative", zIndex: 1, padding: "40px 20px",
        maxWidth: 900, margin: "0 auto",
      }}>
        <h2 style={{
          textAlign: "center", fontSize: "clamp(8px, 1.5vw, 12px)",
          letterSpacing: 4, marginBottom: 30,
          color: "#8899a8",
        }}>FISH COLLECTION</h2>
        <div style={{
          display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap",
        }}>
          {[1,2,3,4,5,6,7,8].map(n => (
            <div key={n} style={{
              width: 64, height: 64,
              background: "rgba(10,20,40,0.6)",
              border: "1px solid rgba(79,195,247,0.08)",
              borderRadius: 8, display: "flex",
              alignItems: "center", justifyContent: "center",
            }}>
              <img src={`/assets/catch/${n}.png`} alt="" style={{
                width: 48, height: 48, imageRendering: "pixelated", objectFit: "contain",
              }} />
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        position: "relative", zIndex: 1, padding: "80px 20px",
        textAlign: "center",
      }}>
        <div style={{
          fontSize: "clamp(8px, 2vw, 14px)", color: "#8899a8",
          letterSpacing: 2, marginBottom: 20, lineHeight: 2,
        }}>
          The ocean awaits. The Legendary 10 are watching.
        </div>
        <Link href="/play">
          <a
            data-testid="button-play-bottom"
            className="landing-btn"
            style={{
              display: "inline-block", padding: "16px 48px",
              background: "linear-gradient(135deg, #0a3a6b, #0d4a8a)",
              border: "2px solid rgba(79,195,247,0.5)", borderRadius: 8,
              color: "#4fc3f7", fontSize: 14, letterSpacing: 4,
              textDecoration: "none", cursor: "pointer",
              animation: "play-pulse 2s ease-in-out infinite",
              transition: "transform 0.2s",
            }}
          >
            CAST YOUR LINE
          </a>
        </Link>
      </section>

      {/* Footer */}
      <footer style={{
        position: "relative", zIndex: 1,
        borderTop: "1px solid rgba(79,195,247,0.08)",
        padding: "30px 20px", textAlign: "center",
      }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
          <Link href="/play">
            <a style={{ fontSize: 6, color: "#4a6070", textDecoration: "none", letterSpacing: 1 }}>PLAY</a>
          </Link>
          <Link href="/legendaries">
            <a style={{ fontSize: 6, color: "#4a6070", textDecoration: "none", letterSpacing: 1 }}>CODEX</a>
          </Link>
          <a href="/gameboard.html" style={{ fontSize: 6, color: "#4a6070", textDecoration: "none", letterSpacing: 1 }}>GAME BOARD</a>
        </div>
        <div style={{ fontSize: 5, color: "#2a3a4a", letterSpacing: 2 }}>
          GRUDGE ANGELER &middot; molochdagod &middot; 2026
        </div>
        <div style={{ fontSize: 5, color: "#1a2a3a", letterSpacing: 1, marginTop: 6 }}>
          A Grudge Studio Production
        </div>
      </footer>
    </div>
  );
}
