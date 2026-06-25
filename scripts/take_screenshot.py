import subprocess
import os

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
out_path = r"C:\Users\somne\Documents\Furious5\stitch-assets\landing_page.png"
cmd = [
    edge_path, 
    "--headless", 
    "--disable-gpu", 
    "--incognito",
    "--disable-cache",
    "--virtual-time-budget=5000",
    "--window-size=1280,800",
    f"--screenshot={out_path}", 
    "http://localhost:5000"
]

print("Running Edge...")
res = subprocess.run(cmd, capture_output=True, text=True)
print("Return code:", res.returncode)
print("Stdout:", res.stdout)
print("Stderr:", res.stderr)
print("Checking if screenshot was created...")
if os.path.exists(out_path):
    print("Screenshot successfully created at:", out_path)
else:
    print("Screenshot file was NOT created at:", out_path)
    # Check current directory
    print("Files in current directory:")
    print(os.listdir("."))
