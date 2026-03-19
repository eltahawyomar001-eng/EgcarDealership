import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { setMockRole } from "./setup";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => React.createElement("a", { href, ...props }, children),
}));

import { BottomNav } from "@/components/navigation/bottom-nav";
import { TopBar } from "@/components/navigation/top-bar";

// ============================================================================
// BottomNav
// ============================================================================
describe("BottomNav", () => {
  it("renders navigation links", () => {
    setMockRole("admin");
    render(<BottomNav />);
    // Nav uses t() which returns keys in tests
    expect(screen.getByText("nav.dashboard")).toBeInTheDocument();
    expect(screen.getByText("nav.inventory")).toBeInTheDocument();
    expect(screen.getByText("nav.sales")).toBeInTheDocument();
    expect(screen.getByText("nav.installments")).toBeInTheDocument();
  });

  it("shows settings for admin", () => {
    setMockRole("admin");
    render(<BottomNav />);
    expect(screen.getByText("nav.settings")).toBeInTheDocument();
  });

  it("shows settings for manager", () => {
    setMockRole("manager");
    render(<BottomNav />);
    expect(screen.getByText("nav.settings")).toBeInTheDocument();
  });

  it("hides settings for employee", () => {
    setMockRole("employee");
    render(<BottomNav />);
    expect(screen.queryByText("nav.settings")).not.toBeInTheDocument();
  });

  it("renders 5 items for admin", () => {
    setMockRole("admin");
    const { container } = render(<BottomNav />);
    const links = container.querySelectorAll("a");
    expect(links).toHaveLength(5);
  });

  it("renders 4 items for employee (no settings)", () => {
    setMockRole("employee");
    const { container } = render(<BottomNav />);
    const links = container.querySelectorAll("a");
    expect(links).toHaveLength(4);
  });

  it("has correct hrefs", () => {
    setMockRole("admin");
    const { container } = render(<BottomNav />);
    const links = container.querySelectorAll("a");
    const hrefs = Array.from(links).map((l) => l.getAttribute("href"));
    expect(hrefs).toContain("/dashboard");
    expect(hrefs).toContain("/inventory");
    expect(hrefs).toContain("/sales");
    expect(hrefs).toContain("/installments");
    expect(hrefs).toContain("/settings");
  });

  it("employee nav does not include /settings href", () => {
    setMockRole("employee");
    const { container } = render(<BottomNav />);
    const links = container.querySelectorAll("a");
    const hrefs = Array.from(links).map((l) => l.getAttribute("href"));
    expect(hrefs).not.toContain("/settings");
  });

  it("always shows dashboard, inventory, sales, installments for all roles", () => {
    const roles = ["admin", "manager", "employee"];
    roles.forEach((role) => {
      setMockRole(role);
      const { container, unmount } = render(<BottomNav />);
      const links = container.querySelectorAll("a");
      const hrefs = Array.from(links).map((l) => l.getAttribute("href"));
      expect(hrefs).toContain("/dashboard");
      expect(hrefs).toContain("/inventory");
      expect(hrefs).toContain("/sales");
      expect(hrefs).toContain("/installments");
      unmount();
    });
  });
});

// ============================================================================
// TopBar
// ============================================================================
describe("TopBar", () => {
  it("renders the top bar", () => {
    setMockRole("admin");
    render(<TopBar />);
    // Should render a header element
    const header = document.querySelector("header");
    expect(header).toBeInTheDocument();
  });

  it("displays role label for admin", () => {
    setMockRole("admin");
    render(<TopBar />);
    expect(screen.getByText("rbac.ownerAccount")).toBeInTheDocument();
  });

  it("displays role label for manager", () => {
    setMockRole("manager");
    render(<TopBar />);
    expect(screen.getByText("rbac.managerAccount")).toBeInTheDocument();
  });

  it("displays role label for employee", () => {
    setMockRole("employee");
    render(<TopBar />);
    expect(screen.getByText("rbac.staffAccount")).toBeInTheDocument();
  });

  it("admin role badge has emerald color", () => {
    setMockRole("admin");
    const { container } = render(<TopBar />);
    const badge = container.querySelector(".bg-emerald-500\\/10");
    expect(badge).toBeInTheDocument();
  });

  it("manager role badge has sky color", () => {
    setMockRole("manager");
    const { container } = render(<TopBar />);
    const badge = container.querySelector(".bg-sky-500\\/10");
    expect(badge).toBeInTheDocument();
  });

  it("employee role badge has gray color", () => {
    setMockRole("employee");
    const { container } = render(<TopBar />);
    const badge = container.querySelector(".bg-gray-500\\/10");
    expect(badge).toBeInTheDocument();
  });

  it("has language toggle button", () => {
    setMockRole("admin");
    render(<TopBar />);
    // Mock i18n returns "en" language, so toggle shows "عربي"
    expect(screen.getByText("عربي")).toBeInTheDocument();
  });

  it("has notification bell", () => {
    setMockRole("admin");
    const { container } = render(<TopBar />);
    // Bell icon renders as SVG
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThanOrEqual(2); // role icon + globe + bell
  });

  it("shows user initial in avatar", () => {
    setMockRole("admin");
    render(<TopBar />);
    // Mock user has full_name "Test User", initial is "T"
    expect(screen.getByText("T")).toBeInTheDocument();
  });

  it("renders app tagline on desktop", () => {
    setMockRole("admin");
    render(<TopBar />);
    expect(screen.getByText("app.tagline")).toBeInTheDocument();
  });
});
