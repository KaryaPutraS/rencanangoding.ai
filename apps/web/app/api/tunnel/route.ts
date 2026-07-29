import { NextResponse } from "next/server";
import { spawn, execSync, ChildProcess } from "child_process";
import os from "os";

interface TailscaleInfo {
  installed: boolean;
  running: boolean;
  ip?: string;
  dnsName?: string;
  url?: string;
  funnelActive?: boolean;
}

interface TunnelState {
  process?: ChildProcess;
  publicUrl?: string;
  localNetworkUrl?: string;
  provider?: "cloudflare" | "tailscale" | "lan";
  tailscaleActive?: boolean;
}

const globalForTunnel = globalThis as unknown as {
  tunnelState: TunnelState | undefined;
};

function getLocalNetworkIp(): string {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === "IPv4" && !net.internal && !name.toLowerCase().includes("tailscale")) {
        return net.address;
      }
    }
  }
  return "127.0.0.1";
}

function getTailscaleInfo(): TailscaleInfo {
  try {
    const stdout = execSync("tailscale status --json", { encoding: "utf-8", timeout: 3000 });
    const data = JSON.parse(stdout);
    const ip = data.Self?.TailscaleIPs?.[0];
    let dnsName = data.Self?.DNSName || "";
    if (dnsName.endsWith(".")) dnsName = dnsName.slice(0, -1);

    return {
      installed: true,
      running: true,
      ip,
      dnsName,
      url: ip ? `http://${ip}:7518` : undefined
    };
  } catch {
    return { installed: false, running: false };
  }
}

export async function GET() {
  const state = globalForTunnel.tunnelState;
  const localIp = getLocalNetworkIp();
  const localNetworkUrl = `http://${localIp}:7518`;
  const tailscale = getTailscaleInfo();

  return NextResponse.json({
    success: true,
    active: !!(state?.publicUrl || state?.process),
    url: state?.publicUrl || null,
    localNetworkUrl,
    tailscale,
    provider: state?.provider || "lan"
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || "start";
    const providerChoice = body.provider || "cloudflare";
    const localIp = getLocalNetworkIp();
    const localNetworkUrl = `http://${localIp}:7518`;
    const tailscale = getTailscaleInfo();

    if (action === "stop") {
      if (globalForTunnel.tunnelState?.process) {
        try {
          globalForTunnel.tunnelState.process.kill();
        } catch {}
      }
      globalForTunnel.tunnelState = undefined;
      return NextResponse.json({
        success: true,
        active: false,
        url: null,
        localNetworkUrl,
        tailscale,
        message: "Tunnel dihentikan."
      });
    }

    if (providerChoice === "tailscale") {
      if (!tailscale.running || !tailscale.ip) {
        return NextResponse.json(
          { success: false, error: "Tailscale tidak aktif di komputer ini. Silakan jalankan Tailscale terlebih dahulu." },
          { status: 400 }
        );
      }

      // Enable Tailscale Funnel / HTTPS serve if requested
      try {
        execSync("tailscale serve --bg 7518", { timeout: 4000 });
      } catch {}

      const tailscaleUrl = tailscale.dnsName ? `http://${tailscale.dnsName}:7518` : `http://${tailscale.ip}:7518`;
      globalForTunnel.tunnelState = {
        publicUrl: tailscaleUrl,
        localNetworkUrl,
        provider: "tailscale",
        tailscaleActive: true
      };

      return NextResponse.json({
        success: true,
        active: true,
        url: tailscaleUrl,
        localNetworkUrl,
        tailscale,
        provider: "tailscale",
        message: "Tailscale Secure Mesh Endpoint diaktifkan!"
      });
    }

    // Start Cloudflare Quick Tunnel
    if (globalForTunnel.tunnelState?.publicUrl && globalForTunnel.tunnelState.provider === "cloudflare") {
      return NextResponse.json({
        success: true,
        active: true,
        url: globalForTunnel.tunnelState.publicUrl,
        localNetworkUrl,
        tailscale,
        provider: "cloudflare",
        message: "Cloudflare Official Tunnel sudah aktif."
      });
    }

    const publicUrl = await new Promise<string | null>((resolve) => {
      let resolved = false;
      try {
        const proc = spawn(
          "npx",
          ["--yes", "cloudflared", "tunnel", "--url", "http://localhost:7518", "--http-host-header", "localhost"],
          { shell: true }
        );

        proc.stderr?.on("data", (data) => {
          const str = data.toString();
          const match = str.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
          if (match && !resolved) {
            resolved = true;
            globalForTunnel.tunnelState = {
              process: proc,
              publicUrl: match[0],
              localNetworkUrl,
              provider: "cloudflare"
            };
            resolve(match[0]);
          }
        });

        proc.on("error", () => {
          if (!resolved) resolve(null);
        });

        setTimeout(() => {
          if (!resolved) resolve(null);
        }, 12000);
      } catch {
        resolve(null);
      }
    });

    if (publicUrl) {
      return NextResponse.json({
        success: true,
        active: true,
        url: publicUrl,
        localNetworkUrl,
        tailscale,
        provider: "cloudflare",
        message: "Cloudflare Official Public Tunnel berhasil diaktifkan!"
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Gagal memulai Cloudflare Tunnel. Gunakan Tailscale atau Wi-Fi Lokal yang 100% Aman.",
        localNetworkUrl,
        tailscale
      },
      { status: 500 }
    );
  } catch (err: any) {
    console.error("Error starting tunnel:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengaktifkan Tunnel" },
      { status: 500 }
    );
  }
}
