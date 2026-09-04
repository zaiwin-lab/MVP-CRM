# kobisbhd.com — role address routing

Runbook for the two role addresses and where their mail goes.

| Address | Forwards to | Purpose |
|---|---|---|
| `pengerusi@kobisbhd.com` | `zaiwin@gmail.com` | Chairman |
| `setiausaha@kobisbhd.com` | `wanrabbul.kobis@gmail.com` | Secretary |

## Why the forwarding is not done in Brevo

Brevo does not host mailboxes and has no forwarding feature. Its only inbound
capability is **Inbound Parsing**: mail is received, converted to JSON and POSTed
to a webhook you host — it is never delivered to a person's inbox. Turning that
into "arrives in Gmail" would mean writing and hosting a service that re-sends
every message through the transactional API.

It also cannot serve these two addresses as written. Brevo's inbound parsing
requires the MX records of the receiving domain to point at
`inbound1.sendinblue.com` / `inbound2.sendinblue.com`, and Brevo documents it for
a **subdomain** (`reply.kobisbhd.com`). Pointing the apex `kobisbhd.com` MX at
Brevo would take inbound mail away from Cloudflare and break every existing
address on the domain.

`kobisbhd.com` already runs **Cloudflare Email Routing**, which does custom
address → external inbox forwarding natively:

```
MX  kobisbhd.com  →  route1.mx.cloudflare.net (41)
                     route2.mx.cloudflare.net (26)
                     route3.mx.cloudflare.net (33)
NS  aiden.ns.cloudflare.com / joyce.ns.cloudflare.com
```

So: **receiving is Cloudflare's job, sending is Brevo's job.** The two are
independent and both are already partly configured.

## 1. Receiving — Cloudflare Email Routing

Dashboard: **Cloudflare → kobisbhd.com → Email → Email Routing**.

1. **Destination addresses** tab → add `zaiwin@gmail.com` and
   `wanrabbul.kobis@gmail.com`. Each owner must click the verification link
   Cloudflare emails them. A rule cannot forward to an unverified address.
2. **Routing rules** tab → **Create address**:
   - `pengerusi` → action *Send to an email* → `zaiwin@gmail.com`
   - `setiausaha` → action *Send to an email* → `wanrabbul.kobis@gmail.com`
3. Send a test message to each address from an outside account.

`scripts/setup-kobis-email.sh` performs steps 1 and 2 against the API.

Forwarding preserves the original `From:`, so replies from Gmail default to
going *from* the Gmail account, not from the role address. To reply as the role
address, add it in Gmail under **Settings → Accounts → Send mail as**, using
Brevo's SMTP relay (`smtp-relay.brevo.com:587`) with an SMTP key as the
credentials.

## 2. Sending — Brevo senders

Adding the addresses in Brevo is what makes them usable as *from* addresses in
campaigns and transactional mail. **Brevo → Senders, Domains & Dedicated IPs →
Senders → Add a sender**, for both addresses. Brevo emails a verification link
to each — which only arrives once step 1 is live, so do the Cloudflare side
first.

## 3. Outstanding: Brevo DKIM is not published

Domain authentication for `kobisbhd.com` is incomplete. Present:

```
TXT  kobisbhd.com    brevo-code:ea8f51016cae3d4b2f406fb1b750a589
TXT  kobisbhd.com    v=spf1 include:_spf.mx.cloudflare.net include:spf.brevo.com ~all
TXT  _dmarc          v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com
```

Missing: the Brevo DKIM record (`brevo._domainkey` / `mail._domainkey` — Brevo
shows the exact host and value on its domain authentication page). Without it,
mail sent through Brevo is signed by no key of ours and DMARC alignment rests on
SPF alone, which breaks whenever a message is forwarded. Publish the DKIM record
Brevo provides, then tighten DMARC from `p=none` to `p=quarantine` once the
`rua` reports come back clean.

## Alternative, if replies must reach the CRM

If the goal later becomes *capture* rather than *deliver* — logging replies
against contact records — that is the Brevo Inbound Parsing case, on a separate
subdomain so it cannot disturb the routing above:

```
MX  reply.kobisbhd.com  →  inbound1.sendinblue.com (10)
                           inbound2.sendinblue.com (20)
```

plus a webhook endpoint registered via `POST /v3/webhooks` with `type: inbound`.
That is a separate build and is deliberately not part of this change.
