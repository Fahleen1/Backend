import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_CLOUD_API_KEY,
//   api_secret: process.env.CLOUDINARY_CLOUD_API_SECRET,
// });

cloudinary.config({
  cloud_name: 'doj8mhohl',
  api_key: '433595295845951',
  api_secret: 'qsHmTTi-o-l04UgwXiJSiTvr3Zg',
});

export const uploadFile = async (localFilePath) => {
  try {
    if (!localFilePath) {
      return null;
    }
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: 'auto',
    });
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // Remove the locally saved temporary file
    console.log('error uploading file');
    return null;
  }
  // console.error('Cloudinary upload error:', error);
  // if (response) {
  //   // Delete the local file if upload is successful
  //   if (fs.existsSync(localFilePath)) {
  //     fs.unlink(localFilePath, (unlinkError) => {
  //       if (unlinkError) {
  //         console.error(
  //           'Failed to delete temporary file:',
  //           unlinkError.message,
  //         );
  //       }
  //     });
  //   }
  // }
};
