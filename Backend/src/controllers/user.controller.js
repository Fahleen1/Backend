import { upload } from '../middleware/multer.middleware.js';
import { User } from '../models/user.model.js';
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
import mongoose from 'mongoose';

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

  //console.log('User during login:', user);

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
    .clearCookie('accessToken', options)
    .clearCookie('refreshToken', options)
    .json(new ApiResponse(200, {}, 'User logged Out successfully'));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, 'Unauthorized');
  }
  try {
    const decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const user = await getUserById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    //Validate refresh token
    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, 'Refresh token is expired');
    }

    //Generate new token
    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);
    return res
      .status(200)
      .cookie('accessToken', accessToken, options)
      .cookie('refreshToken', newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, newRefreshToken },
          'Access token refreshed successfully',
        ),
      );
  } catch (error) {
    throw new ApiError(401, error?.message || 'Invalid refresh token');
  }
});

export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await getUserById(req.user._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(401, 'Invalid password');
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Password changed successfully'));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, 'User fetched successfully'));
});

export const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.files?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, 'Avatar is missing');
  }

  const avatar = upload(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(500, 'Error uploading avatar');
  }

  await updateUserAvatar(req.user._id, avatar.url);
});

export const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username.trim()) throw new ApiError(401, 'User not found');

  //Aggregation pipeline
  const channel = await User.aggregate([
    {
      $match: {
        username: username,
      },
    },
    {
      $lookup: {
        from: 'subscriptions',
        localField: '_id',
        foreignField: 'channel',
        as: 'subscribers', // we are finding subscribers for particular channel
      },
    },
    {
      $lookup: {
        from: 'subscription',
        localField: '_id',
        foreignField: 'subscriber',
        as: 'subscribedTo', //finding whom I subscribed
      },
    },
    //adding fields plus calculating count
    {
      $addFields: {
        subscribersCount: {
          $size: '$subscribers',
        },
        channelSubscribedToCount: {
          $size: '$subscribedTo',
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, '$subscribers.subscriber'] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullname: 1, //flag set to 1
        username: 1,
        avatar: 1,
        coverImage: 1,
        subscribersCount: 1,
        channelSubscribedToCount: 1,
        isSubscribed: 1,
        email: 1,
      },
    },
  ]);

  console.log(channel);
  if (!channel?.length) throw new ApiError(404, 'channel not exist');
  return res
    .status(200)
    .json(new ApiResponse(200, channel[0], 'User channel fetched successfuly'));
});

export const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: 'videos',
        localField: 'watchHistory',
        foreignField: '_id',
        as: 'watchHistory',
        //(sub pipeline) nested pipeline now we're inside videos and performing lookup there
        pipeline: [
          {
            $lookup: {
              from: 'users',
              localField: 'owner', //getting owner info
              foreignField: '_id',
              as: 'owner',
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: '$owner',
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        'Watch History fetched successfully',
      ),
    );
});
