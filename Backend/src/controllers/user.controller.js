import {
  checkUserExistance,
  getUserById,
  userUpdate,
} from '../services/user.service.js';
import { createUser } from '../services/user.service.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadFile } from '../utils/cloudinary.js';

export const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await getUserById(userId);

    const accessToken = user.generateToken();
    const refreshToken = user.generateRefreshToken();
    user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, 'Error generating tokens');
  }
};

export const registerUser = asyncHandler(async (req, res) => {
  const { username, email, fullname, password } = req.body;

  //Validation
  if (
    [username, email, fullname, password].some((field) => field.trim() === '')
  ) {
    throw new ApiError(400, 'All fields are required');
  }

  // Validation
  //   if (!username || !email || !fullname || !password) {
  //     throw new ApiError(400, 'All fields are required');
  //   }

  //   if (!req.files || !req.files.avatar) {
  //     throw new ApiError(400, 'Avatar file is required');
  //   }

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
  const user = await createUser(
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

export const loginUser = asyncHandler(async (req, res) => {
  // get data from req body
  const { username, email, password } = req.body;
  if (!username && !email) {
    throw new ApiError(400, 'Username and email are required');
  }
  //or if (!(username || email))

  //find user
  const user = await checkUserExistance(username, email);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  //Check password
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid password');
  }

  //get access & refresh token
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id,
  );

  //Logged In user
  const loggedInUser = await getUserById(user._id);

  //set options for cookies
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        'User logged In successfully',
      ),
    );
});

export const logoutUser = asyncHandler(async (req, res) => {
  await userUpdate(req.user._id);
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie('accessToken', accessToken, options)
    .clearCookie('refreshToken', refreshToken, options)
    .json(new ApiResponse(200, {}, 'User logged Out successfully'));
});
