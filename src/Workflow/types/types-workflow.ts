import { TriggerType, StepType } from '../models/models-workflow';
import { WorkflowInstanceStatus, StepLogStatus } from '../models/models-workflow-instance';

// Workflow DTOs
export interface CreateWorkflowDto {
  name: string;
  description?: string;
  societyId: string;
  triggerType: TriggerType;
  triggerEntity: string;
  triggerConditions?: Record<string, any>;
  steps?: Array<{
    stepNumber: number;
    stepType: StepType;
    config?: Record<string, any>;
    nextStepOnSuccess?: number;
    nextStepOnFailure?: number;
    nextStepOnTimeout?: number;
  }>;
  isActive?: boolean;
}

export interface UpdateWorkflowDto {
  name?: string;
  description?: string;
  triggerType?: TriggerType;
  triggerEntity?: string;
  triggerConditions?: Record<string, any>;
  steps?: Array<{
    stepNumber: number;
    stepType: StepType;
    config?: Record<string, any>;
    nextStepOnSuccess?: number;
    nextStepOnFailure?: number;
    nextStepOnTimeout?: number;
  }>;
  isActive?: boolean;
}

export interface WorkflowQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  societyId?: string;
  triggerEntity?: string;
  isActive?: boolean;
}

// Workflow Instance DTOs
export interface CreateWorkflowInstanceDto {
  entityType: string;
  entityId: string;
  societyId: string;
}

export interface WorkflowInstanceQueryParams {
  page?: number;
  limit?: number;
  status?: WorkflowInstanceStatus;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UpdateStepDto {
  stepNumber: number;
  status: StepLogStatus;
  result?: Record<string, any>;
  notes?: string;
}

export interface ApproveRejectDto {
  notes?: string;
}
