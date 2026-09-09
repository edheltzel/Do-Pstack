#!/bin/zsh
set -e
cd /Users/ed/Developer/pstack-for-pi
PROMPT=$(cat .tmp-fm320-ponytail/prompt.txt)
: > .tmp-fm320-ponytail/out.txt
: > .tmp-fm320-ponytail/err.txt
echo "START $(date -u +%Y-%m-%dT%H:%M:%SZ) prompt_len=${#PROMPT} model=openai-codex/gpt-6-astra thinking=high tools=read,bash" > .tmp-fm320-ponytail/meta.txt
/Users/ed/.bun/bin/pi -p --no-session --approve \
  --provider openai-codex --model gpt-6-astra --thinking high \
  --tools read,bash --exclude-tools write,edit \
  "$PROMPT" \
  > .tmp-fm320-ponytail/out.txt 2>> .tmp-fm320-ponytail/err.txt
EC=$?
echo "PI_EXIT=$EC" | tee .tmp-fm320-ponytail/exit.txt
echo "END $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> .tmp-fm320-ponytail/meta.txt
wc -c .tmp-fm320-ponytail/out.txt .tmp-fm320-ponytail/err.txt >> .tmp-fm320-ponytail/meta.txt
exit $EC
