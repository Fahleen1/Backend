import { User } from '../models/user.model.js';

export const checkUserExistance = async (username, email) => {
  const user = await User.findOne({ $or: [{ username }, { email }] });
  return user;
};

export const createUser = async (
  username,
  email,
  fullname,
  password,
  avatar,
  coverImage,
) => {
  const response = await User.create({
    username,
    email,
    fullname,
    password,
    avatar,
    coverImage,
  });

  return response;
};

export const getUserById = async (id) => {
  const user = await User.findById(id).select('-password -refreshToken');
  return user;
};

export const userUpdate = async (id) => {
  const user = await User.findByIdAndUpdate(
    id,
    { $set: { refreshToken: undefined } },
    { new: true },
  );
  return user;
};
