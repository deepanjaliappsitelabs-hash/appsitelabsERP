import { useEffect, useState } from "react";

function getInitialSidebarState() {
  if (typeof window === "undefined") return true;

  return window.matchMedia("(min-width: 1024px)").matches;
}

function useSidebarToggle() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(getInitialSidebarState);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const handleScreenChange = (event) => {
      setIsSidebarOpen(event.matches);
    };

    handleScreenChange(desktopQuery);
    desktopQuery.addEventListener("change", handleScreenChange);

    return () => {
      desktopQuery.removeEventListener("change", handleScreenChange);
    };
  }, []);

  return {
    isSidebarOpen,
    toggleSidebar: () => setIsSidebarOpen((current) => !current),
    closeSidebar: () => setIsSidebarOpen(false),
  };
}

export default useSidebarToggle;
