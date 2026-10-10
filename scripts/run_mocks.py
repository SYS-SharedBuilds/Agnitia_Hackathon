import os
import subprocess
import sys
import time

ports = [
    ("oms", 8101),
    ("inventory", 8102),
    ("network", 8103),
    ("billing", 8104),
    ("notification", 8105),
]

procs = []
for system, port in ports:
    env = dict(os.environ)
    env["SYSTEM"] = system
    env["PORT"] = str(port)
    p = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "services.mocks.app:app", "--host", "0.0.0.0", "--port", str(port)],
        env=env,
    )
    procs.append(p)
    print(f"Started mock-{system} on port {port}")

try:
    while True:
        time.sleep(1)
finally:
    for p in procs:
        p.terminate()
