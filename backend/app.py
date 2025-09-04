import os
import json
from flask import Flask, jsonify
from flask_cors import CORS


def create_app() -> Flask:
    app = Flask(__name__)

    # Basic config via env vars
    app.config["ENV"] = os.getenv("FLASK_ENV", "development")
    app.config["DEBUG"] = os.getenv("FLASK_DEBUG", "1") == "1"

    # Enable CORS for local dev (lock down in prod)
    CORS(app, resources={r"/api/*": {"origins": os.getenv("CORS_ORIGINS", "*")}})

    # Resolve path to dataset (project root / stock_market_data.json)
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
    data_file = os.path.join(project_root, "stock_market_data.json")

    @app.get("/")
    def root():
        return "Backend OK", 200

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok"})

    @app.get("/api/stocks")
    def get_stocks():
        try:
            with open(data_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            return jsonify(data)
        except FileNotFoundError:
            return jsonify({"error": "stock_market_data.json not found"}), 500
        except json.JSONDecodeError as e:
            return jsonify({"error": f"Invalid JSON: {e}"}), 500

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)))
