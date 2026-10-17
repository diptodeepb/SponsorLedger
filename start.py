#!/usr/bin/env python3
"""
SponsorLedger Development Server Runner
Starts FastAPI backend and Vite frontend concurrently with colored, prefixed logs.
"""
import os
import subprocess
import sys
import time
import threading
import shutil

# ANSI color codes for tags
COLORS = {
    "backend": "\033[94m",   # Blue
    "frontend": "\033[93m",  # Yellow
    "system": "\033[92m",    # Green
    "reset": "\033[0m",
}


def find_python_bin():
    """Find the python binary with dependencies installed."""
    candidates = [
        os.path.join("backend", ".venv", "bin", "python"),
        os.path.join("backend", ".venv", "bin", "python3"),
        os.path.join(".venv", "bin", "python"),
        os.path.join(".venv", "bin", "python3"),
        sys.executable,
    ]
    for path in candidates:
        if os.path.exists(path):
            # Verify uvicorn is available in this interpreter
            try:
                res = subprocess.run(
                    [path, "-c", "import uvicorn, fastapi"],
                    capture_output=True,
                    text=True,
                )
                if res.returncode == 0:
                    return path
            except Exception:
                continue
    return None


def check_env():
    """Ensure backend and frontend environments are set up."""
    python_bin = find_python_bin()
    if not python_bin:
        sys.stderr.write(
            f"{COLORS['backend']}[backend]{COLORS['reset']} "
            "Backend virtual environment with FastAPI/Uvicorn not found.\n"
            "Please run: cd backend && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt\n"
        )
        sys.exit(1)

    if not os.path.exists("frontend"):
        sys.stderr.write(
            f"{COLORS['frontend']}[frontend]{COLORS['reset']} "
            "Directory 'frontend' not found.\n"
        )
        sys.exit(1)

    if not os.path.exists(os.path.join("frontend", "node_modules")):
        print(
            f"{COLORS['system']}[system]{COLORS['reset']} "
            "Notice: frontend/node_modules not found. You may need to run: cd frontend && npm install"
        )

    # Automatically set up .env from .env.example if missing
    backend_env = os.path.join("backend", ".env")
    backend_env_example = os.path.join("backend", ".env.example")
    if not os.path.exists(backend_env) and os.path.exists(backend_env_example):
        shutil.copyfile(backend_env_example, backend_env)
        print(f"{COLORS['system']}[system]{COLORS['reset']} Created backend/.env from backend/.env.example")

    frontend_env = os.path.join("frontend", ".env")
    frontend_env_example = os.path.join("frontend", ".env.example")
    if not os.path.exists(frontend_env) and os.path.exists(frontend_env_example):
        shutil.copyfile(frontend_env_example, frontend_env)
        print(f"{COLORS['system']}[system]{COLORS['reset']} Created frontend/.env from frontend/.env.example")

    return python_bin


def stream_logs(pipe, prefix):
    """Read lines from subprocess pipe and write with colored prefix."""
    color = COLORS.get(prefix, "")
    reset = COLORS["reset"]
    for line in iter(pipe.readline, b""):
        decoded_line = line.decode("utf-8", errors="replace")
        if decoded_line.strip():
            sys.stdout.write(f"{color}[{prefix}]{reset} {decoded_line}")
        else:
            sys.stdout.write(decoded_line)
        sys.stdout.flush()


def run_process(name, cmd, cwd=None, env_vars=None):
    """Start a background process and stream its logs in a separate thread."""
    env = os.environ.copy()
    if env_vars:
        env.update(env_vars)

    proc = subprocess.Popen(
        cmd,
        cwd=cwd,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    thread = threading.Thread(target=stream_logs, args=(proc.stdout, name))
    thread.daemon = True
    thread.start()
    return proc


def run_backend(python_bin):
    """Start FastAPI via Uvicorn with reload exclusions from .gitignore."""
    abs_python = os.path.abspath(python_bin)
    cmd = [abs_python, "-m", "uvicorn", "app.main:app", "--reload", "--port", "8000", "--use-colors"]

    # Exclude standard directories and dynamically inject .gitignore patterns into watchfiles
    default_excludes = {".venv", "node_modules", "dist", ".git", "__pycache__", ".pytest_cache"}
    reload_excludes = set(default_excludes)

    gitignore_path = ".gitignore"
    if os.path.exists(gitignore_path):
        with open(gitignore_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and not line.startswith("!"):
                    pattern = line.strip("/")
                    if pattern:
                        reload_excludes.add(pattern)

    for exc in sorted(reload_excludes):
        cmd.extend(["--reload-exclude", exc])

    return run_process("backend", cmd, cwd="backend")


def run_frontend():
    """Start Vite development server."""
    if os.path.exists("frontend"):
        # FORCE_COLOR=1 forces Vite/NPM to keep ANSI colors even when piped
        return run_process(
            "frontend",
            ["npm", "run", "dev"],
            cwd="frontend",
            env_vars={"FORCE_COLOR": "1"},
        )
    return None


if __name__ == "__main__":
    print(f"\n{COLORS['system']}=== SponsorLedger Dev Server Runner ==={COLORS['reset']}")
    python_bin = check_env()

    print(f"{COLORS['system']}[system]{COLORS['reset']} Using Python: {python_bin}")
    print(f"{COLORS['system']}[system]{COLORS['reset']} Backend API:  http://localhost:8000 (Swagger docs at /docs)")
    print(f"{COLORS['system']}[system]{COLORS['reset']} Frontend App: http://localhost:5173")
    print(f"{COLORS['system']}[system]{COLORS['reset']} Press Ctrl+C to terminate both servers.\n")

    backend_proc = run_backend(python_bin)
    frontend_proc = run_frontend()

    try:
        while True:
            # Check if either process terminated unexpectedly
            if backend_proc and backend_proc.poll() is not None:
                print(f"\n{COLORS['backend']}[backend]{COLORS['reset']} Process exited with code {backend_proc.returncode}")
                break
            if frontend_proc and frontend_proc.poll() is not None:
                print(f"\n{COLORS['frontend']}[frontend]{COLORS['reset']} Process exited with code {frontend_proc.returncode}")
                break
            time.sleep(0.5)

    except KeyboardInterrupt:
        print(f"\n{COLORS['system']}[system]{COLORS['reset']} Shutting down SponsorLedger dev servers...")

    finally:
        for p, name in [(backend_proc, "backend"), (frontend_proc, "frontend")]:
            if p and p.poll() is None:
                p.terminate()
                try:
                    p.wait(timeout=2)
                except subprocess.TimeoutExpired:
                    p.kill()
        print(f"{COLORS['system']}[system]{COLORS['reset']} All servers stopped.")
