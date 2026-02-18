# Migration: Remove totalPlots, plotsAvailable, plotsSold, plotsReserved from Project

**Status:** Optional one-time migration  
**Date:** 2025

## Summary
Project plot counts are now calculated dynamically from the Plot collection. The following fields have been removed from the Project schema:
- `totalPlots`
- `plotsAvailable`
- `plotsSold`
- `plotsReserved`

## Optional DB Cleanup
To remove these fields from existing documents (optional; MongoDB will ignore them):

```javascript
// Run in MongoDB shell or a one-off script
db.projects.updateMany(
  {},
  { $unset: { totalPlots: "", plotsAvailable: "", plotsSold: "", plotsReserved: "" } }
);
```

**Note:** This is not required. The application no longer reads or writes these fields. Leaving them in the DB causes no issues.
