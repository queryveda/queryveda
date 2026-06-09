#!/usr/bin/env python3
"""Run the SQL practice tool.  Usage:  python3 run.py"""
import http.server, os, threading, webbrowser

PORT = 8000
os.chdir(os.path.dirname(os.path.abspath(__file__)))
url = f"http://localhost:{PORT}/index.html"
print(f"Serving SQL practice at {url}\nPress Ctrl+C to stop.")
threading.Timer(1.0, lambda: webbrowser.open(url)).start()
try:
    http.server.HTTPServer(("", PORT), http.server.SimpleHTTPRequestHandler).serve_forever()
except KeyboardInterrupt:
    print("\nStopped.")
