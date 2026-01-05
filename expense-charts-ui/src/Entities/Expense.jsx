{
  "name": "Expense",
  "type": "object",
  "properties": {
    "transaction_date": {
      "type": "string",
      "format": "date",
      "description": "\u05ea\u05d0\u05e8\u05d9\u05da \u05d4\u05e2\u05e1\u05e7\u05d4"
    },
    "business_name": {
      "type": "string",
      "description": "\u05e9\u05dd \u05d1\u05d9\u05ea \u05e2\u05e1\u05e7"
    },
    "amount": {
      "type": "number",
      "description": "\u05e1\u05db\u05d5\u05dd \u05d1\u05e9\"\u05d7"
    },
    "charge_date": {
      "type": "string",
      "description": "\u05de\u05d5\u05e2\u05d3 \u05d7\u05d9\u05d5\u05d1"
    },
    "transaction_type": {
      "type": "string",
      "description": "\u05e1\u05d5\u05d2 \u05e2\u05e1\u05e7\u05d4"
    },
    "digital_wallet": {
      "type": "string",
      "description": "\u05de\u05d4\u05d3\u05d4 \u05db\u05e8\u05d8\u05d9\u05e1 \u05d1\u05d0\u05e8\u05e0\u05e7 \u05d3\u05d9\u05d2\u05d9\u05d8\u05dc\u05d9"
    },
    "notes": {
      "type": "string",
      "description": "\u05d4\u05e2\u05e8\u05d5\u05ea"
    }
  },
  "required": []
}