import React from "react";

import {
  Row,
  Col,
  CardBody,
  Card,
  Alert,
  Container,
  Input,
  Label,
  Form,
  FormFeedback,
} from "reactstrap";

import * as Yup from "yup";
import { useFormik } from "formik";

import {
  useDispatch,
  useSelector,
} from "react-redux";

import { createSelector } from "reselect";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import { registerUser } from "/src/store/actions";

import profileImg from "../../assets/images/profile-img.png";
import logo from "../../assets/images/logo.svg";
import lightlogo from "../../assets/images/logo-light.svg";


const Register = () => {

  document.title = "Crear cuenta | Warlus CRM";

  const dispatch = useDispatch();
  const navigate = useNavigate();


  const validation = useFormik({

    enableReinitialize: true,

    initialValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },

    validationSchema: Yup.object({

      email: Yup.string()
        .email("Ingresa un correo electronico valido")
        .required("Ingresa tu correo electronico"),

      password: Yup.string()
        .min(
          10,
          "La contraseña debe tener al menos 10 caracteres"
        )
        .matches(
          /[A-Z]/,
          "La contraseña debe incluir una mayuscula"
        )
        .matches(
          /[a-z]/,
          "La contraseña debe incluir una minuscula"
        )
        .matches(
          /\d/,
          "La contraseña debe incluir un numero"
        )
        .matches(
          /[^A-Za-z0-9]/,
          "La contraseña debe incluir un caracter especial"
        )
        .required("Ingresa una contraseña"),

      confirmPassword: Yup.string()
        .oneOf(
          [Yup.ref("password")],
          "Las contraseñas no coinciden"
        )
        .required("Confirma tu contraseña"),
    }),

    onSubmit: values => {

      dispatch(
        registerUser(
          {
            email: values.email,
            password: values.password,
          },
          navigate
        )
      );
    },
  });


  const AccountProperties = createSelector(
    state => state.Account,
    account => ({
      registrationError:
        account.registrationError,

      loading:
        account.loading,
    })
  );


  const {
    registrationError,
    loading,
  } = useSelector(AccountProperties);


  return (
    <React.Fragment>

      <div className="home-btn d-none d-sm-block">

        <Link
          to="/"
          className="text-dark"
        >
          <i className="bx bx-home h2" />
        </Link>

      </div>


      <div className="account-pages my-5 pt-sm-5">

        <Container>

          <Row className="justify-content-center">

            <Col md={8} lg={6} xl={5}>

              <Card className="overflow-hidden">

                <div className="bg-primary-subtle">

                  <Row>

                    <Col className="col-7">

                      <div className="text-primary p-4">

                        <h5 className="text-primary">
                          Crear cuenta
                        </h5>

                        <p>
                          Registra tu cuenta para acceder a Warlus CRM.
                        </p>

                      </div>

                    </Col>

                    <Col className="col-5 align-self-end">

                      <img
                        src={profileImg}
                        alt=""
                        className="img-fluid"
                      />

                    </Col>

                  </Row>

                </div>


                <CardBody className="pt-0">

                  <div className="auth-logo">

                    <Link
                      to="/"
                      className="auth-logo-light"
                    >

                      <div className="avatar-md profile-user-wid mb-4">

                        <span className="avatar-title rounded-circle bg-light">

                          <img
                            src={lightlogo}
                            alt=""
                            className="rounded-circle"
                            height="34"
                          />

                        </span>

                      </div>

                    </Link>


                    <Link
                      to="/"
                      className="auth-logo-dark"
                    >

                      <div className="avatar-md profile-user-wid mb-4">

                        <span className="avatar-title rounded-circle bg-light">

                          <img
                            src={logo}
                            alt=""
                            className="rounded-circle"
                            height="34"
                          />

                        </span>

                      </div>

                    </Link>

                  </div>


                  <div className="p-2">

                    <Form
                      className="form-horizontal"
                      onSubmit={e => {

                        e.preventDefault();

                        validation.handleSubmit();

                        return false;
                      }}
                    >

                      {registrationError ? (

                        <Alert color="danger">
                          {registrationError}
                        </Alert>

                      ) : null}


                      <div className="mb-3">

                        <Label className="form-label">
                          Correo electronico
                        </Label>

                        <Input
                          name="email"
                          type="email"
                          placeholder="Ingresa tu correo"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={validation.values.email}
                          invalid={
                            Boolean(
                              validation.touched.email &&
                              validation.errors.email
                            )
                          }
                        />

                        {validation.touched.email &&
                        validation.errors.email ? (

                          <FormFeedback type="invalid">
                            {validation.errors.email}
                          </FormFeedback>

                        ) : null}

                      </div>


                      <div className="mb-3">

                        <Label className="form-label">
                          Contraseña
                        </Label>

                        <Input
                          name="password"
                          type="password"
                          autoComplete="new-password"
                          placeholder="Ingresa tu contraseña"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={validation.values.password}
                          invalid={
                            Boolean(
                              validation.touched.password &&
                              validation.errors.password
                            )
                          }
                        />

                        {validation.touched.password &&
                        validation.errors.password ? (

                          <FormFeedback type="invalid">
                            {validation.errors.password}
                          </FormFeedback>

                        ) : null}

                      </div>


                      <div className="mb-3">

                        <Label className="form-label">
                          Confirmar contraseña
                        </Label>

                        <Input
                          name="confirmPassword"
                          type="password"
                          autoComplete="new-password"
                          placeholder="Confirma tu contraseña"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={
                            validation.values.confirmPassword
                          }
                          invalid={
                            Boolean(
                              validation.touched.confirmPassword &&
                              validation.errors.confirmPassword
                            )
                          }
                        />

                        {validation.touched.confirmPassword &&
                        validation.errors.confirmPassword ? (

                          <FormFeedback type="invalid">
                            {validation.errors.confirmPassword}
                          </FormFeedback>

                        ) : null}

                      </div>


                      <div className="mt-3 d-grid">

                        <button
                          className="btn btn-primary btn-block"
                          type="submit"
                          disabled={loading}
                        >

                          {
                            loading
                              ? "Creando cuenta..."
                              : "Crear cuenta"
                          }

                        </button>

                      </div>

                    </Form>

                  </div>

                </CardBody>

              </Card>


              <div className="mt-5 text-center">

                <p>

                  ¿Ya tienes una cuenta?{" "}

                  <Link
                    to="/login"
                    className="font-weight-medium text-primary"
                  >
                    Iniciar sesion
                  </Link>

                </p>

                <p>
                  © {new Date().getFullYear()} Warlus CRM.
                </p>

              </div>

            </Col>

          </Row>

        </Container>

      </div>

    </React.Fragment>
  );
};


export default Register;