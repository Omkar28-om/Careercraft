import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Code2,
  Rocket,
  Sparkles,
  Flame,
  CheckCircle2,
  Compass,
  Trophy,
  ChevronDown,
  Terminal,
  Layers,
  GraduationCap,
  ExternalLink,
  Laptop,
  ShieldCheck,
  Check,
  Play,
  FileCode2,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Button from "../components/Button";
import Badge from "../components/Badge";
import SectionHeading from "../components/SectionHeading";
import { ScrollReveal, StaggerContainer, StaggerItem, HoverCard } from "../components/motion/Motion";
import { useAuth } from "../context/AuthContext";
import PersonalizedHome from "../components/PersonalizedHome";

const CODE_SNIPPET = `public int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> map = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
        int comp = target - nums[i];
        if (map.containsKey(comp)) {
            return new int[] { map.get(comp), i };
        }
        map.put(nums[i], i);
    }
    return new int[]{};
}`;

export default function Home() {
  const { user } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  const [activeFaq, setActiveFaq] = useState(null);

  // Lightweight code-typing simulator
  const [displayedCode, setDisplayedCode] = useState(shouldReduceMotion ? CODE_SNIPPET : "");
  const [isTypingComplete, setIsTypingComplete] = useState(!!shouldReduceMotion);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayedCode(CODE_SNIPPET);
      setIsTypingComplete(true);
      return;
    }

    let idx = 0;
    const interval = setInterval(() => {
      idx += 2;
      if (idx >= CODE_SNIPPET.length) {
        setDisplayedCode(CODE_SNIPPET);
        setIsTypingComplete(true);
        clearInterval(interval);
      } else {
        setDisplayedCode(CODE_SNIPPET.slice(0, idx));
      }
    }, 15);

    return () => clearInterval(interval);
  }, [shouldReduceMotion]);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqItems = [
    {
      q: "What is CareerCraft and how does it help students?",
      a: "CareerCraft is an all-in-one career development platform built specifically for tech students. It brings together structured computer science courses, algorithmic coding challenges with real-time execution via Judge0, verified portfolio project showcases, student job and internship listings, freelance opportunities, and deterministic career readiness scoring.",
    },
    {
      q: "How does the coding practice environment work?",
      a: "Our coding platform integrates the Monaco Editor (the editor powering VS Code) with Judge0. You write solutions in Java, Python, C++, or JavaScript, execute them against test cases, and receive immediate feedback on runtime, test passes, and execution accuracy.",
    },
    {
      q: "Are the job and internship opportunities curated for students?",
      a: "Yes. Listings are targeted toward early-career engineers, university students, and fresh graduates, spanning full-time software engineering roles, summer internships, and milestone-based freelance contracts.",
    },
    {
      q: "How does CareerCraft calculate skill progression and career readiness?",
      a: "Your career readiness score is computed deterministically from your actual platform activity: problems solved, course modules completed, portfolio projects deployed, and verified skills added to your profile. No fake scores or black-box guesswork.",
    },
    {
      q: "Is CareerCraft free for students to use?",
      a: "Yes. Core learning tracks, coding challenges, project portfolios, and career roadmap features are freely accessible to students.",
    },
  ];

  // Headline Staggered Entrance Variants
  const headlineVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.12,
        delayChildren: shouldReduceMotion ? 0 : 0.05,
      },
    },
  };

  const lineVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
    },
  };

  if (user) {
    return (
      <div className="min-h-screen bg-[#080B14] text-[#F8FAFC] flex flex-col selection:bg-[#8B5CF6]/30 selection:text-[#F8FAFC] overflow-x-hidden w-full tech-grid-pattern">
        <Navbar />
        <main className="flex-1 overflow-x-hidden w-full">
          <PersonalizedHome user={user} />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080B14] text-[#F8FAFC] flex flex-col selection:bg-[#8B5CF6]/30 selection:text-[#F8FAFC] overflow-x-hidden w-full">
      <Navbar />

      <main className="flex-1 overflow-x-hidden w-full">
        {/* ================= HERO SECTION ================= */}
        <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-32 tech-grid-pattern">
          {/* Restrained Ambient Lighting */}
          <motion.div
            animate={shouldReduceMotion ? {} : {
              opacity: [0.12, 0.20, 0.12],
              scale: [1, 1.06, 1],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute left-1/2 top-0 h-[450px] w-[550px] -translate-x-1/2 rounded-full bg-[#8B5CF6]/15 blur-[140px]"
          />
          <motion.div
            animate={shouldReduceMotion ? {} : {
              opacity: [0.08, 0.16, 0.08],
              scale: [1, 1.08, 1],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="pointer-events-none absolute -left-24 top-28 h-[350px] w-[350px] rounded-full bg-[#22D3EE]/10 blur-[130px]"
          />
          <motion.div
            animate={shouldReduceMotion ? {} : {
              opacity: [0.10, 0.18, 0.10],
              scale: [1, 1.05, 1],
            }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="pointer-events-none absolute -right-24 bottom-10 h-[400px] w-[400px] rounded-full bg-[#8B5CF6]/15 blur-[140px]"
          />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] items-center gap-12 lg:gap-16">
              {/* Left Column: Hero Content */}
              <div>
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 px-4 py-1.5 text-xs font-semibold text-[#C4B5FD] backdrop-blur-md"
                >
                  <Sparkles size={14} className="text-[#A78BFA] animate-pulse" />
                  <span>Learn it · Practice it · Build it</span>
                </motion.div>

                {/* Main Headline with Staggered Entrance */}
                <motion.h1
                  variants={headlineVariants}
                  initial="hidden"
                  animate="visible"
                  className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08] text-[#F8FAFC]"
                >
                  <motion.span variants={lineVariants} className="block">
                    Learn it.
                  </motion.span>
                  <motion.span
                    variants={lineVariants}
                    className="block bg-gradient-to-r from-[#8B5CF6] via-[#A78BFA] to-[#22D3EE] bg-clip-text text-transparent"
                  >
                    Practice it.
                  </motion.span>
                  <motion.span variants={lineVariants} className="block">
                    Build with it.
                  </motion.span>
                </motion.h1>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: shouldReduceMotion ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-[#94A3B8]"
                >
                  Choose a domain, learn through focused courses, practice questions in the online coding workspace, and turn your skills into projects and opportunities.
                </motion.p>

                {/* CTA Buttons with Hover & Tap Feedback */}
                <motion.div
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: shouldReduceMotion ? 0 : 0.52, ease: [0.16, 1, 0.3, 1] }}
                  className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
                >
                  <motion.div
                    whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                    className="w-full sm:w-auto"
                  >
                    <Link to="/login" className="block w-full">
                      <Button
                        variant="primary"
                        size="lg"
                        icon={ArrowRight}
                        iconPosition="right"
                        className="w-full sm:w-auto shadow-lg shadow-purple-500/20"
                      >
                        Get Started
                      </Button>
                    </Link>
                  </motion.div>

                  <motion.div
                    whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
                    whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
                    className="w-full sm:w-auto"
                  >
                    <Link to="/coding" className="block w-full">
                      <Button
                        variant="secondary"
                        size="lg"
                        className="w-full sm:w-auto border border-white/10 hover:border-white/20"
                      >
                        Try Coding Practice
                      </Button>
                    </Link>
                  </motion.div>
                </motion.div>

                {/* Trust & Capability Pillars: Interactive Links */}
                <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-white/[0.08] pt-6">
                  <Link
                    to="/courses"
                    className="group rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 transition-all duration-200 hover:border-[#8B5CF6]/40 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
                  >
                    <div className="text-sm sm:text-base font-bold text-[#F8FAFC] flex items-center gap-2 group-hover:text-[#A78BFA] transition-colors">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#8B5CF6]/15 text-[#8B5CF6] group-hover:scale-105 transition-transform">
                        <BookOpen size={15} />
                      </div>
                      <span>Learn</span>
                    </div>
                    <div className="mt-1 text-xs text-[#94A3B8]">Curated CS Tracks</div>
                  </Link>

                  <Link
                    to="/coding"
                    className="group rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 transition-all duration-200 hover:border-[#22D3EE]/40 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE]"
                  >
                    <div className="text-sm sm:text-base font-bold text-[#F8FAFC] flex items-center gap-2 group-hover:text-[#22D3EE] transition-colors">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#22D3EE]/15 text-[#22D3EE] group-hover:scale-105 transition-transform">
                        <Code2 size={15} />
                      </div>
                      <span>Practice</span>
                    </div>
                    <div className="mt-1 text-xs text-[#94A3B8]">Judge0 Runner</div>
                  </Link>

                  <Link
                    to="/projects"
                    className="group rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 transition-all duration-200 hover:border-[#10B981]/40 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]"
                  >
                    <div className="text-sm sm:text-base font-bold text-[#F8FAFC] flex items-center gap-2 group-hover:text-[#10B981] transition-colors">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#10B981]/15 text-[#10B981] group-hover:scale-105 transition-transform">
                        <Rocket size={15} />
                      </div>
                      <span>Build</span>
                    </div>
                    <div className="mt-1 text-xs text-[#94A3B8]">Verified Portfolios</div>
                  </Link>

                  <Link
                    to="/jobs"
                    className="group rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 transition-all duration-200 hover:border-[#F59E0B]/40 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
                  >
                    <div className="text-sm sm:text-base font-bold text-[#F8FAFC] flex items-center gap-2 group-hover:text-[#F59E0B] transition-colors">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F59E0B]/15 text-[#F59E0B] group-hover:scale-105 transition-transform">
                        <BriefcaseBusiness size={15} />
                      </div>
                      <span>Opportunities</span>
                    </div>
                    <div className="mt-1 text-xs text-[#94A3B8]">Jobs & Internships</div>
                  </Link>
                </div>
              </div>

              {/* Right Column: Premium Interactive Product Visual */}
              <ScrollReveal direction="left" delay={0.15}>
                <motion.div
                  whileHover={shouldReduceMotion ? {} : { y: -4, transition: { duration: 0.3 } }}
                  className="relative"
                >
                  {/* Outer subtle glow */}
                  <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-[#8B5CF6]/20 via-[#22D3EE]/10 to-transparent blur-xl pointer-events-none" />

                  {/* Glass Tech Frame */}
                  <div className="relative rounded-2xl border border-white/[0.08] bg-[#111827] p-5 sm:p-6 shadow-2xl backdrop-blur-xl">
                    {/* Header bar */}
                    <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                          <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                          <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                        </div>
                        <span className="ml-2 text-xs font-mono text-[#94A3B8]">careercraft-workspace // preview</span>
                      </div>
                      <Badge variant="primary" size="xs">Live Demo</Badge>
                    </div>

                    {/* Code & IDE Simulator with typing animation */}
                    <div
                      className="mt-4 rounded-xl border border-white/5 bg-[#080B14] p-4 font-mono text-xs text-[#F8FAFC]"
                      aria-label="Code solution simulator"
                    >
                      <div className="flex items-center justify-between text-slate-500 pb-2 border-b border-white/5">
                        <span className="flex items-center gap-1.5 text-cyan-300 font-medium">
                          <FileCode2 size={13} /> TwoSumSolution.java
                        </span>
                        <div className="flex items-center gap-1.5 text-xs">
                          {isTypingComplete ? (
                            <motion.span
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3 }}
                              className="text-[#10B981] font-semibold flex items-center gap-1.5"
                            >
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
                              </span>
                              <CheckCircle2 size={13} className="text-[#10B981]" /> All Tests Passed
                            </motion.span>
                          ) : (
                            <span className="text-cyan-400 font-medium flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                              Running test suites...
                            </span>
                          )}
                        </div>
                      </div>
                      <pre className="pt-3 text-[11px] leading-relaxed text-[#94A3B8] overflow-x-auto min-h-[160px]">
                        {displayedCode}
                        {!isTypingComplete && (
                          <span className="inline-block w-1.5 h-3.5 bg-cyan-400 animate-pulse ml-0.5 align-middle" />
                        )}
                      </pre>
                    </div>

                    {/* Real-time Readiness Benchmark Widget */}
                    <div className="mt-4 rounded-xl border border-white/[0.08] bg-[#1E293B]/70 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold text-[#F8FAFC]">Full-Stack Software Engineer</span>
                          <span className="block text-[11px] text-[#94A3B8]">Target Role Readiness</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-[#22D3EE]">84% Match</span>
                          <span className="block text-[10px] text-[#10B981]">+12% this week</span>
                        </div>
                      </div>

                      {/* Animated Readiness Progress Bar */}
                      <div className="mt-3 h-2 w-full rounded-full bg-[#080B14] overflow-hidden">
                        <motion.div
                          initial={{ width: "0%" }}
                          whileInView={{ width: "84%" }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                          className="h-full rounded-full bg-gradient-to-r from-[#8B5CF6] via-[#A78BFA] to-[#22D3EE]"
                        />
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="rounded-lg bg-[#080B14]/80 p-2 border border-white/5">
                          <span className="text-[10px] text-[#94A3B8] block">Algorithms</span>
                          <span className="font-bold text-[#10B981]">Level 4</span>
                        </div>
                        <div className="rounded-lg bg-[#080B14]/80 p-2 border border-white/5">
                          <span className="text-[10px] text-[#94A3B8] block">Curricula</span>
                          <span className="font-bold text-[#22D3EE]">3 Active</span>
                        </div>
                        <div className="rounded-lg bg-[#080B14]/80 p-2 border border-white/5">
                          <span className="text-[10px] text-[#94A3B8] block">Projects</span>
                          <span className="font-bold text-[#A78BFA]">Verified</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ================= SECTION 1: LEARN ================= */}
        <section id="overview" className="border-t border-white/10 bg-[#0F172A]/40 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              pill="01. Learn"
              title="Learn with Purpose."
              highlight="Step-by-Step Mastery."
              subtitle="Master essential computer science fundamentals, full-stack technologies, and system design through structured, self-paced courses."
              align="center"
            />

            <StaggerContainer className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: "Data Structures & Algorithms",
                  category: "Core Computer Science",
                  level: "Intermediate",
                  lessons: "32 Lessons",
                  desc: "Arrays, hash tables, linked lists, binary trees, dynamic programming, and interview patterns.",
                  color: "from-[#8B5CF6] to-[#7C3AED]",
                  to: "/courses",
                },
                {
                  title: "Modern Full-Stack Web Development",
                  category: "Software Engineering",
                  level: "Beginner to Pro",
                  lessons: "48 Lessons",
                  desc: "React, Node.js, Express, PostgreSQL, RESTful APIs, JWT authentication, and cloud deployment.",
                  color: "from-[#22D3EE] to-[#06B6D4]",
                  to: "/courses",
                },
                {
                  title: "System Design & Architecture",
                  category: "Scalability & Distributed Systems",
                  level: "Advanced",
                  lessons: "24 Lessons",
                  desc: "Caching, microservices, load balancers, database sharding, and real-world system case studies.",
                  color: "from-[#10B981] to-[#059669]",
                  to: "/courses",
                },
              ].map((course, idx) => (
                <StaggerItem key={idx}>
                  <HoverCard className="h-full flex flex-col justify-between p-6">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-semibold text-[#8B5CF6]">{course.category}</span>
                        <Badge variant="default" size="xs">{course.level}</Badge>
                      </div>
                      <h3 className="text-xl font-bold text-[#F8FAFC] mb-2">{course.title}</h3>
                      <p className="text-sm text-[#94A3B8] leading-relaxed mb-6">{course.desc}</p>
                    </div>

                    <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                      <span className="text-xs text-[#94A3B8] font-mono">{course.lessons}</span>
                      <Link
                        to={course.to}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A78BFA] hover:text-[#C4B5FD] transition"
                      >
                        <span>View Curriculum</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </HoverCard>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* ================= SECTION 2: PRACTICE (CODING) ================= */}
        <section className="border-t border-white/10 bg-[#080B14] py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <ScrollReveal direction="right">
                <SectionHeading
                  pill="02. Practice"
                  title="Practice Code Algorithmic Challenges"
                  highlight="with Instant Judge0 Execution."
                  subtitle="Solve interview problems daily in our integrated editor. Execute tests, evaluate time complexity, and build an unstoppable problem-solving streak."
                  align="left"
                />

                <div className="mt-8 space-y-4">
                  {[
                    { title: "Multi-Language Support", desc: "Write solutions seamlessly in Java, Python, C++, or JavaScript." },
                    { title: "Automated Test Verification", desc: "Instant test execution with detailed error reporting and runtime analysis." },
                    { title: "Gamified XP & Streaks", desc: "Earn verifiable platform XP, unlock badges, and level up your engineering rank." },
                  ].map((feat, i) => (
                    <div key={i} className="flex items-start gap-3.5">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#10B981]/15 text-[#10B981] mt-0.5">
                        <Check size={14} />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-[#F8FAFC]">{feat.title}</h4>
                        <p className="text-xs text-[#94A3B8] mt-0.5">{feat.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex gap-4">
                  <Link to="/coding">
                    <Button variant="primary" size="md" icon={ArrowRight} iconPosition="right">
                      Browse Problem Catalog
                    </Button>
                  </Link>
                  <Link to="/coding/problems/two-sum">
                    <Button variant="secondary" size="md">
                      Solve Two Sum
                    </Button>
                  </Link>
                </div>
              </ScrollReveal>

              <ScrollReveal direction="left" delay={0.1}>
                <div className="rounded-2xl border border-white/10 bg-[#111827] p-5 shadow-2xl">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs">
                    <span className="font-mono text-[#22D3EE] flex items-center gap-2">
                      <Terminal size={14} /> judge0-runner.sh
                    </span>
                    <Badge variant="emerald" size="xs">200 OK — Passed</Badge>
                  </div>

                  <div className="mt-4 space-y-2.5 font-mono text-xs">
                    <div className="flex justify-between p-2 rounded-lg bg-[#080B14] border border-white/5">
                      <span className="text-[#94A3B8]">Test Case 1: nums = [2,7,11,15], target = 9</span>
                      <span className="text-[#10B981] font-bold">Passed</span>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg bg-[#080B14] border border-white/5">
                      <span className="text-[#94A3B8]">Test Case 2: nums = [3,2,4], target = 6</span>
                      <span className="text-[#10B981] font-bold">Passed</span>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg bg-[#080B14] border border-white/5">
                      <span className="text-[#94A3B8]">Test Case 3: nums = [3,3], target = 6</span>
                      <span className="text-[#10B981] font-bold">Passed</span>
                    </div>
                  </div>

                  <div className="mt-4 p-3 rounded-xl bg-[#1E293B]/70 border border-white/5 flex items-center justify-between text-xs">
                    <span className="text-[#94A3B8]">Runtime: <strong className="text-[#F8FAFC]">48ms</strong></span>
                    <span className="text-[#94A3B8]">Memory: <strong className="text-[#F8FAFC]">42.1 MB</strong></span>
                    <span className="text-[#94A3B8]">XP Awarded: <strong className="text-[#F59E0B]">+50 XP</strong></span>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ================= SECTION 3: BUILD (PROJECTS) ================= */}
        <section className="border-t border-white/10 bg-[#0F172A]/40 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              pill="03. Build"
              title="Build Real Systems."
              highlight="Showcase Verified Proof."
              subtitle="Develop full-stack applications, deploy live demos, and build a verified portfolio that proves your capabilities to hiring teams."
              align="center"
            />

            <StaggerContainer className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: "Distributed Task Queue",
                  desc: "Asynchronous background job processor built with Node.js, Redis, and PostgreSQL with retry logic and telemetry.",
                  tags: ["Node.js", "Redis", "PostgreSQL", "Docker"],
                  author: "Featured Student Project",
                },
                {
                  title: "AI Code Analysis Engine",
                  desc: "Static AST analysis tool evaluating algorithmic complexity, linting violations, and code smells across repositories.",
                  tags: ["Python", "FastAPI", "React", "TypeScript"],
                  author: "Featured Student Project",
                },
                {
                  title: "Real-Time Collaborative Canvas",
                  desc: "Multiplayer whiteboarding workspace with WebSockets, optimistic UI updates, and conflict resolution.",
                  tags: ["React", "WebSockets", "Tailwind CSS"],
                  author: "Featured Student Project",
                },
              ].map((proj, idx) => (
                <StaggerItem key={idx}>
                  <HoverCard className="h-full flex flex-col justify-between p-6">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-mono text-[#8B5CF6]">{proj.author}</span>
                        <Rocket size={16} className="text-[#8B5CF6]" />
                      </div>
                      <h3 className="text-xl font-bold text-[#F8FAFC] mb-2">{proj.title}</h3>
                      <p className="text-sm text-[#94A3B8] leading-relaxed mb-6">{proj.desc}</p>
                    </div>

                    <div>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {proj.tags.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="rounded-md border border-white/10 bg-[#080B14] px-2 py-0.5 text-[10px] font-mono text-[#94A3B8]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <Link
                        to="/projects"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#22D3EE] hover:text-[#06B6D4] transition"
                      >
                        <span>Explore Projects</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </HoverCard>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* ================= SECTION 4: DISCOVER OPPORTUNITIES ================= */}
        <section className="border-t border-white/10 bg-[#080B14] py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              pill="04. Discover Opportunities"
              title="Jobs, Internships & Freelance"
              highlight="Direct in One Ecosystem."
              subtitle="Connect your verified skills directly to internships, full-time junior developer roles, and milestone freelance client contracts."
              align="center"
            />

            <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
              <ScrollReveal direction="up" delay={0.05}>
                <HoverCard className="p-6 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6] mb-5">
                      <BriefcaseBusiness size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-[#F8FAFC] mb-2">Full-Time Software Roles</h3>
                    <p className="text-sm text-[#94A3B8] leading-relaxed">
                      Verified junior developer and engineering openings tailored for graduates. Direct applications with verified platform skill profile attachments.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/10">
                    <Link to="/jobs" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#A78BFA] hover:text-[#C4B5FD] transition">
                      <span>View Tech Jobs</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </HoverCard>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={0.1}>
                <HoverCard className="p-6 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#22D3EE]/15 text-[#22D3EE] mb-5">
                      <GraduationCap size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-[#F8FAFC] mb-2">College Internships</h3>
                    <p className="text-sm text-[#94A3B8] leading-relaxed">
                      Summer and semester technical internships offering hands-on engineering experience, mentorship, and pathway to full-time placement.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/10">
                    <Link to="/internships" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#22D3EE] hover:text-[#06B6D4] transition">
                      <span>Browse Internships</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </HoverCard>
              </ScrollReveal>

              <ScrollReveal direction="up" delay={0.15}>
                <HoverCard className="p-6 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#10B981]/15 text-[#10B981] mb-5">
                      <Sparkles size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-[#F8FAFC] mb-2">Freelance Marketplace</h3>
                    <p className="text-sm text-[#94A3B8] leading-relaxed">
                      Submit proposals, deliver client projects, and earn money while still in college. Milestone contracts with verifiable portfolio credit.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/10">
                    <Link to="/freelance" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#10B981] hover:text-emerald-300 transition">
                      <span>Explore Freelance Gigs</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </HoverCard>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ================= SECTION 5: TRACK PROGRESS ================= */}
        <section className="border-t border-white/10 bg-[#0F172A]/40 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <ScrollReveal direction="right">
                <SectionHeading
                  pill="05. Track Progress"
                  title="Track Skills, XP & Milestones"
                  highlight="Every Single Day."
                  subtitle="Gamified learning mechanics that keep you accountable. See your engineering proficiency grow with verifiable activity logs and achievement badges."
                  align="left"
                />

                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-white/10 bg-[#111827] p-4">
                    <div className="flex items-center gap-2 text-amber-400 mb-1">
                      <Trophy size={18} />
                      <span className="font-bold text-sm">Achievement Badges</span>
                    </div>
                    <p className="text-xs text-[#94A3B8]">Unlock verified milestones as you solve problems and complete projects.</p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-[#111827] p-4">
                    <div className="flex items-center gap-2 text-rose-400 mb-1">
                      <Flame size={18} />
                      <span className="font-bold text-sm">Active Streak</span>
                    </div>
                    <p className="text-xs text-[#94A3B8]">Build consistency through daily problem solving and coding habits.</p>
                  </div>
                </div>

                <div className="mt-8">
                  <Link to={user ? "/achievements" : "/login"}>
                    <Button variant="primary" size="md" icon={ArrowRight} iconPosition="right">
                      View Achievements & XP
                    </Button>
                  </Link>
                </div>
              </ScrollReveal>

              <ScrollReveal direction="left" delay={0.1}>
                <div className="rounded-2xl border border-white/10 bg-[#111827] p-6 shadow-2xl">
                  <h4 className="text-sm font-bold text-[#F8FAFC] pb-3 border-b border-white/10 flex items-center justify-between">
                    <span>Recent Learning Activity</span>
                    <Badge variant="cyan" size="xs">Live Stream</Badge>
                  </h4>

                  <div className="mt-4 space-y-3">
                    {[
                      { action: "Solved 'Two Sum'", time: "Just now", type: "Coding", xp: "+50 XP" },
                      { action: "Completed 'React Router v7 Module'", time: "2 hours ago", type: "Course", xp: "+120 XP" },
                      { action: "Deployed 'Portfolio v2' Project", time: "Yesterday", type: "Project", xp: "+200 XP" },
                      { action: "Earned Badge 'Algorithm Apprentice'", time: "2 days ago", type: "Achievement", xp: "Unlocked" },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#080B14] border border-white/5 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
                          <div>
                            <span className="font-semibold text-[#F8FAFC] block">{item.action}</span>
                            <span className="text-[11px] text-[#94A3B8]">{item.time} • {item.type}</span>
                          </div>
                        </div>
                        <span className="font-mono text-[#F59E0B] font-bold">{item.xp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ================= SECTION 6: RESUME BUILDER ================= */}
        <section className="border-t border-white/10 bg-[#080B14] py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <ScrollReveal direction="right">
                <div className="rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-400/[0.08] via-[#111827] to-[#1E293B] p-6 shadow-2xl sm:p-8">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <span className="inline-flex items-center gap-2 text-xs font-semibold text-violet-200"><FileText size={16} /> Profile-powered resume</span>
                    <Badge variant="violet" size="xs">Live preview</Badge>
                  </div>
                  <div className="mt-5 rounded-2xl bg-white p-6 text-slate-800 shadow-xl">
                    <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><GraduationCap size={20} /></div>
                      <div><p className="text-sm font-black text-slate-950">Your profile, in one place</p><p className="mt-0.5 text-[10px] text-slate-500">Skills · Learning · Projects</p></div>
                    </div>
                    <div className="mt-5 space-y-4">
                      <div><p className="text-[10px] font-extrabold uppercase tracking-widest text-violet-700">Summary</p><div className="mt-2 h-2 w-full rounded-full bg-slate-200" /><div className="mt-1.5 h-2 w-4/5 rounded-full bg-slate-100" /></div>
                      <div><p className="text-[10px] font-extrabold uppercase tracking-widest text-violet-700">Skills and projects</p><div className="mt-2 flex gap-2"><span className="h-5 w-16 rounded-full bg-cyan-100" /><span className="h-5 w-20 rounded-full bg-violet-100" /><span className="h-5 w-14 rounded-full bg-emerald-100" /></div></div>
                    </div>
                    <div className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700"><CheckCircle2 size={14} /> Add your work as you learn and build</div>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal direction="left" delay={0.1}>
                <SectionHeading
                  pill="06. Resume Builder & Analysis"
                  title="Make your learning easy to show."
                  highlight="Built from your profile."
                  subtitle="Bring your profile, skills, completed courses, and projects into one editable resume. Get practical completeness checks, refine your summary, and print or save a PDF."
                  align="left"
                />

                <div className="mt-8 space-y-4">
                  {[
                    { title: "Profile-based resume draft", desc: "Start from your education, skills, projects, and completed courses already in CareerCraft." },
                    { title: "Resume readiness checks", desc: "See which contact, education, skills, and project sections need more detail." },
                    { title: "Ready to share", desc: "Set a target role, edit your summary, and print or save your resume as a PDF." },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3.5">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#8B5CF6]/15 text-[#8B5CF6] mt-0.5">
                        <Check size={14} />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-[#F8FAFC]">{item.title}</h4>
                        <p className="text-xs text-[#94A3B8] mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8">
                  <Link to="/resume">
                    <Button variant="primary" size="md" icon={ArrowRight} iconPosition="right">
                      Open Resume Studio
                    </Button>
                  </Link>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ================= SECTION 7: FAQS ================= */}
        <section className="border-t border-white/10 bg-[#0F172A]/40 py-20 sm:py-28">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              pill="07. Frequently Asked Questions"
              title="Frequently Asked Questions"
              highlight=""
              subtitle="Everything you need to know about the CareerCraft student career development ecosystem."
              align="center"
            />

            <div className="mt-12 space-y-3.5">
              {faqItems.map((item, index) => {
                const isOpen = activeFaq === index;
                return (
                  <ScrollReveal key={index} direction="up" delay={index * 0.04}>
                    <div className="rounded-2xl border border-white/10 bg-[#111827] overflow-hidden transition-colors hover:border-[#8B5CF6]/30">
                      <button
                        type="button"
                        onClick={() => toggleFaq(index)}
                        className="w-full flex items-center justify-between p-5 sm:p-6 text-left cursor-pointer focus:outline-none"
                        aria-expanded={isOpen}
                      >
                        <span className="text-base sm:text-lg font-semibold text-[#F8FAFC] pr-4">
                          {item.q}
                        </span>
                        <ChevronDown
                          size={18}
                          className={`text-[#94A3B8] shrink-0 transition-transform duration-200 ${
                            isOpen ? "rotate-180 text-[#8B5CF6]" : ""
                          }`}
                        />
                      </button>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                          >
                            <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-sm text-[#94A3B8] leading-relaxed border-t border-white/5 pt-4">
                              {item.a}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================= SECTION 8: FINAL CALL TO ACTION ================= */}
        <section className="border-t border-white/10 bg-[#080B14] py-20 sm:py-32">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
            <ScrollReveal direction="up">
              <div className="relative overflow-hidden rounded-3xl border border-[#8B5CF6]/30 bg-gradient-to-br from-[#8B5CF6]/20 via-[#111827] to-[#1E293B] p-8 sm:p-16 shadow-2xl">
                {/* Glow ambient background */}
                <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-96 rounded-full bg-[#8B5CF6]/20 blur-3xl" />

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#8B5CF6] text-white shadow-lg shadow-purple-500/25 mb-6">
                  <GraduationCap size={28} />
                </div>

                <h2 className="text-3xl sm:text-5xl font-black text-[#F8FAFC] tracking-tight">
                  Learn. Practice. Build.
                </h2>

                <p className="mx-auto mt-4 max-w-xl text-base sm:text-lg leading-relaxed text-[#94A3B8]">
                  Pick a domain, take a course, practice real questions, and create projects you can share.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link to="/login">
                    <Button variant="primary" size="lg" icon={ArrowRight} iconPosition="right">
                      Get Started
                    </Button>
                  </Link>
                  <Link to="/courses">
                    <Button variant="secondary" size="lg">
                      Browse All Courses
                    </Button>
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
