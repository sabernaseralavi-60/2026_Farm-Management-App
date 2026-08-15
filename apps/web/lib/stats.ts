/** Small self-contained statistics toolkit for the admin AI Q&A tool.
 *
 * The LLM is unreliable at arithmetic on lists of numbers (especially the
 * free models this app targets), so anywhere the admin might ask for
 * descriptive or inferential statistics, we compute the real numbers here in
 * plain TypeScript and hand the LLM only the finished result to narrate —
 * same "compute in code, never let the model invent numbers" rule the rest
 * of admin-analytics.ts follows. */

export interface DescriptiveStats {
  n: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  range: number;
  variance: number; // sample variance (n-1 denominator)
  stdev: number;
  q1: number;
  q3: number;
  iqr: number;
}

function quantile(sorted: number[], p: number): number {
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

const round2 = (x: number) => Math.round(x * 100) / 100;

export function describe(nums: number[]): DescriptiveStats | null {
  const n = nums.length;
  if (n === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mean = nums.reduce((a, b) => a + b, 0) / n;
  const median = quantile(sorted, 0.5);
  const variance = n > 1 ? nums.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1) : 0;
  const min = sorted[0];
  const max = sorted[n - 1];
  const q1 = quantile(sorted, 0.25);
  const q3 = quantile(sorted, 0.75);
  return {
    n,
    mean: round2(mean),
    median: round2(median),
    min,
    max,
    range: round2(max - min),
    variance: round2(variance),
    stdev: round2(Math.sqrt(variance)),
    q1: round2(q1),
    q3: round2(q3),
    iqr: round2(q3 - q1),
  };
}

// --- Student's t-distribution (Numerical Recipes' log-gamma / incomplete-beta method) ---

function logGamma(x: number): number {
  const g = 7;
  const p = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
    12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  x -= 1;
  let a = p[0];
  const t = x + g + 0.5;
  for (let i = 1; i < g + 2; i++) a += p[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

function betacf(x: number, a: number, b: number): number {
  const MAXIT = 200;
  const EPS = 3e-9;
  const FPMIN = 1e-30;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

function betai(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  if (x < (a + 1) / (a + b + 2)) return (bt * betacf(x, a, b)) / a;
  return 1 - (bt * betacf(1 - x, b, a)) / b;
}

/** Two-tailed p-value for a t-statistic with the given degrees of freedom. */
function tTwoTailedP(t: number, df: number): number {
  return betai(df / (df + t * t), df / 2, 0.5);
}

/** The t-critical value for a two-tailed test at the given alpha (e.g. 0.05 → 95% CI), via bisection. */
function tCritical(df: number, alpha: number): number {
  let lo = 0;
  let hi = 1000;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    if (tTwoTailedP(mid, df) > alpha) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export interface WelchTTestResult {
  nA: number;
  nB: number;
  meanA: number;
  meanB: number;
  meanDiff: number; // meanA - meanB
  tStat: number;
  df: number;
  pValue: number;
  significantAt05: boolean;
  ci95Diff: [number, number]; // 95% CI on meanA - meanB
}

/** Welch's two-sample t-test (does not assume equal variances) — the standard
 * choice for comparing two independent groups' means without pretesting. */
export function welchTTest(a: number[], b: number[]): WelchTTestResult | null {
  const nA = a.length;
  const nB = b.length;
  if (nA < 2 || nB < 2) return null;
  const meanA = a.reduce((s, v) => s + v, 0) / nA;
  const meanB = b.reduce((s, v) => s + v, 0) / nB;
  const varA = a.reduce((s, v) => s + (v - meanA) ** 2, 0) / (nA - 1);
  const varB = b.reduce((s, v) => s + (v - meanB) ** 2, 0) / (nB - 1);
  const seA = varA / nA;
  const seB = varB / nB;
  const se = Math.sqrt(seA + seB);
  if (se === 0) return null;
  const meanDiff = meanA - meanB;
  const tStat = meanDiff / se;
  const df = (seA + seB) ** 2 / ((seA * seA) / (nA - 1) + (seB * seB) / (nB - 1));
  const pValue = tTwoTailedP(Math.abs(tStat), df);
  const tCrit = tCritical(df, 0.05);
  const margin = tCrit * se;
  return {
    nA,
    nB,
    meanA: round2(meanA),
    meanB: round2(meanB),
    meanDiff: round2(meanDiff),
    tStat: round2(tStat),
    df: round2(df),
    pValue: Math.round(pValue * 10000) / 10000,
    significantAt05: pValue < 0.05,
    ci95Diff: [round2(meanDiff - margin), round2(meanDiff + margin)],
  };
}

/** "HH:MM" -> minutes since midnight, or null if missing/unparseable. */
export function parseTimeToMinutes(t: string | null | undefined): number | null {
  if (!t) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

export function minutesToHHMM(m: number): string {
  const total = Math.round(m);
  const h = Math.floor(total / 60);
  const min = total % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}
