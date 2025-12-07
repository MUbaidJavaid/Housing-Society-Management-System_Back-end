// import { Router } from 'express';
// import multer from 'multer';
// import { uploadController } from '../controllers/upload.controller';
// import { validateFile } from '../middleware/validate.middleware';
// import { asyncHandler } from '../utils/asyncHandler';

// const upload = multer({
//   storage: multer.memoryStorage(),
//   limits: {
//     fileSize: 10 * 1024 * 1024, // 10MB
//   },
// });

// const router: Router = Router();

//  //Single file upload with leaky bucket rate limiting
// router.post(
//   '/single',
//   upload.single('file'),
//   validateFile({ allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'] }),
//   asyncHandler(uploadController.uploadSingle)
// );

// // Multiple files upload
// router.post(
//   '/multiple',
//   upload.array('files', 5), // Max 5 files
//   validateFile({ maxFiles: 5 }),
//   asyncHandler(uploadController.uploadMultiple)
// );

// export default router;
