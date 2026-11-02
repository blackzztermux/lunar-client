import json
import os
import platform
import shutil
import socket
import time
from datetime import datetime

import psutil
from flask import Flask, jsonify, render_template

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(BASE_DIR, "config.json")

DEFAULT_CONFIG = {
    "app_name": "Lunar Client",
    "host": "127.0.0.1",
    "port": 3000,
    "debug": False,
    "remote_desktop_url": ""
}


def load_config():
    try:
        with open(CONFIG_PATH, "r", encoding="utf-8") as file:
            data = json.load(file)
        return {**DEFAULT_CONFIG, **data}
    except (OSError, json.JSONDecodeError):
        return DEFAULT_CONFIG.copy()


config = load_config()

app = Flask(
    __name__,
    template_folder=os.path.join(BASE_DIR, "templates"),
    static_folder=os.path.join(BASE_DIR, "static")
)

START_TIME = time.time()


def format_bytes(value):
    value = float(value)
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if value < 1024 or unit == "TB":
            return f"{value:.1f} {unit}"
        value /= 1024
    return f"{value:.1f} TB"


@app.get("/")
def index():
    return render_template(
        "index.html",
        app_name=config["app_name"]
    )


@app.get("/api/status")
def api_status():
    memory = psutil.virtual_memory()
    disk = shutil.disk_usage(BASE_DIR)
    network = psutil.net_io_counters()

    return jsonify({
        "app_name": config["app_name"],
        "status": "online",
        "timestamp": datetime.now().astimezone().isoformat(),
        "uptime_seconds": int(time.time() - START_TIME),
        "device": platform.node() or socket.gethostname(),
        "system": platform.system(),
        "system_release": platform.release(),
        "machine": platform.machine(),
        "cpu_percent": psutil.cpu_percent(interval=0.1),
        "cpu_count": psutil.cpu_count() or 1,
        "ram": {
            "total": memory.total,
            "used": memory.used,
            "available": memory.available,
            "percent": memory.percent,
            "total_text": format_bytes(memory.total),
            "used_text": format_bytes(memory.used)
        },
        "storage": {
            "total": disk.total,
            "used": disk.used,
            "free": disk.free,
            "percent": round(disk.used / disk.total * 100, 1)
                if disk.total else 0,
            "total_text": format_bytes(disk.total),
            "used_text": format_bytes(disk.used),
            "free_text": format_bytes(disk.free)
        },
        "network": {
            "bytes_sent": network.bytes_sent,
            "bytes_received": network.bytes_recv,
            "sent_text": format_bytes(network.bytes_sent),
            "received_text": format_bytes(network.bytes_recv)
        },
        "remote_desktop_configured": bool(
            config.get("remote_desktop_url", "").strip()
        )
    })


@app.get("/api/config")
def api_config():
    return jsonify({
        "app_name": config["app_name"],
        "remote_desktop_url": config.get("remote_desktop_url", "")
    })


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(
        host=str(config.get("host", "127.0.0.1")),
        port=int(config.get("port", 3000)),
        debug=bool(config.get("debug", False))
    )
