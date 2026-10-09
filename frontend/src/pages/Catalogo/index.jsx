import React, { useCallback, useEffect, useState } from "react";
import {
  Container,
  Card,
  CardBody,
  Table,
  Button,
  UncontrolledTooltip,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input,
} from "reactstrap";
import Swal from "sweetalert2";

import Breadcrumbs from "../../components/Common/Breadcrumb";
import { apiFetch } from "../../api/client";

const FORM_INICIAL = {
  nombre: "",
  descripcion: "",
  precio: "",
  activo: true,
};

const Catalogo = () => {
  document.title = "Catalogo | Warlus CRM";

  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [servicioEnEdicion, setServicioEnEdicion] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState(null);

  const cargar = useCallback(() => {
    setCargando(true);
    setError(null);
    apiFetch("catalogo", "/servicios")
      .then((data) => setServicios(data))
      .catch(() => setError("No se pudo cargar el catalogo"))
      .finally(() => setCargando(false));
  }, []);

  useEffect(cargar, [cargar]);

  const abrirModalCrear = () => {
    setServicioEnEdicion(null);
    setForm(FORM_INICIAL);
    setErrorForm(null);
    setModalAbierto(true);
  };

  const abrirModalEditar = (servicio) => {
    setServicioEnEdicion(servicio);
    setForm({
      nombre: servicio.nombre,
      descripcion: servicio.descripcion || "",
      precio: String(servicio.precio),
      activo: servicio.activo,
    });
    setErrorForm(null);
    setModalAbierto(true);
  };

  const cerrarModal = () => setModalAbierto(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.nombre || !form.precio) {
      setErrorForm("Nombre y precio son obligatorios");
      return;
    }

    setGuardando(true);
    setErrorForm(null);

    const payload = {
      nombre: form.nombre,
      descripcion: form.descripcion || null,
      precio: parseFloat(form.precio),
      activo: form.activo,
    };

    const peticion = servicioEnEdicion
      ? apiFetch("catalogo", `/servicios/${servicioEnEdicion.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
      : apiFetch("catalogo", "/servicios", {
          method: "POST",
          body: JSON.stringify(payload),
        });

    peticion
      .then(() => {
        setModalAbierto(false);
        cargar();
        Swal.fire({
          icon: "success",
          title: servicioEnEdicion ? "Editado con exito" : "Creado con exito",
          timer: 1500,
          showConfirmButton: false,
        });
      })
      .catch(() => setErrorForm("No se pudo guardar el servicio"))
      .finally(() => setGuardando(false));
  };

  const handleEliminar = (servicio) => {
    Swal.fire({
      title: `¿Eliminar "${servicio.nombre}"?`,
      text: "Esta accion no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#f46a6a",
      cancelButtonColor: "#74788d",
      confirmButtonText: "Si, borrar",
      cancelButtonText: "Cancelar",
    }).then((resultado) => {
      if (resultado.isConfirmed) {
        apiFetch("catalogo", `/servicios/${servicio.id}`, { method: "DELETE" })
          .then(() => {
            cargar();
            Swal.fire({
              icon: "success",
              title: "Borrado con exito",
              timer: 1500,
              showConfirmButton: false,
            });
          })
          .catch(() =>
            Swal.fire("Error", "No se pudo eliminar el servicio", "error")
          );
      }
    });
  };

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumbs title="Catalogo" breadcrumbItem="Servicios" />

        <Card>
          <CardBody>
            <div className="d-flex justify-content-end mb-3">
              <Button
                color="primary"
                id="btn-crear-servicio"
                size="sm"
                onClick={abrirModalCrear}
              >
                <i className="bx bx-plus" />
              </Button>
              <UncontrolledTooltip placement="top" target="btn-crear-servicio">
                Crear
              </UncontrolledTooltip>
            </div>

            {error ? <p className="text-danger">{error}</p> : null}

            <Table responsive className="table-centered table-nowrap mb-0">
              <thead className="table-light">
                <tr>
                  <th>Nombre</th>
                  <th>Descripcion</th>
                  <th>Precio</th>
                  <th>Activo</th>
                  <th>Accion</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan={5} className="text-center">
                      Cargando...
                    </td>
                  </tr>
                ) : servicios.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center">
                      Sin servicios registrados
                    </td>
                  </tr>
                ) : (
                  servicios.map((servicio) => (
                    <tr key={servicio.id}>
                      <td>{servicio.nombre}</td>
                      <td>{servicio.descripcion || "-"}</td>
                      <td>{servicio.precio}</td>
                      <td>{servicio.activo ? "Si" : "No"}</td>
                      <td>
                        {servicio.editable ? (
                          <>
                            <Button
                              color="warning"
                              size="sm"
                              className="me-1"
                              id={`btn-editar-${servicio.id}`}
                              onClick={() => abrirModalEditar(servicio)}
                            >
                              <i className="bx bx-pencil" />
                            </Button>
                            <UncontrolledTooltip
                              placement="top"
                              target={`btn-editar-${servicio.id}`}
                            >
                              Editar
                            </UncontrolledTooltip>

                            <Button
                              color="danger"
                              size="sm"
                              id={`btn-borrar-${servicio.id}`}
                              onClick={() => handleEliminar(servicio)}
                            >
                              <i className="bx bx-trash" />
                            </Button>
                            <UncontrolledTooltip
                              placement="top"
                              target={`btn-borrar-${servicio.id}`}
                            >
                              Borrar
                            </UncontrolledTooltip>
                          </>
                        ) : (
                          <span className="text-muted font-size-12">
                            Global ?? solo lectura
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </CardBody>
        </Card>

        <Modal isOpen={modalAbierto} toggle={cerrarModal}>
          <ModalHeader toggle={cerrarModal}>
            {servicioEnEdicion ? "Editar servicio" : "Crear servicio"}
          </ModalHeader>
          <Form onSubmit={handleSubmit}>
            <ModalBody>
              {errorForm ? <p className="text-danger">{errorForm}</p> : null}

              <FormGroup>
                <Label for="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                />
              </FormGroup>

              <FormGroup>
                <Label for="descripcion">Descripcion</Label>
                <Input
                  id="descripcion"
                  name="descripcion"
                  type="textarea"
                  value={form.descripcion}
                  onChange={handleChange}
                />
              </FormGroup>

              <FormGroup>
                <Label for="precio">Precio</Label>
                <Input
                  id="precio"
                  name="precio"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.precio}
                  onChange={handleChange}
                />
              </FormGroup>

              <FormGroup check>
                <Input
                  id="activo"
                  name="activo"
                  type="checkbox"
                  checked={form.activo}
                  onChange={handleChange}
                />
                <Label for="activo" check>
                  Activo
                </Label>
              </FormGroup>
            </ModalBody>
            <ModalFooter>
              <Button type="button" color="secondary" onClick={cerrarModal}>
                Cancelar
              </Button>
              <Button type="submit" color="primary" disabled={guardando}>
                {guardando ? "Guardando..." : "Guardar"}
              </Button>
            </ModalFooter>
          </Form>
        </Modal>
      </Container>
    </div>
  );
};

export default Catalogo;
