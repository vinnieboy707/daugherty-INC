#!/bin/bash
# MongoDB initialization script
# This script runs when the MongoDB container starts for the first time

echo "Initializing MongoDB database for Daugherty Inc..."

# Create application database
mongosh <<EOF
use daugherty-inc

// Create collections with validation
db.createCollection("portfolios", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["filename", "path", "url", "displayOrder"],
      properties: {
        filename: { bsonType: "string" },
        path: { bsonType: "string" },
        url: { bsonType: "string" },
        displayOrder: { bsonType: "number" },
        isVisible: { bsonType: "bool" }
      }
    }
  }
})

db.createCollection("consultations", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["fullName", "phoneNumber", "email"],
      properties: {
        fullName: { bsonType: "string" },
        phoneNumber: { bsonType: "string" },
        email: { bsonType: "string" },
        status: { enum: ["pending", "confirmed", "completed", "cancelled"] }
      }
    }
  }
})

// Create indexes for performance
db.portfolios.createIndex({ displayOrder: 1 })
db.portfolios.createIndex({ isVisible: 1 })
db.consultations.createIndex({ status: 1 })
db.consultations.createIndex({ createdAt: -1 })

print("Database initialization completed successfully!")
EOF

echo "MongoDB initialization complete!"
