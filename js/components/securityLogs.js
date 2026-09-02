// src/components/securityLogs.js

export const securityLogs = {
  containerId: "securityLogContainer",
  mapId: "attackMap",
  maxLogs: 60,
  maxDots: 18,

  init() {
    let container = document.getElementById(this.containerId);
    if (!container) {
      container = document.createElement("div");
      container.id = this.containerId;
      container.className = "security-log-panel";
      document.body.appendChild(container);
    }

    let map = document.getElementById(this.mapId);
    if (!map) {
      map = document.createElement("div");
      map.id = this.mapId;
      map.className = "attack-map";
      document.body.appendChild(map);
    }

    container.innerHTML = "";
    this._appendHeader(container);
    this.logEvent("Security log initialized");
  },

  _appendHeader(container) {
    const header = document.createElement("div");
    header.className = "sec-log-header";
    header.innerHTML = `<strong>Security Log</strong>`;
    container.appendChild(header);
  },

  _getTimestamp() {
    try {
      return new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    } catch {
      return new Date().toTimeString().slice(0, 8);
    }
  },

  logEvent(message) {
    const container = document.getElementById(this.containerId);
    if (!container || !message) return;

    const entry = document.createElement("div");
    entry.className = "sec-log-entry";
    entry.textContent = `[${this._getTimestamp()}] ${String(message)}`;

    container.appendChild(entry);

    const entries = container.querySelectorAll(".sec-log-entry");
    if (entries.length > this.maxLogs) {
      entries[0]?.remove();
    }

    container.scrollTop = container.scrollHeight;
  },

  animateAttack(type = "breach") {
    const map = document.getElementById(this.mapId);
    if (!map) return;

    const existingDots = map.querySelectorAll(".attack-dot");
    if (existingDots.length >= this.maxDots) {
      existingDots[0]?.remove();
    }

    const dot = document.createElement("div");
    dot.className = `attack-dot ${type === "defend" ? "defend" : "breach"}`;

    dot.style.top = `${Math.random() * 84}%`;
    dot.style.left = `${Math.random() * 84}%`;

    map.appendChild(dot);

    window.setTimeout(() => {
      if (dot && dot.parentNode) {
        dot.parentNode.removeChild(dot);
      }
    }, 1200);
  },

  clearLogs() {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    container.innerHTML = "";
    this._appendHeader(container);
  },

  destroy() {
    const container = document.getElementById(this.containerId);
    const map = document.getElementById(this.mapId);

    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }

    if (map && map.parentNode) {
      map.parentNode.removeChild(map);
    }
  },
};