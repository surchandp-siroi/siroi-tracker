export function usePathname(): string {
  return typeof window !== "undefined" ? window.location.pathname : "/";
}

export function useRouter() {
  return {
    push: (href: string) => {
      if (typeof window !== "undefined") {
        window.history.pushState({}, "", href);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    },
    replace: (href: string) => {
      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", href);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    },
    back: () => {
      if (typeof window !== "undefined") {
        window.history.back();
      }
    },
    forward: () => {
      if (typeof window !== "undefined") {
        window.history.forward();
      }
    },
    refresh: () => {
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    },
    prefetch: async (_href: string) => {},
  };
}

export function useSearchParams(): URLSearchParams {
  return new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
}

