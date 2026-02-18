import { Types } from 'mongoose';
import Plot from '../../Plots/models/models-plot';
import SalesStatus from '../../Sales/models/models-salesstatus';
import { SalesStatusType } from '../../Sales/models/models-salesstatus';

export interface ProjectPlotCounts {
  totalPlots: number;
  plotsSold: number;
  plotsReserved: number;
  plotsAvailable: number;
}

/**
 * Get plot counts for a single project (total, sold, reserved, available).
 * Sold = plot has fileId. Reserved = salesStatusId has statusType RESERVED.
 * Available = total - sold - reserved.
 */
export async function getProjectPlotCounts(
  projectId: Types.ObjectId | string
): Promise<ProjectPlotCounts> {
  const pid = typeof projectId === 'string' ? new Types.ObjectId(projectId) : projectId;
  const baseMatch = { projectId: pid, isDeleted: false };

  // Get SalesStatus _ids for RESERVED type
  const reservedStatuses = await SalesStatus.find(
    { statusType: SalesStatusType.RESERVED, isDeleted: false },
    { _id: 1 }
  ).lean();
  const reservedIds = reservedStatuses.map((s: { _id: Types.ObjectId }) => s._id);

  const [totalPlots, soldPlots, reservedPlots] = await Promise.all([
    Plot.countDocuments(baseMatch),
    Plot.countDocuments({
      ...baseMatch,
      fileId: { $exists: true, $ne: null },
    }),
    reservedIds.length > 0
      ? Plot.countDocuments({
          ...baseMatch,
          salesStatusId: { $in: reservedIds },
        })
      : 0,
  ]);

  const plotsAvailable = Math.max(0, totalPlots - soldPlots - reservedPlots);

  return {
    totalPlots,
    plotsSold: soldPlots,
    plotsReserved: reservedPlots,
    plotsAvailable,
  };
}

/**
 * Get plot counts for multiple projects in one aggregation (efficient for listing).
 */
export async function getProjectPlotCountsBatch(
  projectIds: (Types.ObjectId | string)[]
): Promise<Map<string, ProjectPlotCounts>> {
  if (projectIds.length === 0) return new Map();

  const ids = projectIds.map(id =>
    typeof id === 'string' ? new Types.ObjectId(id) : id
  );

  const reservedStatuses = await SalesStatus.find(
    { statusType: SalesStatusType.RESERVED, isDeleted: false },
    { _id: 1 }
  ).lean();
  const reservedIds = reservedStatuses.map((s: { _id: Types.ObjectId }) => s._id);

  const results = await Plot.aggregate([
    { $match: { projectId: { $in: ids }, isDeleted: false } },
    {
      $group: {
        _id: '$projectId',
        totalPlots: { $sum: 1 },
        soldPlots: {
          $sum: { $cond: [{ $ne: [{ $ifNull: ['$fileId', null] }, null] }, 1, 0] },
        },
        reservedPlots: {
          $sum: {
            $cond: [{ $in: ['$salesStatusId', reservedIds] }, 1, 0],
          },
        },
      },
    },
  ]);

  const map = new Map<string, ProjectPlotCounts>();
  for (const id of ids) {
    const idStr = id.toString();
    const r = results.find((x: { _id: Types.ObjectId }) => x._id.toString() === idStr);
    const total = r?.totalPlots ?? 0;
    const sold = r?.plotsSold ?? 0;
    const reserved = r?.plotsReserved ?? 0;
    map.set(idStr, {
      totalPlots: total,
      plotsSold: sold,
      plotsReserved: reserved,
      plotsAvailable: Math.max(0, total - sold - reserved),
    });
  }
  return map;
}
