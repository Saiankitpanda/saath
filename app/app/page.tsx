"use client";

import { useEffect, useRef, useState } from "react";
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
import AppearanceEditor from "@/components/AppearanceEditor";
import AuthModal from "@/components/AuthModal";
import CrisisModal from "@/components/CrisisModal";
import MoodRelaxationCard from "@/components/MoodRelaxationCard";
import AnimatedMoodFace from "@/components/AnimatedMoodFace";
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
import { caseStudies, trustPoints } from "@/lib/fixtures";
import {
  ROLE_LABELS,
  SAMPLE_PROFILE_NOTICE,
  type ActivityRecord,
  type ConversationRecord,
  type EncryptionStatus,
  type EnrollmentProfile,
  type EnrollmentRole,
  type InterestId,
  type IntroAnswers,
  type MoodEntry,
  type MoodKind,
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
  Menu,
  MessageCircle,
  Phone,
  Plus,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Users,
  UserRound,
  LogIn,
  LogOut,
  X,
} from "lucide-react";

const paths = [
  { view: "connect" as View, n: "01", icon: MessageCircle, title: "Someone to listen.", desc: "Talk with an AI companion, or connect with a companion after they accept.", label: "Meet someone" },
  { view: "circles" as View, n: "02", icon: Users, title: "Peer circles.", desc: "Meet people with a similar lived experience. Discuss and post when you are ready.", label: "Join a circle" },
  { view: "chairs" as View, n: "03", icon: Armchair, title: "Two chairs.", desc: "Practise the hard conversation first, then sit with someone when you are ready.", label: "Open Two Chairs" },
];

function App() {
  const ambient = useAmbient();
  const [view, setView] = useState<View>("home");
  const [mobile, setMobile] = useState(false);
  const [auth, setAuth] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalRole, setAuthModalRole] = useState<EnrollmentRole>("client");
  const [crisisOpen, setCrisisOpen] = useState(false);
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
  const [serverStrangers, setServerStrangers] = useState<{ id: string; name: string; distanceKm: number; situation: string; languages: string[]; available: boolean }[]>([]);
  const [callSituation, setCallSituation] = useState("");
  const [connectedName, setConnectedName] = useState("");
  const [openRoom, setOpenRoom] = useState(false);
  const autoconnectStarted = useRef(false);
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
  const [userMood, setUserMood] = useState<MoodKind | null>(null);
  const [sanctuaryModalOpen, setSanctuaryModalOpen] = useState(false);
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
    try {
      const storedMood = localStorage.getItem("saath_current_mood") as MoodKind | null;
      if (storedMood) {
        setUserMood(storedMood);
      } else if (fixtures.moods && fixtures.moods.length > 0) {
        setUserMood(fixtures.moods[0].mood);
      }
    } catch {}
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
    if (params.get("open") === "1") {
      setView("chairs");
      setChairsFocus("room");
      setOpenRoom(true);
    }
    if (params.get("autoconnect") === "1") {
      setView("connect");
      setStrangerOpen(true);
    }
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
    if (!auth) return undefined;
    const interval = window.setInterval(() => {
      api<{ requests?: SessionRequest[]; incoming?: SessionRequest[] }>("/api/requests")
        .then(res => {
          if (res.incoming) {
            setIncoming(curr => {
              if (res.incoming && res.incoming.length > curr.length) {
                flash("You have a new incoming connection request!");
              }
              return res.incoming || [];
            });
          }
          if (res.requests) {
            setRequests(res.requests);
          }
        })
        .catch(() => {});
    }, 4000);
    return () => window.clearInterval(interval);
  }, [auth]);

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
      story: `${person.name} Â· ${person.intro}\nI want to talk about: ${person.quote}`,
      goal: `Talk about ${person.specialty.toLowerCase()}`,
    });
    setChairsFocus("practise");
    go("chairs");
    flash(`${person.name} is a fictional AI companion. Describe your scenario under Two chairs â†’ Practise, then rehearse. No video with AI.`);
  }

  function dmWithPersona(person: Person) {
    setActiveCall(null);
    setChatRequest(null);
    setAiChatPerson(person);
    flash(`DM with ${person.name} is open. Fictional companion â€” not a live person.`);
  }
  function askForPerson() {
    setStrangerOpen(true);
    setListenStep("meet");
    go("connect");
    flash("Choose a companion nearby. People who fit your answers appear after you open it.");
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
        ? "Video room is ringing. Camera stays off until you Join â€” Meet-style browser call."
        : "Voice room is ringing. Microphone stays off until you Join.");
    } catch (error) {
      flash((error as Error).message);
    } finally {
      setBusy(false);
    }
  }


  function handleAuthSuccess(user: {
    id: string;
    email: string;
    fullName?: string;
    displayName?: string;
    activeRole?: EnrollmentRole;
    pairingCode?: string;
    initialMood?: MoodKind;
    initialReflection?: string;
  }) {
    setAuth(true);
    const name = user.fullName || user.displayName || user.email.split("@")[0] || "User";
    setDisplayName(name);
    setProfile({
      displayName: name,
      clientEnrolled: true,
      listenerEnrolled: user.activeRole === "listener",
      activeRole: user.activeRole || "client",
      pairingCode: user.pairingCode || null,
      updatedAt: new Date().toISOString(),
    });

    if (user.initialMood) {
      setUserMood(user.initialMood);
      try {
        localStorage.setItem("saath_current_mood", user.initialMood);
      } catch {}

      const noteText = user.initialReflection || `Arrived feeling ${user.initialMood}`;
      setMoods(current => [
        {
          id: `mood-${Date.now()}`,
          mood: user.initialMood!,
          note: noteText,
          createdAt: new Date().toISOString(),
        },
        ...current,
      ]);

      if (user.initialReflection) {
        setReflections(curr => (curr ? `${user.initialReflection}\n---\n${curr}` : user.initialReflection!));
        saveReflections(user.initialReflection);
      }

      setSanctuaryModalOpen(true);
    }

    flash(`Welcome, ${name}.`);
    go("home");
  }

  async function handleSignOut() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    setAuth(false);
    setDisplayName("");
    setProfile(null);
    setContext("");
    setUserMood(null);
    try {
      localStorage.removeItem("saath_current_mood");
    } catch {}
    setRequests([]);
    setIncoming([]);
    flash("You have been signed out.");
    go("home");
  }

  async function enroll(input: { clientEnrolled: boolean; listenerEnrolled: boolean; activeRole: EnrollmentRole; displayName: string }) {
    if (!auth) {
      setAuthModalRole(input.activeRole);
      setAuthModalOpen(true);
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
      flash("Sign in to ask a companion to talk with you.");
      return;
    }
    if (!pairingCode.trim()) {
      flash("Ask someone for their invite code, or open Two chairs and share your room code with a companion.");
      return;
    }
    setBusy(true);
    try {
      const result = await api<{ request: SessionRequest; notice?: string }>("/api/requests", "POST", {
        topic: strangerMode === "voice" ? "Voice with a companion" : "Chat with a companion",
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
      flash(action === "accept" ? "You accepted this request. Opening connection..." : "You declined this request.");
      if (action === "accept") {
        if (result.request.mode === "voice" || result.request.mode === "video") {
          void startCall(result.request.id, result.request.mode);
        } else {
          setChatRequest(result.request);
        }
      }
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

  const issueText = [intro?.beforeTalking, intro?.readiness, intro?.offLimits, context]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  useEffect(() => {
    if (view !== "connect" || !strangerOpen) return;
    const query = new URLSearchParams({ situation: issueText });
    api<{ strangers: { id: string; name: string; distanceKm: number; situation: string; languages: string[]; available: boolean }[] }>(`/api/strangers?${query}`)
      .then(result => setServerStrangers(result.strangers || []))
      .catch(error => flash((error as Error).message));
  }, [view, strangerOpen, issueText]);

  useEffect(() => {
    if (!auth || autoconnectStarted.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("autoconnect") !== "1") return;
    autoconnectStarted.current = true;
    setStrangerOpen(true);
    void autoconnect();
  }, [auth]);

  async function autoconnect() {
    setListenStep("auto");
    if (!auth) {
      window.location.href = `/signin-with-chatgpt?return_to=${encodeURIComponent("/?view=connect&autoconnect=1")}`;
      return;
    }
    try {
      const result = await api<{
        stranger: { id: string; name: string; situation: string };
        strangers: { id: string; name: string; distanceKm: number; situation: string; languages: string[]; available: boolean }[];
        situation: string;
        call: PublicCall;
      }>("/api/strangers", "POST", { situation: issueText });
      setServerStrangers(result.strangers || []);
      setConnectedName(result.stranger.name);
      setCallSituation(result.situation);
      setActiveCall(result.call);
      setListenStep("connect");
      saveStrangerPref({ lastPeerId: result.stranger.id, lastPeerName: result.stranger.name, situation: result.situation });
      flash(`Connected with ${result.stranger.name}. The call is about: ${result.situation}`);
      window.setTimeout(() => document.getElementById("call-result")?.scrollIntoView({ behavior: "smooth", block: "start" }), 40);
    } catch (error) {
      flash((error as Error).message);
    }
  }

  function doTheTask() {
    if (activeCall) {
      setListenStep("task");
      document.getElementById("call-result")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    void autoconnect();
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
          <CharacterWait kind="app" message="Getting your space readyâ€¦" motionEnabled={motionEnabled} />
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
          <button
            type="button"
            onClick={() => setCrisisOpen(true)}
            title="Need immediate crisis support or emergency helpline?"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "7px 12px",
              borderRadius: 20,
              border: "1px solid #fecaca",
              background: "#fef2f2",
              color: "#b91c1c",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <ShieldAlert size={14} color="#dc2626" />
            <span className="hide-mobile">In Crisis?</span>
          </button>
          {auth ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {profile && (profile.clientEnrolled || profile.listenerEnrolled) ? (
                <div className="role-switch" role="group" aria-label="Active role">
                  {profile.clientEnrolled && (
                    <button className={profile.activeRole === "client" ? "active" : ""} onClick={() => switchRole("client")}>{ROLE_LABELS.client.short}</button>
                  )}
                  {profile.listenerEnrolled && (
                    <button className={profile.activeRole === "listener" ? "active" : ""} onClick={() => switchRole("listener")}>{ROLE_LABELS.listener.short}</button>
                  )}
                </div>
              ) : null}
              {userMood && (
                <button
                  type="button"
                  onClick={() => setSanctuaryModalOpen(true)}
                  title="Open your Calm Sanctuary"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    color: "#334155",
                    background: "#f8faf9",
                    minHeight: 36,
                    padding: "6px 12px",
                    borderRadius: 20,
                    border: "1px solid rgba(82, 107, 134, 0.22)",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 500,
                  }}
                >
                  <AnimatedMoodFace mood={userMood} size={18} animated={false} />
                  <span className="hide-mobile" style={{ textTransform: "capitalize" }}>Calm Space</span>
                </button>
              )}
              <button
                type="button"
                className="button small"
                onClick={handleSignOut}
                title="Sign out of this session"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  color: "#ffffff",
                  background: "#475569",
                  minHeight: 36,
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <LogOut size={14} color="#ffffff" style={{ color: "#ffffff", stroke: "#ffffff" }} />
                <span className="hide-mobile" style={{ color: "#ffffff", fontWeight: 500 }}>Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="button small"
              onClick={() => { setAuthModalRole("client"); setAuthModalOpen(true); }}
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <LogIn size={15}/> <span>Sign in</span>
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
              <div className="eyebrow"><span/> EARLY PREVIEW Â· 18+</div>
              <h1>A little space.<br/>A little <em>Saath.</em></h1>
              <p className="hero-description">Talk to someone. Practise whatâ€™s hard to say.</p>
              <div className="hero-actions">
                <button className="button" onClick={() => go(profile ? "arrive" : "enroll")}>
                  {profile ? "Continue your visit" : "Enroll or sign in"} <ArrowRight size={18}/>
                </button>
                <button className="text-button" onClick={() => go("connect")}>Listen</button>
              </div>
              <div className="language-note"><Globe size={14}/> English <span>Â·</span> à¤¹à¤¿à¤¨à¥à¤¦à¥€ <span>Â·</span> Hinglish</div>
              <div className="hero-footnote"><span className="tiny-flower">âœ³</span> Adults 18+. No perfect words needed.</div>
            </div>
            <div className="hero-art">
              <div className="art-backdrop"/>
              <img src="/assets/saath-garden-hero.png" alt="A quiet garden courtyard with two empty chairs and soft natural light"/>
              <div className="conversation-note"><span>You can start withâ€¦</span><p>â€œI donâ€™t know<br/>where to begin.â€</p><span className="note-line"/></div>
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
          {/* Real-time Incoming Companion Request / Call Alert Banner */}
          {incoming.filter(item => item.status === "pending").length > 0 && (
            <aside
              role="alert"
              style={{
                position: 'sticky',
                top: 14,
                zIndex: 60,
                margin: '0 auto 20px',
                maxWidth: 680,
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                color: '#ffffff',
                padding: '14px 20px',
                borderRadius: 16,
                boxShadow: '0 12px 28px -5px rgba(15, 23, 42, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                border: '1px solid rgba(56, 189, 248, 0.25)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0f172a',
                  flexShrink: 0,
                }}>
                  {incoming.filter(item => item.status === "pending")[0].mode === 'voice' ? <Phone size={20} /> : <MessageCircle size={20} />}
                </div>
                <div>
                  <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', fontWeight: 700 }}>
                    Incoming {incoming.filter(item => item.status === "pending")[0].mode === 'voice' ? 'Voice Call' : incoming.filter(item => item.status === "pending")[0].mode === 'video' ? 'Video Call' : 'Chat Request'}
                  </div>
                  <div style={{ fontSize: '0.96rem', fontWeight: 700, color: '#f8fafc', marginTop: 1 }}>
                    {incoming.filter(item => item.status === "pending")[0].topic}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => actOnIncoming(incoming.filter(item => item.status === "pending")[0].id, 'accept')}
                  style={{
                    background: '#22c55e',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: 10,
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Accept
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => actOnIncoming(incoming.filter(item => item.status === "pending")[0].id, 'decline')}
                  style={{
                    background: 'rgba(255, 255, 255, 0.12)',
                    color: '#cbd5e1',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: 10,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Decline
                </button>
              </div>
            </aside>
          )}
          {view === "enroll" && (
            <Enrollment
              auth={auth}
              displayName={displayName}
              profile={profile}
              busy={busy}
              onEnroll={enroll}
              onOpenAuthModal={(role) => {
                setAuthModalRole(role);
                setAuthModalOpen(true);
              }}
              onSignOut={handleSignOut}
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
              onOpenAuth={() => setAuthModalOpen(true)}
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
              onOpenAuth={() => setAuthModalOpen(true)}
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
                  <div className="eyebrow">LISTEN Â· THEN ACT</div>
                  <h1>A quiet companion<br/>when you need to <em>speak.</em></h1>
                  <p>Choose a companion nearby when you are ready. People who fit what you answered appear only after that.</p>
                  <div className="listen-hero-actions">
                    <button className="button" type="button" onClick={revealNearby}>
                      Choose a companion nearby <ArrowRight size={17}/>
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
                    <strong>Talk to a companion</strong>
                    <em>Nearby list Â· same situation Â· auto-match</em>
                  </span>
                  <span className="stranger-accordion-chevron">{strangerOpen ? "Matches open" : "Choose nearby"}</span>
                </button>
                <div className="stranger-accordion-body stranger-teaser">
                  <p className="small-print">
                    Choose someone in your radius, match with a similar situation, or reconnect later.
                    Invite-code requests still work below for people you already know.
                  </p>
                  <button className="button" type="button" onClick={() => go("strangers")}>
                    Choose a companion nearby <ArrowRight size={16}/>
                  </button>
                  <div className="two-column" style={{ marginTop: 18 }}>
                    <section className="plain-panel meet-panel">
                      <h3>Invite code (optional)</h3>
                      <label htmlFor="stranger-note">What you'd like them to know
                        <textarea id="stranger-note" value={strangerNote} onChange={event => setStrangerNote(event.target.value)} maxLength={500} rows={3}/>
                      </label>
                      <label htmlFor="pairing-code">Their invite code
                        <input id="pairing-code" value={pairingCode} onChange={event => setPairingCode(event.target.value.toUpperCase())} maxLength={6} placeholder="AB23CD"/>
                      </label>
                      <div className="meet-mode-grid stranger-mode-grid" role="radiogroup" aria-label="Companion connection mode">
                        {([
                          ["voice", "Voice", Phone],
                          ["chat", "Chat", MessageCircle],
                        ] as ["voice" | "chat", string, typeof Phone][]).map(([id, title, Icon]) => (
                          <button
                            key={id}
                            type="button"
                            role="radio"
                            aria-checked={strangerMode === id}
                            className={"meet-mode-card" + (strangerMode === id ? " selected" : "")}
                            onClick={() => setStrangerMode(id)}
                          >
                            <Icon size={18} strokeWidth={1.4}/>
                            <strong>{title}</strong>
                          </button>
                        ))}
                      </div>
                      <div className="inline-actions">
                        <button className="button" type="button" disabled={busy || pairingCode.trim().length !== 6} onClick={connectStranger}>
                          {busy ? "Sending..." : strangerMode === "chat" ? "Ask to chat" : "Ask for voice"}
                        </button>
                      </div>
                      {!auth && <button type="button" className="text-button" onClick={() => setAuthModalOpen(true)}>Sign in first</button>}
                    </section>
                    <section className="plain-panel meet-panel">
                      <h3>If you companion</h3>
                      {profile?.pairingCode ? (
                        <p className="pairing-code">Your invite code <strong>{profile.pairingCode}</strong></p>
                      ) : (
                        <button className="text-button" type="button" onClick={() => go("enroll")}>Enroll as a {ROLE_LABELS.listener.short}</button>
                      )}
                      {incoming.length ? incoming.map(item => (
                        <div className="request-row" key={item.id}>
                          <div><strong>{item.topic}</strong><span>{item.status}</span></div>
                          {item.status === "pending" && profile?.listenerEnrolled && (
                            <div className="inline-actions">
                              <button className="quiet" type="button" disabled={busy} onClick={() => actOnIncoming(item.id, "accept")}>Accept</button>
                              <button className="quiet" type="button" disabled={busy} onClick={() => actOnIncoming(item.id, "decline")}>Decline</button>
                            </div>
                          )}
                          {item.status === "accepted" && (
                            <div className="inline-actions">
                              <button className="quiet" type="button" disabled={busy} onClick={() => void startCall(item.id, "voice")}>Join voice</button>
                              <button className="quiet" type="button" onClick={() => { setActiveCall(null); setAiChatPerson(null); setChatRequest(item); }}>Open DM</button>
                            </div>
                          )}
                        </div>
                      )) : <p className="small-print">No requests yet.</p>}
                    </section>
                  </div>
                </div>
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
                    <li className={listenStep === "meet" ? "current" : ""}>
                      <strong>1. Meet and greet</strong>
                      <span>People from the server, matched to what you are carrying.</span>
                      <div className="listen-nearby">
                        {serverStrangers.map(item => (
                          <div className="request-row" key={item.id}>
                            <div>
                              <strong>{item.name}</strong>
                              <span>{item.situation} Â· {item.distanceKm} km</span>
                            </div>
                          </div>
                        ))}
                        {!serverStrangers.length && <p className="small-print">Loading peopleâ€¦</p>}
                      </div>
                    </li>
                    <li className={listenStep === "connect" || listenStep === "auto" ? "current" : ""}>
                      <strong>2. Autoconnect</strong>
                      <span>The server matches the closest companion and opens the call with your situation.</span>
                    </li>
                    <li className={listenStep === "task" ? "current" : ""}>
                      <strong>3. The call</strong>
                      <span>Join when the line is ready. The situation stays with the call.</span>
                    </li>
                  </ol>
                  <div className="inline-actions">
                    <button className="button" type="button" onClick={() => void autoconnect()}>Autoconnect</button>
                    <button className="outline-button" type="button" onClick={doTheTask}>Open the call</button>
                    <button className="text-button" type="button" onClick={() => go("intro")}>Update your answers</button>
                  </div>
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
                        onOpenAuth={() => setAuthModalOpen(true)}
                      />
                    </section>
                  )}
                  {activeCall && (
                    <section id="call-result" className="plain-panel">
                      <h3>Call with {connectedName || activeCall.guestName}</h3>
                      <p>Situation: {callSituation || "What you are carrying"}</p>
                      <CallRoom
                        call={activeCall}
                        onChange={setActiveCall}
                        onEnded={() => setActiveCall(null)}
                        onNotice={flash}
                      />
                    </section>
                  )}
                  {chatRequest && (
                    <StrangerChat
                      requestId={chatRequest.id}
                      peerName={chatRequest.providerName}
                      onClose={() => setChatRequest(null)}
                      onNotice={flash}
                      onOpenAuth={() => setAuthModalOpen(true)}
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
                  setStrangerMode(mode === "chat" ? "chat" : "voice");
                  setStrangerNote(note);
                  saveStrangerPref({ lastPeerId: peerId, lastPeerName: peerName, situation });
                  const preview: SessionRequest = {
                    id: `near-${peerId}`,
                    providerId: peerId,
                    providerName: peerName,
                    topic: mode === "video" ? "Video call with a companion" : mode === "voice" ? "Voice with a companion" : "Chat with a companion",
                    context: note,
                    mode: mode === "chat" ? "chat" : "voice",
                    status: "accepted",
                    createdAt: new Date().toISOString(),
                  };
                  setRequests(current => [preview, ...current.filter(item => item.id !== preview.id)]);
                  setAiChatPerson(null);
                  if (mode === "video") {
                    setChatRequest(null);
                    void startCall(preview.id, "video");
                  } else if (mode === "voice") {
                    setChatRequest(null);
                    void startCall(preview.id, "voice");
                  } else {
                    setActiveCall(null);
                    setChatRequest(preview);
                  }
                  flash(
                    mode === "video"
                      ? `Video room opening with ${peerName}. Daily.co / Google Meet available.`
                      : mode === "voice"
                        ? `Voice line opening with ${peerName}.`
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
                  onOpenAuth={() => setAuthModalOpen(true)}
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
                  autoOpen={openRoom}
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
          <span>Â© {new Date().getFullYear()} Saath Â· An early, private preview</span>
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
                <h2 id="modal-title">{selected.name} Â· {selected.specialty}</h2>
                <p>{SAMPLE_PROFILE_NOTICE} Domain: {selected.domain}.</p>
                <p className="small-print">Choosing {selected.name} changes only the AI persona â€” never your human identity. Connect here, then work the conversation together.</p>
                <label>How would you like to be supported?<select value={support} onChange={event => setSupport(event.target.value)}><option>Listen only</option><option>Help me reflect</option><option>Offer suggestions</option></select></label>
                <p className="small-print">Modes: Message{voiceConfigured ? " Â· Voice" : ""} Â· no video with AI.</p>
                <label>Context to include<textarea value={context} onChange={event => setContext(event.target.value)} maxLength={4000} placeholder="Only what you want this personality to hearâ€¦"/></label>
                <button className="button full" onClick={() => { setListenStep("connect"); setSelected(null); dmWithPersona(selected); }}>Connect with {selected.name}<ArrowRight size={17}/></button>
                <button className="outline-button" onClick={() => { setListenStep("task"); setSelected(null); talkWithPersona(selected); }}>Work with {selected.name}</button>
                <button className="outline-button" onClick={() => { setSelected(null); askForPerson(); }}>Iâ€™d rather talk with a person</button>
                <label className="checkbox-label"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)}/> I understand this is a sample request only, not a live person.</label>
                <button className="quiet" disabled={!consent || busy} onClick={requestPerson}>{busy ? "Savingâ€¦" : "Save a sample request anyway"}</button>
                <button className="quiet" onClick={() => setBlocks(toggleBlock(selected.id))}>{blocks.includes(selected.id) ? "Unblock in this browser" : "Block in this browser"}</button>
                {!auth && <button type="button" className="sign-in-link text-button" onClick={() => { setModal(null); setAuthModalOpen(true); }}>Sign in to save requests</button>}
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
                <p>AI personalities are fictional. Unsaved writing stays in this tab. Signed-in context and requests are stored on Vinext/D1 and access is limited to their owner. Context can be encrypted at rest when configured â€” that is not end-to-end encryption.</p>
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

      {authModalOpen && (
        <AuthModal
          isOpen={authModalOpen}
          initialRole={authModalRole}
          onClose={() => setAuthModalOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      )}

      {sanctuaryModalOpen && userMood && (
        <MoodRelaxationCard
          asModal={true}
          mood={userMood}
          userName={displayName}
          initialNote={moods[0]?.note}
          onMoodChange={(nextMood) => {
            setUserMood(nextMood);
            try {
              localStorage.setItem("saath_current_mood", nextMood);
            } catch {}
            setMoods(curr => [
              {
                id: `mood-${Date.now()}`,
                mood: nextMood,
                note: `Updated feeling: ${nextMood}`,
                createdAt: new Date().toISOString(),
              },
              ...curr,
            ]);
            flash(`Your calm sanctuary has been tuned for feeling ${nextMood}.`);
          }}
          onSaveReflection={(note, m) => {
            setMoods(curr => [
              {
                id: `mood-${Date.now()}`,
                mood: m,
                note,
                createdAt: new Date().toISOString(),
              },
              ...curr,
            ]);
            setReflections(curr => (curr ? `${note}\n---\n${curr}` : note));
            saveReflections(note);
            flash("Your quiet reflection is saved in My Space.");
          }}
          onNavigate={(dest) => {
            setSanctuaryModalOpen(false);
            go(dest as View);
          }}
          onDismiss={() => {
            setSanctuaryModalOpen(false);
          }}
        />
      )}

      <CrisisModal
        isOpen={crisisOpen}
        onClose={() => setCrisisOpen(false)}
      />
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
