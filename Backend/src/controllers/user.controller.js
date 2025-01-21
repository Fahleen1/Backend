import { checkUserExistance, getUserById } from '../services/user.service.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadFile } from '../utils/cloudinary.js';

export const registerUser = asyncHandler(async (req, res) => {
  const { username, email, fullname, password } = req.body;
  console.log(fullname);

  //Validation
  if (
    [username, email, fullname, password].some((field) => field.trim() === '')
  ) {
    throw new ApiError(400, 'All fields are required');
  }

  //Check if user already exists
  const existedUser = await checkUserExistance(username, email);
  if (existedUser) {
    throw new ApiError(409, 'User already exists');
  }

  //Check for images and avatar
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, 'Avatar is required');
  }

  //Upload on cloudinary
  const avatar = await uploadFile(avatarLocalPath);
  const coverImage = await uploadFile(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(500, 'Error uploading avatar');
  }

  //Register user
  const user = await registerUser(
    username.toLowerCase(),
    email,
    fullname,
    password,
    avatar.url,
    coverImage?.url || '', //Cover is optional
  );

  //Check user creation
  const createdUser = await getUserById(user._id);
  if (!createdUser) {
    throw new ApiError(500, 'Error creating user');
  }

  //Return response
  return res
    .status(200)
    .json(new ApiResponse(200, createdUser, 'User created successfully'));
});
