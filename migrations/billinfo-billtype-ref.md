# BillInfo billType → billTypeId Reference Migration

## Summary

BillInfo previously stored `billType` as a string enum (e.g. "Maintenance Fee", "Electricity").
It now references the BillType collection via `billTypeId` (ObjectId).

## Prerequisites

1. **Ensure BillType documents exist** before migrating. If you have no BillType documents, run a seed or create them manually via the Bill Type admin UI.

2. **Recommended BillType names** (to match legacy string values):
   - Membership Fee
   - Maintenance Fee
   - Electricity
   - Water
   - Gas
   - Property Tax
   - Legal Fee
   - Other

## Migration Script (Optional)

If you have existing BillInfo documents with string `billType`, run a one-time migration to map them to BillType `_id`:

```javascript
// Run in MongoDB shell or a migration script
// 1. Get all BillTypes
const billTypes = db.billtypes.find({ isDeleted: false }).toArray();
const nameToId = {};
billTypes.forEach(bt => { nameToId[bt.billTypeName] = bt._id; });

// 2. Update BillInfo documents (if they still have 'billType' string field)
db.billinfos.find({ billType: { $type: "string" } }).forEach(bill => {
  const typeId = nameToId[bill.billType];
  if (typeId) {
    db.billinfos.updateOne(
      { _id: bill._id },
      { $set: { billTypeId: typeId }, $unset: { billType: "" } }
    );
  }
});
```

## Schema Changes

- `billType` (String enum) → `billTypeId` (ObjectId ref: 'BillType')
- All queries now populate `billTypeId` as `billType` in API responses for backward compatibility

## API Changes

- **Create/Update BillInfo**: Send `billTypeId` (ObjectId string) instead of `billType` (string)
- **Generate Bills**: Send `billTypeId` instead of `billType`
- **List/Filter**: Use `billTypeId` query param instead of `billType`
- **Response**: Includes `billType` (populated object with billTypeName, etc.) for display

## Test Checklist

1. Create a BillType (e.g. "Maintenance Fee") via /billtype
2. Create a BillInfo with billTypeId from the dropdown
3. Verify list and detail show bill type name
4. Generate bills with a selected billTypeId
5. Verify statistics and dashboards work
6. Filter bills by billTypeId
