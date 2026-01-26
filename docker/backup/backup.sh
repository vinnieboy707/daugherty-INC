#!/bin/bash
# Automated backup script for MongoDB and uploaded files

set -e

BACKUP_DIR="/backup/$(date +%Y%m%d_%H%M%S)"
MONGO_HOST="mongodb"
MONGO_PORT="27017"

echo "Starting backup process..."
echo "Backup directory: $BACKUP_DIR"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup MongoDB
echo "Backing up MongoDB database..."
mongodump \
  --host="$MONGO_HOST" \
  --port="$MONGO_PORT" \
  --username="$MONGO_USER" \
  --password="$MONGO_PASSWORD" \
  --authenticationDatabase=admin \
  --db=daugherty-inc \
  --out="$BACKUP_DIR/mongodb" \
  --gzip

if [ $? -eq 0 ]; then
  echo "✓ MongoDB backup completed successfully"
else
  echo "✗ MongoDB backup failed"
  exit 1
fi

# Backup uploaded files
echo "Backing up uploaded files..."
if [ -d "/uploads" ]; then
  cp -r /uploads "$BACKUP_DIR/uploads"
  echo "✓ Files backup completed successfully"
else
  echo "⚠ No uploads directory found"
fi

# Create backup manifest
cat > "$BACKUP_DIR/manifest.json" <<EOF
{
  "timestamp": "$(date -Iseconds)",
  "database": "daugherty-inc",
  "host": "$MONGO_HOST",
  "backup_type": "full",
  "size": "$(du -sh $BACKUP_DIR | cut -f1)"
}
EOF

# Compress backup
echo "Compressing backup..."
tar -czf "$BACKUP_DIR.tar.gz" -C /backup "$(basename $BACKUP_DIR)"
rm -rf "$BACKUP_DIR"

echo "✓ Backup completed: $BACKUP_DIR.tar.gz"

# Cleanup old backups (keep last 7 days)
echo "Cleaning up old backups..."
find /backup -name "*.tar.gz" -mtime +7 -delete

echo "Backup process complete!"
