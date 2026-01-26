#!/bin/bash
# Restore script for MongoDB and files from backup

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <backup-file.tar.gz>"
  echo "Available backups:"
  ls -lh /backup/*.tar.gz 2>/dev/null || echo "No backups found"
  exit 1
fi

BACKUP_FILE="$1"
RESTORE_DIR="/backup/restore_$(date +%Y%m%d_%H%M%S)"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "Starting restore process..."
echo "Backup file: $BACKUP_FILE"

# Extract backup
echo "Extracting backup..."
mkdir -p "$RESTORE_DIR"
tar -xzf "$BACKUP_FILE" -C "$RESTORE_DIR"

# Find the backup directory
BACKUP_CONTENT=$(find "$RESTORE_DIR" -mindepth 1 -maxdepth 1 -type d | head -n 1)

if [ -z "$BACKUP_CONTENT" ]; then
  echo "Error: Invalid backup structure"
  exit 1
fi

# Restore MongoDB
if [ -d "$BACKUP_CONTENT/mongodb" ]; then
  echo "Restoring MongoDB database..."
  mongorestore \
    --host="$MONGO_HOST" \
    --port="$MONGO_PORT" \
    --username="$MONGO_USER" \
    --password="$MONGO_PASSWORD" \
    --authenticationDatabase=admin \
    --gzip \
    --drop \
    "$BACKUP_CONTENT/mongodb"
  
  echo "✓ MongoDB restore completed"
else
  echo "⚠ No MongoDB backup found in archive"
fi

# Restore files
if [ -d "$BACKUP_CONTENT/uploads" ]; then
  echo "Restoring uploaded files..."
  rm -rf /uploads/*
  cp -r "$BACKUP_CONTENT/uploads/"* /uploads/
  echo "✓ Files restore completed"
else
  echo "⚠ No files backup found in archive"
fi

# Cleanup
rm -rf "$RESTORE_DIR"

echo "Restore process complete!"
