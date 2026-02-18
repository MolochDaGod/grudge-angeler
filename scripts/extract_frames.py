#!/usr/bin/env python3
"""
Extract individual frames from creature sprite sheets and remove backgrounds
using flood-fill from corners. This preserves dark creature details while
removing the dark background.
"""
from PIL import Image
import os
from collections import deque

CREATURES_DIR = "client/public/assets/creatures"
FRAME_HEIGHT = 48

COLOR_THRESHOLD = 50

def color_distance(c1, c2):
    return sum((a - b) ** 2 for a, b in zip(c1[:3], c2[:3])) ** 0.5

def flood_fill_background(img, threshold=COLOR_THRESHOLD):
    width, height = img.size
    pixels = img.load()
    visited = [[False] * height for _ in range(width)]
    bg_pixels = set()

    corners = [
        (0, 0), (width-1, 0), (0, height-1), (width-1, height-1),
        (width//4, 0), (width*3//4, 0), (width//4, height-1), (width*3//4, height-1),
        (0, height//4), (0, height*3//4), (width-1, height//4), (width-1, height*3//4),
    ]

    bg_samples = []
    for cx, cy in corners:
        if 0 <= cx < width and 0 <= cy < height:
            bg_samples.append(pixels[cx, cy][:3] if img.mode == 'RGBA' else pixels[cx, cy])

    if not bg_samples:
        return img

    avg_bg = tuple(sum(c[i] for c in bg_samples) // len(bg_samples) for i in range(3))

    queue = deque()
    for cx, cy in corners:
        if 0 <= cx < width and 0 <= cy < height:
            px = pixels[cx, cy][:3] if img.mode == 'RGBA' else px if isinstance((px := pixels[cx, cy]), tuple) else (px, px, px)
            if color_distance(px, avg_bg) < threshold:
                queue.append((cx, cy))
                visited[cx][cy] = True
                bg_pixels.add((cx, cy))

    for x in range(width):
        for y in [0, height-1]:
            if not visited[x][y]:
                px = pixels[x, y]
                if img.mode == 'RGBA':
                    px = px[:3]
                elif not isinstance(px, tuple):
                    px = (px, px, px)
                if color_distance(px, avg_bg) < threshold:
                    queue.append((x, y))
                    visited[x][y] = True
                    bg_pixels.add((x, y))

    for y in range(height):
        for x in [0, width-1]:
            if not visited[x][y]:
                px = pixels[x, y]
                if img.mode == 'RGBA':
                    px = px[:3]
                elif not isinstance(px, tuple):
                    px = (px, px, px)
                if color_distance(px, avg_bg) < threshold:
                    queue.append((x, y))
                    visited[x][y] = True
                    bg_pixels.add((x, y))

    while queue:
        x, y = queue.popleft()
        for dx, dy in [(-1,0),(1,0),(0,-1),(0,1),(-1,-1),(1,-1),(-1,1),(1,1)]:
            nx, ny = x + dx, y + dy
            if 0 <= nx < width and 0 <= ny < height and not visited[nx][ny]:
                visited[nx][ny] = True
                px = pixels[nx, ny]
                if img.mode == 'RGBA':
                    px_rgb = px[:3]
                elif not isinstance(px, tuple):
                    px_rgb = (px, px, px)
                else:
                    px_rgb = px[:3]
                if color_distance(px_rgb, avg_bg) < threshold:
                    bg_pixels.add((nx, ny))
                    queue.append((nx, ny))

    result = img.convert('RGBA')
    result_pixels = result.load()
    for x, y in bg_pixels:
        result_pixels[x, y] = (0, 0, 0, 0)

    edge_pixels = set()
    for x, y in bg_pixels:
        for dx, dy in [(-1,0),(1,0),(0,-1),(0,1)]:
            nx, ny = x + dx, y + dy
            if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in bg_pixels:
                edge_pixels.add((nx, ny))

    for x, y in edge_pixels:
        r, g, b, a = result_pixels[x, y]
        result_pixels[x, y] = (r, g, b, max(0, a - 80))

    return result

def process_creature(creature_id):
    creature_dir = os.path.join(CREATURES_DIR, str(creature_id))
    walk_path = os.path.join(creature_dir, "Walk.png")

    if not os.path.exists(walk_path):
        print(f"  Creature {creature_id}: Walk.png not found, skipping")
        return

    img = Image.open(walk_path)
    if img.mode == 'P':
        img = img.convert('RGBA')
    elif img.mode == 'RGB':
        img = img.convert('RGBA')

    width, height = img.size
    frame_w = FRAME_HEIGHT
    num_frames = width // frame_w

    print(f"  Creature {creature_id}: {width}x{height}, {num_frames} frames of {frame_w}x{height}")

    frames_dir = os.path.join(creature_dir, "frames")
    os.makedirs(frames_dir, exist_ok=True)

    for i in range(num_frames):
        left = i * frame_w
        frame = img.crop((left, 0, left + frame_w, height))
        cleaned = flood_fill_background(frame)
        out_path = os.path.join(frames_dir, f"{i+1}.png")
        cleaned.save(out_path, "PNG")
        print(f"    Frame {i+1} saved: {out_path}")

    return num_frames

if __name__ == "__main__":
    print("=== Extracting and cleaning creature frames ===\n")

    results = {}
    for creature_id in range(1, 16):
        print(f"\nProcessing creature {creature_id}...")
        n = process_creature(creature_id)
        if n:
            results[creature_id] = n

    print("\n=== Summary ===")
    for cid, nframes in sorted(results.items()):
        print(f"  Creature {cid}: {nframes} frames extracted")
    print("\nDone!")
