// src/models/Plot.model.ts
import mongoose, { Schema } from 'mongoose';
import { IPlot, IPlotBlock, IPlotSize, IPlotType } from '../types/plot.types';

// Main Plot Schema
const PlotSchema: Schema = new Schema(
  {
    PlotID: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    PlotNo: {
      type: String,
      required: true,
      index: true,
    },
    PlotSizeID: {
      type: Schema.Types.ObjectId,
      ref: 'PlotSize',
    },
    PlotBlockID: {
      type: Schema.Types.ObjectId,
      ref: 'PlotBlock',
    },
    PlotTypeID: {
      type: Schema.Types.ObjectId,
      ref: 'PlotType',
    },
    plot_development_charge: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// PlotSize Schema (Embedded or Referenced - Choose based on usage)
const PlotSizeSchema: Schema = new Schema({
  PlotSizeID: {
    type: Number,
    required: true,
    unique: true,
  },
  PlotSizeName: {
    type: String,
    required: true,
    trim: true,
  },
});

// PlotBlock Schema
const PlotBlockSchema: Schema = new Schema({
  PlotBlockID: {
    type: Number,
    required: true,
    unique: true,
  },
  PlotBlockName: {
    type: String,
    required: true,
    trim: true,
  },
});

// PlotType Schema
const PlotTypeSchema: Schema = new Schema({
  PlotTypeID: {
    type: Number,
    required: true,
    unique: true,
  },
  PlotTypeName: {
    type: String,
    required: true,
    trim: true,
  },
});

export const Plot = mongoose.model<IPlot>('Plot', PlotSchema);
export const PlotSize = mongoose.model<IPlotSize>('PlotSize', PlotSizeSchema);
export const PlotBlock = mongoose.model<IPlotBlock>('PlotBlock', PlotBlockSchema);
export const PlotType = mongoose.model<IPlotType>('PlotType', PlotTypeSchema);
