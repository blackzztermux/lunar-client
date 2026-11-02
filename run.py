import os
import json
import socket
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(BASE_DIR, "config.json")


def load_config():
    defaults = {
        "host": "127.0.0.1",
        "port": 3000,
        "debug": False
    }

    try:
        with open(CONFIG_PATH, "r", encoding="utf-8") as file:
            config = json.load(file)
        return {**defaults, **config}
    except (OSError, json.JSONDecodeError):
        return defaults


def port_available(host, port):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        sock.bind((host, port))
        return True
    except OSError:
        return False
    finally:
        sock.close()


def main():
    try:
        from app import app
    except ImportError as error:
        print(f"Erro ao importar o app: {error}")
        print("Instale as dependências com: pip install -r requirements.txt")
        sys.exit(1)

    config = load_config()
    host = str(config.get("host", "127.0.0.1"))
    port = int(config.get("port", 3000))

    if not port_available(host, port):
        print(f"A porta {port} já está em uso.")
        print("Feche o outro servidor ou escolha outra porta no config.json.")
        sys.exit(1)

    print("=" * 40)
    print("       LUNAR CLIENT")
    print("=" * 40)
    print(f"Servidor: http://{host}:{port}")
    print("Para parar, pressione CTRL+C.")
    print("=" * 40)

    app.run(
        host=host,
        port=port,
        debug=False,
        use_reloader=False
    )


if __name__ == "__main__":
    main()
