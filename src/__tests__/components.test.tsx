import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatCard } from "@/components/ui/stat-card";
import { Car } from "lucide-react";

// ============================================================================
// GlassCard
// ============================================================================
describe("GlassCard", () => {
  it("renders children", () => {
    render(<GlassCard>Hello World</GlassCard>);
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it("applies default variant classes", () => {
    const { container } = render(<GlassCard>Content</GlassCard>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("backdrop-blur-xl");
    expect(card.className).toContain("rounded-2xl");
  });

  it("applies elevated variant classes", () => {
    const { container } = render(
      <GlassCard variant="elevated">Content</GlassCard>,
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("backdrop-blur-2xl");
    expect(card.className).toContain("shadow-xl");
  });

  it("applies interactive variant classes", () => {
    const { container } = render(
      <GlassCard variant="interactive">Content</GlassCard>,
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("cursor-pointer");
    expect(card.className).toContain("transition-all");
  });

  it("applies none padding", () => {
    const { container } = render(<GlassCard padding="none">Content</GlassCard>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).not.toContain("p-3");
    expect(card.className).not.toContain("p-5");
    expect(card.className).not.toContain("p-7");
  });

  it("applies sm padding", () => {
    const { container } = render(<GlassCard padding="sm">Content</GlassCard>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("p-3");
  });

  it("applies md padding (default)", () => {
    const { container } = render(<GlassCard>Content</GlassCard>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("p-5");
  });

  it("applies lg padding", () => {
    const { container } = render(<GlassCard padding="lg">Content</GlassCard>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("p-7");
  });

  it("merges custom className", () => {
    const { container } = render(
      <GlassCard className="mt-4 custom-class">Content</GlassCard>,
    );
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain("mt-4");
    expect(card.className).toContain("custom-class");
  });

  it("passes through HTML attributes", () => {
    render(
      <GlassCard data-testid="glass-card" id="my-card">
        Content
      </GlassCard>,
    );
    const card = screen.getByTestId("glass-card");
    expect(card).toBeInTheDocument();
    expect(card.id).toBe("my-card");
  });

  it("renders as a div element", () => {
    const { container } = render(<GlassCard>Content</GlassCard>);
    expect(container.firstChild?.nodeName).toBe("DIV");
  });
});

// ============================================================================
// Button
// ============================================================================
describe("Button", () => {
  it("renders children text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("renders as a button element by default", () => {
    render(<Button>Click</Button>);
    const btn = screen.getByText("Click");
    expect(btn.tagName).toBe("BUTTON");
  });

  it("applies primary variant by default", () => {
    render(<Button>Primary</Button>);
    const btn = screen.getByText("Primary");
    expect(btn.className).toContain("bg-sky-500");
  });

  it("applies secondary variant", () => {
    render(<Button variant="secondary">Secondary</Button>);
    const btn = screen.getByText("Secondary");
    expect(btn.className).toContain("bg-white/10");
  });

  it("applies danger variant", () => {
    render(<Button variant="danger">Delete</Button>);
    const btn = screen.getByText("Delete");
    expect(btn.className).toContain("bg-red-500");
  });

  it("applies ghost variant", () => {
    render(<Button variant="ghost">Ghost</Button>);
    const btn = screen.getByText("Ghost");
    expect(btn.className).toContain("hover:bg-white/10");
  });

  it("applies outline variant", () => {
    render(<Button variant="outline">Outline</Button>);
    const btn = screen.getByText("Outline");
    expect(btn.className).toContain("border-sky-500");
  });

  it("applies sm size", () => {
    render(<Button size="sm">Small</Button>);
    const btn = screen.getByText("Small");
    expect(btn.className).toContain("px-3");
    expect(btn.className).toContain("py-1.5");
  });

  it("applies md size (default)", () => {
    render(<Button>Medium</Button>);
    const btn = screen.getByText("Medium");
    expect(btn.className).toContain("px-5");
    expect(btn.className).toContain("py-2.5");
  });

  it("applies lg size", () => {
    render(<Button size="lg">Large</Button>);
    const btn = screen.getByText("Large");
    expect(btn.className).toContain("px-7");
    expect(btn.className).toContain("min-h-[48px]");
  });

  it("applies icon size", () => {
    render(<Button size="icon">🚗</Button>);
    const btn = screen.getByText("🚗");
    expect(btn.className).toContain("p-2.5");
  });

  it("supports disabled state", () => {
    render(<Button disabled>Disabled</Button>);
    const btn = screen.getByText("Disabled");
    expect(btn).toBeDisabled();
    expect(btn.className).toContain("disabled:opacity-50");
  });

  it("merges custom className", () => {
    render(<Button className="extra-class">Custom</Button>);
    const btn = screen.getByText("Custom");
    expect(btn.className).toContain("extra-class");
  });

  it("has proper base classes (font-semibold, transition)", () => {
    render(<Button>Base</Button>);
    const btn = screen.getByText("Base");
    expect(btn.className).toContain("font-semibold");
    expect(btn.className).toContain("transition-all");
    expect(btn.className).toContain("inline-flex");
  });

  it("supports type attribute", () => {
    render(<Button type="submit">Submit</Button>);
    const btn = screen.getByText("Submit") as HTMLButtonElement;
    expect(btn.type).toBe("submit");
  });
});

// ============================================================================
// StatusBadge
// ============================================================================
describe("StatusBadge", () => {
  it("renders label text", () => {
    render(<StatusBadge status="available" label="Available" />);
    expect(screen.getByText("Available")).toBeInTheDocument();
  });

  it("renders as a span element", () => {
    const { container } = render(
      <StatusBadge status="available" label="Available" />,
    );
    expect(container.firstChild?.nodeName).toBe("SPAN");
  });

  it("applies correct color for 'available'", () => {
    const { container } = render(
      <StatusBadge status="available" label="Available" />,
    );
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("emerald");
  });

  it("applies correct color for 'overdue'", () => {
    const { container } = render(
      <StatusBadge status="overdue" label="Overdue" />,
    );
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("red");
  });

  it("applies correct color for 'reserved'", () => {
    const { container } = render(
      <StatusBadge status="reserved" label="Reserved" />,
    );
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("amber");
  });

  it("applies correct color for 'sold'", () => {
    const { container } = render(<StatusBadge status="sold" label="Sold" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("blue");
  });

  it("applies sm size", () => {
    const { container } = render(
      <StatusBadge status="available" label="Available" size="sm" />,
    );
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("text-xs");
    expect(badge.className).toContain("px-2");
  });

  it("applies md size (default)", () => {
    const { container } = render(
      <StatusBadge status="available" label="Available" />,
    );
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("text-sm");
    expect(badge.className).toContain("px-3");
  });

  it("applies lg size", () => {
    const { container } = render(
      <StatusBadge status="available" label="Available" size="lg" />,
    );
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("text-base");
    expect(badge.className).toContain("px-4");
  });

  it("has rounded-full class", () => {
    const { container } = render(
      <StatusBadge status="available" label="Available" />,
    );
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("rounded-full");
  });

  it("has a status dot indicator", () => {
    const { container } = render(
      <StatusBadge status="available" label="Available" />,
    );
    const dot = container.querySelector(".rounded-full.h-1\\.5");
    expect(dot).toBeInTheDocument();
  });

  it("dot is emerald for available/paid/completed/clock_in", () => {
    const greenStatuses = ["available", "paid", "completed", "clock_in"];
    greenStatuses.forEach((status) => {
      const { container } = render(
        <StatusBadge status={status} label={status} />,
      );
      const dot = container.querySelector(
        "span > span:first-child",
      ) as HTMLElement;
      expect(dot?.className).toContain("bg-emerald-500");
    });
  });

  it("dot is red for overdue/cancelled", () => {
    const redStatuses = ["overdue", "cancelled"];
    redStatuses.forEach((status) => {
      const { container } = render(
        <StatusBadge status={status} label={status} />,
      );
      const dot = container.querySelector(
        "span > span:first-child",
      ) as HTMLElement;
      expect(dot?.className).toContain("bg-red-500");
    });
  });

  it("dot is amber for reserved/pending/partially_paid", () => {
    const amberStatuses = ["reserved", "pending", "partially_paid"];
    amberStatuses.forEach((status) => {
      const { container } = render(
        <StatusBadge status={status} label={status} />,
      );
      const dot = container.querySelector(
        "span > span:first-child",
      ) as HTMLElement;
      expect(dot?.className).toContain("bg-amber-500");
    });
  });

  it("dot is blue for unknown statuses", () => {
    const { container } = render(
      <StatusBadge status="upcoming" label="Upcoming" />,
    );
    const dot = container.querySelector(
      "span > span:first-child",
    ) as HTMLElement;
    expect(dot?.className).toContain("bg-blue-500");
  });

  it("has RTL-aware margin classes on dot", () => {
    const { container } = render(
      <StatusBadge status="available" label="Available" />,
    );
    const dot = container.querySelector(
      "span > span:first-child",
    ) as HTMLElement;
    expect(dot?.className).toContain("rtl:mr-0");
    expect(dot?.className).toContain("rtl:ml-1.5");
  });

  it("merges custom className", () => {
    const { container } = render(
      <StatusBadge
        status="available"
        label="Available"
        className="my-custom"
      />,
    );
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain("my-custom");
  });
});

// ============================================================================
// StatCard
// ============================================================================
describe("StatCard", () => {
  const defaultProps = {
    title: "Total Inventory",
    value: "25",
    icon: Car,
  };

  it("renders title", () => {
    render(<StatCard {...defaultProps} />);
    expect(screen.getByText("Total Inventory")).toBeInTheDocument();
  });

  it("renders value", () => {
    render(<StatCard {...defaultProps} />);
    expect(screen.getByText("25")).toBeInTheDocument();
  });

  it("renders subtitle when provided", () => {
    render(<StatCard {...defaultProps} subtitle="5 more than last week" />);
    expect(screen.getByText("5 more than last week")).toBeInTheDocument();
  });

  it("does not render subtitle when not provided", () => {
    const { container } = render(<StatCard {...defaultProps} />);
    const subtitles = container.querySelectorAll(".text-xs.text-gray-400");
    expect(subtitles).toHaveLength(0);
  });

  it("renders trend indicator when provided", () => {
    render(<StatCard {...defaultProps} trend="up" trendValue="12%" />);
    expect(screen.getByText(/↑/)).toBeInTheDocument();
    expect(screen.getByText(/12%/)).toBeInTheDocument();
  });

  it("renders down trend", () => {
    render(<StatCard {...defaultProps} trend="down" trendValue="5%" />);
    expect(screen.getByText(/↓/)).toBeInTheDocument();
  });

  it("renders neutral trend", () => {
    render(<StatCard {...defaultProps} trend="neutral" trendValue="0%" />);
    expect(screen.getByText(/→/)).toBeInTheDocument();
  });

  it("does not render trend when not provided", () => {
    const { container } = render(<StatCard {...defaultProps} />);
    expect(container.textContent).not.toContain("↑");
    expect(container.textContent).not.toContain("↓");
  });

  it("applies sky color by default", () => {
    const { container } = render(<StatCard {...defaultProps} />);
    const gradient = container.querySelector(
      ".bg-gradient-to-br",
    ) as HTMLElement;
    expect(gradient?.className).toContain("from-sky-500");
  });

  it("applies emerald color", () => {
    const { container } = render(
      <StatCard {...defaultProps} color="emerald" />,
    );
    const gradient = container.querySelector(
      ".bg-gradient-to-br",
    ) as HTMLElement;
    expect(gradient?.className).toContain("from-emerald-500");
  });

  it("applies amber color", () => {
    const { container } = render(<StatCard {...defaultProps} color="amber" />);
    const gradient = container.querySelector(
      ".bg-gradient-to-br",
    ) as HTMLElement;
    expect(gradient?.className).toContain("from-amber-500");
  });

  it("applies red color", () => {
    const { container } = render(<StatCard {...defaultProps} color="red" />);
    const gradient = container.querySelector(
      ".bg-gradient-to-br",
    ) as HTMLElement;
    expect(gradient?.className).toContain("from-red-500");
  });

  it("applies violet color", () => {
    const { container } = render(<StatCard {...defaultProps} color="violet" />);
    const gradient = container.querySelector(
      ".bg-gradient-to-br",
    ) as HTMLElement;
    expect(gradient?.className).toContain("from-violet-500");
  });

  it("renders icon", () => {
    const { container } = render(<StatCard {...defaultProps} />);
    // Lucide icons render as SVG
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("merges custom className", () => {
    const { container } = render(
      <StatCard {...defaultProps} className="mt-8" />,
    );
    // The outer GlassCard should have the className
    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv.className).toContain("mt-8");
  });

  it("renders numeric value", () => {
    render(<StatCard {...defaultProps} value={42} />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders currency-formatted value", () => {
    render(<StatCard {...defaultProps} value="EGP 1,500,000" />);
    expect(screen.getByText("EGP 1,500,000")).toBeInTheDocument();
  });

  it("up trend has emerald styling", () => {
    const { container } = render(
      <StatCard {...defaultProps} trend="up" trendValue="10%" />,
    );
    const trendEl = container.querySelector(".bg-emerald-500\\/15");
    expect(trendEl).toBeInTheDocument();
  });

  it("down trend has red styling", () => {
    const { container } = render(
      <StatCard {...defaultProps} trend="down" trendValue="10%" />,
    );
    const trendEl = container.querySelector(".bg-red-500\\/15");
    expect(trendEl).toBeInTheDocument();
  });
});
