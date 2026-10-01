"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  GraduationCap,
  ClipboardList,
  Layers,
  BookOpen,
  Calendar,
  Users,
  TrendingUp,
  Percent,
  School,
  Plus,
  ArrowRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CommandItem {
  id: string;
  title: string;
  category: "Navigation" | "Quick Actions";
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords?: string[];
}

const COMMAND_ITEMS: CommandItem[] = [
  // Quick Actions
  {
    id: "act-new-admission",
    title: "New Student Admission",
    category: "Quick Actions",
    href: "/admissions",
    icon: Plus,
    keywords: ["admissions", "apply", "intake", "register"],
  },
  {
    id: "act-create-class",
    title: "Create Class or Arm",
    category: "Quick Actions",
    href: "/academics/classes",
    icon: Plus,
    keywords: ["class", "section", "arm", "level"],
  },
  {
    id: "act-enroll-student",
    title: "Enroll Existing Student",
    category: "Quick Actions",
    href: "/students",
    icon: GraduationCap,
    keywords: ["students", "enroll", "learner"],
  },

  // Navigation
  {
    id: "nav-dashboard",
    title: "Dashboard Overview",
    category: "Navigation",
    href: "/dashboard",
    icon: LayoutDashboard,
    keywords: ["home", "stats", "overview"],
  },
  {
    id: "nav-students",
    title: "Students Directory",
    category: "Navigation",
    href: "/students",
    icon: GraduationCap,
    keywords: ["pupils", "learners", "directory", "profiles"],
  },
  {
    id: "nav-admissions",
    title: "Admissions Pipeline",
    category: "Navigation",
    href: "/admissions",
    icon: ClipboardList,
    keywords: ["applications", "intake", "reviews"],
  },
  {
    id: "nav-classes",
    title: "Classes & Arms Management",
    category: "Navigation",
    href: "/academics/classes",
    icon: Layers,
    keywords: ["sections", "grades", "arms"],
  },
  {
    id: "nav-subjects",
    title: "Curriculum & Subjects",
    category: "Navigation",
    href: "/academics/subjects",
    icon: BookOpen,
    keywords: ["courses", "curriculum", "syllabus"],
  },
  {
    id: "nav-sessions",
    title: "Sessions & Academic Terms",
    category: "Navigation",
    href: "/academics/sessions",
    icon: Calendar,
    keywords: ["calendar", "year", "term", "dates"],
  },
  {
    id: "nav-staff",
    title: "Faculty & Staff Directory",
    category: "Navigation",
    href: "/staff",
    icon: Users,
    keywords: ["teachers", "employees", "personnel"],
  },
  {
    id: "nav-results",
    title: "Examinations & Batches",
    category: "Navigation",
    href: "/results",
    icon: TrendingUp,
    keywords: ["exams", "grades", "scores", "report cards"],
  },
  {
    id: "nav-grading",
    title: "Grading Scales Setup",
    category: "Navigation",
    href: "/settings/grading",
    icon: Percent,
    keywords: ["grade scale", "marks", "gpa", "a b c"],
  },
  {
    id: "nav-school",
    title: "School Profile & Settings",
    category: "Navigation",
    href: "/school",
    icon: School,
    keywords: ["identity", "logo", "institution", "contact"],
  },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  // Listen for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter items
  const filteredItems = useMemo(() => {
    if (!search.trim()) return COMMAND_ITEMS;
    const q = search.toLowerCase().trim();
    return COMMAND_ITEMS.filter((item) => {
      return (
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.keywords?.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [search]);

  // Reset index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  const handleSelect = (href: string) => {
    setOpen(false);
    setSearch("");
    router.push(href);
  };

  // Keyboard navigation within results
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filteredItems.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = filteredItems[selectedIndex];
      if (selected) {
        handleSelect(selected.href);
      }
    }
  };

  return (
    <>
      {/* Trigger Button rendered in the header */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 items-center gap-2 rounded-lg border border-border/80 bg-muted/40 px-3 text-xs text-muted-foreground transition-colors hover:border-border hover:bg-muted/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:w-56 md:w-64"
      >
        <Search className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="flex-1 text-left">Quick search...</span>
        <kbd className="pointer-events-none hidden select-none items-center gap-0.5 rounded border border-border/80 bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Modal Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden border border-border shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Quick Command Search</DialogTitle>
          </DialogHeader>

          {/* Search Input Bar */}
          <div className="flex items-center border-b border-border/80 px-4 py-3">
            <Search className="mr-3 h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search actions, students, classes, or settings..."
              className="flex h-7 w-full rounded-md bg-transparent text-sm placeholder:text-muted-foreground focus-visible:outline-none"
              autoFocus
            />
          </div>

          {/* Results List */}
          <div className="max-h-80 overflow-y-auto p-2">
            {filteredItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No matching results found for &ldquo;{search}&rdquo;.
              </div>
            ) : (
              <div className="space-y-1">
                {filteredItems.map((item, index) => {
                  const Icon = item.icon;
                  const isSelected = index === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item.href)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-xs text-left transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground font-medium"
                          : "text-foreground hover:bg-muted/60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-md ${
                            isSelected
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <span className="block font-medium">{item.title}</span>
                          <span
                            className={`text-[10px] ${
                              isSelected
                                ? "text-primary-foreground/80"
                                : "text-muted-foreground"
                            }`}
                          >
                            {item.category}
                          </span>
                        </div>
                      </div>
                      <ArrowRight
                        className={`h-3.5 w-3.5 transition-transform ${
                          isSelected ? "translate-x-0.5 text-primary-foreground" : "text-muted-foreground/40"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Modal Footer Key Hints */}
          <div className="flex items-center justify-between border-t border-border/60 bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 font-mono">
                <kbd className="rounded border bg-background px-1 py-0.5 text-[9px]">↑</kbd>
                <kbd className="rounded border bg-background px-1 py-0.5 text-[9px]">↓</kbd>
                Navigate
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-mono">
                <kbd className="rounded border bg-background px-1 py-0.5 text-[9px]">↵</kbd>
                Select
              </span>
            </div>
            <span className="flex items-center gap-1 font-mono">
              <kbd className="rounded border bg-background px-1 py-0.5 text-[9px]">ESC</kbd>
              Close
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
