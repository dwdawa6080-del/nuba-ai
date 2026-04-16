#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# setup-atlas.sh — Auto-create a free MongoDB Atlas M0 cluster via Admin API
#
# Prerequisites:
#   1. Create an Atlas API key at: https://cloud.mongodb.com
#      Organisation → Access Manager → API Keys → Create API Key
#      Role: Organisation Project Creator (minimum)
#   2. Export the three variables below before running, e.g.:
#        export ATLAS_PUBLIC_KEY="abcdefgh"
#        export ATLAS_PRIVATE_KEY="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
#        export ATLAS_ORG_ID="60c72b2f9b1d8a001f8e4abc"
#   3. Run:  bash setup-atlas.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

: "${ATLAS_PUBLIC_KEY:?Set ATLAS_PUBLIC_KEY}"
: "${ATLAS_PRIVATE_KEY:?Set ATLAS_PRIVATE_KEY}"
: "${ATLAS_ORG_ID:?Set ATLAS_ORG_ID}"

PROJECT_NAME="${ATLAS_PROJECT_NAME:-nuba-ai}"
CLUSTER_NAME="${ATLAS_CLUSTER_NAME:-NubaCluster}"
DB_USER="${ATLAS_DB_USER:-nubaadmin}"
DB_PASS="${ATLAS_DB_PASS:-$(openssl rand -hex 16)}"
DB_NAME="nuba-ai"

BASE="https://cloud.mongodb.com/api/atlas/v2"
AUTH=(--user "${ATLAS_PUBLIC_KEY}:${ATLAS_PRIVATE_KEY}" --digest)
HEADERS=(-H "Accept: application/vnd.atlas.2023-01-01+json" -H "Content-Type: application/json")

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " نوبة AI — MongoDB Atlas Auto-Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── 1. Create or reuse project ────────────────────────────────────────────────
echo "▶ Looking for project '${PROJECT_NAME}'..."
PROJECT_ID=$(curl -s "${AUTH[@]}" "${HEADERS[@]}" \
  "${BASE}/groups?orgId=${ATLAS_ORG_ID}" \
  | python3 -c "
import sys, json
data = json.load(sys.stdin)
for p in data.get('results', []):
    if p['name'] == '${PROJECT_NAME}':
        print(p['id'])
        break
" 2>/dev/null || true)

if [[ -z "$PROJECT_ID" ]]; then
  echo "  → Creating project '${PROJECT_NAME}'..."
  PROJECT_ID=$(curl -s -X POST "${AUTH[@]}" "${HEADERS[@]}" \
    "${BASE}/groups" \
    -d "{\"name\":\"${PROJECT_NAME}\",\"orgId\":\"${ATLAS_ORG_ID}\"}" \
    | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
  echo "  ✅ Project created: ${PROJECT_ID}"
else
  echo "  ✅ Using existing project: ${PROJECT_ID}"
fi

# ── 2. Create free M0 cluster ─────────────────────────────────────────────────
echo "▶ Checking for cluster '${CLUSTER_NAME}'..."
CLUSTER_EXISTS=$(curl -s "${AUTH[@]}" "${HEADERS[@]}" \
  "${BASE}/groups/${PROJECT_ID}/clusters/${CLUSTER_NAME}" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print('yes' if 'name' in d else 'no')" 2>/dev/null || echo "no")

if [[ "$CLUSTER_EXISTS" == "no" ]]; then
  echo "  → Creating free M0 cluster '${CLUSTER_NAME}'..."
  curl -s -X POST "${AUTH[@]}" "${HEADERS[@]}" \
    "${BASE}/groups/${PROJECT_ID}/clusters" \
    -d "{
      \"name\": \"${CLUSTER_NAME}\",
      \"clusterType\": \"REPLICASET\",
      \"replicationSpecs\": [{
        \"regionConfigs\": [{
          \"electableSpecs\": {\"instanceSize\": \"M0\"},
          \"providerName\": \"TENANT\",
          \"backingProviderName\": \"AWS\",
          \"regionName\": \"EU_WEST_1\",
          \"priority\": 7
        }]
      }]
    }" > /dev/null
  echo "  ✅ Cluster creation initiated (takes ~3 minutes to provision)"
else
  echo "  ✅ Cluster already exists"
fi

# ── 3. Create database user ───────────────────────────────────────────────────
echo "▶ Creating database user '${DB_USER}'..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${AUTH[@]}" "${HEADERS[@]}" \
  "${BASE}/groups/${PROJECT_ID}/databaseUsers" \
  -d "{
    \"databaseName\": \"admin\",
    \"username\": \"${DB_USER}\",
    \"password\": \"${DB_PASS}\",
    \"roles\": [{\"roleName\": \"readWriteAnyDatabase\", \"databaseName\": \"admin\"}]
  }")

if [[ "$HTTP_CODE" == "201" || "$HTTP_CODE" == "200" ]]; then
  echo "  ✅ DB user created"
elif [[ "$HTTP_CODE" == "409" ]]; then
  echo "  ✅ DB user already exists (keeping existing)"
else
  echo "  ⚠️  DB user creation returned HTTP ${HTTP_CODE}"
fi

# ── 4. Whitelist 0.0.0.0/0 ───────────────────────────────────────────────────
echo "▶ Whitelisting 0.0.0.0/0 (all IPs)..."
curl -s -X POST "${AUTH[@]}" "${HEADERS[@]}" \
  "${BASE}/groups/${PROJECT_ID}/accessList" \
  -d "[{\"cidrBlock\": \"0.0.0.0/0\", \"comment\": \"Allow all — restrict in production\"}]" > /dev/null
echo "  ✅ IP access list updated"

# ── 5. Wait for cluster and fetch connection string ───────────────────────────
echo "▶ Waiting for cluster to be IDLE..."
for i in $(seq 1 30); do
  STATE=$(curl -s "${AUTH[@]}" "${HEADERS[@]}" \
    "${BASE}/groups/${PROJECT_ID}/clusters/${CLUSTER_NAME}" \
    | python3 -c "import sys,json; print(json.load(sys.stdin).get('stateName','UNKNOWN'))" 2>/dev/null || echo "UNKNOWN")
  echo "  [${i}/30] State: ${STATE}"
  if [[ "$STATE" == "IDLE" ]]; then break; fi
  sleep 10
done

SRV_HOST=$(curl -s "${AUTH[@]}" "${HEADERS[@]}" \
  "${BASE}/groups/${PROJECT_ID}/clusters/${CLUSTER_NAME}" \
  | python3 -c "
import sys, json
d = json.load(sys.stdin)
cs = d.get('connectionStrings', {}).get('standardSrv', '')
# strip mongodb+srv:// prefix to get just the host
print(cs.replace('mongodb+srv://','').strip('/') if cs else '')
" 2>/dev/null || true)

CONNECTION_STRING="mongodb+srv://${DB_USER}:${DB_PASS}@${SRV_HOST}/${DB_NAME}?retryWrites=true&w=majority"

# ── 6. Write to backend/.env ──────────────────────────────────────────────────
ENV_FILE="$(dirname "$0")/backend/.env"

if [[ -f "$ENV_FILE" ]]; then
  # Replace the MONGODB_URI line
  if grep -q "^MONGODB_URI=" "$ENV_FILE"; then
    sed -i "s|^MONGODB_URI=.*|MONGODB_URI=${CONNECTION_STRING}|" "$ENV_FILE"
  else
    echo "MONGODB_URI=${CONNECTION_STRING}" >> "$ENV_FILE"
  fi
  echo "  ✅ Updated backend/.env"
else
  echo "MONGODB_URI=${CONNECTION_STRING}" > "$ENV_FILE"
  echo "  ✅ Created backend/.env"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " ✅ Setup complete!"
echo ""
echo " Connection string:"
echo "   ${CONNECTION_STRING}"
echo ""
echo " DB User:     ${DB_USER}"
echo " DB Password: ${DB_PASS}"
echo ""
echo " ⚠️  Save the password above — it won't be shown again."
echo " ⚠️  Restrict IP access (0.0.0.0/0) before going to production."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
