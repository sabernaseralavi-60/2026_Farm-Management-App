// Runs as the very first thing in <body>, before anything else paints, so
// the stored/system theme applies immediately — no flash of the wrong theme
// on load. Kept as a plain inline script (not a "use client" component with
// an effect) precisely so it isn't delayed until after hydration.
const SCRIPT = `(function(){try{var s=localStorage.getItem("farm-theme");var t=(s==="light"||s==="dark")?s:(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;

export function ThemeInit() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
