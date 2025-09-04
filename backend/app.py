import os
from flask import Flask, jsonify
from flask_cors import CORS


def create_app() -> Flask:
    app = Flask(__name__)

    # Basic config via env vars
    app.config["ENV"] = os.getenv("FLASK_ENV", "development")
    app.config["DEBUG"] = os.getenv("FLASK_DEBUG", "1") == "1"

    # Enable CORS for local dev (lock down in prod)
    CORS(app, resources={r"/api/*": {"origins": os.getenv("CORS_ORIGINS", "*")}})

    @app.get("/")
    def root():
        return "Backend OK", 200

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok"})

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)))
