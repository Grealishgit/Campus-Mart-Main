# Creating listings

`http://localhost:5000/api/listings`

`{
  "title": "Engineering Mathematics Textbook",
  "description": "Clean copy with no missing pages, suitable for first and second year students.",
  "price": 1800,
  "type": "SALE",
  "category": "Textbooks",
  "condition": "Good",
  "location": "Mksu Main Campus, Hostel A"
}`

`or`

`{
  "title": "Canon DSLR Camera",
  "description": "Available for events and projects, includes charger and memory card.",
  "price": 1500,
  "type": "LEASE",
  "category": "Tech",
  "condition": "Like New",
  "location": "Mksu Main Gate",
  "price_unit": "/day",
  "min_duration": 1,
  "max_duration": 14,
  "duration_unit": "days",
  "available_from": "2026-04-25",
  "available_until": "2026-05-30"
}`


`
GET    /api/favorites
POST   /api/favorites/sale/3
POST   /api/favorites/lease/7
DELETE /api/favorites/sale/3
DELETE /api/favorites/lease/7
`