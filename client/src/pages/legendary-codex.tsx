import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";

import phantomMinnowImg from "../assets/images/legendary-phantom-minnow.png";
import volcanicPerchImg from "../assets/images/legendary-volcanic-perch.png";
import abyssalBassImg from "../assets/images/legendary-abyssal-bass.png";
import frostCatfishImg from "../assets/images/legendary-frost-catfish.png";
import stormSwordfishImg from "../assets/images/legendary-storm-swordfish.png";
import celestialWhaleImg from "../assets/images/legendary-celestial-whale.png";
import neonEelImg from "../assets/images/legendary-neon-eel.png";
import goldenSalmonImg from "../assets/images/legendary-golden-salmon.png";
import shadowLeviathanImg from "../assets/images/legendary-shadow-leviathan.png";

const sealAtTheSeamImg = "/assets/grudge_logo.png";

function UnderwaterBackground() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
      <img
        src="/assets/underwater_scene.png"
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.12,
          filter: "blur(3px) saturate(0.5) hue-rotate(-15deg)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 50% 30%, rgba(15,15,30,0.6) 0%, rgba(10,10,18,0.9) 70%)",
        }}
      />
      <div
        className="codex-ray codex-ray-1"
        style={{
          position: "absolute",
          top: -100,
          left: "15%",
          width: 180,
          height: "120%",
          background: "linear-gradient(180deg, rgba(200,160,80,0.06) 0%, transparent 60%)",
          transform: "rotate(15deg)",
          animation: "codexRay1 10s ease-in-out infinite",
        }}
      />
      <div
        className="codex-ray codex-ray-2"
        style={{
          position: "absolute",
          top: -100,
          left: "65%",
          width: 140,
          height: "120%",
          background: "linear-gradient(180deg, rgba(200,160,80,0.04) 0%, transparent 50%)",
          transform: "rotate(-10deg)",
          animation: "codexRay2 13s ease-in-out infinite",
        }}
      />
      <style>{`
        @keyframes codexRay1 {
          0%, 100% { opacity: 0.4; transform: rotate(15deg) scaleY(1); }
          50% { opacity: 0.8; transform: rotate(17deg) scaleY(1.1); }
        }
        @keyframes codexRay2 {
          0%, 100% { opacity: 0.3; transform: rotate(-10deg) scaleY(1.05); }
          50% { opacity: 0.6; transform: rotate(-8deg) scaleY(0.95); }
        }
      `}</style>
    </div>
  );
}

const legendaries = [
  {
    name: "Phantom Minnow",
    image: phantomMinnowImg,
    stars: 5,
    pts: 500,
    wt: "0.3%",
    spd: 2.2,
    dep: "55%",
    zone: "Deep",
    aura: "rgba(0,255,200,0.35)",
    auraCss: "0, 255, 200",
    lore: `In the lightless corridors between ocean trenches, fishermen speak of a presence that defies the laws of the living sea. The Phantom Minnow is no ordinary creature — it is a fracture in the membrane between worlds, a flickering ghost-light that swims the boundary of existence itself.\n\nAncient deep-sea manuscripts recovered from sunken monasteries describe it as "the fish that dreams itself into being." Wreathed in spectral cyan flame, its translucent body phases in and out of visibility, leaving only afterimages that burn into the retinas of those fortunate — or cursed — enough to witness it.\n\nNo net can hold it. No hook can pierce its ethereal flesh. The Phantom Minnow must be coaxed into capture through patience and a rod attuned to frequencies beyond mortal hearing. Those who have caught one report a sudden chill, a whisper of forgotten names, and the unmistakable sensation that the fish caught them first.`,
    chapter: "I",
    subtitle: "The Ghost Between Tides",
  },
  {
    name: "Volcanic Perch",
    image: volcanicPerchImg,
    stars: 5,
    pts: 600,
    wt: "0.25%",
    spd: 1.6,
    dep: "60%",
    zone: "Deep Ocean",
    aura: "rgba(255,80,0,0.4)",
    auraCss: "255, 80, 0",
    lore: `Where the ocean floor splits open and the earth bleeds molten fire, a creature thrives in conditions that would vaporize steel. The Volcanic Perch has evolved beyond biology — its scales are fused with volcanic glass, each one a tiny furnace burning at temperatures that make the surrounding water boil and hiss.\n\nSubmarine expeditions have recorded footage of entire hydrothermal vent colonies parting before the Volcanic Perch's approach. It doesn't merely survive in extreme heat — it IS the heat. Lava flows around it like a living current, and when it feeds, it superheats its prey into ash before consumption.\n\nThe few specimens ever caught required rods reinforced with obsidian cores and lines woven from deep-earth minerals. Each capture is announced by a column of steam that breaches the surface like a volcanic eruption in miniature. Anglers who've held one describe the experience as "gripping a star."`,
    chapter: "II",
    subtitle: "Born of Magma and Fury",
  },
  {
    name: "Abyssal Bass",
    image: abyssalBassImg,
    stars: 5,
    pts: 750,
    wt: "0.2%",
    spd: 1.4,
    dep: "65%",
    zone: "Abyss",
    aura: "rgba(120,0,255,0.35)",
    auraCss: "120, 0, 255",
    lore: `There exists a depth where light has never reached — not since the oceans first filled their basins billions of years ago. In this eternal darkness, the Abyssal Bass has claimed dominion over a kingdom of shadow and pressure.\n\nColossal beyond reason, this creature radiates an energy that marine biologists cannot classify. It isn't bioluminescence. It isn't radiation. Instruments brought near captured specimens simply... fail. Screens go dark. Compasses spin. The darkness it emanates is not an absence of light but a presence of something else entirely.\n\nDeep-sea fishermen call it "The Void's Appetite." When an Abyssal Bass passes beneath a vessel, the sonar doesn't show a fish — it shows a hole in the ocean. A moving nothing. Those who have reeled one up speak of a bass so heavy with dark energy that hauling it felt like dragging gravity itself from the water.`,
    chapter: "III",
    subtitle: "The Devourer of Light",
  },
  {
    name: "Frost Catfish",
    image: frostCatfishImg,
    stars: 5,
    pts: 800,
    wt: "0.18%",
    spd: 0.9,
    dep: "60%",
    zone: "Deep Ocean",
    aura: "rgba(100,200,255,0.4)",
    auraCss: "100, 200, 255",
    lore: `Some creatures are old enough to remember when the oceans were different. The Frost Catfish remembers when they were ice.\n\nEncased in a living shell of crystalline frost that regenerates faster than it melts, this ancient being drifts through the deep ocean like a frozen comet. The water around it drops to near-absolute zero, creating a sphere of ice crystals that orbits its body like a personal winter.\n\nGeological surveys have found flash-frozen sections of ocean floor bearing the Frost Catfish's unmistakable whisker-marks — some dating back to the last ice age. It doesn't just endure cold; it is the source of cold. Scientists theorize it may be a living remnant of the primordial ice that once covered Earth.\n\nCatching one requires lines that won't shatter at sub-zero temperatures and a rod flexible enough to bend without cracking. When successfully landed, the Frost Catfish leaves a trail of frozen seawater that takes hours to thaw — and the angler's hands never quite feel warm again.`,
    chapter: "IV",
    subtitle: "Winter Given Form",
  },
  {
    name: "Storm Swordfish",
    image: stormSwordfishImg,
    stars: 5,
    pts: 1000,
    wt: "0.12%",
    spd: 2.5,
    dep: "70%",
    zone: "Deep Ocean",
    aura: "rgba(255,255,0,0.35)",
    auraCss: "255, 255, 0",
    lore: `Lightning was born in the sky. But something learned to carry it beneath the waves.\n\nThe Storm Swordfish is velocity incarnate — a living thunderbolt that cuts through the deep ocean at speeds that create sonic booms underwater. Its elongated bill crackles with accumulated electrical charge, and in its wake, the water ionizes into a trail of plasma that illuminates the abyss like a highway of light.\n\nSailors have reported seeing its glow from the surface during storms, a jagged yellow streak beneath the waves that mirrors the lightning above. Some believe the fish doesn't just ride storms — it creates them. Barometric readings plummet when a Storm Swordfish surfaces, and thunder follows within minutes.\n\nOf all the Legendaries, the Storm Swordfish is the most dangerous to catch. Its electric discharge has fried equipment, paralyzed anglers, and once caused a fishing vessel's entire electrical system to overload. Those brave or foolish enough to pursue it use insulated rods and rubber-lined gloves — and still describe the catch as "wrestling a lightning bolt."`,
    chapter: "V",
    subtitle: "The Living Thunderbolt",
  },
  {
    name: "Celestial Whale",
    image: celestialWhaleImg,
    stars: 5,
    pts: 2000,
    wt: "0.05%",
    spd: 0.4,
    dep: "75%",
    zone: "Abyss",
    aura: "rgba(255,180,255,0.3)",
    auraCss: "255, 180, 255",
    lore: `At the uttermost bottom of the world, where the ocean becomes something else — something older than water — the Celestial Whale drifts in eternal meditation.\n\nThis is no mere fish. It is a cosmological event wearing the shape of a whale. Within its translucent body, observers have reported seeing nebulae forming and collapsing, stars being born and dying, entire galaxies spiraling in miniature. It swallowed a dying star eons ago, and that stellar remnant still burns inside it, casting rose-gold light through flesh that seems woven from the fabric of space itself.\n\nThe Celestial Whale is the rarest creature in all the world's oceans — perhaps the rarest creature in existence. Some theologians argue it isn't a creature at all but a fragment of the universe's consciousness, swimming through the deep to observe its own creation from below.\n\nOnly three confirmed catches exist in recorded history. Each angler described the same thing: an overwhelming sense of insignificance, followed by an equally overwhelming sense of belonging. As if, for one moment, they understood their place in the cosmos.\n\nThe Celestial Whale is worth more gbux than any other catch — not because of its size, but because of what it represents. To hold one is to hold a piece of eternity.`,
    chapter: "VI",
    subtitle: "The Star That Swims",
  },
  {
    name: "Neon Eel",
    image: neonEelImg,
    stars: 5,
    pts: 650,
    wt: "0.22%",
    spd: 1.9,
    dep: "55%",
    zone: "Deep",
    aura: "rgba(0,255,100,0.4)",
    auraCss: "0, 255, 100",
    lore: `Beauty in the deep ocean is usually a trap — a lure dangled by something with too many teeth. But the Neon Eel is genuine. Its bioluminescence isn't a hunting mechanism; it's an expression of pure, undiluted life force.\n\nRippling with bands of electric green, vivid cyan, and pulsing magenta, the Neon Eel transforms whatever reef it inhabits into a psychedelic cathedral of light. Other fish follow it, mesmerized, forming processional trains that wind through coral canyons like living ribbons of color.\n\nDeep-sea photographers have spent entire careers pursuing a single clear image of the Neon Eel. The challenge isn't finding one — it's that cameras cannot faithfully reproduce the colors. Every photograph comes out looking muted, a pale shadow of the real thing. The eel's chromatophores produce wavelengths that exist at the edge of human visual perception.\n\nAnglers who have caught one describe a moment of synesthesia — hearing colors, seeing sounds — as the eel's bioluminescent patterns synchronize with their nervous system. The experience is described as equal parts terrifying and transcendent.`,
    chapter: "VII",
    subtitle: "The Painter of the Deep",
  },
  {
    name: "Golden Salmon",
    image: goldenSalmonImg,
    stars: 5,
    pts: 700,
    wt: "0.2%",
    spd: 1.5,
    dep: "60%",
    zone: "Deep Ocean",
    aura: "rgba(255,200,0,0.45)",
    auraCss: "255, 200, 0",
    lore: `Every civilization that has ever fished has told stories of the Golden Salmon. The Mesopotamians called it Apsu's Treasure. The Norse named it Gleipnir's Catch. The Japanese whispered of Kin no Sake.\n\nAll of them were right.\n\nThe Golden Salmon's scales are not merely golden in color — they are gold. Solid, twenty-four-karat gold, grown organically through a biological process that no scientist has been able to replicate. Each scale is a perfect hexagonal plate of pure precious metal, and a full-grown specimen carries enough gold on its body to purchase a small kingdom.\n\nBut the Golden Salmon is not valued merely for its material worth. It is a symbol — of ambition, of impossible dreams made tangible, of the ocean's capacity to create miracles from nothing but salt water and time.\n\nThe fish swims in the deep ocean surrounded by a warm golden radiance that turns the dark water into a cathedral of amber light. Smaller fish orbit it like worshippers around an altar. To see one is said to bring a lifetime of fortune. To catch one is to become legend.`,
    chapter: "VIII",
    subtitle: "Fortune Made Flesh",
  },
  {
    name: "Shadow Leviathan",
    image: shadowLeviathanImg,
    stars: 5,
    pts: 1500,
    wt: "0.08%",
    spd: 0.6,
    dep: "80%",
    zone: "Abyss",
    aura: "rgba(180,0,50,0.35)",
    auraCss: "180, 0, 50",
    lore: `There is a reason the abyss is dark. It isn't because light cannot reach there. It's because something consumed it.\n\nThe Shadow Leviathan is the ocean's oldest nightmare — a titanic entity that exists at the boundary between the physical ocean and something far more ancient. Its body is composed of living shadow, a substance that absorbs all light and radiates a blood-red aura that turns the surrounding water into a crimson void.\n\nEvery creature in the ocean knows to flee when the Shadow Leviathan stirs. Sharks reverse course. Whales change migration routes. Even the other Legendaries give it wide berth. It is not merely a predator — it is the concept of predation given terrible, physical form.\n\nThe few who have encountered it and survived describe a presence that goes beyond size. The Shadow Leviathan doesn't just occupy space — it warps it. Water flows differently near it. Time feels slower. Sound distorts into bass rumbles that vibrate in the chest.\n\nTo catch the Shadow Leviathan is considered the ultimate achievement in all of fishing. It requires the strongest rod, the most potent chum, and a courage that borders on madness. Those who succeed earn a title whispered with equal parts admiration and fear: Leviathan Tamer.`,
    chapter: "IX",
    subtitle: "The End of All Light",
  },
  {
    name: "The Seal at the Seam",
    image: sealAtTheSeamImg,
    stars: 5,
    pts: 5000,
    wt: "0.01%",
    spd: 0.1,
    dep: "99%",
    zone: "The Seam",
    aura: "rgba(30,60,140,0.5)",
    auraCss: "30, 60, 140",
    lore: `There is a place beneath the abyss that has no name in any human language. Cartographers leave it blank. Sonar returns nothing. It is not a depth — it is a boundary. The fishermen who know of it call it the Seam.\n\nThe Seal at the Seam is not a fish in any biological sense. It is a sigil — a living mark pressed into the fabric of the ocean where the physical world ends and something else begins. It does not swim. It does not feed. It simply exists at the absolute bottom, a sentinel at the threshold between what is known and what can never be.\n\nIts form resembles a skull forged from deep-ocean pressure and mineral deposits accumulated over geological epochs. Blue-black and ancient, it pulses with a light that has no visible source — a cold, authoritative glow that seems to come from the concept of depth itself.\n\nNo expedition has ever intentionally reached it. The three documented encounters were accidents — lines cast too deep, hooks dragged by currents into crevasses that should not exist. In each case, the angler reported the same phenomenon: the line went taut with a weight that felt infinite, and then, impossibly, something let itself be pulled.\n\nThe Seal does not resist capture. It allows itself to be taken — briefly — as if granting an audience. Those who have held it describe an understanding that floods the mind: that the ocean has a floor, and beneath that floor is another ocean, and beneath that is another, and the Seal guards every border between them.\n\nIt is the 10th Legendary. The one that was always there, waiting at the seam for someone brave enough — or lost enough — to drop a hook into forever.`,
    chapter: "X",
    subtitle: "The Guardian of the Lowest Deep",
  },
];

export default function LegendaryCodex() {
  const [currentPage, setCurrentPage] = useState(-1);
  const [fadeState, setFadeState] = useState<"in" | "out" | "visible">("in");
  const containerRef = useRef<HTMLDivElement>(null);

  const totalPages = legendaries.length;

  useEffect(() => {
    setFadeState("in");
    const timer = setTimeout(() => setFadeState("visible"), 600);
    return () => clearTimeout(timer);
  }, [currentPage]);

  const goToPage = (page: number) => {
    setFadeState("out");
    setTimeout(() => {
      setCurrentPage(page);
      if (containerRef.current) {
        containerRef.current.scrollTo({ top: 0, behavior: "instant" });
      }
    }, 400);
  };

  const opacity = fadeState === "visible" ? 1 : fadeState === "in" ? 1 : 0;

  return (
    <div
      ref={containerRef}
      style={{
        width: "100vw",
        minHeight: "100vh",
        background: "#0a0a12",
        color: "#e8e0d0",
        fontFamily: "'Georgia', 'Palatino Linotype', 'Book Antiqua', serif",
        overflowY: "auto",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      <UnderwaterBackground />
      <div
        style={{
          position: "fixed",
          top: 12,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 50,
          display: "flex",
          gap: 6,
        }}
      >
        <a
          href="/gameboard.html"
          data-testid="link-gameboard"
          style={{
            background: "rgba(10,10,20,0.85)",
            border: "1px solid rgba(196,160,80,0.2)",
            borderRadius: 6,
            padding: "6px 12px",
            color: "#8888aa",
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 6,
            textDecoration: "none",
            backdropFilter: "blur(10px)",
            transition: "all 0.2s",
            whiteSpace: "nowrap",
          }}
        >
          GAME BOARD
        </a>
        <Link href="/">
          <a
            data-testid="link-play-game"
            style={{
              background: "rgba(10,10,20,0.85)",
              border: "1px solid rgba(196,160,80,0.2)",
              borderRadius: 6,
              padding: "6px 12px",
              color: "#8888aa",
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 6,
              textDecoration: "none",
              backdropFilter: "blur(10px)",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            PLAY GAME
          </a>
        </Link>
      </div>
      <div
        style={{
          transition: "opacity 0.5s ease",
          opacity,
          minHeight: "100vh",
          position: "relative",
          zIndex: 1,
        }}
      >
        {currentPage === -1 ? (
          <CoverPage onEnter={() => goToPage(0)} />
        ) : (
          <ChapterPage
            fish={legendaries[currentPage]}
            pageNum={currentPage}
            totalPages={totalPages}
            onPrev={currentPage > 0 ? () => goToPage(currentPage - 1) : undefined}
            onNext={currentPage < totalPages - 1 ? () => goToPage(currentPage + 1) : undefined}
            onCover={() => goToPage(-1)}
            onGoToPage={goToPage}
          />
        )}
      </div>
    </div>
  );
}

function CoverPage({ onEnter }: { onEnter: () => void }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "40px 20px",
        background: "radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a12 70%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><circle cx=\"20\" cy=\"30\" r=\"0.5\" fill=\"%23ffffff15\"/><circle cx=\"80\" cy=\"20\" r=\"0.3\" fill=\"%23ffffff10\"/><circle cx=\"50\" cy=\"70\" r=\"0.4\" fill=\"%23ffffff12\"/><circle cx=\"10\" cy=\"80\" r=\"0.3\" fill=\"%23ffffff08\"/><circle cx=\"90\" cy=\"60\" r=\"0.5\" fill=\"%23ffffff15\"/><circle cx=\"40\" cy=\"10\" r=\"0.3\" fill=\"%23ffffff10\"/><circle cx=\"70\" cy=\"90\" r=\"0.4\" fill=\"%23ffffff12\"/><circle cx=\"30\" cy=\"50\" r=\"0.6\" fill=\"%23ffffff18\"/></svg>')",
          backgroundSize: "300px 300px",
          opacity: 0.4,
          animation: "twinkle 8s ease-in-out infinite alternate",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            fontSize: "14px",
            letterSpacing: "8px",
            textTransform: "uppercase",
            color: "#8888aa",
            marginBottom: "20px",
          }}
        >
          The Grudge Angeler Chronicles
        </div>

        <h1
          style={{
            fontSize: "clamp(36px, 7vw, 72px)",
            fontWeight: 700,
            lineHeight: 1.1,
            margin: "0 0 8px 0",
            background: "linear-gradient(180deg, #f0e6d0 0%, #c4a050 50%, #8b6914 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 0 30px rgba(200,160,50,0.3))",
          }}
        >
          THE LEGENDARY 10
        </h1>

        <div
          style={{
            fontSize: "clamp(14px, 2.5vw, 22px)",
            color: "#9090b0",
            fontStyle: "italic",
            marginBottom: "40px",
            letterSpacing: "3px",
          }}
        >
          A Codex of the Ultra Rare &mdash; Complete Edition
        </div>

        <div
          style={{
            width: "60px",
            height: "1px",
            background: "linear-gradient(90deg, transparent, #c4a050, transparent)",
            margin: "0 auto 40px",
          }}
        />

        <div
          style={{
            maxWidth: "560px",
            margin: "0 auto 50px",
            fontSize: "clamp(13px, 1.8vw, 16px)",
            lineHeight: 1.9,
            color: "#a0a0b8",
          }}
        >
          Beneath the waves, in depths where sunlight is a forgotten memory,
          ten creatures of impossible power await the boldest anglers.
          Each is a legend. Each defies nature. Together, they are
          <span style={{ color: "#c4a050" }}> The Legendary 10</span> —
          the rarest catches in all the world's oceans.
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginBottom: "50px", flexWrap: "wrap" }}>
          {legendaries.map((fish, i) => (
            <div
              key={i}
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: `rgba(${fish.auraCss}, 0.7)`,
                boxShadow: `0 0 8px rgba(${fish.auraCss}, 0.5)`,
              }}
            />
          ))}
        </div>

        <button
          data-testid="button-enter-codex"
          onClick={onEnter}
          style={{
            background: "transparent",
            border: "1px solid #c4a05060",
            color: "#c4a050",
            padding: "14px 48px",
            fontSize: "14px",
            letterSpacing: "4px",
            textTransform: "uppercase",
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#c4a05015";
            e.currentTarget.style.borderColor = "#c4a050";
            e.currentTarget.style.boxShadow = "0 0 30px rgba(196,160,80,0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "#c4a05060";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          Open the Codex
        </button>

        <div style={{ marginTop: "40px" }}>
          <Link href="/">
            <a
              data-testid="link-back-to-game"
              style={{
                color: "#666680",
                fontSize: "13px",
                textDecoration: "none",
                letterSpacing: "2px",
              }}
            >
              Return to the Waters
            </a>
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes twinkle {
          0% { opacity: 0.3; }
          100% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

interface ChapterProps {
  fish: typeof legendaries[0];
  pageNum: number;
  totalPages: number;
  onPrev?: () => void;
  onNext?: () => void;
  onCover: () => void;
  onGoToPage: (page: number) => void;
}

function ChapterPage({ fish, pageNum, totalPages, onPrev, onNext, onCover, onGoToPage }: ChapterProps) {
  const paragraphs = fish.lore.split("\n\n");

  return (
    <div
      style={{
        minHeight: "100vh",
        maxWidth: "900px",
        margin: "0 auto",
        padding: "40px 24px 80px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "40px",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <button
          data-testid="button-back-to-cover"
          onClick={onCover}
          style={{
            background: "none",
            border: "none",
            color: "#666680",
            cursor: "pointer",
            fontSize: "13px",
            fontFamily: "inherit",
            letterSpacing: "2px",
            padding: "4px 0",
          }}
        >
          The Legendary 10
        </button>
        <div style={{ fontSize: "13px", color: "#555568", letterSpacing: "1px" }}>
          {pageNum + 1} / {totalPages}
        </div>
      </div>

      <div
        style={{
          textAlign: "center",
          marginBottom: "12px",
          fontSize: "13px",
          letterSpacing: "6px",
          textTransform: "uppercase",
          color: "#666680",
        }}
      >
        Chapter {fish.chapter}
      </div>

      <h2
        style={{
          textAlign: "center",
          fontSize: "clamp(28px, 5vw, 48px)",
          fontWeight: 700,
          margin: "0 0 6px 0",
          color: "#f0e6d0",
        }}
      >
        {fish.name}
      </h2>

      <div
        style={{
          textAlign: "center",
          fontSize: "clamp(13px, 2vw, 17px)",
          fontStyle: "italic",
          color: "#9090b0",
          marginBottom: "32px",
        }}
      >
        {fish.subtitle}
      </div>

      <div
        style={{
          width: "40px",
          height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(196,160,80,0.4), transparent)",
          margin: "0 auto 32px",
        }}
      />

      <div
        style={{
          position: "relative",
          marginBottom: "40px",
          borderRadius: "4px",
          overflow: "hidden",
        }}
      >
        <img
          src={fish.image}
          alt={fish.name}
          data-testid={`img-legendary-${fish.name.toLowerCase().replace(/\s+/g, "-")}`}
          style={{
            width: "100%",
            maxWidth: "400px",
            display: "block",
            margin: "0 auto",
            imageRendering: "pixelated",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "4px",
          marginBottom: "24px",
        }}
      >
        {Array.from({ length: fish.stars }).map((_, i) => (
          <span
            key={i}
            style={{
              color: "#c4a050",
              fontSize: "18px",
              textShadow: "0 0 8px rgba(196,160,80,0.5)",
            }}
          >
            &#9733;
          </span>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "40px",
          fontSize: "12px",
          letterSpacing: "1px",
        }}
      >
        {[
          { label: "PTS", value: fish.pts.toLocaleString() },
          { label: "WT", value: fish.wt },
          { label: "SPD", value: fish.spd.toString() },
          { label: "DEP", value: fish.dep },
          { label: "ZONE", value: fish.zone },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              padding: "8px 16px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "2px",
              textAlign: "center",
            }}
          >
            <div style={{ color: "#666680", fontSize: "10px", marginBottom: "4px", textTransform: "uppercase" }}>
              {stat.label}
            </div>
            <div style={{ color: "#c4a050", fontWeight: 600 }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          width: "40px",
          height: "1px",
          background: "linear-gradient(90deg, transparent, #333348, transparent)",
          margin: "0 auto 40px",
        }}
      />

      <div style={{ maxWidth: "640px", margin: "0 auto" }}>
        {paragraphs.map((p, i) => (
          <p
            key={i}
            style={{
              fontSize: "clamp(14px, 1.8vw, 16.5px)",
              lineHeight: 2,
              color: i === 0 ? "#d0c8b8" : "#a0a0b8",
              marginBottom: "24px",
              textAlign: "justify",
              textIndent: i === 0 ? "0" : "2em",
            }}
          >
            {i === 0 && (
              <span
                style={{
                  fontSize: "clamp(36px, 5vw, 52px)",
                  float: "left",
                  lineHeight: 0.8,
                  marginRight: "8px",
                  marginTop: "4px",
                  color: "#c4a050",
                  fontWeight: 700,
                }}
              >
                {p.charAt(0)}
              </span>
            )}
            {i === 0 ? p.slice(1) : p}
          </p>
        ))}
      </div>

      <div
        style={{
          width: "40px",
          height: "1px",
          background: "linear-gradient(90deg, transparent, #333348, transparent)",
          margin: "40px auto",
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          maxWidth: "640px",
          margin: "0 auto",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          {onPrev && (
            <button
              data-testid="button-prev-chapter"
              onClick={onPrev}
              style={{
                background: "none",
                border: "1px solid #333348",
                color: "#8888aa",
                padding: "10px 24px",
                fontSize: "12px",
                letterSpacing: "2px",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#666680";
                e.currentTarget.style.color = "#c0c0d0";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#333348";
                e.currentTarget.style.color = "#8888aa";
              }}
            >
              Previous
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: "4px" }}>
          {legendaries.map((_, i) => (
            <button
              key={i}
              data-testid={`button-page-dot-${i}`}
              onClick={() => onGoToPage(i)}
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                border: "none",
                cursor: "pointer",
                padding: 0,
                background:
                  i === pageNum
                    ? "rgba(196,160,80,0.8)"
                    : "rgba(255,255,255,0.15)",
                boxShadow:
                  i === pageNum
                    ? "0 0 8px rgba(196,160,80,0.4)"
                    : "none",
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>

        <div>
          {onNext && (
            <button
              data-testid="button-next-chapter"
              onClick={onNext}
              style={{
                background: "none",
                border: "1px solid #333348",
                color: "#8888aa",
                padding: "10px 24px",
                fontSize: "12px",
                letterSpacing: "2px",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#666680";
                e.currentTarget.style.color = "#c0c0d0";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#333348";
                e.currentTarget.style.color = "#8888aa";
              }}
            >
              Next
            </button>
          )}
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: "40px" }}>
        <Link href="/">
          <a
            data-testid="link-return-to-game"
            style={{
              color: "#555568",
              fontSize: "12px",
              textDecoration: "none",
              letterSpacing: "2px",
            }}
          >
            Return to the Waters
          </a>
        </Link>
      </div>
    </div>
  );

}
