import { AuthRequest } from '../../auth/types';

import console from 'console';
import { NextFunction, Request, Response } from 'express';
import { uploadService } from '../../imageUpload/services/upload.service';
import { EntityType } from '../../imageUpload/types/upload.types';
import { AppError } from '../../middleware/error.middleware';
import { CreateMemberDto, MemberQueryParams, memberService } from '../index-member';

const handleError = (error: any, next: NextFunction) => {
  next(error);
};

export const memberController = {
  createMember: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const createData: CreateMemberDto = req.body;

      // Validate required fields
      if (!createData.memName?.trim()) {
        throw new AppError(400, 'Member Name is required');
      }
      if (!createData.memNic?.trim()) {
        throw new AppError(400, 'NIC is required');
      }
      if (!createData.memAddr1?.trim()) {
        throw new AppError(400, 'Address Line 1 is required');
      }
      if (!createData.memContMob?.trim()) {
        throw new AppError(400, 'Mobile Contact is required');
      }

      // Check if NIC already exists
      const nicExists = await memberService.checkNicExists(createData.memNic);
      if (nicExists) {
        throw new AppError(409, 'Member with this NIC already exists');
      }

      // Check if mobile already exists
      const mobileExists = await memberService.checkMobileExists(createData.memContMob);
      if (mobileExists) {
        throw new AppError(409, 'Member with this mobile number already exists');
      }
      if (createData.memImg && !createData.memImg.includes('cloudinary.com')) {
        // If it's not a Cloudinary URL, remove it
        delete createData.memImg;
      }

      const member = await memberService.createMember(createData, req.user.userId);

      res.status(201).json({
        success: true,
        data: member,
        message: 'Member created successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getMember: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      const member = await memberService.getMemberById(id);

      if (!member || (member as any).isDeleted) {
        throw new AppError(404, 'Member not found');
      }

      res.json({
        success: true,
        data: member,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getMemberByNic: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const nic = req.params.nic as string;

      const member = await memberService.getMemberByNic(nic);

      if (!member || (member as any).isDeleted) {
        throw new AppError(404, 'Member not found');
      }

      res.json({
        success: true,
        data: member,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getMembers: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams: MemberQueryParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        search: req.query.search as string,
        statusId: req.query.statusId as string,
        cityId: req.query.cityId as string,
        memIsOverseas: req.query.memIsOverseas === 'true',
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const result = await memberService.getMembers(queryParams);
      console.log('Member data:', result);

      res.json({
        success: true,
        data: {
          members: result.members,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  searchMembers: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { query } = req.query;

      if (!query || typeof query !== 'string' || query.trim().length < 2) {
        throw new AppError(400, 'Search query must be at least 2 characters');
      }

      const members = await memberService.searchMembers(query.trim());

      res.json({
        success: true,
        data: members,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  getMemberSummary: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await memberService.getMemberSummary();

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  updateMember: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;
      const updateData = req.body;

      const existingMember = await memberService.getMemberById(id);
      if (!existingMember || (existingMember as any).isDeleted) {
        throw new AppError(404, 'Member not found');
      }

      // Check if NIC is being changed and if it already exists
      if (updateData.memNic && updateData.memNic !== existingMember.memNic) {
        const nicExists = await memberService.checkNicExists(updateData.memNic, id);
        if (nicExists) {
          throw new AppError(409, 'Member with this NIC already exists');
        }
      }

      // Check if mobile is being changed and if it already exists
      if (updateData.memContMob && updateData.memContMob !== existingMember.memContMob) {
        const mobileExists = await memberService.checkMobileExists(updateData.memContMob, id);
        if (mobileExists) {
          throw new AppError(409, 'Member with this mobile number already exists');
        }
      }
      // Check if image is being updated
      if (updateData.memImg !== undefined) {
        // If new image is empty string, remove image
        if (updateData.memImg === '') {
          if (existingMember.memImg) {
            const files = await uploadService.getFilesByEntity(
              EntityType.MEMBER, // correct enum
              existingMember._id.toString() // ensure string
            );
            if (files.length > 0) {
              await uploadService.deleteFromCloudinary(files[0].publicId); // instance method
            }
          }
        }
        // If new image is not a Cloudinary URL, don't update it
        else if (!updateData.memImg.includes('cloudinary.com')) {
          delete updateData.memImg;
        }
      }
      const updatedMember = await memberService.updateMember(id, updateData, req.user.userId);

      res.json({
        success: true,
        data: updatedMember,
        message: 'Member updated successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  deleteMember: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      const existingMember = await memberService.getMemberById(id);
      if (!existingMember || (existingMember as any).isDeleted) {
        throw new AppError(404, 'Member not found');
      }
      if (existingMember.memImg) {
        const publicId = uploadService.extractPublicIdFromUrl(existingMember.memImg);
        if (publicId) {
          await uploadService.deleteMemberImage(publicId);
        }
      }

      const deleted = await memberService.deleteMember(id, req.user.userId);

      if (!deleted) {
        throw new AppError(500, 'Failed to delete Member');
      }

      res.json({
        success: true,
        message: 'Member deleted successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },

  unlockMember: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Authentication required');
      }

      const id = req.params.id as string;

      const existingMember = await memberService.getMemberById(id);
      if (!existingMember || (existingMember as any).isDeleted) {
        throw new AppError(404, 'Member not found');
      }

      const unlocked = await memberService.unlockMember(id, req.user.userId);

      if (!unlocked) {
        throw new AppError(500, 'Failed to unlock member account');
      }

      res.json({
        success: true,
        message: 'Member account unlocked successfully',
      });
    } catch (error) {
      handleError(error, next);
    }
  },
};
