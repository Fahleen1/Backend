import { User } from '../models/user.model.js';

export const checkUserExistance = async (username, email) => {
  const user = User.findOne({ $or: [{ username }, { email }] });
  return user;
};

export const registerUser = async (
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
  const user = await User.findById(id).select('-password - refreshToken');
};
