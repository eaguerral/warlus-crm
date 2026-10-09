import axios from "axios";

//apply base url for axios
const API_URL = "";

const axiosApi = axios.create({
  baseURL: API_URL,
});

// Adjunta el token real del usuario autenticado (guardado en el login) a
// cada petición, en lugar de un token fijo.
axiosApi.interceptors.request.use((config) => {
  const authUser = localStorage.getItem("authUser");
  if (authUser) {
    const { access_token } = JSON.parse(authUser);
    if (access_token) {
      config.headers.Authorization = `Bearer ${access_token}`;
    }
  }
  return config;
});

axiosApi.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export async function get(url, config = {}) {
  return await axiosApi
    .get(url, { ...config })
    .then((response) => response.data);
}

export async function post(url, data, config = {}) {
  return axiosApi
    .post(url, { ...data }, { ...config })
    .then((response) => response.data);
}

export async function put(url, data, config = {}) {
  return axiosApi
    .put(url, { ...data }, { ...config })
    .then((response) => response.data);
}

export async function del(url, config = {}) {
  return await axiosApi
    .delete(url, { ...config })
    .then((response) => response.data);
}
