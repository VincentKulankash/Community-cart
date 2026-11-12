# OWNER: VINCENT (Scrum Master / Offers Engine)
# TASKS:
# 1. Validate an offer (deadline not passed, not owner, etc.).
# 2. Find highest offer (tie-break by earliest).
# 3. Close auction and set winner.
# 4. Trigger outbid emails via Mailtrap.
# RULES:
# - Email failures must be logged, never block the offer submission.
# - Keep pure business logic here; routes should call these functions.

# Vincent will fill this in