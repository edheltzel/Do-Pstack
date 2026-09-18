# FM-528 — Do-Pstack / omp first-surface demo for README stills/GIF
# Shear bar (must appear for real; do not fake):
#   1) omp plugin doctor → green
#   2) /poteto-mode → 🍠 poteto: ✓ on
#   3) a do-* skill visible under /  (e.g. /skill:do-how)
# Host: BigMac with omp + pstack loaded (marketplace or `omp plugin link` from Do-Pstack).
# Render: mkdir -p /tmp/pstack-vhs && vhs /path/to/pstack-demo.tape

Output "/tmp/pstack-vhs/pstack-demo.gif"

Require omp
Require bash

Set FontSize 18
Set Width 1200
Set Height 700
Set Padding 16
Set Theme "Catppuccin Mocha"
Set TypingSpeed 40ms
Set Shell bash

Hide
Type "mkdir -p /tmp/pstack-vhs && clear"
Enter
Sleep 400ms
Show

# --- (1) doctor green (also list proves plugin loaded) ---
Type "omp plugin list"
Enter
Sleep 1.5s

Type "omp plugin doctor"
Enter
Sleep 2.5s

# --- (2) poteto on ---
Type "omp"
Enter
Sleep 2.5s

Type "/poteto-mode"
Enter
Sleep 2.5s
# Expect status: 🍠 poteto: ✓ on

# --- (3) do-* skill under / ---
Type "/"
Sleep 1s
Type "skill:do-"
Sleep 1.8s
# Completions should include do-* skills (do-how, do-poteto-mode, …)

Backspace 20
Type "/skill:do-how"
Sleep 1.2s

Sleep 2s
Ctrl+C
Sleep 400ms
Type "exit"
Enter
Sleep 300ms
