import { Types } from 'mongoose';
import Workflow, { IWorkflow } from '../models/models-workflow';
import WorkflowInstance, {
  IWorkflowInstance,
  WorkflowInstanceStatus,
  StepLogStatus,
} from '../models/models-workflow-instance';
import {
  CreateWorkflowDto,
  UpdateWorkflowDto,
  WorkflowQueryParams,
  WorkflowInstanceQueryParams,
} from '../types/types-workflow';

export const workflowService = {
  /**
   * Create a new workflow
   */
  async create(data: CreateWorkflowDto, userId: Types.ObjectId): Promise<IWorkflow> {
    const workflow = await Workflow.create({
      ...data,
      createdBy: userId,
      modifiedBy: userId,
    });

    return workflow;
  },

  /**
   * Get all workflows with pagination and filtering
   */
  async getAll(params: WorkflowQueryParams): Promise<{
    workflows: IWorkflow[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    const {
      page = 1,
      limit = 50,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      societyId,
      triggerEntity,
      isActive,
    } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const query: any = { isDeleted: false };

    if (societyId) {
      query.societyId = new Types.ObjectId(societyId);
    }

    if (triggerEntity) {
      query.triggerEntity = triggerEntity;
    }

    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { triggerEntity: { $regex: search, $options: 'i' } },
      ];
    }

    const [workflows, total] = await Promise.all([
      Workflow.find(query)
        .populate('createdBy', 'firstName lastName email')
        .populate('modifiedBy', 'firstName lastName email')
        .populate('societyId', 'name')
        .skip(skip)
        .limit(limit)
        .sort(sort),
      Workflow.countDocuments(query),
    ]);

    return {
      workflows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get a workflow by ID
   */
  async getById(id: string): Promise<IWorkflow | null> {
    const workflow = await Workflow.findById(id)
      .populate('createdBy', 'firstName lastName email')
      .populate('modifiedBy', 'firstName lastName email')
      .populate('societyId', 'name');

    if (!workflow || workflow.isDeleted) return null;
    return workflow;
  },

  /**
   * Update a workflow
   */
  async update(
    id: string,
    data: UpdateWorkflowDto,
    userId: Types.ObjectId
  ): Promise<IWorkflow | null> {
    const existing = await Workflow.findById(id);
    if (!existing || existing.isDeleted) return null;

    const updated = await Workflow.findByIdAndUpdate(
      id,
      {
        $set: {
          ...data,
          modifiedBy: userId,
        },
      },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'firstName lastName email')
      .populate('modifiedBy', 'firstName lastName email')
      .populate('societyId', 'name');

    return updated;
  },

  /**
   * Soft delete a workflow
   */
  async delete(id: string, userId: Types.ObjectId): Promise<boolean> {
    const workflow = await Workflow.findById(id);

    if (!workflow || workflow.isDeleted) {
      throw new Error('Workflow not found');
    }

    // Check for active instances
    const activeInstances = await WorkflowInstance.countDocuments({
      workflowId: id,
      status: { $in: [WorkflowInstanceStatus.PENDING, WorkflowInstanceStatus.IN_PROGRESS] },
      isDeleted: false,
    });

    if (activeInstances > 0) {
      throw new Error('Cannot delete workflow with active instances. Cancel or complete them first.');
    }

    const result = await Workflow.findByIdAndUpdate(
      id,
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          isActive: false,
          modifiedBy: userId,
        },
      },
      { new: true }
    );

    return !!result;
  },

  /**
   * Get active workflows for a society
   */
  async getBySociety(societyId: string): Promise<IWorkflow[]> {
    return Workflow.getActiveBySociety(societyId);
  },

  /**
   * Create a workflow instance
   */
  async createInstance(
    workflowId: string,
    entityType: string,
    entityId: string,
    societyId: string,
    userId: Types.ObjectId
  ): Promise<IWorkflowInstance> {
    const workflow = await Workflow.findById(workflowId);

    if (!workflow || workflow.isDeleted) {
      throw new Error('Workflow not found');
    }

    if (!workflow.isActive) {
      throw new Error('Workflow is not active');
    }

    // Initialize step logs from workflow steps
    const stepLogs = workflow.steps.map((step) => ({
      stepNumber: step.stepNumber,
      stepType: step.stepType,
      status: StepLogStatus.PENDING,
    }));

    const instance = await WorkflowInstance.create({
      workflowId: new Types.ObjectId(workflowId),
      entityType,
      entityId: new Types.ObjectId(entityId),
      societyId: new Types.ObjectId(societyId),
      currentStepNumber: 1,
      status: WorkflowInstanceStatus.IN_PROGRESS,
      stepLogs,
      startedAt: new Date(),
      initiatedBy: userId,
    });

    return instance;
  },

  /**
   * Get instances for a workflow with pagination
   */
  async getInstances(
    workflowId: string,
    params: WorkflowInstanceQueryParams
  ): Promise<{
    instances: IWorkflowInstance[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    const {
      page = 1,
      limit = 50,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const query: any = {
      workflowId: new Types.ObjectId(workflowId),
      isDeleted: false,
    };

    if (status) {
      query.status = status;
    }

    const [instances, total] = await Promise.all([
      WorkflowInstance.find(query)
        .populate('workflowId', 'name triggerType triggerEntity')
        .populate('initiatedBy', 'firstName lastName email')
        .skip(skip)
        .limit(limit)
        .sort(sort),
      WorkflowInstance.countDocuments(query),
    ]);

    return {
      instances,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get a single workflow instance by ID
   */
  async getInstance(instanceId: string): Promise<IWorkflowInstance | null> {
    const instance = await WorkflowInstance.findById(instanceId)
      .populate('workflowId')
      .populate('initiatedBy', 'firstName lastName email')
      .populate('stepLogs.executedBy', 'firstName lastName email');

    if (!instance || instance.isDeleted) return null;
    return instance;
  },

  /**
   * Update a step log in a workflow instance
   */
  async updateInstanceStep(
    instanceId: string,
    stepNumber: number,
    status: StepLogStatus,
    userId: Types.ObjectId,
    result?: Record<string, any>
  ): Promise<IWorkflowInstance | null> {
    const instance = await WorkflowInstance.findById(instanceId);
    if (!instance || instance.isDeleted) {
      throw new Error('Workflow instance not found');
    }

    if (instance.status === WorkflowInstanceStatus.COMPLETED ||
        instance.status === WorkflowInstanceStatus.CANCELLED) {
      throw new Error('Cannot update step on a completed or cancelled instance');
    }

    // Find the step log entry
    const stepLog = instance.stepLogs.find((log) => log.stepNumber === stepNumber);
    if (!stepLog) {
      throw new Error(`Step ${stepNumber} not found in instance`);
    }

    // Update the step log
    stepLog.status = status;
    stepLog.executedAt = new Date();
    stepLog.executedBy = userId;
    if (result) {
      stepLog.result = result;
    }

    // Get the workflow to determine next step
    const workflow = await Workflow.findById(instance.workflowId);
    if (!workflow) {
      throw new Error('Associated workflow not found');
    }

    const currentWorkflowStep = workflow.steps.find((s) => s.stepNumber === stepNumber);

    if (status === StepLogStatus.COMPLETED && currentWorkflowStep) {
      // Move to next step on success
      if (currentWorkflowStep.nextStepOnSuccess) {
        instance.currentStepNumber = currentWorkflowStep.nextStepOnSuccess;
      } else {
        // Check if this was the last step
        const maxStep = Math.max(...workflow.steps.map((s) => s.stepNumber));
        if (stepNumber >= maxStep) {
          instance.status = WorkflowInstanceStatus.COMPLETED;
          instance.completedAt = new Date();
        } else {
          instance.currentStepNumber = stepNumber + 1;
        }
      }
    } else if (status === StepLogStatus.FAILED && currentWorkflowStep) {
      if (currentWorkflowStep.nextStepOnFailure) {
        instance.currentStepNumber = currentWorkflowStep.nextStepOnFailure;
      } else {
        instance.status = WorkflowInstanceStatus.FAILED;
        instance.completedAt = new Date();
      }
    } else if (status === StepLogStatus.TIMED_OUT && currentWorkflowStep) {
      if (currentWorkflowStep.nextStepOnTimeout) {
        instance.currentStepNumber = currentWorkflowStep.nextStepOnTimeout;
      } else {
        instance.status = WorkflowInstanceStatus.FAILED;
        instance.completedAt = new Date();
      }
    }

    await instance.save();
    return instance;
  },

  /**
   * Approve the current approval step
   */
  async approveStep(
    instanceId: string,
    userId: Types.ObjectId,
    notes?: string
  ): Promise<IWorkflowInstance | null> {
    const instance = await WorkflowInstance.findById(instanceId);
    if (!instance || instance.isDeleted) {
      throw new Error('Workflow instance not found');
    }

    if (instance.status !== WorkflowInstanceStatus.IN_PROGRESS) {
      throw new Error('Instance is not in progress');
    }

    // Get the workflow to find the current step
    const workflow = await Workflow.findById(instance.workflowId);
    if (!workflow) {
      throw new Error('Associated workflow not found');
    }

    const currentStep = workflow.steps.find(
      (s) => s.stepNumber === instance.currentStepNumber
    );

    if (!currentStep) {
      throw new Error('Current step not found in workflow definition');
    }

    if (currentStep.stepType !== 'approval') {
      throw new Error('Current step is not an approval step');
    }

    // Update the step log
    const stepLog = instance.stepLogs.find(
      (log) => log.stepNumber === instance.currentStepNumber
    );

    if (stepLog) {
      stepLog.status = StepLogStatus.COMPLETED;
      stepLog.executedAt = new Date();
      stepLog.executedBy = userId;
      stepLog.result = { action: 'approved' };
      if (notes) {
        stepLog.notes = notes;
      }
    }

    // Advance to next step
    if (currentStep.nextStepOnSuccess) {
      instance.currentStepNumber = currentStep.nextStepOnSuccess;
    } else {
      const maxStep = Math.max(...workflow.steps.map((s) => s.stepNumber));
      if (instance.currentStepNumber >= maxStep) {
        instance.status = WorkflowInstanceStatus.COMPLETED;
        instance.completedAt = new Date();
      } else {
        instance.currentStepNumber = instance.currentStepNumber + 1;
      }
    }

    await instance.save();
    return instance;
  },

  /**
   * Reject the current approval step
   */
  async rejectStep(
    instanceId: string,
    userId: Types.ObjectId,
    notes?: string
  ): Promise<IWorkflowInstance | null> {
    const instance = await WorkflowInstance.findById(instanceId);
    if (!instance || instance.isDeleted) {
      throw new Error('Workflow instance not found');
    }

    if (instance.status !== WorkflowInstanceStatus.IN_PROGRESS) {
      throw new Error('Instance is not in progress');
    }

    // Get the workflow to find the current step
    const workflow = await Workflow.findById(instance.workflowId);
    if (!workflow) {
      throw new Error('Associated workflow not found');
    }

    const currentStep = workflow.steps.find(
      (s) => s.stepNumber === instance.currentStepNumber
    );

    if (!currentStep) {
      throw new Error('Current step not found in workflow definition');
    }

    if (currentStep.stepType !== 'approval') {
      throw new Error('Current step is not an approval step');
    }

    // Update the step log
    const stepLog = instance.stepLogs.find(
      (log) => log.stepNumber === instance.currentStepNumber
    );

    if (stepLog) {
      stepLog.status = StepLogStatus.FAILED;
      stepLog.executedAt = new Date();
      stepLog.executedBy = userId;
      stepLog.result = { action: 'rejected' };
      if (notes) {
        stepLog.notes = notes;
      }
    }

    // Handle failure path
    if (currentStep.nextStepOnFailure) {
      instance.currentStepNumber = currentStep.nextStepOnFailure;
    } else {
      instance.status = WorkflowInstanceStatus.FAILED;
      instance.completedAt = new Date();
    }

    await instance.save();
    return instance;
  },
};
