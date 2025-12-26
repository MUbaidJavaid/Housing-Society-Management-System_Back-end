// src/types/plot.types.ts
import { Document, ObjectId } from 'mongoose';

export interface IPlot extends Document {
  PlotID: number;
  PlotNo: string;
  PlotSizeID?: ObjectId;
  PlotBlockID?: ObjectId;
  PlotTypeID?: ObjectId;
  plot_development_charge?: number;
  MemId?: number; // From the FetchPlot stored procedure
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPlotSize extends Document {
  PlotSizeID: number;
  PlotSizeName: string;
}

export interface IPlotBlock extends Document {
  PlotBlockID: number;
  PlotBlockName: string;
}

export interface IPlotType extends Document {
  PlotTypeID: number;
  PlotTypeName: string;
}
