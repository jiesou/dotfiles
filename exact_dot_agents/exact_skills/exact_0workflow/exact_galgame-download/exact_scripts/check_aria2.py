#!/usr/bin/env python3
"""Monitor aria2 downloads on casaos server. Run on casaos itself.

Usage: python3 check_aria2.py [--once] [--gid GID1 GID2 ...]

Without --once, polls every 30s until all downloads complete.
GIDs default to the ATRI download set; pass custom GIDs as needed.
"""
import json, subprocess, time, sys

RPC = "http://127.0.0.1:6800/jsonrpc"
SECRET = "aea8nIqYT"

DEFAULT_GIDS = [
    "cf745a7eade34cfa","e47f26fca63bdcba","1f8139c17b35c57d",
    "4827bd1b5b821259","88399682583354ac","98f6192afa29c129"
]

def check_gids(gids):
    active = 0
    for gid in gids:
        payload = json.dumps({
            "jsonrpc": "2.0", "method": "aria2.tellStatus", "id": 1,
            "params": [f"token:{SECRET}", gid,
                ["gid","status","completedLength","totalLength",
                 "downloadSpeed","errorCode","errorMessage"]]
        })
        r = subprocess.run(
            ["curl","-s","-X","POST",RPC,
             "-H","Content-Type: application/json","-d",payload],
            capture_output=True, text=True)
        d = json.loads(r.stdout)
        res = d.get("result", {})
        st = res.get("status", "?")
        cl = int(res.get("completedLength", 0)) // 1048576
        tl = int(res.get("totalLength", 0)) // 1048576
        sp = int(res.get("downloadSpeed", 0))
        ec = res.get("errorCode", "-")
        em = res.get("errorMessage", "")
        pct = f"{cl*100//tl}%" if tl > 0 else "?"
        print(f"  {gid[:8]} | {st:9s} | {cl:4d}/{tl:4d}MB ({pct:>3s}) | {sp//1024:3d}KB/s | err={ec} {em}")
        if st == "active":
            active += 1
    return active

def main():
    once = "--once" in sys.argv
    gid_args = [a for a in sys.argv[1:] if a != "--once"]
    gids = gid_args if gid_args else DEFAULT_GIDS

    while True:
        print(f"\n--- {time.strftime('%H:%M:%S')} ---")
        active = check_gids(gids)
        if active == 0:
            print("\nAll downloads finished!")
            break
        if once:
            break
        time.sleep(30)

if __name__ == "__main__":
    main()
