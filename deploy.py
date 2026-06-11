#!/usr/bin/env python3
"""CineRealm deploy: npm install → build → git push → Vercel deploy"""
import subprocess, sys, os

PROJECT = "/home/erdogansemsiyeci/cinerealm"

def load_env():
    env_file = os.path.join(PROJECT, ".env")
    if os.path.exists(env_file):
        with open(env_file) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    if key not in os.environ:
                        os.environ[key] = val

load_env()

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
VERCEL_TOKEN = os.environ.get("VERCEL_TOKEN", "")

if not GITHUB_TOKEN or not VERCEL_TOKEN:
    print("ERROR: GITHUB_TOKEN and VERCEL_TOKEN must be set in environment or .env file")
    sys.exit(1)

def run(cmd, cwd=PROJECT, check=True):
    print(f"  RUN: {cmd}")
    r = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True)
    if r.stdout.strip():
        print(r.stdout.strip()[-1000:])
    if r.stderr.strip() and (check and r.returncode != 0):
        print("STDERR:", r.stderr.strip()[-1000:])
    if check and r.returncode != 0:
        print(f"FAILED (exit {r.returncode}): {cmd}")
        sys.exit(1)
    return r

os.chdir(PROJECT)

print("\n=== npm install ===")
run("npm install --legacy-peer-deps")

print("\n=== npm run build ===")
run("npx next build")

print("\n=== git setup ===")
run("git init")
run("git config user.email 'erdogansemsiyeci@gmail.com'")
run("git config user.name 'erdogansemsiyeci-ship-it'")
run("git add -A")
run("git diff --cached --quiet || git commit -m 'Fresh CineRealm v2'")

r = run("git remote get-url origin", check=False)
if r.returncode != 0:
    run(f"git remote add origin https://erdogansemsiyeci-ship-it:{GITHUB_TOKEN}@github.com/erdogansemsiyeci-ship-it/cinerealm.git")
else:
    run(f"git remote set-url origin https://erdogansemsiyeci-ship-it:{GITHUB_TOKEN}@github.com/erdogansemsiyeci-ship-it/cinerealm.git")

print("\n=== git push ===")
run("git push -u origin main --force")

print("\n=== Vercel deploy ===")
run(f"VERCEL_TOKEN={VERCEL_TOKEN} npx vercel --token {VERCEL_TOKEN} --prod --yes --scope ailedizimiorg-3695")

print("\n=== DONE ===")
print("CineRealm deployed to: https://cinerealm.app")
