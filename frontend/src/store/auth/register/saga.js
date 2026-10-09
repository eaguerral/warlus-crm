import {
  all,
  call,
  fork,
  put,
  takeEvery,
} from "redux-saga/effects";

import Swal from "sweetalert2";

import { REGISTER_USER } from "./actionTypes";

import {
  registerUserSuccessful,
  registerUserFailed,
} from "./actions";

import {
  postJwtRegister,
} from "../../../helpers/fakebackend_helper";


const toErrorMessage = error => {
  const detail = error?.response?.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map(item => item?.msg || "Dato invalido")
      .filter(Boolean)
      .join(". ");
  }

  if (detail && typeof detail === "object") {
    return detail.msg || "Datos de registro invalidos";
  }

  return (
    error?.message ||
    "No fue posible crear la cuenta"
  );
};


function* registerUser({
  payload: {
    user,
    history,
  },
}) {
  try {
    const response = yield call(
      postJwtRegister,
      {
        email: user.email,
        password: user.password,
      }
    );

    yield put(
      registerUserSuccessful(response)
    );

    yield call(() =>
      Swal.fire({
        icon: "success",
        title: "Cuenta creada correctamente",
        text: "Tu cuenta ya esta lista. Ahora puedes iniciar sesion.",
        confirmButtonColor: "#556ee6",
        timer: 1800,
        timerProgressBar: true,
        showConfirmButton: false,
      })
    );

    history("/login");

  } catch (error) {
    const message = toErrorMessage(error);

    yield put(
      registerUserFailed(message)
    );

    yield call(() =>
      Swal.fire({
        icon: "error",
        title: "No se pudo crear la cuenta",
        text: message,
        confirmButtonColor: "#556ee6",
        confirmButtonText: "Entendido",
      })
    );
  }
}


export function* watchUserRegister() {
  yield takeEvery(
    REGISTER_USER,
    registerUser
  );
}


function* accountSaga() {
  yield all([
    fork(watchUserRegister),
  ]);
}


export default accountSaga;