#!/usr/bin/env python3
"""Generate cinematic cyber-noir boardroom intro video for Cyber Guardians.

Output: public/videos/background_1.mp4 (854x480, 24fps, 8s loop)

Scene: Corporate boardroom under cyber attack. Red emergency lighting,
floating monitor panels with CRITICAL BREACH alerts, digital rain,
pulsing red glow, cinematic letterbox.

Requires: Python 3.6+, ffmpeg
"""

import struct
import subprocess
import sys
import math
import random
import array
import os
import tempfile
import shutil

W = 854
H = 480
FPS = 24
DURATION = 8
TOTAL_FRAMES = FPS * DURATION
FONT_W, FONT_H = 6, 10

FONT = {
    'A': [0x3E,0x63,0x63,0x7F,0x63,0x63,0x63,0x00,0x00,0x00],
    'B': [0x7E,0x63,0x63,0x7E,0x63,0x63,0x7E,0x00,0x00,0x00],
    'C': [0x3E,0x63,0x60,0x60,0x60,0x63,0x3E,0x00,0x00,0x00],
    'D': [0x7C,0x66,0x63,0x63,0x63,0x66,0x7C,0x00,0x00,0x00],
    'E': [0x7F,0x60,0x60,0x7E,0x60,0x60,0x7F,0x00,0x00,0x00],
    'F': [0x7F,0x60,0x60,0x7E,0x60,0x60,0x60,0x00,0x00,0x00],
    'G': [0x3E,0x63,0x60,0x60,0x67,0x63,0x3F,0x00,0x00,0x00],
    'H': [0x63,0x63,0x63,0x7F,0x63,0x63,0x63,0x00,0x00,0x00],
    'I': [0x3F,0x0C,0x0C,0x0C,0x0C,0x0C,0x3F,0x00,0x00,0x00],
    'J': [0x1F,0x06,0x06,0x06,0x06,0x66,0x3C,0x00,0x00,0x00],
    'K': [0x63,0x66,0x6C,0x78,0x6C,0x66,0x63,0x00,0x00,0x00],
    'L': [0x60,0x60,0x60,0x60,0x60,0x60,0x7F,0x00,0x00,0x00],
    'M': [0x63,0x77,0x7F,0x6B,0x63,0x63,0x63,0x00,0x00,0x00],
    'N': [0x63,0x73,0x7B,0x6F,0x67,0x63,0x63,0x00,0x00,0x00],
    'O': [0x3E,0x63,0x63,0x63,0x63,0x63,0x3E,0x00,0x00,0x00],
    'P': [0x7E,0x63,0x63,0x7E,0x60,0x60,0x60,0x00,0x00,0x00],
    'Q': [0x3E,0x63,0x63,0x63,0x6B,0x66,0x3D,0x00,0x00,0x00],
    'R': [0x7E,0x63,0x63,0x7E,0x6C,0x66,0x63,0x00,0x00,0x00],
    'S': [0x3E,0x63,0x30,0x0C,0x06,0x63,0x3E,0x00,0x00,0x00],
    'T': [0x7F,0x0C,0x0C,0x0C,0x0C,0x0C,0x0C,0x00,0x00,0x00],
    'U': [0x63,0x63,0x63,0x63,0x63,0x63,0x3E,0x00,0x00,0x00],
    'V': [0x63,0x63,0x63,0x63,0x63,0x36,0x1C,0x00,0x00,0x00],
    'W': [0x63,0x63,0x63,0x6B,0x7F,0x77,0x63,0x00,0x00,0x00],
    'X': [0x63,0x63,0x36,0x1C,0x36,0x63,0x63,0x00,0x00,0x00],
    'Y': [0x63,0x63,0x36,0x1C,0x0C,0x0C,0x0C,0x00,0x00,0x00],
    'Z': [0x7F,0x06,0x0C,0x18,0x30,0x60,0x7F,0x00,0x00,0x00],
    '0': [0x3E,0x63,0x67,0x6B,0x73,0x63,0x3E,0x00,0x00,0x00],
    '1': [0x0C,0x1C,0x0C,0x0C,0x0C,0x0C,0x3F,0x00,0x00,0x00],
    '2': [0x3E,0x63,0x06,0x0C,0x30,0x60,0x7F,0x00,0x00,0x00],
    '3': [0x3E,0x63,0x06,0x1C,0x06,0x63,0x3E,0x00,0x00,0x00],
    '4': [0x0C,0x1C,0x2C,0x4C,0x7F,0x0C,0x0C,0x00,0x00,0x00],
    '5': [0x7F,0x60,0x7E,0x03,0x03,0x63,0x3E,0x00,0x00,0x00],
    '6': [0x1E,0x30,0x60,0x7E,0x63,0x63,0x3E,0x00,0x00,0x00],
    '7': [0x7F,0x03,0x06,0x0C,0x18,0x18,0x18,0x00,0x00,0x00],
    '8': [0x3E,0x63,0x63,0x3E,0x63,0x63,0x3E,0x00,0x00,0x00],
    '9': [0x3E,0x63,0x63,0x3F,0x03,0x06,0x3C,0x00,0x00,0x00],
    ':': [0x00,0x00,0x0C,0x00,0x00,0x0C,0x00,0x00,0x00,0x00],
    '.': [0x00,0x00,0x00,0x00,0x00,0x00,0x0C,0x00,0x00,0x00],
    ',': [0x00,0x00,0x00,0x00,0x00,0x0C,0x08,0x00,0x00,0x00],
    '!': [0x0C,0x0C,0x0C,0x0C,0x0C,0x00,0x0C,0x00,0x00,0x00],
    '-': [0x00,0x00,0x00,0x7F,0x00,0x00,0x00,0x00,0x00,0x00],
    '_': [0x00,0x00,0x00,0x00,0x00,0x00,0x7F,0x00,0x00,0x00],
    '/': [0x03,0x06,0x0C,0x18,0x30,0x60,0x40,0x00,0x00,0x00],
    '(': [0x06,0x0C,0x18,0x18,0x18,0x0C,0x06,0x00,0x00,0x00],
    ')': [0x60,0x30,0x18,0x18,0x18,0x30,0x60,0x00,0x00,0x00],
    ' ': [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    '+': [0x00,0x0C,0x0C,0x7F,0x0C,0x0C,0x00,0x00,0x00,0x00],
    '=': [0x00,0x00,0x7F,0x00,0x7F,0x00,0x00,0x00,0x00,0x00],
    '\'':[0x0C,0x0C,0x04,0x00,0x00,0x00,0x00,0x00,0x00,0x00],
    '#': [0x24,0x24,0x7E,0x24,0x7E,0x24,0x24,0x00,0x00,0x00],
}

PALETTE = {
    'bg': (5, 2, 12),
    'red': (255, 20, 30),
    'red_dim': (180, 10, 15),
    'red_dark': (80, 5, 8),
    'cyan': (0, 200, 255),
    'cyan_dim': (0, 120, 180),
    'white': (220, 220, 230),
    'gray': (100, 100, 120),
    'table': (15, 10, 25),
    'silhouette': (8, 4, 18),
}

ERR_MSGS = [
    "CRITICAL BREACH DETECTED",
    "DATA LEAK IN PROGRESS",
    "UNAUTHORIZED ACCESS",
    "FIREWALL COMPROMISED",
    "CLASSIFIED DATA EXPOSED",
    "MULTIPLE INTRUSIONS",
    "SYSTEM INTEGRITY LOST",
]

class Frame:
    def __init__(self):
        self.pixels = array.array('B', [0]) * (W * H * 3)

    def set_pixel(self, x, y, r, g, b):
        if 0 <= x < W and 0 <= y < H:
            idx = (y * W + x) * 3
            self.pixels[idx] = max(0, min(255, int(r)))
            self.pixels[idx+1] = max(0, min(255, int(g)))
            self.pixels[idx+2] = max(0, min(255, int(b)))

    def fill_rect(self, x1, y1, x2, y2, r, g, b):
        for y in range(max(0, y1), min(H, y2)):
            start = (y * W + max(0, x1)) * 3
            end = (y * W + min(W, x2)) * 3
            for i in range(start, end, 3):
                self.pixels[i] = int(r)
                self.pixels[i+1] = int(g)
                self.pixels[i+2] = int(b)

    def blend_rect(self, x1, y1, x2, y2, r, g, b, alpha):
        a = max(0, min(1, alpha))
        for y in range(max(0, y1), min(H, y2)):
            for x in range(max(0, x1), min(W, x2)):
                idx = (y * W + x) * 3
                self.pixels[idx] = int(self.pixels[idx] * (1-a) + r * a)
                self.pixels[idx+1] = int(self.pixels[idx+1] * (1-a) + g * a)
                self.pixels[idx+2] = int(self.pixels[idx+2] * (1-a) + b * a)

    def vgradient(self, r1, g1, b1, r2, g2, b2):
        for y in range(H):
            t = y / H
            r = r1 * (1-t) + r2 * t
            g = g1 * (1-t) + g2 * t
            b = b1 * (1-t) + b2 * t
            start = y * W * 3
            end = start + W * 3
            for i in range(start, end, 3):
                self.pixels[i] = int(r)
                self.pixels[i+1] = int(g)
                self.pixels[i+2] = int(b)

    def vgradient_range(self, y1, y2, r1, g1, b1, r2, g2, b2):
        for y in range(max(0, y1), min(H, y2)):
            t = (y - y1) / max(1, y2 - y1)
            r = r1 * (1-t) + r2 * t
            g = g1 * (1-t) + g2 * t
            b = b1 * (1-t) + b2 * t
            start = y * W * 3
            end = start + W * 3
            for i in range(start, end, 3):
                self.pixels[i] = int(r)
                self.pixels[i+1] = int(g)
                self.pixels[i+2] = int(b)

    def vignette(self, strength=0.5):
        cx, cy = W//2, H//2
        max_dist = math.sqrt(cx*cx + cy*cy)
        for y in range(H):
            for x in range(W):
                dx = x - cx
                dy = y - cy
                d = math.sqrt(dx*dx + dy*dy) / max_dist
                dark = min(1, d * strength)
                idx = (y * W + x) * 3
                self.pixels[idx] = int(self.pixels[idx] * (1 - dark))
                self.pixels[idx+1] = int(self.pixels[idx+1] * (1 - dark))
                self.pixels[idx+2] = int(self.pixels[idx+2] * (1 - dark))

    def draw_char(self, x, y, ch, r, g, b, scale=1):
        if ch not in FONT:
            return
        glyph = FONT[ch]
        for row in range(FONT_H):
            if row >= len(glyph):
                break
            mask = glyph[row]
            for col in range(FONT_W):
                if mask & (1 << (FONT_W - 1 - col)):
                    for sy in range(scale):
                        for sx in range(scale):
                            self.set_pixel(x + col*scale + sx, y + row*scale + sy, r, g, b)

    def draw_string(self, x, y, s, r, g, b, scale=1, spacing=1):
        for i, ch in enumerate(s):
            px = x + i * ((FONT_W + spacing) * scale)
            self.draw_char(px, y, ch, r, g, b, scale)

    def draw_string_center(self, y, s, r, g, b, scale=1, spacing=1):
        pw = len(s) * ((FONT_W + spacing) * scale)
        x = (W - pw) // 2
        self.draw_string(x, y, s, r, g, b, scale, spacing)

    def glow_text(self, x, y, s, r, g, b, scale=1, spacing=1, glow_size=6):
        for gs in range(glow_size, 0, -1):
            a = 0.3 / gs
            for i, ch in enumerate(s):
                px = x + i * ((FONT_W + spacing) * scale)
                self.draw_char(px - gs, y, ch, r*a, g*a, b*a, scale)
                self.draw_char(px + gs, y, ch, r*a, g*a, b*a, scale)
        self.draw_string(x, y, s, r, g, b, scale, spacing)

    def glow_text_center(self, y, s, r, g, b, scale=1, spacing=1, glow_size=6):
        pw = len(s) * ((FONT_W + spacing) * scale)
        x = (W - pw) // 2
        self.glow_text(x, y, s, r, g, b, scale, spacing, glow_size)

    def get_bytes(self):
        return self.pixels.tobytes()


class Monitor:
    def __init__(self, x, y, w, h, label, anim_phase=0):
        self.x = x
        self.y = y
        self.w = w
        self.h = h
        self.label = label
        self.phase = anim_phase
        self.glitch_timer = random.uniform(0, 1)

    def draw(self, frame, t):
        glitch = random.random() < 0.02
        scan_offset = int(math.sin(t * 3 + self.phase) * 2)

        frame.blend_rect(self.x-3, self.y-3, self.x+self.w+3, self.y+self.h+3, 30, 40, 80, 0.8)

        bg_r, bg_g, bg_b = 2, 5, 15
        frame.fill_rect(self.x, self.y, self.x+self.w, self.y+self.h, bg_r, bg_g, bg_b)

        border_color = PALETTE['cyan_dim'] if self.label == "MAIN" else PALETTE['red_dim']
        frame.fill_rect(self.x, self.y, self.x+self.w, self.y+2, *border_color)
        frame.fill_rect(self.x, self.y+self.h-2, self.x+self.w, self.y+self.h, *border_color)
        frame.fill_rect(self.x, self.y, self.x+2, self.y+self.h, *border_color)
        frame.fill_rect(self.x+self.w-2, self.y, self.x+self.w, self.y+self.h, *border_color)

        if glitch:
            glitch_y = self.y + random.randint(0, self.h-4)
            glitch_h = random.randint(2, 8)
            frame.fill_rect(self.x+2, glitch_y, self.x+self.w-2, glitch_y+glitch_h,
                          random.randint(0, 255), random.randint(0, 255), random.randint(0, 255))

        scan_y = self.y + 4 + scan_offset
        frame.blend_rect(self.x+2, scan_y, self.x+self.w-2, scan_y+1, 255, 255, 255, 0.03)

        frame.blend_rect(self.x+2, self.y+2, self.x+self.w-2, self.y+self.h-2,
                      0, 0, 0, 0.4)

        label_scale = 1
        lx = self.x + (self.w - len(self.label) * ((FONT_W+1) * label_scale)) // 2
        ly = self.y + self.h - 20
        frame.draw_string(lx, ly, self.label, 100, 100, 120, label_scale, 1)


def digital_rain(frame, x, y, w, h, t, seed=0):
    random.seed(seed + int(t * 10))
    cols = w // 10
    for c in range(cols):
        col_x = x + c * 10 + 2
        rain_y = int((t * 80 + c * 17) % (h - 20)) + y + 5
        for i in range(6):
            ry = rain_y - i * 10
            if y < ry < y + h:
                alpha = 0.7 - i * 0.1
                bright = int(200 * (1 - i/6))
                frame.blend_rect(col_x, ry, col_x+6, ry+2, 0, bright, bright, alpha)
    random.seed()


def draw_scene(frame, t):
    t_cycle = t

    frame.vgradient(8, 3, 18, 3, 1, 10)

    pulse = 0.5 + 0.5 * math.sin(t_cycle * 1.5)
    red_pulse = PALETTE['red_dark'][0] * (0.3 + 0.7 * pulse)
    frame.blend_rect(0, 0, W, 150, red_pulse, PALETTE['red_dark'][1]*pulse, PALETTE['red_dark'][2]*pulse, 0.3)

    frame.blend_rect(80, 250, 770, 390, *PALETTE['table'], 0.5)
    frame.vgradient_range(250, 390, 20, 12, 35, 5, 3, 12)

    frame.fill_rect(0, 370, W, 390, *PALETTE['table'])
    frame.blend_rect(0, 385, W, 390, *PALETTE['red_dim'], 0.15 * pulse)

    table_glow = 0.4 + 0.4 * pulse
    frame.blend_rect(100, 375, 750, 390, *PALETTE['red'], 0.05 * table_glow)

    monitors = [
        Monitor(60, 50, 220, 160, "MAIN", 0),
        Monitor(310, 70, 180, 120, "SECTOR-4", 1.5),
        Monitor(520, 60, 160, 110, "NET-SCAN", 0.7),
        Monitor(710, 80, 120, 90, "FIREWALL", 2.1),
    ]

    for i, m in enumerate(monitors):
        m.draw(frame, t_cycle + i * 0.3)

    digital_rain(frame, 65, 55, 210, 150, t_cycle, 42)

    frame.draw_string(320, 80, "DATA LEAK", *PALETTE['red'], 1, 1)
    frame.draw_string(320, 95, "ACTIVE", *PALETTE['red'], 1, 1)

    frame.draw_string(530, 68, "THREATS:", *PALETTE['cyan'], 1, 1)
    num_threats = 12 + int(math.sin(t_cycle * 0.7) * 5)
    threat_str = f"{num_threats:03d}"
    frame.draw_string(530, 82, threat_str, *PALETTE['red'], 1, 1)

    frame.draw_string(715, 88, "STATUS:", *PALETTE['gray'], 1, 1)
    status_y = 102
    status_text = "DOWN" if int(t_cycle * 2) % 2 else "LOST"
    if int(t_cycle * 3) % 4 == 0:
        status_text = "???  "
    frame.draw_string(715, status_y, status_text, *PALETTE['red'], 1, 1)

    frame.blend_rect(0, 130, W, 250, *PALETTE['red'], 0.02 * pulse)

    # silhoutte of manager
    sil_x = W // 2 - 60
    sil_y = 200
    frame.fill_rect(sil_x, sil_y, sil_x+120, sil_y+160, *PALETTE['silhouette'])
    # head
    frame.fill_rect(sil_x+30, sil_y-30, sil_x+90, sil_y+10, *PALETTE['silhouette'])
    # shoulders
    frame.fill_rect(sil_x-20, sil_y+20, sil_x+140, sil_y+40, *PALETTE['silhouette'])

    # tablet glow
    tablet_pulse = 0.3 + 0.7 * (0.5 + 0.5 * math.sin(t_cycle * 2.5))
    frame.blend_rect(sil_x+70, sil_y+60, sil_x+110, sil_y+120, 0, 200, 255, 0.1 * tablet_pulse)

    msg_idx = int(t_cycle * 0.8) % len(ERR_MSGS)
    msg = ERR_MSGS[msg_idx]
    msg_scale = 1
    msg_y = 420
    msg_glow = 0.4 + 0.6 * (0.5 + 0.5 * math.sin(t_cycle * 2))
    frame.glow_text_center(msg_y, msg,
                          int(PALETTE['red'][0] * (0.5 + 0.5 * pulse)),
                          int(PALETTE['red'][1] * (0.5 + 0.5 * pulse)),
                          int(PALETTE['red'][2] * (0.5 + 0.5 * pulse)),
                          msg_scale, 1, 4)

    # letterbox
    frame.fill_rect(0, 0, W, 40, 0, 0, 0)
    frame.fill_rect(0, H-40, W, H, 0, 0, 0)

    frame.vignette(0.6)


def main():
    out_path = os.path.join(os.path.dirname(os.path.dirname(__file__)),
                           'public', 'videos', 'background_1.mp4')

    ffmpeg = subprocess.Popen([
        'ffmpeg', '-y', '-f', 'rawvideo',
        '-vcodec', 'rawvideo', '-s', f'{W}x{H}',
        '-pix_fmt', 'rgb24', '-r', str(FPS),
        '-i', '-', '-an',
        '-vf', 'vflip',
        '-c:v', 'libx264', '-preset', 'medium',
        '-crf', '23', '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        out_path
    ], stdin=subprocess.PIPE)

    random.seed(42)

    for frame_idx in range(TOTAL_FRAMES):
        t = frame_idx / FPS
        frame = Frame()
        draw_scene(frame, t)

        try:
            ffmpeg.stdin.write(frame.get_bytes())
        except BrokenPipeError:
            print("ffmpeg pipe broken", file=sys.stderr)
            break

        if frame_idx % (FPS * 2) == 0:
            pct = frame_idx * 100 // TOTAL_FRAMES
            print(f"\r  Rendering: {pct}%", file=sys.stderr, end='', flush=True)

    ffmpeg.stdin.close()
    ffmpeg.wait()
    print(f"\r  Rendering: 100%", file=sys.stderr)
    print(f"  Output: {os.path.abspath(out_path)}", file=sys.stderr)


if __name__ == '__main__':
    main()
