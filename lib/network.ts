// Pure (no Next imports), so lib/network.test.ts can run it with plain node.
/** The caller's network: an IPv4 address, or an IPv6 address cut to its /64 (one client usually owns the whole /64). */
export function network(ip: string): string {
  const v = ip.trim().toLowerCase().replace(/^::ffff:(?=\d+\.)/, "");
  if (!v.includes(":")) return v;
  const [head, tail = ""] = v.split("::");
  const a = head ? head.split(":") : [];
  const b = tail ? tail.split(":") : [];
  const full = v.includes("::") ? [...a, ...Array(Math.max(0, 8 - a.length - b.length)).fill("0"), ...b] : a;
  return full.slice(0, 4).map((x) => x.replace(/^0+(?=.)/, "")).join(":") + "::/64";
}
