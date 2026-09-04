#!/usr/bin/env bash
#
# Configure the kobisbhd.com role addresses.
#
#   Cloudflare Email Routing  — receives mail and forwards it to a Gmail inbox.
#   Brevo senders (optional)  — lets the same addresses be used as "from".
#
# Re-running is safe: existing destinations, rules and senders are left alone.
# See docs/email-routing.md for why forwarding lives in Cloudflare, not Brevo.
#
# Required:
#   CLOUDFLARE_API_TOKEN   token with Email Routing Rules:Edit + Email Routing
#                          Addresses:Edit (account scope covers both)
#   CLOUDFLARE_ACCOUNT_ID  Cloudflare account id
#   CLOUDFLARE_ZONE_ID     zone id for kobisbhd.com
# Optional:
#   BREVO_API_KEY          adds the addresses as Brevo senders as well

set -euo pipefail

# address                      destination                  label
ROUTES=(
  "pengerusi@kobisbhd.com|zaiwin@gmail.com|Pengerusi"
  "setiausaha@kobisbhd.com|wanrabbul.kobis@gmail.com|Setiausaha"
)

CF_API="https://api.cloudflare.com/client/v4"
BREVO_API="https://api.brevo.com/v3"

for var in CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID CLOUDFLARE_ZONE_ID; do
  if [ -z "${!var:-}" ]; then
    echo "error: $var is not set" >&2
    exit 1
  fi
done

cf() {
  # cf METHOD PATH [BODY]
  local method="$1" path="$2" body="${3:-}"
  if [ -n "$body" ]; then
    curl -sS -X "$method" "$CF_API$path" \
      -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
      -H "Content-Type: application/json" \
      --data "$body"
  else
    curl -sS -X "$method" "$CF_API$path" \
      -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"
  fi
}

# Reads a JSON response on stdin and prints "ok" or "fail: <messages>".
cf_status() {
  python3 -c '
import json, sys
try:
    d = json.load(sys.stdin)
except Exception as e:
    print("fail: unreadable response (%s)" % e); sys.exit()
if d.get("success"):
    print("ok")
else:
    msgs = "; ".join(str(e.get("message", e)) for e in d.get("errors", [])) or "unknown error"
    print("fail: " + msgs)
'
}

echo "==> Cloudflare: destination addresses"
for route in "${ROUTES[@]}"; do
  IFS='|' read -r _addr dest _label <<< "$route"

  existing=$(cf GET "/accounts/$CLOUDFLARE_ACCOUNT_ID/email/routing/addresses?per_page=100")
  state=$(printf '%s' "$existing" | python3 -c '
import json, sys
dest = sys.argv[1]
d = json.load(sys.stdin)
for a in d.get("result") or []:
    if a.get("email") == dest:
        print("verified" if a.get("verified") else "unverified"); break
else:
    print("missing")
' "$dest")

  case "$state" in
    verified)   echo "    $dest — already verified" ;;
    unverified) echo "    $dest — exists, NOT yet verified (owner must click the Cloudflare email)" ;;
    missing)
      result=$(cf POST "/accounts/$CLOUDFLARE_ACCOUNT_ID/email/routing/addresses" \
        "$(python3 -c 'import json,sys; print(json.dumps({"email": sys.argv[1]}))' "$dest")")
      echo "    $dest — created: $(printf '%s' "$result" | cf_status)"
      echo "      a verification email was sent; the rule stays inactive until it is clicked"
      ;;
  esac
done

echo "==> Cloudflare: routing rules"
rules=$(cf GET "/zones/$CLOUDFLARE_ZONE_ID/email/routing/rules?per_page=100")

for route in "${ROUTES[@]}"; do
  IFS='|' read -r addr dest label <<< "$route"

  if printf '%s' "$rules" | python3 -c '
import json, sys
addr = sys.argv[1]
d = json.load(sys.stdin)
for r in d.get("result") or []:
    for m in r.get("matchers") or []:
        if m.get("field") == "to" and (m.get("value") or "").lower() == addr.lower():
            sys.exit(0)
sys.exit(1)
' "$addr"; then
    echo "    $addr — rule already exists, leaving it alone"
    continue
  fi

  body=$(python3 -c '
import json, sys
addr, dest, label = sys.argv[1], sys.argv[2], sys.argv[3]
print(json.dumps({
    "name": "%s -> %s" % (label, dest),
    "enabled": True,
    "matchers": [{"type": "literal", "field": "to", "value": addr}],
    "actions": [{"type": "forward", "value": [dest]}],
}))
' "$addr" "$dest" "$label")

  result=$(cf POST "/zones/$CLOUDFLARE_ZONE_ID/email/routing/rules" "$body")
  echo "    $addr -> $dest — $(printf '%s' "$result" | cf_status)"
done

if [ -z "${BREVO_API_KEY:-}" ]; then
  echo "==> Brevo: skipped (BREVO_API_KEY not set)"
else
  echo "==> Brevo: senders"
  senders=$(curl -sS "$BREVO_API/senders" -H "api-key: $BREVO_API_KEY")

  for route in "${ROUTES[@]}"; do
    IFS='|' read -r addr _dest label <<< "$route"

    if printf '%s' "$senders" | python3 -c '
import json, sys
addr = sys.argv[1]
d = json.load(sys.stdin)
for s in d.get("senders") or []:
    if (s.get("email") or "").lower() == addr.lower():
        sys.exit(0)
sys.exit(1)
' "$addr" 2>/dev/null; then
      echo "    $addr — already a sender"
      continue
    fi

    body=$(python3 -c '
import json, sys
print(json.dumps({"name": sys.argv[1], "email": sys.argv[2]}))
' "$label KOBIS" "$addr")

    result=$(curl -sS -X POST "$BREVO_API/senders" \
      -H "api-key: $BREVO_API_KEY" \
      -H "Content-Type: application/json" \
      --data "$body")
    echo "    $addr — $(printf '%s' "$result" | python3 -c '
import json, sys
try:
    d = json.load(sys.stdin)
except Exception:
    print("created"); sys.exit()
if "id" in d:
    print("created (id %s); verification email sent" % d["id"])
else:
    print("fail: %s" % d.get("message", d))
')"
  done
fi

echo
echo "Done. Remaining manual steps:"
echo "  1. Both Gmail owners click their Cloudflare verification link."
echo "  2. Send a test message to each address from an outside account."
echo "  3. Publish the Brevo DKIM record — see docs/email-routing.md section 3."
