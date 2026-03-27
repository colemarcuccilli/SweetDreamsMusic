'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ChevronDown,
  ChevronRight,
  DollarSign,
  Music,
  Globe,
  TrendingUp,
  Lightbulb,
  Check,
  Loader2,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

interface Section {
  id: string;
  icon: typeof Music;
  title: string;
  subtitle: string;
  content: RoadmapItem[];
}

interface RoadmapItem {
  heading: string;
  body: string[];
}

// Map career_stage values to default expanded section
const CAREER_STAGE_MAP: Record<string, string> = {
  'just-starting': 'foundation',
  emerging: 'creating',
  growing: 'growing',
  established: 'monetizing',
  professional: 'scaling',
};

// ============================================================
// Roadmap Data
// ============================================================

const ROADMAP_SECTIONS: Section[] = [
  {
    id: 'foundation',
    icon: Lightbulb,
    title: 'STAGE 1: LAYING THE FOUNDATION',
    subtitle: 'Before you have a career — building from zero',
    content: [
      {
        heading: 'The Reality Check',
        body: [
          'Most artists start with a day job, and that\'s not something to be ashamed of — it\'s strategic. Your 9-to-5 funds your dream. The goal isn\'t to quit your job tomorrow; it\'s to build something real while you have financial stability.',
          'Set aside a specific monthly budget for music. Even $200/month adds up: that\'s studio time, distribution fees, and basic marketing. Track every dollar. Treat your music like a business from day one, because it is one.',
          'Open a separate bank account or at minimum a spreadsheet. Every dollar in (merch sales, streaming, shows) and every dollar out (studio, beats, mixing, distribution, marketing). If you can\'t track it, you can\'t grow it.',
        ],
      },
      {
        heading: 'Budgeting Your Music Career',
        body: [
          'Here\'s a realistic monthly breakdown for an emerging artist with a $300/month music budget:',
          'Studio time: $120-150 (2-3 hours at Sweet Dreams). Distribution: $20/month (DistroKid) or $0 if annual. Marketing/ads: $50-80. Beats/production: $30-75 (leases). Miscellaneous (artwork, photography): $25-50.',
          'As your music starts generating revenue, reinvest 100% back into your career until you\'re consistently earning. The goal for Year 1 isn\'t profit — it\'s building a catalog, audience, and skills.',
          'Track your ROI per release: If you spent $300 making a single and it earned $50 in streams + got you 200 new followers, that\'s data you can use. Which singles performed best relative to cost? Double down on what works.',
        ],
      },
      {
        heading: 'Defining Your Sound & Brand',
        body: [
          'Before you record anything, answer these questions: What do I sound like? Who am I making music for? What emotion do I want people to feel? What makes me different from the 100,000 other artists in my genre?',
          'Your brand isn\'t just your music — it\'s your visual aesthetic, your story, your personality online, and the experience people have interacting with you. Consistency across all platforms is critical.',
          'Pick 2-3 core colors, a font style, and a visual vibe. Use the same profile picture everywhere. Your Instagram, TikTok, YouTube, Spotify, and SoundCloud should all feel like the same person.',
          'Study 5 artists you admire who are 1-2 levels above you (not superstars — artists who are succeeding at the next stage you want to reach). What are they doing right? How do they present themselves? What can you learn and adapt (not copy)?',
        ],
      },
      {
        heading: 'Building Your First Team',
        body: [
          'You don\'t need a manager, lawyer, and publicist yet. You need: a good engineer (someone who understands your sound), a graphic designer (even a friend who\'s good with Canva), and 2-3 honest listeners who will tell you when something isn\'t good enough.',
          'Your engineer is your most important early relationship. Find someone who gets your vision, communicates well, and pushes you to be better. A great engineer can elevate a good song to a great one.',
          'Networking isn\'t going to industry events and handing out business cards. It\'s building genuine relationships with other artists, producers, videographers, and creatives at your level. Collaborate. Support each other\'s releases. Rise together.',
        ],
      },
    ],
  },
  {
    id: 'creating',
    icon: Music,
    title: 'STAGE 2: CREATING YOUR CATALOG',
    subtitle: 'Your first releases and finding your voice',
    content: [
      {
        heading: 'The Release Strategy',
        body: [
          'Your first release is NOT your masterpiece — it\'s your introduction. Don\'t spend 6 months perfecting one song. Release consistently. Aim for a single every 4-6 weeks when you\'re starting out.',
          'The music industry algorithm gods reward consistency. Spotify\'s editorial team, social media algorithms, and fans all respond to regular output. A single every month builds more momentum than an album every year.',
          'Release strategy for your first year: Start with 3-4 singles to establish your sound. Then a small project (3-5 tracks). Then more singles. Listen to what resonates with your audience and lean into it.',
          'Every release needs a plan. At minimum: 2 weeks of pre-release content, a pre-save campaign, release day push, and 2 weeks of post-release promotion. Use the Project Tracker in your Artist Hub to manage this.',
        ],
      },
      {
        heading: 'In the Studio',
        body: [
          'Come prepared. Studio time is expensive. Have your lyrics written, your beat selected, and your vision clear before you walk in. Wasting 30 minutes figuring out what to record is burning money.',
          'Record reference tracks at home first if possible. Even a phone voice memo of you rapping/singing to the beat helps your engineer understand what you\'re going for.',
          'Trust your engineer\'s ear, but speak up about your vision. Good communication in the booth is everything. If something doesn\'t feel right, say so. It\'s your song.',
          'Get your vocals right at the source. No amount of mixing can fix a lazy vocal take. Do multiple takes. Push yourself. The best take is usually take 5-10, not take 1.',
          'Save everything. Every session file, every rough mix, every reference. You\'d be surprised how often an old recording becomes useful later.',
        ],
      },
      {
        heading: 'Mixing & Mastering',
        body: [
          'Mixing is where your song goes from a rough recording to a polished track. Mastering is the final step that makes it sound professional and consistent across all playback systems.',
          'Don\'t skip mastering. Ever. Unmastered music sounds amateur on streaming platforms. It\'s the difference between "this is a demo" and "this is a record."',
          'Provide reference tracks to your mix engineer — songs that sound how you want your song to sound. This saves time and ensures you\'re on the same page.',
          'Listen to your mix on multiple systems: car speakers, earbuds, laptop speakers, studio monitors. If it sounds good everywhere, it\'s good.',
        ],
      },
      {
        heading: 'Distribution & Metadata',
        body: [
          'Choose a distributor: DistroKid ($22/year unlimited), TuneCore ($30/single), CD Baby (one-time fee), or Amuse (free with slower delivery). For most independent artists, DistroKid is the best value.',
          'Metadata matters more than you think. Your song title, artist name, genre tags, ISRC codes, and songwriter credits all feed into how algorithms discover and categorize your music.',
          'Register your songs with a PRO (Performance Rights Organization): BMI or ASCAP. This is how you get paid when your music is played on radio, in venues, or streamed. It\'s free to sign up. Do it before your first release.',
          'Set your release date at least 3-4 weeks in advance to be eligible for Spotify editorial playlists. Last-minute releases miss the editorial window entirely.',
        ],
      },
    ],
  },
  {
    id: 'growing',
    icon: TrendingUp,
    title: 'STAGE 3: GROWING YOUR AUDIENCE',
    subtitle: 'Marketing, social media, and building real fans',
    content: [
      {
        heading: 'Social Media Strategy',
        body: [
          'You need to be on at least 2-3 platforms consistently. The big three for musicians in 2025+: TikTok (discovery), Instagram (brand/community), YouTube (long-form/deep fans). Pick your primary and be on it daily.',
          'Content pillars: 1) Music content (snippets, behind-the-scenes, studio sessions). 2) Personality content (day-in-the-life, opinions, humor). 3) Value content (tips, storytelling, education). 4) Engagement content (Q&As, polls, replies).',
          'Post at least 4-5 times per week on your main platform. Not every post needs to be a masterpiece. Consistency builds algorithm trust and audience habits.',
          'Engage genuinely. Reply to every comment for your first 1,000 followers. DM people who share your music. Build relationships, not just follower counts. 100 real fans > 10,000 passive followers.',
          'Track your metrics weekly using the Metrics tab in your Artist Hub. Know your numbers. Which posts got the most saves? Which songs drove the most profile visits? Data should inform your content strategy.',
        ],
      },
      {
        heading: 'Playlist Strategy',
        body: [
          'There are three types of playlists: Editorial (Spotify-curated), Algorithmic (Release Radar, Discover Weekly), and User-generated (independent curators).',
          'You can\'t directly pitch to editorial playlists except through Spotify for Artists (which every artist should have). Submit your song 2+ weeks before release. Write a compelling pitch: who you are, what the song is about, why it fits the playlist.',
          'For user-generated playlists: find curators in your genre using tools like SubmitHub, Playlist Push, or manual research. Build relationships with curators. Don\'t spam — curate your pitches.',
          'Your own playlists matter too. Create playlists that include your music alongside similar artists. Share them. This gets your songs in front of fans of related artists.',
        ],
      },
      {
        heading: 'Live Performance',
        body: [
          'Play shows as soon as you have 3-5 songs ready to perform. Don\'t wait until you\'re "ready" — you become ready by performing.',
          'Start small: open mics, local venues, house shows, college events. Build a local following first. Pack a 100-person room before you try to fill a 500-person room.',
          'Every show is a networking opportunity. Bring cards with your QR code/links. Get on every opening slot you can. Supporting bigger artists exposes you to new audiences.',
          'Record every performance. Even a phone video from the crowd. This is content for your social media and proof of your live show for booking agents.',
        ],
      },
      {
        heading: 'Building Your Email List',
        body: [
          'Social media followers are rented. Email subscribers are owned. Start building your email list from day one, even if it\'s just 20 people.',
          'Offer something exclusive for signing up: early access to music, behind-the-scenes content, unreleased tracks, or exclusive merch drops.',
          'Email your list at least once a month. Share upcoming releases, show dates, personal updates. Be human. People subscribe because they care about you, not just your music.',
        ],
      },
    ],
  },
  {
    id: 'monetizing',
    icon: DollarSign,
    title: 'STAGE 4: MONETIZING YOUR ART',
    subtitle: 'Turning your music career into a real business',
    content: [
      {
        heading: 'Revenue Streams for Musicians',
        body: [
          'Streaming alone will not pay your bills (unless you\'re doing millions of streams). Diversify. Here are the main revenue streams, in rough order of accessibility:',
          '1. Live performances (most accessible, highest per-event pay for independents). 2. Merchandise (t-shirts, hoodies — start simple). 3. Beat sales / production (if you produce). 4. Sync licensing (music in ads, films, TV, games). 5. Teaching / workshops. 6. Streaming royalties. 7. Publishing / songwriter royalties. 8. Brand partnerships / sponsorships.',
          'Don\'t ignore non-music income that leverages your audience: content creation, social media management for other artists, event hosting, or consulting. Your skills are valuable beyond just performing.',
        ],
      },
      {
        heading: 'Financial Management',
        body: [
          'Set up an LLC for your music business. It costs $100-300 depending on your state and protects your personal assets. File as a sole proprietor or single-member LLC to start.',
          'Get a business bank account and business credit card. Separate personal and business finances completely. This makes tax time infinitely easier.',
          'Save 25-30% of all music income for taxes. Self-employment tax is real and it will surprise you if you\'re not prepared. Consider quarterly estimated tax payments once you\'re earning consistently.',
          'Track every expense. Studio time, beats, equipment, travel to shows, marketing costs — these are all tax deductions. Use an app like Wave (free) or QuickBooks to track.',
          'The 50/30/20 rule adapted for artists: 50% of music income reinvested into your career, 30% saved for taxes and emergencies, 20% is yours to keep.',
        ],
      },
      {
        heading: 'When to Go Full-Time',
        body: [
          'Don\'t quit your day job until your music income consistently covers your living expenses for at least 3-6 months. Consistently means every month, not one good month.',
          'Calculate your "survival number" — the minimum monthly income you need to cover rent, food, transportation, phone, insurance, and basic living. Your music income needs to exceed this reliably.',
          'Have an emergency fund of 3-6 months expenses before making the leap. The music industry is unpredictable. Shows get cancelled. Streams fluctuate. Brand deals fall through.',
          'Going full-time doesn\'t mean working less. It means dedicating ALL your working hours to music and music-adjacent activities. Treat it like a job: set hours, set goals, be disciplined.',
        ],
      },
    ],
  },
  {
    id: 'scaling',
    icon: Globe,
    title: 'STAGE 5: SCALING YOUR CAREER',
    subtitle: 'Building a real team and reaching new levels',
    content: [
      {
        heading: 'Building Your Team',
        body: [
          'When to hire a manager: When the business side of your career is taking more than 50% of your time away from creating. A good manager handles bookings, negotiations, strategy, and opportunities so you can focus on music.',
          'Don\'t sign with a manager just because they offer. Vet them: Who else do they manage? What\'s their track record? What specifically will they do for you? Never pay upfront — managers work on commission (15-20% of your earnings).',
          'Other team members to consider as you grow: booking agent (for live shows), publicist (for press coverage), entertainment lawyer (for contracts and deals), and an accountant (for taxes and financial planning).',
          'You don\'t need everyone at once. Add team members as the need arises and as your income can support it.',
        ],
      },
      {
        heading: 'Licensing & Publishing',
        body: [
          'Sync licensing (getting your music in TV, film, ads, and games) can be incredibly lucrative. A single sync placement can earn $5,000-$100,000+.',
          'To get sync placements: register with a sync licensing agency (Musicbed, Artlist, Epidemic Sound for non-exclusive; Terrorbird, Position Music for exclusive). Keep instrumental versions of all your songs. Create music that works without context — emotional, mood-driven songs get placed more often.',
          'Publishing deals: a publisher pitches your songs to other artists, sync opportunities, and manages your songwriter royalties. Consider this once you have a solid catalog (20+ songs).',
        ],
      },
      {
        heading: 'Protecting Your Art',
        body: [
          'Copyright your music. In the US, your music is technically copyrighted the moment you create it, but registering with the Copyright Office ($65 per work) gives you legal protection to sue for infringement.',
          'Read every contract. Every. Single. One. If you don\'t understand it, don\'t sign it. Get an entertainment lawyer to review any deal that involves your rights, money, or exclusivity.',
          'Never sign away your masters unless the deal is life-changing. Your masters are your most valuable long-term asset. Many artists have lost millions by signing away their master recordings early in their career.',
          'Keep copies of all your contracts, session files, release agreements, and financial records. Organize them. A disorganized business is a vulnerable business.',
        ],
      },
    ],
  },
];

// ============================================================
// Helper: count total items across all sections
// ============================================================

function getTotalItemCount(): number {
  return ROADMAP_SECTIONS.reduce((sum, s) => sum + s.content.length, 0);
}

function getSectionItemIds(section: Section): string[] {
  return section.content.map((_, idx) => `${section.id}-${idx}`);
}

// ============================================================
// Component
// ============================================================

export default function ArtistRoadmap() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['foundation']));
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [careerStage, setCareerStage] = useState<string | null>(null);

  // Fetch progress and career stage on mount
  useEffect(() => {
    async function fetchProgress() {
      try {
        const res = await fetch('/api/hub/roadmap');
        if (res.ok) {
          const data = await res.json();
          setProgress(data.progress || {});
          setCareerStage(data.careerStage || null);

          // Set default expanded section based on career stage
          if (data.careerStage && CAREER_STAGE_MAP[data.careerStage]) {
            setExpandedSections(new Set([CAREER_STAGE_MAP[data.careerStage]]));
          }
        }
      } catch {
        // silently fail, keep empty progress
      } finally {
        setLoading(false);
      }
    }
    fetchProgress();
  }, []);

  // Toggle a roadmap item's completion
  const toggleCompletion = useCallback(async (itemId: string) => {
    const newCompleted = !progress[itemId];
    setSaving(itemId);

    // Optimistic update
    setProgress((prev) => {
      const next = { ...prev };
      if (newCompleted) {
        next[itemId] = true;
      } else {
        delete next[itemId];
      }
      return next;
    });

    try {
      const res = await fetch('/api/hub/roadmap', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, completed: newCompleted }),
      });

      if (res.ok) {
        const data = await res.json();
        setProgress(data.progress);

        // Award XP if completing (not unchecking) and eligible
        if (data.xpEligible) {
          try {
            await fetch('/api/hub/xp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'complete_roadmap_item',
                metadata: { itemId },
              }),
            });
          } catch {
            // XP award failure is non-blocking
          }
        }
      } else {
        // Revert on failure
        setProgress((prev) => {
          const next = { ...prev };
          if (newCompleted) {
            delete next[itemId];
          } else {
            next[itemId] = true;
          }
          return next;
        });
      }
    } catch {
      // Revert on network error
      setProgress((prev) => {
        const next = { ...prev };
        if (newCompleted) {
          delete next[itemId];
        } else {
          next[itemId] = true;
        }
        return next;
      });
    } finally {
      setSaving(null);
    }
  }, [progress]);

  function toggleSection(id: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleItem(key: string) {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Calculate completion stats
  const totalItems = getTotalItemCount();
  const completedCount = Object.keys(progress).length;
  const overallPercent = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  function getSectionStats(section: Section) {
    const ids = getSectionItemIds(section);
    const done = ids.filter((id) => progress[id]).length;
    const total = ids.length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { done, total, percent };
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-heading-md mb-2">ARTIST ROADMAP</h2>
        <p className="font-mono text-sm text-black/60 max-w-2xl">
          A comprehensive guide to building a music career from scratch. This isn&apos;t motivational fluff &mdash; it&apos;s the real playbook. Check off items as you complete them to track your progress.
        </p>
      </div>

      {/* Overall progress bar */}
      <div className="mb-6 border-2 border-black/10 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider">Overall Progress</span>
          <span className="font-mono text-xs text-black/50">
            {loading ? '...' : `${completedCount} / ${totalItems} items (${overallPercent}%)`}
          </span>
        </div>
        <div className="w-full h-3 bg-black/5 overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-500 ease-out"
            style={{ width: loading ? '0%' : `${overallPercent}%` }}
          />
        </div>
      </div>

      <div className="space-y-4">
        {ROADMAP_SECTIONS.map((section) => {
          const isOpen = expandedSections.has(section.id);
          const Icon = section.icon;
          const stats = getSectionStats(section);

          return (
            <div key={section.id} className="border-2 border-black/10">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full p-5 sm:p-6 flex items-center gap-4 text-left hover:bg-black/[0.02] transition-colors"
              >
                <div className="w-10 h-10 bg-accent flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-black" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-mono text-sm font-bold uppercase tracking-wider">{section.title}</h3>
                  </div>
                  <p className="font-mono text-xs text-black/50 mt-0.5">{section.subtitle}</p>
                  {/* Section progress bar */}
                  {!loading && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-black/5 overflow-hidden max-w-[200px]">
                        <div
                          className="h-full bg-accent transition-all duration-500 ease-out"
                          style={{ width: `${stats.percent}%` }}
                        />
                      </div>
                      <span className="font-mono text-[10px] text-black/40">
                        {stats.done}/{stats.total}
                      </span>
                    </div>
                  )}
                </div>
                {isOpen ? (
                  <ChevronDown className="w-5 h-5 text-black/30 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-black/30 flex-shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="border-t border-black/10">
                  {section.content.map((item, idx) => {
                    const itemKey = `${section.id}-${idx}`;
                    const isItemOpen = expandedItems.has(itemKey);
                    const isCompleted = progress[itemKey] === true;
                    const isSaving = saving === itemKey;

                    return (
                      <div
                        key={idx}
                        className={`border-b border-black/5 last:border-0 transition-colors ${
                          isCompleted ? 'bg-green-50/60' : ''
                        }`}
                      >
                        <div className="flex items-center">
                          {/* Checkbox */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCompletion(itemKey);
                            }}
                            disabled={isSaving || loading}
                            className="ml-4 sm:ml-6 flex-shrink-0 w-6 h-6 border-2 flex items-center justify-center transition-all hover:scale-105 disabled:opacity-50"
                            style={{
                              borderColor: isCompleted ? '#16a34a' : 'rgba(0,0,0,0.2)',
                              backgroundColor: isCompleted ? '#16a34a' : 'transparent',
                            }}
                            title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                          >
                            {isSaving ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-black/30" />
                            ) : isCompleted ? (
                              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                            ) : null}
                          </button>

                          {/* Item header */}
                          <button
                            onClick={() => toggleItem(itemKey)}
                            className="flex-1 px-3 py-4 flex items-center gap-3 text-left hover:bg-black/[0.02] transition-colors"
                          >
                            {isItemOpen ? (
                              <ChevronDown className="w-4 h-4 text-accent flex-shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-black/30 flex-shrink-0" />
                            )}
                            <span
                              className={`font-mono text-sm font-semibold ${
                                isCompleted ? 'text-green-700 line-through decoration-green-400/50' : ''
                              }`}
                            >
                              {item.heading}
                            </span>
                            {isCompleted && !isSaving && (
                              <span className="font-mono text-[10px] text-green-600 bg-green-100 px-1.5 py-0.5 uppercase tracking-wider flex-shrink-0">
                                Done
                              </span>
                            )}
                          </button>
                        </div>

                        {isItemOpen && (
                          <div className="px-6 pb-5 pl-[4.5rem] space-y-3">
                            {item.body.map((paragraph, pIdx) => (
                              <p key={pIdx} className="font-mono text-xs text-black/60 leading-relaxed">
                                {paragraph}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 border-2 border-accent p-6 text-center">
        <p className="font-mono text-xs text-black/60">
          This roadmap is a living document. As you grow, new stages and strategies will be added.
          Use the Projects, Goals, and Metrics tabs to put this knowledge into action.
        </p>
        {!loading && completedCount > 0 && (
          <p className="font-mono text-xs text-accent mt-2 font-semibold">
            +10 XP awarded for each completed roadmap item
          </p>
        )}
      </div>
    </div>
  );
}
