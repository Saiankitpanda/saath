"use client";

import { useEffect, useState } from "react";
import { AmbientProvider, useAmbient } from "@/components/AmbientSound";
import NeedAMoment from "@/components/NeedAMoment";
import ArriveHome from "@/components/ArriveHome";
import GettingToKnowYou from "@/components/GettingToKnowYou";
import ActivitiesWorkspace from "@/components/ActivitiesWorkspace";
import ConversationRoom from "@/components/ConversationRoom";
import Enrollment from "@/components/Enrollment";
import TwoChairsRoom from "@/components/TwoChairsRoom";
import PractiseRoom from "@/components/PractiseRoom";
import PeerCircles from "@/components/PeerCircles";
import CallRoom from "@/components/CallRoom";
import StrangerChat from "@/components/StrangerChat";
import StoryMoments from "@/components/StoryMoments";
import CheckInNudge from "@/components/CheckInNudge";
import StrangersNearby from "@/components/StrangersNearby";
import ProfileHome from "@/components/ProfileHome";
import { SaathCharacter } from "@/components/SaathCharacter";
import CharacterWait from "@/components/CharacterWait";
import { api } from "@/lib/client/api";
import { loadAppearance, restoreAppliedAppearance } from "@/lib/client/appearance";
import type { PublicCall } from "@/lib/application/ports";
import {
  loadFixtures,
  saveInterests,
  saveReflections,
  saveStrangerPref,
  toggleBlock,
} from "@/lib/client/store";
import { caseStudies, nearbyStrangerFixtures, samplePeople, trustPoints } from "@/lib/fixtures";
import {
  ROLE_LABELS,
  SAMPLE_PROFILE_NOTICE,
  type ActivityRecord,
  type CompanionCategory,
  type ConversationRecord,
  type EncryptionStatus,
  type EnrollmentProfile,
  type EnrollmentRole,
  type InterestId,
  type IntroAnswers,
  type MoodEntry,
  type Person,
  type SessionRequest,
  type View,
} from "@/lib/domain";
import {
  ArrowRight,
  ArrowUpRight,
  Armchair,
  Globe,
  Heart,
  Laptop,
  Leaf,
  Menu,
  MessageCircle,
  Phone,
  Plus,
  ShieldCheck,
  Sparkles,
  Users,
  UserRound,
  X,
} from "lucide-react";

const paths = [
  { view: "connect" as View, n: "01", icon: MessageCircle, title: "Someone to listen.", desc: "Talk with an AI companion, or connect with a real stranger after they accept.", label: "Meet someone" },
  { view: "circles" as View, n: "02", icon: Users, title: "Peer circles.", desc: "Meet people with a similar lived experience. Discuss and post when you are ready.", label: "Join a circle" },
  { view: "chairs" as View, n: "03", icon: Armchair, title: "Two chairs.", desc: "Practise the hard conversation first, then sit with someone when you are ready.", label: "Open Two Chairs" },
];

function App() {
  const ambient = useAmbient();
  const [view, setView] = useState<View>("home");
  const [mobile, setMobile] = useState(false);
  const [auth, setAuth] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [profile, setProfile] = useState<EnrollmentProfile | null>(null);
  const [incoming, setIncoming] = useState<SessionRequest[]>([]);
  const [encryption, setEncryption] = useState<EncryptionStatus | null>(null);
  const [pairingCode, setPairingCode] = useState("");
  const [ai, setAi] = useState(false);
  const [voiceConfigured, setVoiceConfigured] = useState(false);
  const [topic, setTopic] = useState("Just need to talk");
  const [support, setSupport] = useState("Listen only");
  const [strangerNote, setStrangerNote] = useState("I would like to talk with someone when you have a moment.");
  const [strangerMode, setStrangerMode] = useState<"voice" | "chat">("voice");
  const [strangerOpen, setStrangerOpen] = useState(false);
  const [listenStep, setListenStep] = useState<"meet" | "connect" | "auto" | "task">("meet");
  const [connectionTab, setConnectionTab] = useState<"pending" | "accepted">("pending");
  const [shareTarget, setShareTarget] = useState("");
  const [chatRequest, setChatRequest] = useState<SessionRequest | null>(null);
  const [aiChatPerson, setAiChatPerson] = useState<Person | null>(null);
  const [context, setContext] = useState("");
  const [shareMode, setShareMode] = useState<"private" | "ask-first">("private");
  const [notice, setNotice] = useState("");
  const [requests, setRequests] = useState<SessionRequest[]>([]);
  const [selected, setSelected] = useState<Person | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [chairsFocus, setChairsFocus] = useState<"practise" | "room">("practise");
  const [practiseSeed, setPractiseSeed] = useState<{ situation?: string; story?: string; goal?: string } | null>(null);
  const [modal, setModal] = useState<"approach" | "join" | "privacy" | "phrase" | null>(null);
  const [phrase, setPhrase] = useState("");
  const [phrasePerson, setPhrasePerson] = useState<Person | null>(null);
  const [blocks, setBlocks] = useState<string[]>([]);
  const [intro, setIntro] = useState<IntroAnswers | null>(null);
  const [introDone, setIntroDone] = useState(false);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [interests, setInterests] = useState<InterestId[]>([]);
  const [reflections, setReflections] = useState("");
  const [conversation, setConversation] = useState<ConversationRecord | null>(null);
  const [activeCall, setActiveCall] = useState<PublicCall | null>(null);
  const [submitLock, setSubmitLock] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(true);
  const [appBooting, setAppBooting] = useState(true);

  useEffect(() => {
    const fixtures = loadFixtures();
    setIntro(fixtures.intro?.answers ?? null);
    setIntroDone(Boolean(fixtures.intro?.completed));
    setActivities(fixtures.activities);
    setMoods(fixtures.moods);
    setInterests(fixtures.interests);
    setReflections(fixtures.reflections || fixtures.quietThoughts);
    setBlocks(fixtures.blocks);
    setConversation(fixtures.conversations[0] ?? null);
    const appearance = loadAppearance(null);
    setMotionEnabled(appearance.motionEnabled);
    restoreAppliedAppearance(null);
    const started = Date.now();
    const reveal = window.setTimeout(() => setAppBooting(false), Math.max(0, 1100 - (Date.now() - started)));
    return () => window.clearTimeout(reveal);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const intended = params.get("enroll");
    if (intended === "client" || intended === "listener") setView("enroll");
    const requestedView = params.get("view");
    const focus = params.get("focus");
    if (focus === "practise" || focus === "room") setChairsFocus(focus);
    if (requestedView === "onboard") {
      setView("enroll");
    } else if (requestedView === "rehearsal") {
      setView("chairs");
      setChairsFocus("practise");
    } else if (
      requestedView === "chairs" ||
      requestedView === "connect" ||
      requestedView === "circles" ||
      requestedView === "arrive" ||
      requestedView === "space" ||
      requestedView === "activities" ||
      requestedView === "enroll" ||
      requestedView === "strangers" ||
      requestedView === "profile"
    ) {
      setView(requestedView);
    }
    api<{ authenticated: boolean; displayName?: string | null; aiConfigured: boolean; encryption?: EncryptionStatus; voiceConfigured?: boolean; calling?: boolean }>("/api/status").then(data => {
      setAuth(data.authenticated);
      setDisplayName(data.displayName || "");
      setAi(data.aiConfigured);
      setVoiceConfigured(Boolean(data.voiceConfigured || data.calling));
      if (data.encryption) setEncryption(data.encryption);
      if (data.authenticated) {
        api<{ context: { content: string; shareMode?: "private" | "ask-first" } | null }>("/api/context").then(result => {
          setContext(result.context?.content || "");
          setShareMode(result.context?.shareMode || "private");
        }).catch(() => {});
        api<{ requests: SessionRequest[]; incoming?: SessionRequest[] }>("/api/requests").then(result => {
          setRequests(result.requests || []);
          setIncoming(result.incoming || []);
        }).catch(() => {});
        api<{ profile: EnrollmentProfile | null }>("/api/profile").then(async result => {
          let next = result.profile;
          if (!next && (intended === "client" || intended === "listener")) {
            try {
              const enrolled = await api<{ profile: EnrollmentProfile }>("/api/profile", "PUT", {
                clientEnrolled: intended === "client",
                listenerEnrolled: intended === "listener",
                activeRole: intended,
                displayName: data.displayName || "",
              });
              next = enrolled.profile;
              setNotice(intended === "listener"
                ? `You are enrolled as a ${ROLE_LABELS.listener.short} on this account.`
                : `You are enrolled as a ${ROLE_LABELS.client.short} on this account.`);
            } catch (error) {
              setNotice((error as Error).message);
            }
          }
          setProfile(next);
          if (data.authenticated && !next) setView(current => current === "home" ? "enroll" : current);
          if (next && (intended === "client" || intended === "listener")) setView("arrive");
        }).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selected && !modal) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelected(null);
        setModal(null);
      }
    };
    document.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", close);
    };
  }, [selected, modal]);

  function go(next: View) {
    const resolved = next === "onboard" ? "enroll" : next === "rehearsal" ? "chairs" : next;
    if (next === "rehearsal") setChairsFocus("practise");
    setView(resolved);
    setMobile(false);
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function flash(message: string) { setNotice(message); }
  function talkWithPersona(person: Person) {
    setAiChatPerson(null);
    setSelected(null);
    setPractiseSeed({
      situation: person.specialty || "Just need to talk",
      story: `${person.name} · ${person.intro}\nI want to talk about: ${person.quote}`,
      goal: `Talk about ${person.specialty.toLowerCase()}`,
    });
    setChairsFocus("practise");
    go("chairs");
    flash(`${person.name} is a fictional AI companion. Describe your scenario under Two chairs → Practise, then rehearse. No video with AI.`);
  }

  function dmWithPersona(person: Person) {
    setActiveCall(null);
    setChatRequest(null);
    setAiChatPerson(person);
    flash(`DM with ${person.name} is open. Fictional companion — not a live person.`);
  }
  function askForPerson() {
    setStrangerOpen(true);
    setListenStep("meet");
    go("connect");
    flash("Choose a stranger nearby. People who fit your answers appear after you open it.");
  }
  function revealNearby() {
    setStrangerOpen(true);
    setListenStep("meet");
    window.setTimeout(() => {
      document.getElementById("nearby-match")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 40);
  }
  async function startCall(requestId: string, media: "voice" | "video" = "voice") {
    setBusy(true);
    try {
      const result = await api<{ call: PublicCall }>("/api/calls", "POST", {
        source: "request",
        sourceId: requestId,
        media,
      });
      setActiveCall(result.call);
      setChatRequest(null);
      flash(media === "video"
        ? "Video room is ringing. Camera stays off until you Join — Meet-style browser call."
        : "Voice room is ringing. Microphone stays off until you Join.");
    } catch (error) {
      flash((error as Error).message);
    } finally {
      setBusy(false);
    }
  }


  async function enroll(input: { clientEnrolled: boolean; listenerEnrolled: boolean; activeRole: EnrollmentRole; displayName: string }) {
    if (!auth) {
      window.location.href = `/signin-with-chatgpt?return_to=/?enroll=${input.activeRole}`;
      return;
    }
    setBusy(true);
    try {
      const result = await api<{ profile: EnrollmentProfile }>("/api/profile", "PUT", input);
      setProfile(result.profile);
      go("arrive");
      flash(input.activeRole === "listener"
        ? `${ROLE_LABELS.listener.short} enrollment is saved. You share one home. A live person is used only after someone actually accepts.`
        : `${ROLE_LABELS.client.short} enrollment is saved. This home is for expressing yourself. A live person is used if one has accepted; otherwise you can talk with a fictional AI personality.`);
    } catch (error) {
      flash((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function switchRole(role: EnrollmentRole) {
    setBusy(true);
    try {
      const result = await api<{ profile: EnrollmentProfile }>("/api/profile", "PATCH", { activeRole: role });
      setProfile(result.profile);
      flash(role === "listener"
        ? `You are using the ${ROLE_LABELS.listener.short} view.`
        : `You are using the ${ROLE_LABELS.client.short} view.`);
    } catch (error) {
      flash((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function connectStranger() {
    if (!auth) {
      flash("Sign in to ask a real stranger to talk with you.");
      return;
    }
    if (!pairingCode.trim()) {
      flash("Ask someone for their invite code, or open Two chairs and share your room code with a stranger.");
      return;
    }
    setBusy(true);
    try {
      const result = await api<{ request: SessionRequest; notice?: string }>("/api/requests", "POST", {
        topic: strangerMode === "voice" ? "Voice with a stranger" : "Chat with a stranger",
        context: strangerNote || context || "I would like to talk when you have a moment.",
        consent: true,
        mode: strangerMode,
        pairingCode: pairingCode.trim().toUpperCase(),
      });
      setRequests(current => [result.request, ...current.filter(item => item.id !== result.request.id)]);
      setPairingCode("");
      flash(result.notice || "Request saved. After they accept, you can open voice or chat.");
    } catch (error) {
      flash((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function actOnIncoming(id: string, action: "accept" | "decline") {
    setBusy(true);
    try {
      const result = await api<{ request: SessionRequest }>("/api/requests", "PATCH", { id, action });
      setIncoming(current => current.map(item => item.id === id ? result.request : item));
      flash(action === "accept" ? "You accepted this request. Both accounts now show it as accepted." : "You declined this request.");
    } catch (error) {
      flash((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function saveContext() {
    if (!auth) {
      flash("Kept in this tab for your preview. Sign in to save your context.");
      return;
    }
    setBusy(true);
    try {
      await api("/api/context", "PUT", { content: context, shareMode });
      flash("Your context is saved as " + shareMode + ". You decide what to share each time.");
    } catch (error) {
      flash((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function requestPerson() {
    if (!selected || !consent || submitLock) return;
    if (blocks.includes(selected.id)) {
      flash("You blocked this profile in this browser. Blocked people cannot receive a new request here.");
      return;
    }
    if (!auth) {
      flash("This is a sample profile. Sign in to explore saved requests; no real person will be contacted.");
      return;
    }
    setSubmitLock(true);
    setBusy(true);
    try {
      const result = await api<{ request: SessionRequest }>("/api/requests", "POST", {
        providerId: selected.id,
        providerName: selected.name,
        topic,
        context: `Support preference: ${support}\n\n${context}`,
        consent: true,
        mode: "chat",
      });
      setRequests(current => [result.request, ...current.filter(item => item.id !== result.request.id)]);
      setSelected(null);
      flash("Request saved as pending. This does not contact a real provider or create a conversation.");
    } catch (error) {
      flash((error as Error).message);
    } finally {
      setBusy(false);
      setSubmitLock(false);
    }
  }

  function companionIcon(category: CompanionCategory) {
    if (category === "relationships") return <Heart size={14}/>;
    if (category === "work") return <Laptop size={14}/>;
    if (category === "family") return <Users size={14}/>;
    return <Leaf size={14}/>;
  }

  const issueText = [intro?.beforeTalking, intro?.readiness, intro?.offLimits, context]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const hasIssue = Boolean(issueText.trim() || intro?.supportStyle || intro?.pace);

  function scoreCompanion(person: Person) {
    let score = 0;
    const blob = `${person.domain} ${person.specialty} ${person.topics.join(" ")} ${person.tag} ${person.intro} ${person.category}`.toLowerCase();
    for (const word of issueText.split(/[^a-z0-9]+/).filter(word => word.length > 3)) {
      if (blob.includes(word)) score += 2;
    }
    if (/famil|parent|home|belong|sister|brother/.test(issueText) && person.category === "family") score += 4;
    if (/work|study|job|office|exam|city|start/.test(issueText) && person.category === "work") score += 4;
    if (/lone|relationship|love|partner|friend/.test(issueText) && person.category === "relationships") score += 4;
    if (/slow|quiet|overwhelm|anx|breath|tired/.test(issueText) && person.category === "slow") score += 4;
    if (intro?.pace === "time-to-think" && person.category === "slow") score += 3;
    if (intro?.pace === "gentle-questions" && (person.category === "family" || person.category === "relationships")) score += 2;
    if (intro?.pace === "talking-freely" && person.category === "work") score += 1;
    if (intro?.supportStyle === "listening" && person.category === "relationships") score += 2;
    if (intro?.supportStyle === "suggestions" && person.category === "work") score += 2;
    if (intro?.supportStyle === "ask-first" && person.category === "slow") score += 2;
    if (intro?.supportStyle === "reflection" && person.category === "family") score += 2;
    return score;
  }

  const relatedCompanions = samplePeople
    .filter(person => !blocks.includes(person.id))
    .map(person => ({ person, score: scoreCompanion(person) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.person);

  const relatedNearby = nearbyStrangerFixtures.filter(item => {
    if (!item.available || !issueText.trim()) return false;
    const situation = item.situation.toLowerCase();
    const words = issueText.split(/[^a-z0-9]+/).filter(word => word.length > 3);
    if (words.some(word => situation.includes(word))) return true;
    if (/famil|parent|home/.test(issueText) && /famil/.test(situation)) return true;
    if (/work|job|study|office/.test(issueText) && /work/.test(situation)) return true;
    if (/quiet|tired|long/.test(issueText) && /quiet|long/.test(situation)) return true;
    if (/city|start|new/.test(issueText) && /start|city/.test(situation)) return true;
    return false;
  });

  function autoconnect() {
    const person = relatedCompanions[0];
    if (!person) {
      flash(hasIssue
        ? "Nothing lines up with those answers yet. Add a little more about what you are carrying."
        : "Answer a few questions first, then autoconnect can match someone.");
      return;
    }
    setListenStep("auto");
    setSelected(person);
    flash(`Autoconnected with ${person.name} for what you shared. Connect, then do the task.`);
  }

  function doTheTask() {
    const person = selected || relatedCompanions[0];
    if (!person) {
      flash("Choose someone, or autoconnect, before the task.");
      return;
    }
    setListenStep("task");
    talkWithPersona(person);
  }

  function connectNearby(item: (typeof nearbyStrangerFixtures)[number]) {
    const preview: SessionRequest = {
      id: `near-${item.id}`,
      providerId: item.id,
      providerName: item.name,
      topic: "Chat with a stranger",
      context: item.situation,
      mode: "chat",
      status: "accepted",
      createdAt: new Date().toISOString(),
    };
    setListenStep("connect");
    setRequests(current => [preview, ...current.filter(entry => entry.id !== preview.id)]);
    setAiChatPerson(null);
    setActiveCall(null);
    setChatRequest(preview);
    saveStrangerPref({ lastPeerId: item.id, lastPeerName: item.name, situation: item.situation });
    flash(`Connected with ${item.name}. You can do the task when you are ready.`);
  }

  const accepted = requests.filter(item => item.status === "accepted");

  return (
    <div className="site-shell">
      <NeedAMoment
        go={go}
        enrolled={Boolean(profile?.clientEnrolled || profile?.listenerEnrolled)}
        onPhrasePreview={(nextPhrase, person) => {
          setPhrase(nextPhrase);
          setPhrasePerson(person);
          setModal("phrase");
        }}
      />
      <CheckInNudge
        enabled={
          auth
          && view !== "home"
          && view !== "enroll"
          && !activeCall
          && !chatRequest
          && !aiChatPerson
          && view !== "chairs"
          && view !== "activities"
          && view !== "conversation"
        }
        motionEnabled={motionEnabled}
        onNotice={flash}
        onSaved={entry => setMoods(current => [{ id: entry.id, mood: entry.mood, note: entry.dayStory.slice(0, 400), createdAt: entry.createdAt }, ...current])}
      />
      {appBooting && (
        <div className="app-boot-overlay">
          <CharacterWait kind="app" message="Getting your space ready…" motionEnabled={motionEnabled} />
        </div>
      )}
      <header className="header">
        <button className="brand" onClick={() => go("home")} aria-label="Saath home"><span className="brand-mark"><i/><i/></span>saath<span className="brand-dot">.</span></button>
        <nav className={mobile ? "main-nav open" : "main-nav"} aria-label="Main navigation">
          <button className={view === "arrive" ? "active" : ""} onClick={() => go("arrive")}>Your visit</button>
          <button className={view === "connect" || view === "strangers" ? "active" : ""} onClick={() => go("connect")}>Listen</button>
          <button className={view === "circles" ? "active" : ""} onClick={() => go("circles")}>Circles</button>
          <button className={view === "chairs" ? "active" : ""} onClick={() => { setChairsFocus("practise"); go("chairs"); }}>Two chairs</button>
        </nav>
        <div className="header-actions">
          {profile && (profile.clientEnrolled || profile.listenerEnrolled) ? (
            <div className="role-switch" role="group" aria-label="Active role">
              {profile.clientEnrolled && (
                <button className={profile.activeRole === "client" ? "active" : ""} onClick={() => switchRole("client")}>{ROLE_LABELS.client.short}</button>
              )}
              {profile.listenerEnrolled && (
                <button className={profile.activeRole === "listener" ? "active" : ""} onClick={() => switchRole("listener")}>{ROLE_LABELS.listener.short}</button>
              )}
            </div>
          ) : (
            <button className="button small" onClick={() => go("enroll")}>
              {auth ? "Enroll" : "Sign in"}
            </button>
          )}
          <button
            className={view === "profile" || view === "space" ? "profile-entry active" : "profile-entry"}
            aria-label="Your profile"
            onClick={() => go("profile")}
          >
            <UserRound size={18} />
          </button>
          <button className="mobile-toggle" aria-label="Toggle navigation" aria-expanded={mobile} onClick={() => setMobile(!mobile)}>{mobile ? <X/> : <Menu/>}</button>
        </div>
      </header>
      {notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss notification"><X size={17}/></button></div>}

      {view === "home" ? (
        <main>
          <section className="hero">
            <div className="hero-copy">
              <div className="eyebrow"><span/> EARLY PREVIEW · 18+</div>
              <h1>A little space.<br/>A little <em>Saath.</em></h1>
              <p className="hero-description">Talk to someone. Practise what’s hard to say.</p>
              <div className="hero-actions">
                <button className="button" onClick={() => go(profile ? "arrive" : "enroll")}>
                  {profile ? "Continue your visit" : "Enroll or sign in"} <ArrowRight size={18}/>
                </button>
                <button className="text-button" onClick={() => go("connect")}>Listen</button>
              </div>
              <div className="language-note"><Globe size={14}/> English <span>·</span> हिन्दी <span>·</span> Hinglish</div>
              <div className="hero-footnote"><span className="tiny-flower">✳</span> Adults 18+. No perfect words needed.</div>
            </div>
            <div className="hero-art">
              <div className="art-backdrop"/>
              <img src="/assets/saath-garden-hero.png" alt="A quiet garden courtyard with two empty chairs and soft natural light"/>
              <div className="conversation-note"><span>You can start with…</span><p>“I don’t know<br/>where to begin.”</p><span className="note-line"/></div>
              <div className="art-caption"><span className="small-dot"/> Two chairs. Room to arrive slowly.</div>
            </div>
            <svg className="thread" viewBox="0 0 400 120" aria-hidden="true"><path d="M0 95 C95 140 230 15 200 20 C150 28 195 120 400 0"/></svg>
          </section>
          <section className="topic-strip">
            <div><span className="eyebrow">START HERE</span><h2>One path. Five places.</h2></div>
            <div className="topic-pills">
              <button onClick={() => go("arrive")}><span className="topic-icon tint-0"><Heart size={18}/></span>Your visit<ArrowUpRight className="pill-arrow" size={14}/></button>
              <button onClick={() => go("connect")}><span className="topic-icon tint-1"><MessageCircle size={18}/></span>Listen<ArrowUpRight className="pill-arrow" size={14}/></button>
              <button onClick={() => go("circles")}><span className="topic-icon tint-2"><Users size={18}/></span>Circles<ArrowUpRight className="pill-arrow" size={14}/></button>
              <button onClick={() => { setChairsFocus("practise"); go("chairs"); }}><span className="topic-icon tint-2"><Sparkles size={18}/></span>Practise first<ArrowUpRight className="pill-arrow" size={14}/></button>
              <button onClick={() => { setChairsFocus("room"); go("chairs"); }}><span className="topic-icon tint-3"><Armchair size={18}/></span>Two chairs<ArrowUpRight className="pill-arrow" size={14}/></button>
            </div>
          </section>
          <section className="section pathways">
            <div className="section-head">
              <div><div className="eyebrow">WAYS IN</div><h2>Listen, peers,<br/>or two chairs.</h2></div>
              <p>Pick one to start.</p>
            </div>
            <div className="path-grid">
              {paths.map(path => (
                <button key={path.n} className={"path-card path-" + path.n} onClick={() => go(path.view)}>
                  <div className="path-top"><path.icon size={29} strokeWidth={1.3}/><span>{path.n}</span></div>
                  <h3>{path.title}</h3>
                  <p>{path.desc}</p>
                  <span className="card-link">{path.label}<ArrowRight size={18}/></span>
                </button>
              ))}
            </div>
          </section>
        </main>
      ) : (
        <main className="workspace">
          {view === "enroll" && (
            <Enrollment
              auth={auth}
              displayName={displayName}
              profile={profile}
              busy={busy}
              onEnroll={enroll}
            />
          )}

          {view === "arrive" && (
            <ArriveHome
              profile={profile}
              incoming={incoming}
              accepted={accepted}
              moods={moods}
              interests={interests}
              onToggleInterest={(id: InterestId) => {
                const next = interests.includes(id) ? interests.filter(item => item !== id) : [...interests, id];
                setInterests(saveInterests(next));
              }}
              go={go}
              onTalkWithPersona={talkWithPersona}
              onAskForPerson={askForPerson}
              onStartCall={startCall}
            />
          )}
          {view === "arrive" && activeCall && (
            <CallRoom
              call={activeCall}
              onChange={setActiveCall}
              onEnded={() => setActiveCall(null)}
              onNotice={flash}
            />
          )}
          {view === "arrive" && chatRequest && (
            <StrangerChat
              requestId={chatRequest.id}
              peerName={chatRequest.providerName}
              onClose={() => setChatRequest(null)}
              onNotice={flash}
            />
          )}

          {view === "intro" && (
            <GettingToKnowYou
              initial={intro}
              auth={auth}
              ai={ai}
              onClose={() => go("profile")}
              onSaved={(answers, completed) => { setIntro(answers); setIntroDone(completed); }}
              flash={flash}
            />
          )}

          {view === "conversation" && conversation && (
            <ConversationRoom
              conversation={conversation}
              onChange={setConversation}
              flash={flash}
              onReport={async targetId => {
                setBlocks(toggleBlock(targetId));
                if (auth) {
                  try { await api("/api/reports", "POST", { targetId, reason: "Blocked from a development fixture conversation." }); }
                  catch (error) { flash((error as Error).message); }
                }
                flash("Block recorded in this browser. Server-side block enforcement needs the forthcoming schema.");
              }}
            />
          )}

          {view === "activities" && (
            <ActivitiesWorkspace
              activities={activities}
              answers={intro}
              mood={moods[0]?.mood ?? null}
              interests={interests}
              hasAcceptedConnection={accepted.length > 0}
              onChange={setActivities}
              flash={flash}
            />
          )}

          {view === "circles" && (
            <PeerCircles
              auth={auth}
              displayName={displayName}
              onNotice={flash}
            />
          )}

          {view === "connect" && (
            <div className="listen-shell">
              <section className="listen-hero">
                <div className="listen-hero-media">
                  <img
                    src="/assets/saath-listen-hero.jpg"
                    alt="A quiet conversation with a soft cloud companion by the window"
                  />
                </div>
                <div className="listen-hero-veil" aria-hidden="true" />
                <div className="listen-hero-copy">
                  <div className="eyebrow">LISTEN · THEN ACT</div>
                  <h1>A quiet companion<br/>when you need to <em>speak.</em></h1>
                  <p>Choose a stranger nearby when you are ready. People who fit what you answered appear only after that.</p>
                  <div className="listen-hero-actions">
                    <button className="button" type="button" onClick={revealNearby}>
                      Choose a stranger nearby <ArrowRight size={17}/>
                    </button>
                  </div>
                </div>
              </section>

              <section className="listen-block trust-block">
                <div className="section-head listen-head">
                  <div>
                    <div className="eyebrow">TRUST</div>
                    <h2>Feel safe enough to begin.</h2>
                  </div>
                </div>
                <div className="trust-grid">
                  {trustPoints.map(item => (
                    <article key={item.id} className="trust-card">
                      <ShieldCheck size={20} strokeWidth={1.5}/>
                      <h3>{item.title}</h3>
                      <p>{item.text}</p>
                    </article>
                  ))}
                </div>
              </section>

              <StoryMoments stories={caseStudies} />

              <section className="stranger-accordion" id="strangers">
                <button
                  type="button"
                  className="stranger-accordion-toggle"
                  onClick={revealNearby}
                >
                  <span>
                    <Users size={18} strokeWidth={1.5}/>
                    <strong>Talk to a stranger</strong>
                    <em>Nearby list · same situation · auto-match</em>
                  </span>
                  <span className="stranger-accordion-chevron">{strangerOpen ? "Matches open" : "Choose nearby"}</span>
                </button>
                {!strangerOpen && (
                  <div className="stranger-accordion-body stranger-teaser">
                    <p className="small-print">
                      Related people stay hidden until you choose a stranger nearby. They are matched to what you answered.
                    </p>
                    <button className="button" type="button" onClick={revealNearby}>
                      Choose a stranger nearby <ArrowRight size={16}/>
                    </button>
                  </div>
                )}
              </section>

              {strangerOpen && (
                <section className="listen-block" id="nearby-match">
                  <div className="section-head listen-head">
                    <div>
                      <div className="eyebrow">LOCAL TWO-PERSON TEST</div>
                      <h2>Meet and greet, then connect.</h2>
                    </div>
                    <p className="small-print">{SAMPLE_PROFILE_NOTICE}</p>
                  </div>
                  <ol className="listen-steps">
                    {([
                      ["meet", "Meet and greet", "See people who fit what you answered."],
                      ["connect", "Connect", "Open a profile and connect with that person."],
                      ["auto", "Autoconnect", "Let Saath pick the closest match to your answers."],
                      ["task", "Do the task", "Sit the conversation and work it through together."],
                    ] as const).map(([id, title, text], index) => (
                      <li key={id} className={listenStep === id ? "current" : ""}>
                        <strong>{index + 1}. {title}</strong>
                        <span>{text}</span>
                      </li>
                    ))}
                  </ol>
                  <div className="inline-actions">
                    <button className="button" type="button" onClick={autoconnect}>Autoconnect</button>
                    <button className="outline-button" type="button" onClick={doTheTask}>Do the task</button>
                    <button className="text-button" type="button" onClick={() => go("intro")}>Update your answers</button>
                  </div>
                  {!hasIssue && (
                    <div className="empty-state">
                      <Leaf/>
                      <h2>Tell us what you are carrying.</h2>
                      <p>Related strangers appear from your answers, not before.</p>
                      <button className="button" type="button" onClick={() => go("intro")}>Answer a few questions</button>
                    </div>
                  )}
                  {hasIssue && !relatedCompanions.length && !relatedNearby.length && (
                    <p className="small-print">Nothing lines up with those answers yet. Add a little more, then look again.</p>
                  )}
                  {relatedCompanions.length > 0 && (
                    <>
                      <h3 className="listen-match-label">Companions for what you shared</h3>
                      <div className="companion-grid">
                        {relatedCompanions.map((person, index) => (
                          <button
                            type="button"
                            className={"companion-card tone-" + person.color}
                            key={person.id}
                            style={{ animationDelay: `${index * 70}ms` }}
                            onClick={() => { setListenStep("connect"); setSelected(person); }}
                          >
                            <div className="companion-portrait companion-portrait-art">
                              <SaathCharacter
                                name={person.characterKey || "mira"}
                                size={168}
                                alt=""
                                animate={motionEnabled}
                              />
                            </div>
                            <div className="companion-body">
                              <header className="companion-top">
                                <div className="companion-meta">
                                  <span className="companion-badge">Fictional AI companion</span>
                                  <h3>{person.name}</h3>
                                  <p className="companion-tag">{companionIcon(person.category)} {person.tag}</p>
                                </div>
                              </header>
                              <p className="companion-intro">{person.intro}</p>
                              <blockquote className="companion-quote">“{person.quote}”</blockquote>
                              <p className="companion-modes-note">Open the profile to connect and work.</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                  {relatedNearby.length > 0 && (
                    <div className="listen-nearby">
                      <h3 className="listen-match-label">Strangers in a similar situation</h3>
                      {relatedNearby.map(item => (
                        <div className="request-row" key={item.id}>
                          <div>
                            <strong>{item.name}</strong>
                            <span>{item.situation}</span>
                          </div>
                          <button className="quiet" type="button" onClick={() => connectNearby(item)}>Connect</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {aiChatPerson && (
                    <section className="ai-dm-shell">
                      <header className="ai-dm-head">
                        <SaathCharacter name={aiChatPerson.characterKey || "mira"} size={64} alt="" />
                        <div>
                          <span className="companion-badge">Fictional AI companion</span>
                          <h3>{aiChatPerson.name}</h3>
                          <p className="small-print">{aiChatPerson.tag}</p>
                        </div>
                      </header>
                      <StrangerChat
                        requestId={`ai-dm-${aiChatPerson.id}`}
                        peerName={aiChatPerson.name}
                        onClose={() => setAiChatPerson(null)}
                        onNotice={flash}
                      />
                    </section>
                  )}
                  {activeCall && (
                    <CallRoom
                      call={activeCall}
                      onChange={setActiveCall}
                      onEnded={() => setActiveCall(null)}
                      onNotice={flash}
                    />
                  )}
                  {chatRequest && (
                    <StrangerChat
                      requestId={chatRequest.id}
                      peerName={chatRequest.providerName}
                      onClose={() => setChatRequest(null)}
                      onNotice={flash}
                    />
                  )}
                </section>
              )}
            </div>
          )}

          {view === "strangers" && (
            <>
              <StrangersNearby
                auth={auth}
                onBack={() => go("connect")}
                onNotice={flash}
                onConnect={({ peerId, peerName, mode, note, situation }) => {
                  setStrangerMode(mode);
                  setStrangerNote(note);
                  saveStrangerPref({ lastPeerId: peerId, lastPeerName: peerName, situation });
                  const preview: SessionRequest = {
                    id: `near-${peerId}`,
                    providerId: peerId,
                    providerName: peerName,
                    topic: mode === "voice" ? "Voice with a stranger" : "Chat with a stranger",
                    context: note,
                    mode,
                    status: "accepted",
                    createdAt: new Date().toISOString(),
                  };
                  setRequests(current => [preview, ...current.filter(item => item.id !== preview.id)]);
                  setAiChatPerson(null);
                  setActiveCall(null);
                  setChatRequest(preview);
                  flash(
                    mode === "voice"
                      ? `Dial connected with ${peerName}. Chat holds the line for now — live mic joins after signup + accept.`
                      : `Chat open with ${peerName}. Messages stay in this browser until live sync.`,
                  );
                }}
              />
              {chatRequest && (
                <StrangerChat
                  requestId={chatRequest.id}
                  peerName={chatRequest.providerName}
                  onClose={() => setChatRequest(null)}
                  onNotice={flash}
                />
              )}
              {activeCall && (
                <CallRoom
                  call={activeCall}
                  onChange={setActiveCall}
                  onEnded={() => setActiveCall(null)}
                  onNotice={flash}
                />
              )}
            </>
          )}

          {view === "chairs" && (
            <div className="chairs-shell">
              <nav className="chairs-focus-tabs" aria-label="Two chairs modes">
                <button
                  type="button"
                  className={chairsFocus === "practise" ? "active" : ""}
                  onClick={() => setChairsFocus("practise")}
                >
                  Practise first
                </button>
                <button
                  type="button"
                  className={chairsFocus === "room" ? "active" : ""}
                  onClick={() => setChairsFocus("room")}
                >
                  Sit with someone
                </button>
              </nav>
              {chairsFocus === "practise" ? (
                <PractiseRoom
                  auth={auth}
                  aiConfigured={ai}
                  privateContext={context}
                  onPrivateContextChange={setContext}
                  onNotice={flash}
                  seed={practiseSeed}
                />
              ) : (
                <TwoChairsRoom
                  auth={auth}
                  displayName={displayName}
                  profile={profile}
                  aiConfigured={ai}
                  voiceConfigured={voiceConfigured}
                  onNotice={flash}
                />
              )}
            </div>
          )}

          {(view === "profile" || view === "space") && (
            <ProfileHome
              auth={auth}
              displayName={displayName}
              profile={profile}
              onNotice={flash}
              onMotionChange={setMotionEnabled}
              onEnroll={() => go("enroll")}
              onSwitchRole={switchRole}
              context={context}
              onContextChange={setContext}
              shareMode={shareMode}
              onShareModeChange={setShareMode}
              shareTarget={shareTarget}
              onShareTargetChange={setShareTarget}
              reflections={reflections}
              onReflectionsChange={setReflections}
              onSaveContext={() => { void saveContext(); }}
              onSaveNote={() => { saveReflections(reflections); flash("Note saved in this browser."); }}
              requests={requests}
              connectionTab={connectionTab}
              onConnectionTab={setConnectionTab}
              busy={busy}
              encryptionAtRest={Boolean(encryption?.atRest)}
              pairingCode={pairingCode}
              onPairingCodeChange={setPairingCode}
              onConnect={() => { void connectStranger(); }}
              onCancelRequest={async id => {
                try {
                  const result = await api<{ request: SessionRequest }>("/api/requests", "PATCH", { id, action: "cancel" });
                  setRequests(current => current.map(entry => entry.id === id ? result.request : entry));
                  flash("Request cancelled.");
                } catch (error) { flash((error as Error).message); }
              }}
              onStartCall={id => { void startCall(id); }}
              onWorkTogether={() => { setChairsFocus("room"); go("chairs"); }}
              onOpenIntro={() => go("intro")}
              onOpenQuiet={() => ambient.openPanel()}
              activeCall={activeCall}
              onCallChange={setActiveCall}
              onCallEnded={() => setActiveCall(null)}
              spaceStartsOpen={view === "space"}
            />
          )}
        </main>
      )}

      <footer className="footer">
        <div className="footer-top">
          <button className="brand" onClick={() => go("home")}><span className="brand-mark"><i/><i/></span>saath<span className="brand-dot">.</span></button>
          <span className="footer-tagline">Someone alongside you.</span>
          <div>
            <button onClick={() => setModal("approach")}>Our approach</button>
            <button onClick={() => go("enroll")}>Enroll</button>
            <button onClick={() => setModal("privacy")}>Privacy</button>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Saath · An early, private preview</span>
          <p>For adults 18+. Peer support and AI rehearsal are not emergency services or a substitute for professional care. End-to-end encryption is not claimed.</p>
        </div>
      </footer>

      {(selected || modal) && (
        <div className="modal-backdrop" onClick={() => { setSelected(null); setModal(null); }}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={event => event.stopPropagation()}>
            <button className="modal-close" aria-label="Close dialog" onClick={() => { setSelected(null); setModal(null); }}><X size={20}/></button>
            {selected && (
              <>
                <div className="eyebrow">FICTIONAL AI COMPANION</div>
                <div className="appearance-preview-art" style={{ marginBottom: 12 }}>
                  <SaathCharacter name={selected.characterKey || "mira"} size={120} alt="" />
                </div>
                <h2 id="modal-title">{selected.name} · {selected.specialty}</h2>
                <p>{SAMPLE_PROFILE_NOTICE} Domain: {selected.domain}.</p>
                <p className="small-print">Choosing {selected.name} changes only the AI persona — never your human identity. Connect here, then work the conversation together.</p>
                <label>How would you like to be supported?<select value={support} onChange={event => setSupport(event.target.value)}><option>Listen only</option><option>Help me reflect</option><option>Offer suggestions</option></select></label>
                <p className="small-print">Modes: Message{voiceConfigured ? " · Voice" : ""} · no video with AI.</p>
                <label>Context to include<textarea value={context} onChange={event => setContext(event.target.value)} maxLength={4000} placeholder="Only what you want this personality to hear…"/></label>
                <button className="button full" onClick={() => { setListenStep("connect"); setSelected(null); dmWithPersona(selected); }}>Connect with {selected.name}<ArrowRight size={17}/></button>
                <button className="outline-button" onClick={() => { setListenStep("task"); setSelected(null); talkWithPersona(selected); }}>Work with {selected.name}</button>
                <button className="outline-button" onClick={() => { setSelected(null); askForPerson(); }}>I’d rather talk with a person</button>
                <label className="checkbox-label"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)}/> I understand this is a sample request only, not a live person.</label>
                <button className="quiet" disabled={!consent || busy} onClick={requestPerson}>{busy ? "Saving…" : "Save a sample request anyway"}</button>
                <button className="quiet" onClick={() => setBlocks(toggleBlock(selected.id))}>{blocks.includes(selected.id) ? "Unblock in this browser" : "Block in this browser"}</button>
                {!auth && <a className="sign-in-link" href="/signin-with-chatgpt?return_to=/">Sign in to save requests</a>}
              </>
            )}
            {modal === "approach" && (
              <>
                <div className="eyebrow">A LITTLE SUPPORT. A LITTLE SAATH.</div>
                <h2 id="modal-title">You set the pace.</h2>
                <div className="approach-step"><span>01</span><div><h3>Start with what you need.</h3><p>A live listener by pairing code, a fictional AI personality, or Two chairs to practise first.</p></div></div>
                <div className="approach-step"><span>02</span><div><h3>Choose what to share.</h3><p>Your context is yours. Review it before any connection request.</p></div></div>
                <div className="approach-step"><span>03</span><div><h3>Make room to be heard.</h3><p>Under Two chairs, describe the scenario, let AI understand it, rehearse, then sit with someone when you are ready.</p></div></div>
                <button className="button full" onClick={() => { setModal(null); go("connect"); }}>Explore Saath <ArrowRight size={17}/></button>
              </>
            )}
            {modal === "privacy" && (
              <>
                <div className="eyebrow">CLEAR BOUNDARIES</div>
                <h2 id="modal-title">Your story belongs to you.</h2>
                <p>AI personalities are fictional. Unsaved writing stays in this tab. Signed-in context and requests are stored on Vinext/D1 and access is limited to their owner. Context can be encrypted at rest when configured — that is not end-to-end encryption.</p>
                <p>AI rehearsal only sends text after you opt in. Browser voice calling exists between two enrolled people after a request is accepted (Two Chairs / calls API). There is no call recording, and end-to-end encryption is not claimed.</p>
                <p>You can delete your context from the profile icon. Previously viewed content cannot be unremembered by a person who already saw it.</p>
                <button className="button full" onClick={() => { setModal(null); go("profile"); }}>Manage my context <ArrowRight size={17}/></button>
              </>
            )}
            {modal === "join" && (
              <>
                <div className="eyebrow">SIT AS A COMPANION</div>
                <h2 id="modal-title">Enroll as a {ROLE_LABELS.listener.short}.</h2>
                <p>{ROLE_LABELS.listener.short} enrollment gives you a pairing code. There is no paid counselor directory on this minimal path.</p>
                <button className="button full" onClick={() => { setModal(null); go("enroll"); }}>Open enrollment <ArrowRight size={17}/></button>
              </>
            )}
            {modal === "phrase" && (
              <>
                <div className="eyebrow">PREVIEW BEFORE SENDING</div>
                <h2 id="modal-title">This message has not been sent.</h2>
                <p>Recipient: {phrasePerson ? `${phrasePerson.name} (fictional AI personality, not a live person)` : "No available recipient"}.</p>
                <pre className="intro-preview">{phrase}</pre>
                <p className="small-print">Sample profiles cannot accept. A saved request would stay pending and would not notify anyone.</p>
                <button className="button full" onClick={() => {
                  setSelected(phrasePerson);
                  setContext(phrase);
                  setConsent(false);
                  setModal(null);
                  go("connect");
                  flash("Preview the request in Find a person. Nothing was sent.");
                }}>Continue to a request preview</button>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <AmbientProvider>
      <App/>
    </AmbientProvider>
  );
}
