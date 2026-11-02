"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  const setText = (id, value) => {
    const el = $(id);
    if (el && value !== undefined && value !== null) {
      el.textContent = value;
    }
  };

  const setBar = (id, value) => {
    const el = $(id);
    if (el) {
      const percent = Math.max(0, Math.min(100, Number(value) || 0));
      el.style.width = `${percent}%`;
    }
  };

  const formatBytes = (bytes) => {
    if (!Number.isFinite(Number(bytes))) return "—";
    const value = Math.max(0, Number(bytes));
    if (value < 1024) return `${value} B`;

    const units = ["KB", "MB", "GB", "TB"];
    let size = value / 1024;
    let index = 0;

    while (size >= 1024 && index < units.length - 1) {
      size /= 1024;
      index++;
    }

    return `${size.toFixed(1)} ${units[index]}`;
  };

  const formatUptime = (seconds) => {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);

    if (days) return `${days}d ${hours}h`;
    if (hours) return `${hours}h ${minutes}min`;
    return `${minutes} min`;
  };

  // Navegação entre páginas
  const navItems = document.querySelectorAll(".nav-item[data-page]");
  const pages = document.querySelectorAll(".page");

  function showPage(pageName) {
    const target = $(`page-${pageName}`);
    if (!target) return;

    pages.forEach((page) => {
      page.classList.toggle("active", page === target);
    });

    navItems.forEach((item) => {
      item.classList.toggle("active", item.dataset.page === pageName);
    });

    const activeItem = document.querySelector(
      `.nav-item[data-page="${pageName}"]`
    );

    setText(
      "currentSection",
      activeItem ? activeItem.textContent.trim() : pageName
    );

    closeSidebar();
  }

  navItems.forEach((item) => {
    item.addEventListener("click", () => showPage(item.dataset.page));
  });

  // Menu para dispositivos móveis
  const sidebar = $("sidebar");
  const overlay = $("sidebarOverlay");

  function openSidebar() {
    if (sidebar) sidebar.classList.add("open");
    if (overlay) overlay.classList.add("active");
    document.body.classList.add("sidebar-open");
  }

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove("open");
    if (overlay) overlay.classList.remove("active");
    document.body.classList.remove("sidebar-open");
  }

  $("menuToggle")?.addEventListener("click", openSidebar);
  $("closeMenu")?.addEventListener("click", closeSidebar);
  overlay?.addEventListener("click", closeSidebar);

  // Endereço do PC remoto: fica salvo neste navegador.
  const remoteInput = $("remoteDesktopUrl");
  const savedUrl = sessionStorage.getItem("lunarRemoteUrl") || "";

  if (remoteInput) remoteInput.value = savedUrl;

  function getSafeRemoteUrl() {
    const raw = remoteInput?.value.trim() || "";
    if (!raw) {
      alert("Digite o endereço do PC remoto primeiro.");
      return null;
    }

    try {
      const url = new URL(
        /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(raw) ? raw : `https://${raw}`
      );

      if (!["http:", "https:"].includes(url.protocol)) {
        alert("Use um endereço HTTP ou HTTPS válido.");
        return null;
      }

      return url.href;
    } catch {
      alert("Esse endereço não parece ser válido.");
      return null;
    }
  }

  $("saveRemoteUrl")?.addEventListener("click", () => {
    const url = getSafeRemoteUrl();
    if (!url) return;

    sessionStorage.setItem("lunarRemoteUrl", url);
    if (remoteInput) remoteInput.value = url;
    setText("connectionStatus", "Endereço salvo");
    alert("Endereço salvo nesta sessão do navegador.");
  });

  $("connectRemote")?.addEventListener("click", () => {
    const url = getSafeRemoteUrl();
    if (!url) return;

    sessionStorage.setItem("lunarRemoteUrl", url);
    window.open(url, "_blank", "noopener,noreferrer");
  });

  $("openRemote")?.addEventListener("click", () => {
    const url = sessionStorage.getItem("lunarRemoteUrl");
    if (!url) {
      alert("Configure e salve o endereço do PC remoto primeiro.");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  });

  // Atualização dos dados do dispositivo que executa o backend.
  async function updateStatus() {
    try {
      const response = await fetch("/api/status", {
        cache: "no-store"
      });

      if (!response.ok) throw new Error("Falha ao consultar o servidor");

      const data = await response.json();
      const ram = data.ram || {};
      const storage = data.storage || {};
      const network = data.network || {};

      setText("cpuValue", `${Number(data.cpu_percent || 0).toFixed(1)}%`);
      setText("cpuValue2", `${Number(data.cpu_percent || 0).toFixed(1)}%`);
      setBar("cpuBar", data.cpu_percent);
      setBar("cpuBar2", data.cpu_percent);

      setText("ramValue", `${Number(ram.percent || 0).toFixed(1)}%`);
      setText("ramValue2", `${Number(ram.percent || 0).toFixed(1)}%`);
      setBar("ramBar", ram.percent);
      setBar("ramBar2", ram.percent);
      setText(
        "ramDetails",
        `${ram.used_text || formatBytes(ram.used)} usados de ${ram.total_text || formatBytes(ram.total)}`
      );
      setText(
        "ramDetails2",
        `${ram.used_text || formatBytes(ram.used)} usados de ${ram.total_text || formatBytes(ram.total)}`
      );

      setText("diskValue", `${Number(storage.percent || 0).toFixed(1)}%`);
      setText("diskValue2", `${Number(storage.percent || 0).toFixed(1)}%`);
      setBar("diskBar", storage.percent);
      setBar("diskBar2", storage.percent);
      setText(
        "diskDetails",
        `${storage.used_text || formatBytes(storage.used)} usados de ${storage.total_text || formatBytes(storage.total)}`
      );
      setText(
        "diskDetails2",
        `${storage.used_text || formatBytes(storage.used)} usados de ${storage.total_text || formatBytes(storage.total)}`
      );

      setText("coreValue", data.cpu_count ?? "—");
      setText("coreValue2", data.cpu_count ?? "—");
      setText("deviceName", data.device || "Dispositivo local");
      setText("systemInfo", `${data.system || "Sistema"} ${data.system_release || ""}`.trim());
      setText("uptimeValue", formatUptime(data.uptime_seconds));
      setText("architectureValue", data.machine || "—");

      setText("networkSent", network.sent_text || formatBytes(network.bytes_sent));
      setText("networkReceived", network.received_text || formatBytes(network.bytes_received));

      setText("hardwareDevice", data.device || "—");
      setText("hardwareSystem", data.system || "—");
      setText("hardwareRelease", data.system_release || "—");
      setText("hardwareMachine", data.machine || "—");
      setText("hardwareCpu", `${data.cpu_count ?? "—"} núcleos`);
      setText(
        "hardwareRam",
        ram.total_text || formatBytes(ram.total)
      );
      setText(
        "hardwareDisk",
        storage.total_text || formatBytes(storage.total)
      );

      setText("sidebarStatus", "Online");
      setText("connectionStatus", "Servidor online");

      const updated = new Date();
      setText(
        "lastUpdated",
        `Atualizado às ${updated.toLocaleTimeString("pt-BR")}`
      );
    } catch (error) {
      setText("sidebarStatus", "Offline");
      setText("connectionStatus", "Servidor indisponível");
      console.error("Lunar Client:", error);
    }
  }

  // Configuração geral
  async function loadConfig() {
    try {
      const response = await fetch("/api/config", {
        cache: "no-store"
      });

      if (!response.ok) return;

      const config = await response.json();
      setText("settingAppName", config.app_name || "Lunar Client");
    } catch (error) {
      console.error("Não foi possível carregar as configurações:", error);
    }
  }

  updateStatus();
  loadConfig();

  // Atualiza os indicadores a cada cinco segundos.
  window.setInterval(updateStatus, 5000);
});
