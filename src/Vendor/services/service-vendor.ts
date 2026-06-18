import { Types } from 'mongoose';
import VendorProfile from '../models/models-vendor-profile';
import WorkOrder from '../models/models-work-order';
import VendorContract from '../models/models-vendor-contract';
import VendorInvoice from '../models/models-vendor-invoice';
import {
  CreateVendorProfileDto,
  UpdateVendorProfileDto,
  VendorQueryParams,
  CreateWorkOrderDto,
  UpdateWorkOrderDto,
  WorkOrderQueryParams,
  CreateVendorContractDto,
  UpdateVendorContractDto,
  ContractQueryParams,
  CreateVendorInvoiceDto,
  InvoiceQueryParams,
} from '../types/types-vendor';

// ============ Vendor Profile Service ============

export const vendorService = {
  // ---------- Vendor Profile ----------

  async registerVendor(data: CreateVendorProfileDto, userId: Types.ObjectId) {
    const existing = await VendorProfile.findOne({ email: data.email, isDeleted: false });
    if (existing) {
      throw new Error('A vendor with this email already exists');
    }

    const vendorData = {
      ...data,
      createdBy: userId,
      modifiedBy: userId,
    };

    const vendor = await VendorProfile.create(vendorData);

    const created = await VendorProfile.findById(vendor._id)
      .populate('serviceAreas', 'name')
      .populate('userId', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email');

    if (!created) {
      throw new Error('Failed to create vendor profile');
    }

    return created.toObject();
  },

  async getAllVendors(params: VendorQueryParams) {
    const {
      page = 1,
      limit = 20,
      search = '',
      vendorType,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const query: any = { isDeleted: false };

    if (search) {
      query.$text = { $search: search };
    }

    if (vendorType) {
      query.vendorType = vendorType;
    }

    if (status) {
      query.status = status;
    }

    const [vendors, total] = await Promise.all([
      VendorProfile.find(query)
        .populate('serviceAreas', 'name')
        .populate('userId', 'firstName lastName email')
        .populate('verifiedBy', 'firstName lastName')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .lean(),
      VendorProfile.countDocuments(query),
    ]);

    return {
      vendors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async getVendorById(id: string) {
    const vendor = await VendorProfile.findById(id)
      .populate('serviceAreas', 'name')
      .populate('userId', 'firstName lastName email')
      .populate('verifiedBy', 'firstName lastName')
      .populate('createdBy', 'firstName lastName email')
      .populate('modifiedBy', 'firstName lastName email');

    if (!vendor || vendor.isDeleted) {
      throw new Error('Vendor not found');
    }

    return vendor.toObject();
  },

  async updateVendor(id: string, data: UpdateVendorProfileDto, userId: Types.ObjectId) {
    const existing = await VendorProfile.findById(id);
    if (!existing || existing.isDeleted) {
      throw new Error('Vendor not found');
    }

    if (data.email && data.email !== existing.email) {
      const emailExists = await VendorProfile.findOne({
        email: data.email,
        isDeleted: false,
        _id: { $ne: id },
      });
      if (emailExists) {
        throw new Error('A vendor with this email already exists');
      }
    }

    const updated = await VendorProfile.findByIdAndUpdate(
      id,
      {
        $set: {
          ...data,
          modifiedBy: userId,
        },
      },
      { new: true, runValidators: true }
    )
      .populate('serviceAreas', 'name')
      .populate('userId', 'firstName lastName email')
      .populate('verifiedBy', 'firstName lastName');

    return updated ? updated.toObject() : null;
  },

  async verifyVendor(id: string, userId: Types.ObjectId) {
    const vendor = await VendorProfile.findById(id);
    if (!vendor || vendor.isDeleted) {
      throw new Error('Vendor not found');
    }

    if (vendor.status === 'active') {
      throw new Error('Vendor is already verified');
    }

    const updated = await VendorProfile.findByIdAndUpdate(
      id,
      {
        $set: {
          status: 'active',
          verifiedBy: userId,
          verificationDate: new Date(),
          modifiedBy: userId,
        },
      },
      { new: true }
    )
      .populate('serviceAreas', 'name')
      .populate('verifiedBy', 'firstName lastName');

    return updated ? updated.toObject() : null;
  },

  async suspendVendor(id: string, userId: Types.ObjectId) {
    const vendor = await VendorProfile.findById(id);
    if (!vendor || vendor.isDeleted) {
      throw new Error('Vendor not found');
    }

    if (vendor.status === 'suspended') {
      throw new Error('Vendor is already suspended');
    }

    const updated = await VendorProfile.findByIdAndUpdate(
      id,
      {
        $set: {
          status: 'suspended',
          modifiedBy: userId,
        },
      },
      { new: true }
    );

    return updated ? updated.toObject() : null;
  },

  async rateVendor(id: string, rating: number, _userId: Types.ObjectId) {
    const vendor = await VendorProfile.findById(id);
    if (!vendor || vendor.isDeleted) {
      throw new Error('Vendor not found');
    }

    if (vendor.status !== 'active') {
      throw new Error('Can only rate active vendors');
    }

    const newTotalRatings = vendor.totalRatings + 1;
    const newRating =
      (vendor.rating * vendor.totalRatings + rating) / newTotalRatings;

    const updated = await VendorProfile.findByIdAndUpdate(
      id,
      {
        $set: {
          rating: Math.round(newRating * 100) / 100,
          totalRatings: newTotalRatings,
        },
      },
      { new: true }
    );

    return updated ? updated.toObject() : null;
  },

  // ---------- Work Order ----------

  async createWorkOrder(data: CreateWorkOrderDto, userId: Types.ObjectId) {
    const workOrderData = {
      ...data,
      createdBy: userId,
      modifiedBy: userId,
    };

    const workOrder = await WorkOrder.create(workOrderData);

    const created = await WorkOrder.findById(workOrder._id)
      .populate('societyId', 'name')
      .populate('createdBy', 'firstName lastName email');

    if (!created) {
      throw new Error('Failed to create work order');
    }

    return created.toObject();
  },

  async getAllWorkOrders(params: WorkOrderQueryParams) {
    const {
      page = 1,
      limit = 20,
      search = '',
      societyId,
      status,
      category,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const query: any = { isDeleted: false };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (societyId) {
      query.societyId = new Types.ObjectId(societyId);
    }

    if (status) {
      query.status = status;
    }

    if (category) {
      query.category = category;
    }

    const [workOrders, total] = await Promise.all([
      WorkOrder.find(query)
        .populate('societyId', 'name')
        .populate('awardedVendorId', 'vendorName companyName')
        .populate('createdBy', 'firstName lastName')
        .populate('bids.vendorId', 'vendorName companyName')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .lean(),
      WorkOrder.countDocuments(query),
    ]);

    return {
      workOrders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async getWorkOrderById(id: string) {
    const workOrder = await WorkOrder.findById(id)
      .populate('societyId', 'name')
      .populate('awardedVendorId', 'vendorName companyName email phone')
      .populate('createdBy', 'firstName lastName email')
      .populate('modifiedBy', 'firstName lastName email')
      .populate('bids.vendorId', 'vendorName companyName rating');

    if (!workOrder || workOrder.isDeleted) {
      throw new Error('Work order not found');
    }

    return workOrder.toObject();
  },

  async updateWorkOrder(id: string, data: UpdateWorkOrderDto, userId: Types.ObjectId) {
    const existing = await WorkOrder.findById(id);
    if (!existing || existing.isDeleted) {
      throw new Error('Work order not found');
    }

    const updated = await WorkOrder.findByIdAndUpdate(
      id,
      {
        $set: {
          ...data,
          modifiedBy: userId,
        },
      },
      { new: true, runValidators: true }
    )
      .populate('societyId', 'name')
      .populate('awardedVendorId', 'vendorName companyName')
      .populate('bids.vendorId', 'vendorName companyName');

    return updated ? updated.toObject() : null;
  },

  async deleteWorkOrder(id: string, userId: Types.ObjectId) {
    const existing = await WorkOrder.findById(id);
    if (!existing || existing.isDeleted) {
      throw new Error('Work order not found');
    }

    const result = await WorkOrder.findByIdAndUpdate(
      id,
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          modifiedBy: userId,
        },
      },
      { new: true }
    );

    return !!result;
  },

  async submitBid(
    workOrderId: string,
    vendorId: string,
    amount: number,
    proposal: string
  ) {
    const workOrder = await WorkOrder.findById(workOrderId);
    if (!workOrder || workOrder.isDeleted) {
      throw new Error('Work order not found');
    }

    if (!['open', 'bidding'].includes(workOrder.status)) {
      throw new Error('Work order is not accepting bids');
    }

    const vendor = await VendorProfile.findById(vendorId);
    if (!vendor || vendor.isDeleted || vendor.status !== 'active') {
      throw new Error('Vendor not found or not active');
    }

    const existingBid = workOrder.bids.find(
      (bid) => bid.vendorId.toString() === vendorId
    );
    if (existingBid) {
      throw new Error('Vendor has already submitted a bid for this work order');
    }

    const updated = await WorkOrder.findByIdAndUpdate(
      workOrderId,
      {
        $push: {
          bids: {
            vendorId: new Types.ObjectId(vendorId),
            amount,
            proposal,
            submittedAt: new Date(),
            status: 'submitted',
          },
        },
        $set: {
          status: 'bidding',
        },
      },
      { new: true }
    )
      .populate('bids.vendorId', 'vendorName companyName');

    return updated ? updated.toObject() : null;
  },

  async reviewBid(
    workOrderId: string,
    bidIndex: number,
    status: string,
    userId: Types.ObjectId
  ) {
    const workOrder = await WorkOrder.findById(workOrderId);
    if (!workOrder || workOrder.isDeleted) {
      throw new Error('Work order not found');
    }

    if (bidIndex < 0 || bidIndex >= workOrder.bids.length) {
      throw new Error('Invalid bid index');
    }

    const updatePath = `bids.${bidIndex}.status`;
    const updated = await WorkOrder.findByIdAndUpdate(
      workOrderId,
      {
        $set: {
          [updatePath]: status,
          modifiedBy: userId,
        },
      },
      { new: true }
    )
      .populate('bids.vendorId', 'vendorName companyName');

    return updated ? updated.toObject() : null;
  },

  async awardWorkOrder(workOrderId: string, vendorId: string, userId: Types.ObjectId) {
    const workOrder = await WorkOrder.findById(workOrderId);
    if (!workOrder || workOrder.isDeleted) {
      throw new Error('Work order not found');
    }

    if (workOrder.status === 'awarded' || workOrder.status === 'completed') {
      throw new Error('Work order has already been awarded or completed');
    }

    const vendor = await VendorProfile.findById(vendorId);
    if (!vendor || vendor.isDeleted || vendor.status !== 'active') {
      throw new Error('Vendor not found or not active');
    }

    const acceptedBid = workOrder.bids.find(
      (bid) => bid.vendorId.toString() === vendorId
    );

    const updated = await WorkOrder.findByIdAndUpdate(
      workOrderId,
      {
        $set: {
          status: 'awarded',
          awardedVendorId: new Types.ObjectId(vendorId),
          awardedAmount: acceptedBid ? acceptedBid.amount : workOrder.estimatedBudget,
          awardedDate: new Date(),
          modifiedBy: userId,
        },
      },
      { new: true }
    )
      .populate('awardedVendorId', 'vendorName companyName')
      .populate('societyId', 'name');

    // Update vendor's total contracts count
    await VendorProfile.findByIdAndUpdate(vendorId, {
      $inc: { totalContracts: 1 },
    });

    return updated ? updated.toObject() : null;
  },

  async completeWorkOrder(workOrderId: string, notes: string, userId: Types.ObjectId) {
    const workOrder = await WorkOrder.findById(workOrderId);
    if (!workOrder || workOrder.isDeleted) {
      throw new Error('Work order not found');
    }

    if (workOrder.status !== 'awarded' && workOrder.status !== 'in-progress') {
      throw new Error('Work order must be awarded or in-progress to complete');
    }

    const updated = await WorkOrder.findByIdAndUpdate(
      workOrderId,
      {
        $set: {
          status: 'completed',
          completionDate: new Date(),
          completionNotes: notes,
          modifiedBy: userId,
        },
      },
      { new: true }
    )
      .populate('awardedVendorId', 'vendorName companyName')
      .populate('societyId', 'name');

    // Update vendor's completed contracts count
    if (workOrder.awardedVendorId) {
      await VendorProfile.findByIdAndUpdate(workOrder.awardedVendorId, {
        $inc: { completedContracts: 1 },
      });
    }

    return updated ? updated.toObject() : null;
  },

  // ---------- Contract ----------

  async createContract(data: CreateVendorContractDto, userId: Types.ObjectId) {
    const vendor = await VendorProfile.findById(data.vendorId);
    if (!vendor || vendor.isDeleted) {
      throw new Error('Vendor not found');
    }

    const contractData = {
      ...data,
      createdBy: userId,
      modifiedBy: userId,
    };

    const contract = await VendorContract.create(contractData);

    const created = await VendorContract.findById(contract._id)
      .populate('vendorId', 'vendorName companyName')
      .populate('societyId', 'name')
      .populate('workOrderId', 'title')
      .populate('createdBy', 'firstName lastName email');

    if (!created) {
      throw new Error('Failed to create contract');
    }

    return created.toObject();
  },

  async getAllContracts(params: ContractQueryParams) {
    const {
      page = 1,
      limit = 20,
      search = '',
      vendorId,
      societyId,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const query: any = { isDeleted: false };

    if (search) {
      query.$or = [
        { contractName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (vendorId) {
      query.vendorId = new Types.ObjectId(vendorId);
    }

    if (societyId) {
      query.societyId = new Types.ObjectId(societyId);
    }

    if (status) {
      query.status = status;
    }

    const [contracts, total] = await Promise.all([
      VendorContract.find(query)
        .populate('vendorId', 'vendorName companyName')
        .populate('societyId', 'name')
        .populate('workOrderId', 'title')
        .populate('createdBy', 'firstName lastName')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .lean(),
      VendorContract.countDocuments(query),
    ]);

    return {
      contracts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async getContractById(id: string) {
    const contract = await VendorContract.findById(id)
      .populate('vendorId', 'vendorName companyName email phone')
      .populate('societyId', 'name')
      .populate('workOrderId', 'title description')
      .populate('createdBy', 'firstName lastName email')
      .populate('modifiedBy', 'firstName lastName email')
      .populate('performanceReviews.reviewedBy', 'firstName lastName');

    if (!contract || contract.isDeleted) {
      throw new Error('Contract not found');
    }

    return contract.toObject();
  },

  async updateContract(id: string, data: UpdateVendorContractDto, userId: Types.ObjectId) {
    const existing = await VendorContract.findById(id);
    if (!existing || existing.isDeleted) {
      throw new Error('Contract not found');
    }

    const updated = await VendorContract.findByIdAndUpdate(
      id,
      {
        $set: {
          ...data,
          modifiedBy: userId,
        },
      },
      { new: true, runValidators: true }
    )
      .populate('vendorId', 'vendorName companyName')
      .populate('societyId', 'name')
      .populate('workOrderId', 'title');

    return updated ? updated.toObject() : null;
  },

  async terminateContract(id: string, reason: string, userId: Types.ObjectId) {
    const contract = await VendorContract.findById(id);
    if (!contract || contract.isDeleted) {
      throw new Error('Contract not found');
    }

    if (contract.status === 'terminated') {
      throw new Error('Contract is already terminated');
    }

    const updated = await VendorContract.findByIdAndUpdate(
      id,
      {
        $set: {
          status: 'terminated',
          terminationReason: reason,
          modifiedBy: userId,
        },
      },
      { new: true }
    )
      .populate('vendorId', 'vendorName companyName')
      .populate('societyId', 'name');

    return updated ? updated.toObject() : null;
  },

  async renewContract(id: string, newEndDate: Date, userId: Types.ObjectId) {
    const contract = await VendorContract.findById(id);
    if (!contract || contract.isDeleted) {
      throw new Error('Contract not found');
    }

    if (new Date(newEndDate) <= new Date()) {
      throw new Error('New end date must be in the future');
    }

    const updated = await VendorContract.findByIdAndUpdate(
      id,
      {
        $set: {
          status: 'renewed',
          endDate: newEndDate,
          renewalDate: new Date(),
          modifiedBy: userId,
        },
      },
      { new: true }
    )
      .populate('vendorId', 'vendorName companyName')
      .populate('societyId', 'name');

    return updated ? updated.toObject() : null;
  },

  async addPerformanceReview(
    id: string,
    rating: number,
    comments: string,
    userId: Types.ObjectId
  ) {
    const contract = await VendorContract.findById(id);
    if (!contract || contract.isDeleted) {
      throw new Error('Contract not found');
    }

    if (contract.status !== 'active') {
      throw new Error('Can only review active contracts');
    }

    const updated = await VendorContract.findByIdAndUpdate(
      id,
      {
        $push: {
          performanceReviews: {
            date: new Date(),
            rating,
            comments,
            reviewedBy: userId,
          },
        },
        $set: {
          modifiedBy: userId,
        },
      },
      { new: true }
    )
      .populate('vendorId', 'vendorName companyName')
      .populate('performanceReviews.reviewedBy', 'firstName lastName');

    return updated ? updated.toObject() : null;
  },

  // ---------- Invoice ----------

  async submitInvoice(data: CreateVendorInvoiceDto, userId: Types.ObjectId) {
    const vendor = await VendorProfile.findById(data.vendorId);
    if (!vendor || vendor.isDeleted) {
      throw new Error('Vendor not found');
    }

    const invoiceData = {
      ...data,
      createdBy: userId,
      modifiedBy: userId,
    };

    const invoice = await VendorInvoice.create(invoiceData);

    const created = await VendorInvoice.findById(invoice._id)
      .populate('vendorId', 'vendorName companyName')
      .populate('societyId', 'name')
      .populate('contractId', 'contractName')
      .populate('workOrderId', 'title')
      .populate('createdBy', 'firstName lastName email');

    if (!created) {
      throw new Error('Failed to create invoice');
    }

    return created.toObject();
  },

  async getAllInvoices(params: InvoiceQueryParams) {
    const {
      page = 1,
      limit = 20,
      search = '',
      vendorId,
      societyId,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const query: any = { isDeleted: false };

    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (vendorId) {
      query.vendorId = new Types.ObjectId(vendorId);
    }

    if (societyId) {
      query.societyId = new Types.ObjectId(societyId);
    }

    if (status) {
      query.status = status;
    }

    const [invoices, total] = await Promise.all([
      VendorInvoice.find(query)
        .populate('vendorId', 'vendorName companyName')
        .populate('societyId', 'name')
        .populate('contractId', 'contractName')
        .populate('workOrderId', 'title')
        .populate('approvedBy', 'firstName lastName')
        .populate('createdBy', 'firstName lastName')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .lean(),
      VendorInvoice.countDocuments(query),
    ]);

    return {
      invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async getInvoiceById(id: string) {
    const invoice = await VendorInvoice.findById(id)
      .populate('vendorId', 'vendorName companyName email phone')
      .populate('societyId', 'name')
      .populate('contractId', 'contractName amount')
      .populate('workOrderId', 'title description')
      .populate('approvedBy', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .populate('modifiedBy', 'firstName lastName email');

    if (!invoice || invoice.isDeleted) {
      throw new Error('Invoice not found');
    }

    return invoice.toObject();
  },

  async approveInvoice(id: string, userId: Types.ObjectId) {
    const invoice = await VendorInvoice.findById(id);
    if (!invoice || invoice.isDeleted) {
      throw new Error('Invoice not found');
    }

    if (invoice.status !== 'submitted' && invoice.status !== 'under-review') {
      throw new Error('Invoice is not in a state that can be approved');
    }

    const updated = await VendorInvoice.findByIdAndUpdate(
      id,
      {
        $set: {
          status: 'approved',
          approvedBy: userId,
          approvalDate: new Date(),
          modifiedBy: userId,
        },
      },
      { new: true }
    )
      .populate('vendorId', 'vendorName companyName')
      .populate('approvedBy', 'firstName lastName');

    return updated ? updated.toObject() : null;
  },

  async rejectInvoice(id: string, reason: string, userId: Types.ObjectId) {
    const invoice = await VendorInvoice.findById(id);
    if (!invoice || invoice.isDeleted) {
      throw new Error('Invoice not found');
    }

    if (invoice.status === 'paid') {
      throw new Error('Cannot reject a paid invoice');
    }

    const updated = await VendorInvoice.findByIdAndUpdate(
      id,
      {
        $set: {
          status: 'rejected',
          rejectionReason: reason,
          modifiedBy: userId,
        },
      },
      { new: true }
    )
      .populate('vendorId', 'vendorName companyName');

    return updated ? updated.toObject() : null;
  },

  async markInvoicePaid(id: string, paymentRef: string, userId: Types.ObjectId) {
    const invoice = await VendorInvoice.findById(id);
    if (!invoice || invoice.isDeleted) {
      throw new Error('Invoice not found');
    }

    if (invoice.status !== 'approved') {
      throw new Error('Invoice must be approved before marking as paid');
    }

    const updated = await VendorInvoice.findByIdAndUpdate(
      id,
      {
        $set: {
          status: 'paid',
          paymentDate: new Date(),
          paymentReference: paymentRef,
          modifiedBy: userId,
        },
      },
      { new: true }
    )
      .populate('vendorId', 'vendorName companyName')
      .populate('approvedBy', 'firstName lastName');

    return updated ? updated.toObject() : null;
  },
};
