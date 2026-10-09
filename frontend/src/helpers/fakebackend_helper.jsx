import axios from "axios";
import { get, post } from "./api_helper";
import * as url from "./url_helper";


const getLoggedInUser = () => {
  const user = localStorage.getItem("authUser");

  if (user) {
    return JSON.parse(user);
  }

  return null;
};


const isUserAuthenticated = () => {
  return getLoggedInUser() !== null;
};


const postFakeRegister = data =>
  axios.post(url.POST_FAKE_REGISTER, data)
    .then(response => response.data);


const postFakeLogin = data =>
  post(url.POST_FAKE_LOGIN, data);


const postFakeForgetPwd = data =>
  post(url.POST_FAKE_PASSWORD_FORGET, data);


const postJwtProfile = data =>
  post(url.POST_EDIT_JWT_PROFILE, data);


const postFakeProfile = data =>
  post(url.POST_EDIT_PROFILE, data);


const postJwtRegister = data =>
  post(url.POST_JWT_REGISTER, data);


const postJwtLogin = data =>
  post(url.POST_FAKE_JWT_LOGIN, data);


const postJwtLogout = () =>
  post(url.POST_JWT_LOGOUT, {});


const postJwtForgetPwd = data =>
  post(url.POST_FAKE_JWT_PASSWORD_FORGET, data);


export const postSocialLogin = data =>
  post(url.SOCIAL_LOGIN, data);


export {
  getLoggedInUser,
  isUserAuthenticated,
  postFakeRegister,
  postFakeLogin,
  postFakeProfile,
  postFakeForgetPwd,
  postJwtRegister,
  postJwtLogin,
  postJwtLogout,
  postJwtForgetPwd,
  postJwtProfile,
};