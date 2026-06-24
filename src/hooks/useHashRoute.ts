import { useEffect, useState } from "react";

const normalize = (hash: string) => {
  const path = hash.replace(/^#/, "");
  return path === "" || path === "/" ? "/" : path;
};

export const useHashRoute = () => {
  const [route, setRoute] = useState(() => normalize(window.location.hash));

  useEffect(() => {
    const onHashChange = () => {
      setRoute(normalize(window.location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return route;
};
