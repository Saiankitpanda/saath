"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { AmbientProvider, useAmbient } from "@/components/AmbientSound";
import NeedAMoment from "@/components/NeedAMoment";
import ArriveHome from "@/components/ArriveHome";
import GettingToKnowYou from "@/components/GettingToKnowYou";
import ActivitiesWorkspace from "@/components/ActivitiesWorkspace";
import ConversationRoom from "@/components/ConversationRoom";
import Enrollment from "@/components/Enrollment";
import TwoChairsRoom from "@/components/TwoChairsRoom";
import CallRoom from "@/components/CallRoom";
import { api } from "@/lib/client/api";
import type { PublicCall } from "@/lib/application/ports";
import {
  addMood,
  loadFixtures,
  saveInterests,
  saveReflections,
  toggleBlock,
} from "@/lib/client/store";
import { samplePeople, staticWritingPrompts, topics } from "@/lib/fixtures";
import {
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
  BookOpen,
  Check,
  Globe,
  Heart,
  Leaf,
  Menu,
  MessageCircle,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  UserRound,
  X,
} from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

const paths = [
  { view: "connect" as View, n: "01", icon: MessageCircle, title: "Someone to listen.", desc: "Pair with a real listener by code, or talk with a clearly fictional AI personality.", label: "Meet someone" },
  { view: "rehearsal" as View, n: "02", icon: Armchair, title: "A room to practise.", desc: "Practise what’s hard to say with a clearly fictional counterpart.", label: "Enter rehearsal room" },
  { view: "chairs" as View, n: "03", icon: Users, title: "Two chairs.", desc: "Sit with someone after they join. Text first, then a voice call if you both want it.", label: "Open Two Chairs" },
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
  const [language, setLanguage] = useState("All languages");
  const [role, setRole] = useState("Everyone");
  const [support, setSupport] = useState("Listen only");
  const [context, setContext] = useState("");
  const [shareMode, setShareMode] = useState<"private" | "ask-first">("private");
  const [notice, setNotice] = useState("");
  const [requests, setRequests] = useState<SessionRequest[]>([]);
  const [selected, setSelected] = useState<Person | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [scenario, setScenario] = useState("Setting a boundary");
  const [goal, setGoal] = useState("Say the first sentence clearly");
  const [style, setStyle] = useState("Receptive");
  const [aiConsent, setAiConsent] = useState(false);
  const [includeContext, setIncludeContext] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
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
  const abortRef = useRef<AbortController | null>(null);

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
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const intended = params.get("enroll");
    if (intended === "client" || intended === "listener") setView("enroll");
    const requestedView = params.get("view");
    if (requestedView === "circles" || requestedView === "onboard") {
      setView(requestedView === "onboard" ? "enroll" : "connect");
    } else if (
      requestedView === "chairs" ||
      requestedView === "connect" ||
      requestedView === "arrive" ||
      requestedView === "space" ||
      requestedView === "activities" ||
      requestedView === "rehearsal" ||
      requestedView === "enroll"
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
                ? "You are enrolled as a listener on this account."
                : "You are enrolled as a client on this account.");
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
    const resolved = next === "circles" ? "connect" : next === "onboard" ? "enroll" : next;
    setView(resolved);
    setMobile(false);
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function flash(message: string) { setNotice(message); }
  function talkWithPersona(person: Person) {
    setScenario(person.domain);
    setGoal(`Talk about ${person.specialty.toLowerCase()}`);
    setStyle("Receptive");
    setMessages([]);
    setSelected(null);
    go("rehearsal");
    flash(`${person.name} is a fictional AI personality for ${person.specialty.toLowerCase()}. Not a person, not treatment. AI replies need a configured provider.`);
  }
  function askForPerson() {
    go("connect");
    flash("A live person is reached only with a pairing code, and only after they accept. Saath does not invent availability.");
  }
  async function startCall(requestId: string) {
    setBusy(true);
    try {
      const result = await api<{ call: PublicCall }>("/api/calls", "POST", {
        source: "request",
        sourceId: requestId,
        media: "voice",
      });
      setActiveCall(result.call);
      flash("The call is ringing. The other person joins from their account. Your microphone stays off until you join.");
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
        ? "Listener enrollment is saved. You share one home. A live person is used only after someone actually accepts."
        : "You are enrolled. This home is for expressing yourself. A live person is used if one has accepted; otherwise you can talk with a fictional AI personality.");
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
      flash(role === "listener" ? "You are using the listener view." : "You are using the client view.");
    } catch (error) {
      flash((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function pairListener() {
    if (!auth) {
      flash("Sign in to send a request to an enrolled listener.");
      return;
    }
    if (!pairingCode.trim()) return;
    setBusy(true);
    try {
      const result = await api<{ request: SessionRequest; notice?: string }>("/api/requests", "POST", {
        topic,
        context: context || "I would like to talk when you have a moment.",
        consent: true,
        mode: "chat",
        pairingCode: pairingCode.trim().toUpperCase(),
      });
      setRequests(current => [result.request, ...current.filter(item => item.id !== result.request.id)]);
      setPairingCode("");
      flash(result.notice || "Request saved. The listener can accept it from their account.");
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

  async function sendRehearsal(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim() || busy || submitLock) return;
    if (!aiConsent) {
      flash("Please allow AI processing before sending your practice conversation.");
      return;
    }
    const submitted = includeContext && context.trim()
      ? `${draft.trim()}\n\nContext I chose to include:\n${context.trim()}`
      : draft.trim();
    const next: Message[] = [...messages, { role: "user", content: submitted }];
    setMessages(next);
    setDraft("");
    setBusy(true);
    setSubmitLock(true);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const result = await fetch("/api/rehearse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: next.slice(-15),
          scenario: `${scenario}. Goal: ${goal}`,
          style: style.toLowerCase(),
          consent: true,
        }),
      });
      const data = await result.json() as { reply?: string; error?: string };
      if (!result.ok) throw new Error(data.error || "The rehearsal could not continue.");
      if (data.reply) setMessages([...next, { role: "assistant", content: data.reply }]);
    } catch (error) {
      if ((error as Error).name === "AbortError") flash("Rehearsal cancelled. Nothing extra was added.");
      else flash((error as Error).message);
    } finally {
      setBusy(false);
      setSubmitLock(false);
    }
  }

  const filtered = samplePeople.filter(person =>
    !blocks.includes(person.id)
    && (language === "All languages" || person.languages.includes(language))
    && (role === "Everyone" || person.specialty === role)
    && (topic === "Just need to talk" || person.topics.includes(topic))
  );

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
      <header className="header">
        <button className="brand" onClick={() => go("home")} aria-label="Saath home"><span className="brand-mark"><i/><i/></span>saath<span className="brand-dot">.</span></button>
        <nav className={mobile ? "main-nav open" : "main-nav"} aria-label="Main navigation">
          <button className={view === "arrive" ? "active" : ""} onClick={() => go("arrive")}>Your visit</button>
          <button className={view === "connect" ? "active" : ""} onClick={() => go("connect")}>Listen</button>
          <button className={view === "rehearsal" ? "active" : ""} onClick={() => go("rehearsal")}>Practise</button>
          <button className={view === "chairs" ? "active" : ""} onClick={() => go("chairs")}>Two chairs</button>
          <button className={view === "space" ? "active" : ""} onClick={() => go("space")}>My space</button>
        </nav>
        <div className="header-actions">
          {profile && (profile.clientEnrolled || profile.listenerEnrolled) ? (
            <div className="role-switch" role="group" aria-label="Active role">
              {profile.clientEnrolled && (
                <button className={profile.activeRole === "client" ? "active" : ""} onClick={() => switchRole("client")}>Client</button>
              )}
              {profile.listenerEnrolled && (
                <button className={profile.activeRole === "listener" ? "active" : ""} onClick={() => switchRole("listener")}>Listener</button>
              )}
            </div>
          ) : (
            <button className="button small" onClick={() => go("enroll")}>
              {auth ? "Enroll" : "Sign in"} <UserRound size={15}/>
            </button>
          )}
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
              <button onClick={() => go("rehearsal")}><span className="topic-icon tint-2"><Sparkles size={18}/></span>Practise<ArrowUpRight className="pill-arrow" size={14}/></button>
              <button onClick={() => go("chairs")}><span className="topic-icon tint-3"><Armchair size={18}/></span>Two chairs<ArrowUpRight className="pill-arrow" size={14}/></button>
              <button onClick={() => go("space")}><span className="topic-icon tint-0"><BookOpen size={18}/></span>My space<ArrowUpRight className="pill-arrow" size={14}/></button>
            </div>
          </section>
          <section className="section pathways">
            <div className="section-head">
              <div><div className="eyebrow">THREE WAYS IN</div><h2>A person, a practice room,<br/>or two chairs.</h2></div>
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
              onSaveMood={(mood: MoodKind) => setMoods(addMood(mood))}
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

          {view === "intro" && (
            <GettingToKnowYou
              initial={intro}
              auth={auth}
              ai={ai}
              onClose={() => go("space")}
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

          {view === "connect" && (
            <>
              <div className="page-heading">
                <div className="eyebrow">A CONVERSATION STARTS WITH A HELLO</div>
                <h1>A person, or an AI personality.</h1>
                <p>Pair with an enrolled listener using their code. Meera, Arjun, Isha, and Kabir are fictional AI personalities with a domain. They cannot accept as people.</p>
              </div>
              <div className="sample-notice"><Leaf size={17}/> {SAMPLE_PROFILE_NOTICE} A live person appears only after they accept a paired request.</div>
              <div className="two-column">
                <section className="plain-panel">
                  <h2>Pair with an enrolled listener</h2>
                  <p>If someone has shared their six-character listener code, you can request them from this account. The request stays pending until they accept.</p>
                  <label htmlFor="pairing-code">Listener pairing code
                    <input id="pairing-code" value={pairingCode} onChange={event => setPairingCode(event.target.value.toUpperCase())} maxLength={6} placeholder="AB23CD"/>
                  </label>
                  <div className="inline-actions">
                    <button className="button" disabled={busy || pairingCode.trim().length !== 6} onClick={pairListener}>{busy ? "Sending…" : "Request this listener"}</button>
                    {!auth && <a className="text-button" href="/signin-with-chatgpt?return_to=/">Sign in first</a>}
                  </div>
                </section>
                <section className="plain-panel">
                  <h2>Incoming listener requests</h2>
                  <p>These appear when you are enrolled as a listener and someone uses your pairing code.</p>
                  {profile?.pairingCode && <p className="pairing-code">Your code <strong>{profile.pairingCode}</strong></p>}
                  {incoming.length ? incoming.map(item => (
                    <div className="request-row" key={item.id}>
                      <div><strong>{item.topic}</strong><span>{item.mode} · {item.status}</span></div>
                      {item.status === "pending" && profile?.listenerEnrolled && (
                        <div className="inline-actions">
                          <button className="quiet" disabled={busy} onClick={() => actOnIncoming(item.id, "accept")}>Accept</button>
                          <button className="quiet" disabled={busy} onClick={() => actOnIncoming(item.id, "decline")}>Decline</button>
                        </div>
                      )}
                      <span className="status-badge">{item.status}</span>
                    </div>
                  )) : <p className="small-print">No incoming requests yet.</p>}
                </section>
              </div>
              <div className="filter-bar">
                <label>What’s on your mind?<select value={topic} onChange={event => setTopic(event.target.value)}>{topics.map(item => <option key={item}>{item}</option>)}</select></label>
                <label>Focus<select value={role} onChange={event => setRole(event.target.value)}>{["Everyone", "Company in hard conversations", "Pressure and next chapters", "Paced conversation", "Spiritual quiet"].map(item => <option key={item}>{item}</option>)}</select></label>
                <label>Language<select value={language} onChange={event => setLanguage(event.target.value)}>{["All languages", "English", "Hindi", "Hinglish"].map(item => <option key={item}>{item}</option>)}</select></label>
              </div>
              <div className="result-heading">
                <p>{filtered.length} AI {filtered.length === 1 ? "personality" : "personalities"} to explore</p>
                <span>Start with what feels comfortable.</span>
              </div>
              <div className="people-grid">
                {filtered.map(person => (
                  <article className="person-card" key={person.id}>
                    <div className={"person-avatar " + person.color}>{person.initials}<span>✳</span></div>
                    <span className="sample-tag">AI PERSONALITY</span>
                    <div className="person-title"><h2>{person.name}</h2><span>{person.specialty}</span></div>
                    <p className="role-note">Fictional AI · {person.domain}</p>
                    <p>{person.intro}</p>
                    <div className="person-chips">{person.topics.map(item => <span key={item}>{item}</span>)}</div>
                    <div className="person-languages"><Globe size={14}/>{person.languages.join(" · ")}</div>
                    <p className="small-print">{person.availabilityLabel}. Chat rehearsal only — not a live person.</p>
                    <div className="person-bottom">
                      <span>Chat<small> · fictional · not a live session</small></span>
                      <button className="round-button" aria-label={"Talk with " + person.name} onClick={() => { setSelected(person); setConsent(false); }}><ArrowUpRight size={20}/></button>
                    </div>
                  </article>
                ))}
              </div>
              {!filtered.length && (
                <div className="empty-state">
                  <Leaf/>
                  <h2>No matching AI personalities.</h2>
                  <p>No AI personalities match these filters. Nobody is actually available as a live participant.</p>
                  <button className="button" onClick={() => { setTopic("Just need to talk"); setRole("Everyone"); setLanguage("All languages"); }}>Reset filters</button>
                </div>
              )}
            </>
          )}

          {view === "rehearsal" && (
            <>
              <div className="page-heading">
                <div className="eyebrow">PRACTISE BEFORE YOU PRESS SEND</div>
                <h1>Find the words.<br/><em>Keep your voice.</em></h1>
                <p>A private practice space. The counterpart is fictional and cannot know or predict an actual person’s thoughts.</p>
              </div>
              <div className="rehearsal-layout">
                <aside className="settings-panel">
                  <img className="panel-photo" src="/assets/saath-rehearsal.png" alt="Two empty chairs in a rehearsal room"/>
                  <h2>Set the scene</h2>
                  <label>Scenario<select value={scenario} onChange={event => setScenario(event.target.value)}>{["Setting a boundary", "Asking for support", "Talking to a partner", "A conversation at work", "Making an apology"].map(item => <option key={item}>{item}</option>)}</select></label>
                  <label>Goal<input value={goal} onChange={event => setGoal(event.target.value)} maxLength={160}/></label>
                  <label>Fictional response style<select value={style} onChange={event => setStyle(event.target.value)}>{["Receptive", "Hesitant", "Defensive"].map(item => <option key={item}>{item}</option>)}</select></label>
                  <p className="small-print">Private context is never appended automatically.</p>
                  <label className="checkbox-label"><input type="checkbox" checked={includeContext} onChange={event => setIncludeContext(event.target.checked)}/> Include the context I write below, and only that.</label>
                  {includeContext && <textarea value={context} onChange={event => setContext(event.target.value)} maxLength={2000} placeholder="Only the context you choose to send…"/>}
                  <label className="checkbox-label"><input type="checkbox" checked={aiConsent} onChange={event => setAiConsent(event.target.checked)}/> I agree to send this practice conversation to the configured AI provider.</label>
                  <button className="text-button" onClick={() => { setMessages([]); setNotice(""); abortRef.current?.abort(); }}>Restart and clear <Plus size={15}/></button>
                  {busy && <button className="outline-button" onClick={() => abortRef.current?.abort()}>Cancel pending reply</button>}
                  <span className="integration-state"><span className={ai ? "status-dot ready" : "status-dot"}/>{ai ? "AI provider configured" : "AI provider not connected yet"}</span>
                  {!ai && (
                    <div>
                      <p className="small-print">No fabricated AI replies. Static writing prompts remain available.</p>
                      {staticWritingPrompts.map(item => <button type="button" key={item} className="quiet" onClick={() => setDraft(item)}>{item}</button>)}
                    </div>
                  )}
                </aside>
                <section className="chat-panel">
                  <div className="chat-header">
                    <span className="ai-symbol"><Sparkles size={20}/></span>
                    <div><strong>Your rehearsal room</strong><span>Fictional counterpart · {style.toLowerCase()} style</span></div>
                    <span className="quiet-tag">AI</span>
                  </div>
                  <div className="chat-messages" aria-live="polite">
                    {!messages.length ? (
                      <div className="chat-empty">
                        <span className="empty-chair"><Armchair size={43} strokeWidth={1}/></span>
                        <h2>Take a breath.<br/>You can start anywhere.</h2>
                        <p>Try the first sentence you wish you could say.</p>
                        <button onClick={() => setDraft("I care about our relationship, but I need to talk about something that has been difficult for me.")}>Help me start <ArrowUpRight size={15}/></button>
                      </div>
                    ) : messages.map((message, index) => (
                      <div key={index} className={"message " + message.role}><span>{message.role === "user" ? "YOU" : "FICTIONAL COUNTERPART"}</span><p>{message.content}</p></div>
                    ))}
                    {busy && <div className="thinking">Preparing a response…</div>}
                  </div>
                  <form className="chat-input" onSubmit={sendRehearsal}>
                    <textarea aria-label="Your rehearsal message" placeholder="What would you like to say?" value={draft} onChange={event => setDraft(event.target.value)} maxLength={2000}/>
                    <button className="round-button" aria-label="Send rehearsal message" disabled={busy || !draft.trim()}><Send size={18}/></button>
                  </form>
                  <div className="chat-footer">Text rehearsal · Voice is unconfigured. {!auth && <a href="/signin-with-chatgpt?return_to=/">Sign in to use AI.</a>}</div>
                </section>
              </div>
            </>
          )}

          {view === "chairs" && (
            <TwoChairsRoom
              auth={auth}
              displayName={displayName}
              profile={profile}
              aiConfigured={ai}
              voiceConfigured={voiceConfigured}
              onNotice={flash}
            />
          )}

          {view === "space" && (
            <>
              <div className="page-heading">
                <div className="eyebrow">MY SPACE</div>
                <h1>Your notes.<br/><em>Your requests.</em></h1>
                <p>Save private context, review pairing requests, and start a call after someone accepts.</p>
              </div>
              {!auth && (
                <div className="sample-notice">
                  <ShieldCheck size={18}/>
                  <span>Sign in to save context on the server. <a href="/signin-with-chatgpt?return_to=/?view=space">Sign in</a></span>
                </div>
              )}
              {encryption?.atRest && (
                <p className="small-print space-encrypt-note">At-rest encryption is on for saved context. End-to-end encryption is not claimed.</p>
              )}
              <div className="two-column space-layout">
                <section className="plain-panel context-panel">
                  <BookOpen size={25} strokeWidth={1.4}/>
                  <h2>Private context</h2>
                  <p>What you want a listener to know — only when you choose to share it.</p>
                  <label htmlFor="life-context">My context</label>
                  <textarea id="life-context" value={context} onChange={event => setContext(event.target.value)} maxLength={4000} placeholder="Lately, I’ve been…"/>
                  <span className="field-count">{context.length}/4000</span>
                  <label>Visibility
                    <select value={shareMode} onChange={event => setShareMode(event.target.value as "private" | "ask-first")}>
                      <option value="private">Private</option>
                      <option value="ask-first">Ask first before sharing</option>
                    </select>
                  </label>
                  <div className="inline-actions">
                    <button className="button" disabled={busy} onClick={saveContext}>{busy ? "Saving…" : "Save"}<Check size={16}/></button>
                    <button className="text-button" onClick={async () => {
                      if (auth) {
                        try { await api("/api/context", "DELETE"); setContext(""); flash("Your saved context was deleted."); }
                        catch (error) { flash((error as Error).message); }
                      } else setContext("");
                    }}>Delete</button>
                  </div>
                </section>
                <section className="plain-panel">
                  <MessageCircle size={25} strokeWidth={1.4}/>
                  <h2>Requests</h2>
                  <p>Pending and accepted pairing. Samples cannot accept.</p>
                  {requests.length ? requests.map(item => (
                    <div className="request-row" key={item.id}>
                      <div>
                        <strong>{item.providerName}</strong>
                        <span>{item.topic} · {item.status}</span>
                      </div>
                      {item.status === "pending" && (
                        <button className="quiet" onClick={async () => {
                          try {
                            const result = await api<{ request: SessionRequest }>("/api/requests", "PATCH", { id: item.id, action: "cancel" });
                            setRequests(current => current.map(entry => entry.id === item.id ? result.request : entry));
                            flash("Request cancelled.");
                          } catch (error) { flash((error as Error).message); }
                        }}>Cancel</button>
                      )}
                      {item.status === "accepted" && (
                        <button className="quiet" type="button" disabled={busy} onClick={() => void startCall(item.id)}>Call</button>
                      )}
                      <span className="status-badge">{item.status}</span>
                    </div>
                  )) : (
                    <div className="small-empty">
                      <h3>No requests yet.</h3>
                      <button className="text-button" onClick={() => go("connect")}>Go to Listen <ArrowRight size={16}/></button>
                    </div>
                  )}
                  {activeCall && (
                    <CallRoom
                      call={activeCall}
                      onChange={setActiveCall}
                      onEnded={() => setActiveCall(null)}
                      onNotice={flash}
                    />
                  )}
                  <div className="inline-actions space-quick-links">
                    <button className="text-button" onClick={() => go("chairs")}>Open Two chairs</button>
                    <button className="text-button" onClick={() => go("intro")}>{introDone || intro ? "Edit introduction" : "Getting to Know You"}</button>
                  </div>
                </section>
              </div>
              <section className="plain-panel">
                <h2>Private notes</h2>
                <p>Stays in this browser. Not sent to a listener unless you paste it into context.</p>
                <textarea value={reflections} onChange={event => { setReflections(event.target.value); saveReflections(event.target.value); }} maxLength={4000} placeholder="Notes for yourself…"/>
              </section>
            </>
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
                <div className="eyebrow">FICTIONAL AI PERSONALITY</div>
                <h2 id="modal-title">{selected.name} · {selected.specialty}</h2>
                <p>{SAMPLE_PROFILE_NOTICE} Domain: {selected.domain}.</p>
                <p className="small-print">Talking here opens rehearsal with this personality. It cannot accept a live request. If you want a person, use a pairing code. Voice calls are for accepted live listeners via Two Chairs, not AI personalities.</p>
                <label>How would you like to be supported?<select value={support} onChange={event => setSupport(event.target.value)}><option>Listen only</option><option>Help me reflect</option><option>Offer suggestions</option></select></label>
                <p className="small-print">Conversation mode: chat only for AI personalities.</p>
                <label>Context to include<textarea value={context} onChange={event => setContext(event.target.value)} maxLength={4000} placeholder="Only what you want this personality to hear…"/></label>
                <button className="button full" onClick={() => talkWithPersona(selected)}>Talk with {selected.name}<ArrowRight size={17}/></button>
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
                <div className="approach-step"><span>01</span><div><h3>Start with what you need.</h3><p>A live listener by pairing code, a fictional AI personality, or a room to practise.</p></div></div>
                <div className="approach-step"><span>02</span><div><h3>Choose what to share.</h3><p>Your context is yours. Review it before any connection request.</p></div></div>
                <div className="approach-step"><span>03</span><div><h3>Make room to be heard.</h3><p>Talk at your pace. After a person accepts, you can sit in Two Chairs and start a browser voice call if you both want it.</p></div></div>
                <button className="button full" onClick={() => { setModal(null); go("connect"); }}>Explore Saath <ArrowRight size={17}/></button>
              </>
            )}
            {modal === "privacy" && (
              <>
                <div className="eyebrow">CLEAR BOUNDARIES</div>
                <h2 id="modal-title">Your story belongs to you.</h2>
                <p>AI personalities are fictional. Unsaved writing stays in this tab. Signed-in context and requests are stored on Vinext/D1 and access is limited to their owner. Context can be encrypted at rest when configured — that is not end-to-end encryption.</p>
                <p>AI rehearsal only sends text after you opt in. Browser voice calling exists between two enrolled people after a request is accepted (Two Chairs / calls API). There is no call recording, and end-to-end encryption is not claimed.</p>
                <p>You can delete your context in My space. Previously viewed content cannot be unremembered by a person who already saw it.</p>
                <button className="button full" onClick={() => { setModal(null); go("space"); }}>Manage my context <ArrowRight size={17}/></button>
              </>
            )}
            {modal === "join" && (
              <>
                <div className="eyebrow">LISTEN AS A PERSON</div>
                <h2 id="modal-title">Enroll as a listener.</h2>
                <p>Listener enrollment gives you a pairing code. There is no paid counselor directory on this minimal path.</p>
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
